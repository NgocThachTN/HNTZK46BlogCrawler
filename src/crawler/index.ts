import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { fetchHtml, downloadFile } from './client';
import { parseMembers, parseBlogFeed, parseBlogDetail } from './parser';
import type { Member, BlogPost, BlogDatabase } from '../types/blog';

const HOME_URL = 'https://www.hinatazaka46.com/s/official/diary/member?ima=0000';
const BASE_URL = 'https://www.hinatazaka46.com';

// Define project paths
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const MEMBERS_DIR = path.join(IMAGES_DIR, 'members');
const BLOGS_DIR = path.join(IMAGES_DIR, 'blogs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');

// Ensure necessary directories exist
function ensureDirectories() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(MEMBERS_DIR)) fs.mkdirSync(MEMBERS_DIR, { recursive: true });
  if (!fs.existsSync(BLOGS_DIR)) fs.mkdirSync(BLOGS_DIR, { recursive: true });
}

/**
 * Get file extension from URL, defaulting to .jpg
 */
function getFileExtension(url: string): string {
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname);
  return ext ? ext.toLowerCase() : '.jpg';
}

async function runCrawler() {
  console.log('[Crawler] Starting Hinatazaka46 Blog Crawler...');
  ensureDirectories();

  try {
    // 1. Fetch official blog homepage
    console.log(`[Crawler] Fetching homepage: ${HOME_URL}`);
    const homepageHtml = await fetchHtml(HOME_URL, 3, 1000);

    // 2. Parse active members list
    console.log('[Crawler] Parsing active members directory...');
    const rawMembers = parseMembers(homepageHtml);
    console.log(`[Crawler] Found ${rawMembers.length} active members.`);

    const members: Member[] = [];

    // 3. Download member avatars locally
    for (const member of rawMembers) {
      const ext = getFileExtension(member.avatar);
      const localFilename = `${member.id}${ext}`;
      const localDestPath = path.join(MEMBERS_DIR, localFilename);
      const relativeLocalUrl = `/images/members/${localFilename}`;

      if (!fs.existsSync(localDestPath)) {
        console.log(`[Crawler] Downloading avatar for member: ${member.name} (${member.id})...`);
        try {
          await downloadFile(member.avatar, localDestPath);
        } catch (err: any) {
          console.error(`[Crawler] Error downloading avatar for ${member.name}: ${err.message}`);
          // Continue with remote URL if local download fails
          members.push({ ...member });
          continue;
        }
      } else {
        // Skip downloading if already exists
        console.log(`[Crawler] Avatar for ${member.name} already cached.`);
      }

      members.push({
        id: member.id,
        name: member.name,
        avatar: relativeLocalUrl,
      });
    }

    // 4. Parse recent blog feed
    console.log('[Crawler] Parsing recent blog posts from feed...');
    const feedItems = parseBlogFeed(homepageHtml);
    console.log(`[Crawler] Found ${feedItems.length} blog posts in feed.`);

    const blogs: BlogPost[] = [];

    // 5. Crawl each blog post detail page
    for (let i = 0; i < feedItems.length; i++) {
      const item = feedItems[i];
      console.log(`\n[Crawler] [${i + 1}/${feedItems.length}] Processing blog: "${item.title}" by ${item.authorName} (${item.id})`);

      try {
        console.log(`[Crawler] Fetching detail page: ${item.detailUrl}`);
        const detailHtml = await fetchHtml(item.detailUrl, 3, 1500); // 1.5s delay to be polite
        
        console.log('[Crawler] Parsing blog detail content...');
        const detail = parseBlogDetail(detailHtml);

        // Find or fallback to author ID
        let authorId = detail.authorId;
        if (!authorId) {
          // Find matching member by name
          const matchedMember = members.find((m) => m.name === item.authorName);
          authorId = matchedMember ? matchedMember.id : 'unknown';
          console.warn(`[Crawler] Author ID not found in detail page, matched by name to: ${authorId}`);
        }

        // A. Download blog post thumbnail image
        let localThumbnailUrl = '';
        if (item.thumbnailUrl) {
          const thumbExt = getFileExtension(item.thumbnailUrl);
          const thumbFilename = `${item.id}_thumb${thumbExt}`;
          const thumbDestPath = path.join(BLOGS_DIR, thumbFilename);
          
          if (!fs.existsSync(thumbDestPath)) {
            console.log(`[Crawler] Downloading thumbnail: ${item.thumbnailUrl}`);
            await downloadFile(item.thumbnailUrl, thumbDestPath);
          }
          localThumbnailUrl = `/images/blogs/${thumbFilename}`;
        }

        // B. Download all inline images inside post
        const localImages: string[] = [];
        const contentImgMapping: Record<string, string> = {};

        for (let j = 0; j < detail.images.length; j++) {
          const remoteImgUrl = detail.images[j];
          const imgExt = getFileExtension(remoteImgUrl);
          const imgFilename = `${item.id}_${j}${imgExt}`;
          const imgDestPath = path.join(BLOGS_DIR, imgFilename);
          const relativeImgUrl = `/images/blogs/${imgFilename}`;

          if (!fs.existsSync(imgDestPath)) {
            console.log(`[Crawler] Downloading inline image [${j + 1}/${detail.images.length}]: ${remoteImgUrl}`);
            try {
              await downloadFile(remoteImgUrl, imgDestPath);
            } catch (err: any) {
              console.error(`[Crawler] Failed to download inline image ${remoteImgUrl}: ${err.message}`);
              contentImgMapping[remoteImgUrl] = remoteImgUrl; // fallback to remote
              continue;
            }
          }
          
          localImages.push(relativeImgUrl);
          contentImgMapping[remoteImgUrl] = relativeImgUrl;
        }

        // C. Replace remote image URLs with local image paths in HTML content
        const $content = cheerio.load(detail.contentHtml, null, false);
        $content('img').each((_, imgEl) => {
          const src = $content(imgEl).attr('src') || '';
          const absoluteSrc = src.startsWith('/') ? BASE_URL + src : src;
          
          // Map to local if we downloaded it
          if (contentImgMapping[absoluteSrc]) {
            $content(imgEl).attr('src', contentImgMapping[absoluteSrc]);
          } else if (contentImgMapping[src]) {
            $content(imgEl).attr('src', contentImgMapping[src]);
          }
        });
        
        // Remove empty paragraphs or unnecessary elements if needed
        const localContentHtml = $content.html() || '';

        // D. Create text summary preview
        const textSummary = $content.text()
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 120) + '...';

        blogs.push({
          id: item.id,
          authorId: authorId,
          title: item.title,
          date: item.date,
          summary: textSummary,
          contentHtml: localContentHtml,
          images: localImages,
          detailUrl: item.detailUrl,
          // Use thumbnail or fall back to the first inline image, or empty
          thumbnail: localThumbnailUrl || (localImages.length > 0 ? localImages[0] : ''),
        });

        console.log(`[Crawler] Successfully processed blog: ${item.id}`);

      } catch (err: any) {
        console.error(`[Crawler] Skipped blog ${item.id} due to error: ${err.message}`);
      }
    }

    // 6. Write final structured database to JSON
    const database: BlogDatabase = {
      members,
      blogs,
    };

    console.log(`\n[Crawler] Finished crawling! Writing structured JSON to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf-8');
    console.log(`[Crawler] Successfully wrote database with ${members.length} members and ${blogs.length} blog posts!`);

  } catch (err: any) {
    console.error(`[Crawler] Critical crawler failure: ${err.message}`);
    process.exit(1);
  }
}

// Run immediately
runCrawler();
