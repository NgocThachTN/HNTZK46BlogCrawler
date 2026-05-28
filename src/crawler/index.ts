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
const CONTRIBUTIONS_DIR = path.join(IMAGES_DIR, 'contributions');
const MEMBERS_DIR = path.join(IMAGES_DIR, 'members');
const BLOGS_DIR = path.join(IMAGES_DIR, 'blogs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');

// Ensure necessary directories exist
function ensureDirectories() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(CONTRIBUTIONS_DIR)) fs.mkdirSync(CONTRIBUTIONS_DIR, { recursive: true });
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

/**
 * Helper to convert date string ("YYYY.M.D HH:mm") to "YYYY-MM-DD"
 */
function formatFolderDate(dateStr: string): string {
  try {
    const [datePart] = dateStr.trim().split(/\s+/);
    const [year, month, day] = datePart.split('.').map(Number);
    const yyyy = year.toString();
    const mm = month.toString().padStart(2, '0');
    const dd = day.toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) {
    return dateStr.replace(/[^a-zA-Z0-9]/g, '_');
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
    let newlyProcessedCount = 0;
    const MAX_NEW_POSTS_PER_RUN = 50; // Safety batch limit to prevent rate limits and GitHub Action timeouts

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

    // Create an in-memory Map of all blogs to manage incremental updates
    const allBlogsMap = new Map<string, BlogPost>();
    for (const blog of existingDatabase.blogs) {
      allBlogsMap.set(blog.id, blog);
    }

    // Helper closure to process, download, compress, and translate a single blog post
    async function processSingleBlog(item: any) {
      console.log(`\n[Crawler] Processing new blog: "${item.title}" by ${item.authorName} (${item.id})`);
      
      console.log(`[Crawler] Fetching detail page: ${item.detailUrl}`);
      const detailHtml = await fetchHtml(item.detailUrl, 3, 1500); // 1.5s delay to be polite
      
      console.log('[Crawler] Parsing blog detail content...');
      const detail = parseBlogDetail(detailHtml);

      // Find or fallback to author ID
      let authorId = detail.authorId;
      if (!authorId) {
        const matchedMember = members.find((m) => m.name === item.authorName);
        authorId = matchedMember ? matchedMember.id : 'unknown';
        console.warn(`[Crawler] Author ID not found in detail page, matched by name to: ${authorId}`);
      }

      // Determine nested folder paths for blog assets
      const member = members.find((m) => m.id === authorId);
      const memberSlug = (member && member.slug) || MEMBER_SLUGS[authorId] || `member_${authorId}`;
      const folderDate = formatFolderDate(item.date);
      const blogPostImagesDir = path.join(BLOGS_DIR, memberSlug, folderDate);
      const publicBlogImagesPath = `/images/blogs/${memberSlug}/${folderDate}`;

      // A. Download blog post thumbnail image
      let localThumbnailUrl = '';
      if (item.thumbnailUrl) {
        const thumbUrl = item.thumbnailUrl.startsWith('/') ? BASE_URL + item.thumbnailUrl : item.thumbnailUrl;
        const thumbExt = getFileExtension(thumbUrl);
        const thumbFilename = `${item.id}_thumb${thumbExt}`;
        const thumbDestPath = path.join(blogPostImagesDir, thumbFilename);
        
        if (!fs.existsSync(thumbDestPath)) {
          console.log(`[Crawler] Downloading thumbnail: ${thumbUrl}`);
          try {
            await downloadFile(thumbUrl, thumbDestPath);
          } catch (err: any) {
            console.error(`[Crawler] Failed to download thumbnail: ${err.message}`);
          }
        }
        localThumbnailUrl = `${publicBlogImagesPath}/${thumbFilename}`;
      }

      // B. Download all inline images inside post
      const localImages: string[] = [];
      const contentImgMapping: Record<string, string> = {};

      for (let j = 0; j < detail.images.length; j++) {
        const remoteImgUrl = detail.images[j].startsWith('/') ? BASE_URL + detail.images[j] : detail.images[j];
        const imgExt = getFileExtension(remoteImgUrl);
        const imgFilename = `${item.id}_${j}${imgExt}`;
        const imgDestPath = path.join(blogPostImagesDir, imgFilename);
        const relativeImgUrl = `${publicBlogImagesPath}/${imgFilename}`;

        if (!fs.existsSync(imgDestPath)) {
          console.log(`[Crawler] Downloading inline image [${j + 1}/${detail.images.length}]: ${remoteImgUrl}`);
          try {
            await downloadFile(remoteImgUrl, imgDestPath);
          } catch (err: any) {
            console.error(`[Crawler] Failed to download inline image ${remoteImgUrl}: ${err.message}`);
            contentImgMapping[detail.images[j]] = remoteImgUrl; // fallback to remote
            continue;
          }
        }
        
        localImages.push(relativeImgUrl);
        contentImgMapping[detail.images[j]] = relativeImgUrl;
      }

      // C. Replace remote image URLs with local image paths in HTML content
      const $content = cheerio.load(detail.contentHtml, null, false);
      $content('img').each((_, imgEl) => {
        const src = $content(imgEl).attr('src') || '';
        // Find match in mapping (either exact relative or resolved absolute)
        const match = contentImgMapping[src] || contentImgMapping[src.startsWith('/') ? BASE_URL + src : src] || src;
        $content(imgEl).attr('src', match);
      });
      
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
        thumbnail: localThumbnailUrl || (localImages.length > 0 ? localImages[0] : ''),
      };

      allBlogsMap.set(item.id, newBlog);
      newlyProcessedCount++;
      console.log(`[Crawler] Successfully processed blog: ${item.id} (${newlyProcessedCount}/${MAX_NEW_POSTS_PER_RUN})`);
    }

    // Flag to break out of all loops if batch limit is reached
    let batchLimitReached = false;

    // Phase 1: Mixed Feed - Quick check of the very latest updates (Mixed group list, e.g. 3 pages)
    // This is super important to capture any fresh blogs immediately on the home page!
    const RECENT_MIXED_PAGES = 3;
    console.log(`[Crawler] Phase 1: Checking latest mixed feed updates (up to ${RECENT_MIXED_PAGES} pages)...`);
    
    const mixedFeedItems: any[] = [];
    for (let page = 0; page < RECENT_MIXED_PAGES; page++) {
      const pageUrl = `${BASE_URL}/s/official/diary/member/list?ima=0000&page=${page}&cd=member`;
      try {
        const pageHtml = await fetchHtml(pageUrl, 3, 1000);
        const pageFeedItems = parseBlogFeedFromList(pageHtml);
        if (pageFeedItems.length === 0) break;
        mixedFeedItems.push(...pageFeedItems);
      } catch (err: any) {
        console.error(`[Crawler] Error scraping mixed feed page ${page + 1}: ${err.message}`);
      }
    }
    
    // Process recent mixed feed items
    const uniqueMixedFeedItems = mixedFeedItems.filter((item, index, self) =>
      self.findIndex((t) => t.id === item.id) === index
    );
    
    for (const item of uniqueMixedFeedItems) {
      // Check if already cached and all local images physically exist
      let filesExist = allBlogsMap.has(item.id);
      if (filesExist) {
        const cachedBlog = allBlogsMap.get(item.id)!;
        if (cachedBlog.thumbnail && !fs.existsSync(path.join(PUBLIC_DIR, cachedBlog.thumbnail))) filesExist = false;
        for (const img of cachedBlog.images) {
          if (!fs.existsSync(path.join(PUBLIC_DIR, img))) {
            filesExist = false;
            break;
          }
        }
        if (filesExist) {
          if (!cachedBlog.contentHtmlFurigana) {
            console.log(`[Crawler] Compiling missing Furigana for cached blog: ${item.id}`);
            cachedBlog.contentHtmlFurigana = compileHtmlWithFurigana(cachedBlog.contentHtml, tokenizer);
            allBlogsMap.set(item.id, cachedBlog);
          }
          continue;
        }
      }
      
      // If new/missing post, check batch limit
      if (newlyProcessedCount >= MAX_NEW_POSTS_PER_RUN) {
        console.log(`\n[Crawler] Reached batch limit of ${MAX_NEW_POSTS_PER_RUN} new posts during mixed feed check. Stopping crawler.`);
        batchLimitReached = true;
        break;
      }
      
      // Process it
      try {
        await processSingleBlog(item);
      } catch (err: any) {
        console.error(`[Crawler] Failed to process blog ${item.id}: ${err.message}`);
      }
    }

    // Phase 2: Sequential Member-by-Member Deep Archive
    if (!batchLimitReached) {
      const MAX_MEMBER_PAGES = 250;
      console.log(`\n[Crawler] Phase 2: Starting deep targeted sequential crawling member-by-member...`);
      
      for (let mIdx = 0; mIdx < members.length; mIdx++) {
        const member = members[mIdx];
        console.log(`[Crawler] [Member ${mIdx + 1}/${members.length}] Deep archiving history for ${member.name} (ct=${member.id})...`);
        
        for (let page = 0; page < MAX_MEMBER_PAGES; page++) {
          const pageUrl = `${BASE_URL}/s/official/diary/member/list?ima=0000&page=${page}&ct=${member.id}&cd=member`;
          
          let pageFeedItems: any[] = [];
          try {
            const pageHtml = await fetchHtml(pageUrl, 3, 900);
            pageFeedItems = parseBlogFeedFromList(pageHtml);
            if (pageFeedItems.length === 0) {
              console.log(`  Reached the end of blog history for ${member.name} at page ${page + 1}.`);
              break;
            }
          } catch (err: any) {
            console.error(`  Error scraping page ${page + 1} for ${member.name}: ${err.message}`);
            break;
          }
          
          // Process each blog parsed on this page
          for (const item of pageFeedItems) {
            // Check cache and local files presence
            let filesExist = allBlogsMap.has(item.id);
            if (filesExist) {
              const cachedBlog = allBlogsMap.get(item.id)!;
              if (cachedBlog.thumbnail && !fs.existsSync(path.join(PUBLIC_DIR, cachedBlog.thumbnail))) filesExist = false;
              for (const img of cachedBlog.images) {
                if (!fs.existsSync(path.join(PUBLIC_DIR, img))) {
                  filesExist = false;
                  break;
                }
              }
              if (filesExist) {
                if (!cachedBlog.contentHtmlFurigana) {
                  console.log(`[Crawler] Compiling missing Furigana for cached blog: ${item.id}`);
                  cachedBlog.contentHtmlFurigana = compileHtmlWithFurigana(cachedBlog.contentHtml, tokenizer);
                  allBlogsMap.set(item.id, cachedBlog);
                }
                continue;
              }
            }
            
            // Check batch limit
            if (newlyProcessedCount >= MAX_NEW_POSTS_PER_RUN) {
              console.log(`\n[Crawler] Reached batch limit of ${MAX_NEW_POSTS_PER_RUN} new posts during deep crawl of ${member.name}. Stopping crawler.`);
              batchLimitReached = true;
              break;
            }
            
            // Process it
            try {
              await processSingleBlog(item);
            } catch (err: any) {
              console.error(`  Failed to process blog ${item.id}: ${err.message}`);
            }
          }
          
          if (batchLimitReached) break;
        }
        
        if (batchLimitReached) break;
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

    // 9. Generate and update README.md automatically with live statistics
    console.log('[Crawler] Updating README.md dashboard with live statistics...');
    const readmeFile = path.join(PROJECT_ROOT, 'README.md');
    
    const totalBlogs = sortedBlogs.length;
    const totalImages = sortedBlogs.reduce((sum, b) => sum + b.images.length, 0);

    // Helper to generate SVG contribution heatmap for a specific year
    const generateYearlySvg = (year: number, blogsList: BlogPost[], imagesDir: string): { svgPath: string; totalBlogs: number } => {
      const jan1 = new Date(year, 0, 1);
      const firstSunday = new Date(jan1.getTime() - jan1.getDay() * 24 * 60 * 60 * 1000);
      
      const dec31 = new Date(year, 11, 31);
      const lastSunday = new Date(dec31.getTime() - dec31.getDay() * 24 * 60 * 60 * 1000);
      const totalWeeks = Math.ceil((lastSunday.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      const totalDays = totalWeeks * 7;
      const dailyCounts: number[] = new Array(totalDays).fill(0);
      const dateStrings: string[] = [];
      const formattedDates: string[] = [];
      
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(firstSunday.getTime() + i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        
        // key format "YYYY.M.D" used in blogs list sorting
        dateStrings.push(`${yyyy}.${m}.${day}`);
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        formattedDates.push(`${monthNames[d.getMonth()]} ${day}, ${yyyy}`);
      }
      
      // Count blogs for this year
      let yearTotalBlogs = 0;
      blogsList.forEach(blog => {
        const blogDatePart = blog.date.split(' ')[0];
        const [byyyy] = blogDatePart.split('.').map(Number);
        if (byyyy === year) {
          const idx = dateStrings.indexOf(blogDatePart);
          if (idx !== -1) {
            dailyCounts[idx]++;
            yearTotalBlogs++;
          }
        }
      });
      
      const svgWidth = 32 + totalWeeks * 14 + 16;
      
      // Build the SVG string with premium sky-blue styling
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} 150" width="${svgWidth}" height="150">\n`;
      // background
      svgContent += `  <rect width="${svgWidth}" height="150" fill="#0d1117" rx="8" ry="8" />\n`;
      
      // day labels (Mon, Wed, Fri)
      svgContent += `  <text x="8" y="43" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Mon</text>\n`;
      svgContent += `  <text x="8" y="71" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Wed</text>\n`;
      svgContent += `  <text x="8" y="99" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Fri</text>\n`;
      
      // Draw month labels & grid squares
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let lastMonthName = '';
      
      for (let col = 0; col < totalWeeks; col++) {
        const sundayIdx = col * 7;
        const sundayDate = new Date(firstSunday.getTime() + sundayIdx * 24 * 60 * 60 * 1000);
        const currentMonthName = monthNames[sundayDate.getMonth()];
        
        if (currentMonthName !== lastMonthName && sundayDate.getFullYear() === year) {
          svgContent += `  <text x="${32 + col * 14}" y="12" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${currentMonthName}</text>\n`;
          lastMonthName = currentMonthName;
        }
        
        for (let row = 0; row < 7; row++) {
          const idx = col * 7 + row;
          const d = new Date(firstSunday.getTime() + idx * 24 * 60 * 60 * 1000);
          const count = dailyCounts[idx];
          const dateLabel = formattedDates[idx];
          const postLabel = count === 1 ? '1 blog post' : `${count} blog posts`;
          
          if (d.getFullYear() !== year) {
            continue;
          }
          
          let fill = '#161b22'; // Level 0 (inactive)
          if (count === 1) fill = '#0b3b5c';
          else if (count === 2) fill = '#0a6299';
          else if (count === 3) fill = '#008ee6';
          else if (count > 3) fill = '#5bc4ff'; // Hinatazaka46 Sky Blue
          
          svgContent += `  <rect x="${32 + col * 14}" y="${20 + row * 14}" width="11" height="11" rx="2" ry="2" fill="${fill}">\n`;
          svgContent += `    <title>${dateLabel}: ${postLabel}</title>\n`;
          svgContent += `  </rect>\n`;
        }
      }
      
      // Draw Legend at the bottom right
      const legendX = svgWidth - 180;
      svgContent += `  <text x="${legendX}" y="138" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Less</text>\n`;
      svgContent += `  <rect x="${legendX + 32}" y="129" width="11" height="11" rx="2" ry="2" fill="#161b22" />\n`;
      svgContent += `  <rect x="${legendX + 48}" y="129" width="11" height="11" rx="2" ry="2" fill="#0b3b5c" />\n`;
      svgContent += `  <rect x="${legendX + 64}" y="129" width="11" height="11" rx="2" ry="2" fill="#0a6299" />\n`;
      svgContent += `  <rect x="${legendX + 80}" y="129" width="11" height="11" rx="2" ry="2" fill="#008ee6" />\n`;
      svgContent += `  <rect x="${legendX + 96}" y="129" width="11" height="11" rx="2" ry="2" fill="#5bc4ff" />\n`;
      svgContent += `  <text x="${legendX + 114}" y="138" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">More</text>\n`;
      
      svgContent += `</svg>\n`;
      
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      const svgPath = path.join(imagesDir, `${year}.svg`);
      fs.writeFileSync(svgPath, svgContent, 'utf-8');
      
      return { svgPath, totalBlogs: yearTotalBlogs };
    };

    // A. Helper to build the unified Git-like project contribution calendars for all years
    const projectContributionGrid = (() => {
      const yearsSet = new Set<number>();
      sortedBlogs.forEach(blog => {
        try {
          const year = Number(blog.date.split(' ')[0].split('.')[0]);
          if (!isNaN(year) && year >= 2010 && year <= 2030) {
            yearsSet.add(year);
          }
        } catch (e) {}
      });

      const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
      if (availableYears.length === 0) {
        return '';
      }

      const yearlyResults: { year: number; totalBlogs: number; relativePath: string }[] = [];
      availableYears.forEach(year => {
        const { totalBlogs } = generateYearlySvg(year, sortedBlogs, CONTRIBUTIONS_DIR);
        yearlyResults.push({
          year,
          totalBlogs,
          relativePath: `public/images/contributions/${year}.svg`
        });
      });

      const newestYearResult = yearlyResults[0];
      let contributionsMarkdown = `### ${newestYearResult.year} Contribution Calendar\n\n`;
      contributionsMarkdown += `This grid displays the total crawled blog posts across all members during the year ${newestYearResult.year} (Total: ${newestYearResult.totalBlogs} posts):\n\n`;
      contributionsMarkdown += `![Hinatazaka46 Blog Contributions ${newestYearResult.year}](${newestYearResult.relativePath})\n\n`;

      if (yearlyResults.length > 1) {
        contributionsMarkdown += `### Archive & Previous Years\n\n`;
        contributionsMarkdown += `Click on any year below to view the activity heatmap archive for that year:\n\n`;
        
        yearlyResults.slice(1).forEach(result => {
          contributionsMarkdown += `<details>\n`;
          contributionsMarkdown += `  <summary><b>Year ${result.year} Activity Calendar (${result.totalBlogs} blog posts)</b></summary>\n`;
          contributionsMarkdown += `  <br/>\n`;
          contributionsMarkdown += `  <img src="${result.relativePath}" alt="Hinatazaka46 Blog Contributions ${result.year}" width="100%">\n`;
          contributionsMarkdown += `</details>\n\n`;
        });
      }

      return contributionsMarkdown;
    })();

    // B. Helper to get the 30-day sparkline for each member
    const getMemberSparkline = (memberBlogs: BlogPost[]) => {
      const dates: string[] = [];
      const formattedDates: string[] = [];
      const tzOffset = 7 * 60 * 60 * 1000; // GMT+7
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nd = new Date(utc + tzOffset);
      
      for (let i = 29; i >= 0; i--) {
        const d = new Date(nd.getTime() - i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        dates.push(`${yyyy}.${m}.${day}`);
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        formattedDates.push(`${monthNames[d.getMonth()]} ${day}, ${yyyy}`);
      }
      
      const dailyCounts = dates.map(dateStr => {
        return memberBlogs.filter(b => b.date.split(' ')[0] === dateStr).length;
      });
      
      return dailyCounts.map((count, idx) => {
        const emoji = count === 0 ? '⬛' : '🟩';
        const dateLabel = formattedDates[idx];
        const postLabel = count === 1 ? '1 blog post' : `${count} blog posts`;
        return `<span title="${dateLabel}: ${postLabel}">${emoji}</span>`;
      }).join('');
    };

    // Table 2: Complete member database statistics in English
    let statsTable = '| No | Member Name | Romaji Slug | 30-Day Activity Sparkline | Total Posts | Oldest Post | Newest Post |\n';
    statsTable += '| --- | --- | --- | --- | --- | --- | --- |\n';
    
    members.forEach((member, index) => {
      const memberBlogs = sortedBlogs.filter(b => b.authorId === member.id);
      const count = memberBlogs.length;
      const sparkline = getMemberSparkline(memberBlogs);
      const oldest = count > 0 ? memberBlogs[count - 1].date : 'N/A';
      const newest = count > 0 ? memberBlogs[0].date : 'N/A';
      statsTable += `| ${index + 1} | ${member.name} | ${member.slug || ''} | ${sparkline} | ${count} | ${oldest} | ${newest} |\n`;
    });
    
    const readmeContent = `# Hinatazaka46 Blog Archive and Morphological Furigana Database

This repository automatically archives official diaries from Hinatazaka46 members, compresses image assets to optimize storage efficiency, and compiles Japanese text into dynamic Hiragana Furigana tags using morphological analysis.

The archiving process runs periodically via GitHub Actions, establishing a persistent, self-updating, and high-performance Japanese learning and reading resource.

## Project Contribution Calendar

This calendar displays the total crawled blog posts across all members over the past year (53 weeks):

${projectContributionGrid}

## Member Statistics and Activity

- Total active members: ${members.length}
- Total archived blog posts: ${totalBlogs}
- Total optimized images: ${totalImages}
- Database last updated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })} (Indochina Time)

### Member Progress Dashboard

${statsTable}

## Technical Setup

### Installation

Install the required Node.js dependencies:

\`\`\`bash
npm install
\`\`\`

### Local Development

Launch the interactive Vite development server locally:

\`\`\`bash
npm run dev
\`\`\`

### Run Crawler Manually

Trigger the incremental morphological compiler and image optimizer manually:

\`\`\`bash
npm run crawl
\`\`\`

### Build Production Bundle

Compile the TypeScript application and build the static production bundle:

\`\`\`bash
npm run build
\`\`\`
`;

    fs.writeFileSync(readmeFile, readmeContent, 'utf-8');
    console.log('[Crawler] Successfully updated README.md dashboard!');

  } catch (err: any) {
    console.error(`[Crawler] Critical crawler failure: ${err.message}`);
    process.exit(1);
  }
}

// Run immediately
runCrawler();
