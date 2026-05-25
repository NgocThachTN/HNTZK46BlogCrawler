import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import kuromoji from 'kuromoji';
import { fetchHtml, downloadFile } from './client';
import { parseMembers, parseBlogDetail, parseBlogFeedFromList } from './parser';
import type { Member, BlogPost, BlogDatabase } from '../types/blog';
import { compileHtmlWithFurigana } from './furigana';

const HOME_URL = 'https://www.hinatazaka46.com/s/official/diary/member?ima=0000';
const BASE_URL = 'https://www.hinatazaka46.com';

const MEMBER_SLUGS: Record<string, string> = {
  '12': 'kanemura.miku',
  '14': 'kosaka.nao',
  '21': 'kamimura.hinano',
  '22': 'takahashi.mikuni',
  '23': 'morimoto.marie',
  '24': 'yamaguchi.haruyo',
  '25': 'ishizuka.tamaki',
  '27': 'konishi.nanami',
  '28': 'shimizu.rio',
  '29': 'shogenji.yoko',
  '30': 'takeuchi.kirari',
  '31': 'hirao.honoka',
  '32': 'hiraoka.mitsuki',
  '33': 'fujishima.kaho',
  '34': 'miyachi.sumire',
  '35': 'yamashita.haruka',
  '36': 'watanabe.rina',
  '37': 'ota.mitsuki',
  '38': 'ono.manami',
  '39': 'katayama.saki',
  '40': 'kuramori.hinano',
  '41': 'sakai.niina',
  '42': 'sato.yuu',
  '43': 'shimoda.izuki',
  '44': 'takai.rika',
  '45': 'tsurusaki.nika',
  '46': 'matsuo.sakura',
  '000': 'poka',
};

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

/**
 * Helper to parse a blog date string ("YYYY.M.D HH:mm") into a Date object for correct sorting
 */
function parseBlogDate(dateStr: string): Date {
  try {
    const [datePart, timePart] = dateStr.trim().split(/\s+/);
    const [year, month, day] = datePart.split('.').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0);
  } catch (e) {
    console.warn(`[Crawler] Failed to parse date string "${dateStr}", using current date.`);
    return new Date();
  }
}

