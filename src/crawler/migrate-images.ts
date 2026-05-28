import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const BLOGS_DIR = path.join(IMAGES_DIR, 'blogs');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');
const MEMBER_JSON_DIR = path.join(PUBLIC_DIR, 'member');

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

async function migrateImages() {
  console.log('[Migration] Starting Blog Image Directory Migration...');

  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`[Migration] Database file not found at: ${OUTPUT_FILE}. Run crawl first.`);
    return;
  }

  const database = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const blogs = database.blogs || [];
  const members = database.members || [];

  console.log(`[Migration] Loaded ${blogs.length} blogs and ${members.length} members.`);

  let movedFilesCount = 0;
  let updatedBlogsCount = 0;

  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    let blogModified = false;
    
    const authorId = blog.authorId || 'unknown';
    const member = members.find((m: any) => m.id === authorId);
    const memberSlug = member?.slug || MEMBER_SLUGS[authorId] || `member_${authorId}`;
    const folderDate = formatFolderDate(blog.date);
    
    const newRelativeDir = `/images/blogs/${memberSlug}/${folderDate}`;
    const newAbsoluteDir = path.join(BLOGS_DIR, memberSlug, folderDate);

    // 1. Move and update Thumbnail
    if (blog.thumbnail && blog.thumbnail.startsWith('/images/blogs/') && !blog.thumbnail.replace('/images/blogs/', '').includes('/')) {
      const filename = path.basename(blog.thumbnail);
      const oldPath = path.join(PUBLIC_DIR, blog.thumbnail);
      const newPath = path.join(newAbsoluteDir, filename);
      const newUrl = `${newRelativeDir}/${filename}`;

      if (fs.existsSync(oldPath)) {
        if (!fs.existsSync(newAbsoluteDir)) {
          fs.mkdirSync(newAbsoluteDir, { recursive: true });
        }
        fs.renameSync(oldPath, newPath);
        movedFilesCount++;
      }
      
      blog.thumbnail = newUrl;
      blogModified = true;
    }

    // 2. Move and update Inline Images in array
    if (blog.images && Array.isArray(blog.images)) {
      const updatedImages: string[] = [];
      for (const imgUrl of blog.images) {
        if (imgUrl.startsWith('/images/blogs/') && !imgUrl.replace('/images/blogs/', '').includes('/')) {
          const filename = path.basename(imgUrl);
          const oldPath = path.join(PUBLIC_DIR, imgUrl);
          const newPath = path.join(newAbsoluteDir, filename);
          const newUrl = `${newRelativeDir}/${filename}`;

          if (fs.existsSync(oldPath)) {
            if (!fs.existsSync(newAbsoluteDir)) {
              fs.mkdirSync(newAbsoluteDir, { recursive: true });
            }
            fs.renameSync(oldPath, newPath);
            movedFilesCount++;
          }
          
          updatedImages.push(newUrl);
          blogModified = true;

          // Replace URL inside contentHtml and contentHtmlFurigana
          if (blog.contentHtml && blog.contentHtml.includes(imgUrl)) {
            blog.contentHtml = blog.contentHtml.replaceAll(imgUrl, newUrl);
          }
          if (blog.contentHtmlFurigana && blog.contentHtmlFurigana.includes(imgUrl)) {
            blog.contentHtmlFurigana = blog.contentHtmlFurigana.replaceAll(imgUrl, newUrl);
          }
        } else {
          updatedImages.push(imgUrl);
        }
      }
      blog.images = updatedImages;
    }

    // 3. Scan contentHtml for any leftover top-level images not captured in the array
    if (blog.contentHtml && (blog.contentHtml.includes('/images/blogs/') && !blog.contentHtml.replace(/\/images\/blogs\//g, '').includes('/'))) {
      const srcRegex = /\/images\/blogs\/([a-zA-Z0-9._-]+)/g;
      let match;
      const htmlMatches: string[] = [];
      
      while ((match = srcRegex.exec(blog.contentHtml)) !== null) {
        htmlMatches.push(match[0]);
      }

      for (const oldUrl of htmlMatches) {
        if (oldUrl.startsWith('/images/blogs/') && !oldUrl.replace('/images/blogs/', '').includes('/')) {
          const filename = path.basename(oldUrl);
          const oldPath = path.join(PUBLIC_DIR, oldUrl);
          const newPath = path.join(newAbsoluteDir, filename);
          const newUrl = `${newRelativeDir}/${filename}`;

          if (fs.existsSync(oldPath)) {
            if (!fs.existsSync(newAbsoluteDir)) {
              fs.mkdirSync(newAbsoluteDir, { recursive: true });
            }
            fs.renameSync(oldPath, newPath);
            movedFilesCount++;
          }

          blog.contentHtml = blog.contentHtml.replaceAll(oldUrl, newUrl);
          if (blog.contentHtmlFurigana) {
            blog.contentHtmlFurigana = blog.contentHtmlFurigana.replaceAll(oldUrl, newUrl);
          }
          blogModified = true;

          // Sync into images list if it wasn't in there
          if (blog.images && !blog.images.includes(newUrl)) {
            const oldIdx = blog.images.indexOf(oldUrl);
            if (oldIdx !== -1) {
              blog.images[oldIdx] = newUrl;
            } else {
              blog.images.push(newUrl);
            }
          }
        }
      }
    }

    if (blogModified) {
      updatedBlogsCount++;
      if (updatedBlogsCount % 50 === 0 || i === blogs.length - 1) {
        console.log(`[Migration] Processed ${i + 1}/${blogs.length} blogs...`);
      }
    }
  }

  // Save the updated main database file
  if (updatedBlogsCount > 0) {
    console.log(`\n[Migration] Saving updated database with ${updatedBlogsCount} migrated blogs...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2), 'utf-8');
    console.log(`[Migration] Successfully saved updated blogs.json!`);

    // Re-generate individual member JSON files
    console.log('[Migration] Re-generating individual member JSON files...');
    if (!fs.existsSync(MEMBER_JSON_DIR)) {
      fs.mkdirSync(MEMBER_JSON_DIR, { recursive: true });
    }
    
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
    console.log('[Migration] Individual member JSON archives updated successfully!');
  } else {
    console.log('\n[Migration] No legacy top-level images found to migrate.');
  }

  console.log(`\n[Migration] COMPLETE! Migrated ${movedFilesCount} image files across ${updatedBlogsCount} blogs.`);
}

migrateImages().catch(err => {
  console.error('[Migration] Error during migration:', err);
});
