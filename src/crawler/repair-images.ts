import * as fs from 'fs';
import * as path from 'path';
import { downloadFile } from './client';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const BLOGS_DIR = path.join(IMAGES_DIR, 'blogs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');
const MEMBER_JSON_DIR = path.join(PUBLIC_DIR, 'member');

const BASE_URL = 'https://www.hinatazaka46.com';

function ensureDirectories() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(BLOGS_DIR)) fs.mkdirSync(BLOGS_DIR, { recursive: true });
  if (!fs.existsSync(MEMBER_JSON_DIR)) fs.mkdirSync(MEMBER_JSON_DIR, { recursive: true });
}

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

function getFileExtension(url: string): string {
  try {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname);
    return ext ? ext.toLowerCase() : '.jpg';
  } catch (e) {
    const baseName = path.basename(url.split('?')[0]);
    const ext = path.extname(baseName);
    return ext ? ext.toLowerCase() : '.jpg';
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

function isRemoteUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.includes('hinatazaka46.com') || url.startsWith('/diary/') || url.startsWith('/files/');
}

async function repairDatabase() {
  console.log('[Repair] Starting Hinatazaka46 Blog Image Repair Tool...');
  ensureDirectories();

  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`[Repair] Database file not found at: ${OUTPUT_FILE}. Run crawl first.`);
    return;
  }

  const database = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const blogs = database.blogs || [];
  const members = database.members || [];

  console.log(`[Repair] Loaded ${blogs.length} blogs and ${members.length} members from local database.`);
  
  let repairedBlogsCount = 0;
  let totalDownloadedCount = 0;

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    let blogModified = false;
    const urlMapping: Record<string, string> = {};

    const authorId = blog.authorId || 'unknown';
    const member = members.find((m: any) => m.id === authorId);
    const memberSlug = (member && member.slug) || MEMBER_SLUGS[authorId] || `member_${authorId}`;
    const folderDate = formatFolderDate(blog.date);
    const blogPostImagesDir = path.join(BLOGS_DIR, memberSlug, folderDate);
    const publicBlogImagesPath = `/images/blogs/${memberSlug}/${folderDate}`;

    // 1. Repair Thumbnail Image
    if (blog.thumbnail && isRemoteUrl(blog.thumbnail)) {
      const absoluteThumbUrl = blog.thumbnail.startsWith('/') ? BASE_URL + blog.thumbnail : blog.thumbnail;
      const thumbExt = getFileExtension(absoluteThumbUrl);
      const thumbFilename = `${blog.id}_thumb${thumbExt}`;
      const thumbDestPath = path.join(blogPostImagesDir, thumbFilename);
      const localThumbUrl = `${publicBlogImagesPath}/${thumbFilename}`;

      if (!fs.existsSync(thumbDestPath)) {
        console.log(`[Repair] [${i + 1}/${blogs.length}] Downloading thumbnail for blog ${blog.id}: ${absoluteThumbUrl}`);
        try {
          await downloadFile(absoluteThumbUrl, thumbDestPath);
          totalDownloadedCount++;
        } catch (err: any) {
          console.error(`  Failed to download thumbnail: ${err.message}`);
        }
      }

      if (fs.existsSync(thumbDestPath)) {
        urlMapping[blog.thumbnail] = localThumbUrl;
        urlMapping[absoluteThumbUrl] = localThumbUrl;
        blog.thumbnail = localThumbUrl;
        blogModified = true;
      }
    }

    // 2. Repair inline images array
    const repairedImages: string[] = [];
    if (blog.images && blog.images.length > 0) {
      for (let j = 0; j < blog.images.length; j++) {
        const remoteImgUrl = blog.images[j];
        
        if (isRemoteUrl(remoteImgUrl)) {
          const absoluteImgUrl = remoteImgUrl.startsWith('/') ? BASE_URL + remoteImgUrl : remoteImgUrl;
          const imgExt = getFileExtension(absoluteImgUrl);
          const imgFilename = `${blog.id}_${j}${imgExt}`;
          const imgDestPath = path.join(blogPostImagesDir, imgFilename);
          const localImgUrl = `${publicBlogImagesPath}/${imgFilename}`;

          if (!fs.existsSync(imgDestPath)) {
            console.log(`[Repair] [${i + 1}/${blogs.length}] Downloading inline image [${j + 1}/${blog.images.length}] for blog ${blog.id}: ${absoluteImgUrl}`);
            try {
              await downloadFile(absoluteImgUrl, imgDestPath);
              totalDownloadedCount++;
            } catch (err: any) {
              console.error(`  Failed to download inline image ${absoluteImgUrl}: ${err.message}`);
              repairedImages.push(remoteImgUrl); // Keep remote on failure
              continue;
            }
          }

          if (fs.existsSync(imgDestPath)) {
            urlMapping[remoteImgUrl] = localImgUrl;
            urlMapping[absoluteImgUrl] = localImgUrl;
            repairedImages.push(localImgUrl);
            blogModified = true;
          } else {
            repairedImages.push(remoteImgUrl);
          }
        } else {
          repairedImages.push(remoteImgUrl);
        }
      }
      blog.images = repairedImages;
    }

    // 3. Repair contentHtml and contentHtmlFurigana URLs using mapping & regex replacement
    let updatedHtml = blog.contentHtml;
    let updatedHtmlFurigana = blog.contentHtmlFurigana || '';

    // Direct String Replacement for exact remote URLs
    for (const [remoteUrl, localUrl] of Object.entries(urlMapping)) {
      if (updatedHtml.includes(remoteUrl)) {
        updatedHtml = updatedHtml.replaceAll(remoteUrl, localUrl);
        blogModified = true;
      }
      if (updatedHtmlFurigana && updatedHtmlFurigana.includes(remoteUrl)) {
        updatedHtmlFurigana = updatedHtmlFurigana.replaceAll(remoteUrl, localUrl);
        blogModified = true;
      }
    }

    // Double check if there are other remote images inside the HTML that weren't captured in the main images array
    if (updatedHtml.includes('http') || updatedHtml.includes('/diary/') || updatedHtml.includes('/files/')) {
      // Find all matches of src attribute in HTML
      const srcRegex = /src=["']([^"']+)["']/g;
      let match;
      let extraIdx = blog.images.length;
      
      while ((match = srcRegex.exec(blog.contentHtml)) !== null) {
        const foundSrc = match[1];
        if (isRemoteUrl(foundSrc) && !urlMapping[foundSrc]) {
          const absoluteImgUrl = foundSrc.startsWith('/') ? BASE_URL + foundSrc : foundSrc;
          const imgExt = getFileExtension(absoluteImgUrl);
          const imgFilename = `${blog.id}_extra_${extraIdx}${imgExt}`;
          const imgDestPath = path.join(blogPostImagesDir, imgFilename);
          const localImgUrl = `${publicBlogImagesPath}/${imgFilename}`;

          if (!fs.existsSync(imgDestPath)) {
            console.log(`[Repair] [${i + 1}/${blogs.length}] Downloading extra inline HTML image for blog ${blog.id}: ${absoluteImgUrl}`);
            try {
              await downloadFile(absoluteImgUrl, imgDestPath);
              totalDownloadedCount++;
            } catch (err: any) {
              console.error(`  Failed to download extra image ${absoluteImgUrl}: ${err.message}`);
              continue;
            }
          }

          if (fs.existsSync(imgDestPath)) {
            updatedHtml = updatedHtml.replaceAll(foundSrc, localImgUrl);
            updatedHtml = updatedHtml.replaceAll(absoluteImgUrl, localImgUrl);
            if (updatedHtmlFurigana) {
              updatedHtmlFurigana = updatedHtmlFurigana.replaceAll(foundSrc, localImgUrl);
              updatedHtmlFurigana = updatedHtmlFurigana.replaceAll(absoluteImgUrl, localImgUrl);
            }
            blog.images.push(localImgUrl);
            blogModified = true;
            extraIdx++;
          }
        }
      }
    }

    blog.contentHtml = updatedHtml;
    blog.contentHtmlFurigana = updatedHtmlFurigana;

    if (blogModified) {
      repairedBlogsCount++;
      console.log(`  -> Repaired blog ${blog.id} successfully!`);
    }
  }

  // 4. Save the updated database
  if (repairedBlogsCount > 0) {
    console.log(`\n[Repair] Saving updated database with ${repairedBlogsCount} repaired blogs...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf-8');
    console.log(`[Repair] Successfully saved updated blogs.json!`);

    // 5. Re-generate individual member JSON files
    console.log('[Repair] Re-generating individual member JSON files...');
    for (const member of members) {
      const slug = member.slug || `member_${member.id}`;
      const memberBlogs = blogs.filter((b: any) => b.authorId === member.id);
      const memberFile = path.join(MEMBER_JSON_DIR, `${slug}.json`);
      
      const memberArchive = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        slug: slug,
        blogs: memberBlogs
      };
      
      fs.writeFileSync(memberFile, JSON.stringify(memberArchive, null, 2), 'utf-8');
    }
    console.log('[Repair] Individual member JSON archives updated successfully!');
  } else {
    console.log('\n[Repair] No remote image URLs found to download/repair.');
  }

  console.log(`\n[Repair] COMPLETE! Repaired ${repairedBlogsCount} blogs, downloaded ${totalDownloadedCount} missing images.`);
}

repairDatabase().catch(err => {
  console.error('[Repair] Error during repair:', err);
});