async function runCrawler() {
  console.log('[Crawler] Starting Hinatazaka46 Blog Crawler...');
  ensureDirectories();

  try {
    // Initialize Kuromoji morph analyzer
    console.log('[Crawler] Initializing Kuromoji morphological analyzer...');
    const dictPath = path.resolve('node_modules/kuromoji/dict');
    const tokenizer = await new Promise<any>((resolve, reject) => {
      kuromoji.builder({ dicPath: dictPath }).build((err: Error | null, tok: any) => {
        if (err) reject(err);
        else resolve(tok);
      });
    });
    console.log('[Crawler] Kuromoji morphological analyzer loaded successfully!');
    // 0. Load existing database for incremental crawl
    let existingDatabase: BlogDatabase = { members: [], blogs: [] };
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        existingDatabase = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
        console.log(`[Crawler] Loaded ${existingDatabase.blogs.length} existing blogs and ${existingDatabase.members.length} members from local database.`);
      } catch (err: any) {
        console.warn(`[Crawler] Failed to load existing database: ${err.message}. Starting fresh.`);
      }
    }

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
          members.push({ 
            ...member,
            slug: MEMBER_SLUGS[member.id] || `member_${member.id}`,
          });
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
        slug: MEMBER_SLUGS[member.id] || `member_${member.id}`,
      });
    }

    // 4. Scrape multiple list pages for blog feed items to support full group archival dynamically until the very end
    let feedItems: any[] = [];

    // A. First, dynamically crawl the mixed group feed until no more blogs are found (safety ceiling at 200 pages)
    const MAX_MIXED_PAGES = 200;
    console.log(`[Crawler] Phase 1: Dynamically crawling mixed group feed until the very end (up to ${MAX_MIXED_PAGES} pages)...`);
    for (let page = 0; page < MAX_MIXED_PAGES; page++) {
      const pageUrl = `${BASE_URL}/s/official/diary/member/list?ima=0000&page=${page}&cd=member`;
      console.log(`[Crawler] Mixed feed page ${page + 1}: ${pageUrl}`);
      try {
        const pageHtml = await fetchHtml(pageUrl, 3, 1000);
        const pageFeedItems = parseBlogFeedFromList(pageHtml);
        console.log(`[Crawler] Found ${pageFeedItems.length} blogs.`);
        
        if (pageFeedItems.length === 0) {
          console.log(`[Crawler] Reached the end of the mixed feed history at page ${page + 1}.`);
          break;
        }
        feedItems = feedItems.concat(pageFeedItems);
      } catch (err: any) {
        console.error(`[Crawler] Error scraping mixed feed page ${page + 1}: ${err.message}`);
        break; // Stop list scraping on consecutive network failures
      }
    }

    // B. Second, dynamically crawl the specific feed for EACH active member until the very end (safety ceiling at 250 pages per member)
    const MAX_MEMBER_PAGES = 250;
    console.log(`\n[Crawler] Phase 2: Starting deep targeted dynamic crawling for each of the ${members.length} members (up to ${MAX_MEMBER_PAGES} pages each)...`);
    for (let mIdx = 0; mIdx < members.length; mIdx++) {
      const member = members[mIdx];
      console.log(`[Crawler] [Member ${mIdx + 1}/${members.length}] Scraping entire blog history for ${member.name} (ct=${member.id})...`);
      
      for (let page = 0; page < MAX_MEMBER_PAGES; page++) {
        const pageUrl = `${BASE_URL}/s/official/diary/member/list?ima=0000&page=${page}&ct=${member.id}&cd=member`;
        try {
          const pageHtml = await fetchHtml(pageUrl, 3, 900); // slightly faster rate limit for members
          const pageFeedItems = parseBlogFeedFromList(pageHtml);
          console.log(`  Page ${page + 1}: Found ${pageFeedItems.length} blogs.`);
          
          if (pageFeedItems.length === 0) {
            console.log(`  Reached the end of blog history for ${member.name} at page ${page + 1}.`);
            break;
          }
          feedItems = feedItems.concat(pageFeedItems);
        } catch (err: any) {
          console.error(`  Error scraping page ${page + 1} for ${member.name}: ${err.message}`);
          break;
        }
      }
    }

    // Deduplicate posts by ID to prevent processing identical items
    const uniqueFeedItems = feedItems.filter((item, index, self) =>
      self.findIndex((t) => t.id === item.id) === index
    );
    console.log(`\n[Crawler] Complete dynamic scan finished! Total deduplicated blogs found across all historical feeds: ${uniqueFeedItems.length}`);

    // Create a Map of all blogs to manage incremental updates
    const allBlogsMap = new Map<string, BlogPost>();
    for (const blog of existingDatabase.blogs) {
      allBlogsMap.set(blog.id, blog);
    }

    // 5. Crawl each blog post detail page with safe Rate Limiting and Jimp Compression
    for (let i = 0; i < uniqueFeedItems.length; i++) {
      const item = uniqueFeedItems[i];

      // Check if we already have this blog post fully cached on disk
      if (allBlogsMap.has(item.id)) {
        const cachedBlog = allBlogsMap.get(item.id)!;
        let filesExist = true;

        if (cachedBlog.thumbnail && !fs.existsSync(path.join(PUBLIC_DIR, cachedBlog.thumbnail))) {
          filesExist = false;
        }
        for (const img of cachedBlog.images) {
          if (!fs.existsSync(path.join(PUBLIC_DIR, img))) {
            filesExist = false;
            break;
          }
        }

        if (filesExist) {
          console.log(`[Crawler] [${i + 1}/${uniqueFeedItems.length}] Reusing cached blog: "${item.title}" by ${item.authorName} (${item.id})`);
          if (!cachedBlog.contentHtmlFurigana) {
            console.log(`[Crawler] Compiling missing Furigana for cached blog: ${item.id}`);
            cachedBlog.contentHtmlFurigana = compileHtmlWithFurigana(cachedBlog.contentHtml, tokenizer);
            allBlogsMap.set(item.id, cachedBlog);
          }
          continue;
        } else {
          console.log(`[Crawler] [${i + 1}/${uniqueFeedItems.length}] Cached blog "${item.title}" (${item.id}) has missing local images. Re-downloading...`);
        }
      }

      console.log(`\n[Crawler] [${i + 1}/${uniqueFeedItems.length}] Processing new blog: "${item.title}" by ${item.authorName} (${item.id})`);

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

        const newBlog: BlogPost = {
          id: item.id,
          authorId: authorId,
          title: item.title,
          date: item.date,
          summary: textSummary,
          contentHtml: localContentHtml,
          contentHtmlFurigana: compileHtmlWithFurigana(localContentHtml, tokenizer),
          images: localImages,
          detailUrl: item.detailUrl,
          // Use thumbnail or fall back to the first inline image, or empty
          thumbnail: localThumbnailUrl || (localImages.length > 0 ? localImages[0] : ''),
        };

        allBlogsMap.set(item.id, newBlog);
        console.log(`[Crawler] Successfully processed blog: ${item.id}`);

      } catch (err: any) {
        console.error(`[Crawler] Skipped blog ${item.id} due to error: ${err.message}`);
      }
    }

    // 6. Sort all blogs (cached + newly crawled) by date descending
    console.log('[Crawler] Sorting blog posts by publication date...');
    const sortedBlogs = Array.from(allBlogsMap.values()).sort((a, b) => {
      return parseBlogDate(b.date).getTime() - parseBlogDate(a.date).getTime();
    });

    // 7. Write final structured database to JSON
    const database: BlogDatabase = {
      members,
      blogs: sortedBlogs,
    };

    console.log(`\n[Crawler] Finished crawling! Writing structured JSON to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf-8');
    console.log(`[Crawler] Successfully wrote database with ${members.length} members and ${sortedBlogs.length} blog posts!`);

    // 8. Write individual member-specific blog JSON archives in public/member/
    const MEMBER_JSON_DIR = path.join(PUBLIC_DIR, 'member');
    if (!fs.existsSync(MEMBER_JSON_DIR)) {
      fs.mkdirSync(MEMBER_JSON_DIR, { recursive: true });
    }

    console.log('[Crawler] Exporting member-specific blog archives with Romaji names...');
    for (const member of members) {
      const slug = member.slug || `member_${member.id}`;
      const memberBlogs = sortedBlogs.filter(b => b.authorId === member.id);
      const memberFile = path.join(MEMBER_JSON_DIR, `${slug}.json`);
      
      const memberArchive = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        slug: slug,
        blogs: memberBlogs
      };
      
      fs.writeFileSync(memberFile, JSON.stringify(memberArchive, null, 2), 'utf-8');
      console.log(`[Crawler] Saved archive to public/member/${slug}.json: ${memberBlogs.length} blogs`);
    }

  } catch (err: any) {
    console.error(`[Crawler] Critical crawler failure: ${err.message}`);
    process.exit(1);
  }
}

// Run immediately
runCrawler();
