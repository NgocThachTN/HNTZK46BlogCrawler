import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import { Jimp } from 'jimp';
import { fetchHtml, sleep } from './client';
import { parseArtistSearchMembers, parseMembers } from './parser';
import type { Member, BlogDatabase } from '../types/blog';

const ARTIST_URL = 'https://www.hinatazaka46.com/s/official/search/artist?ima=0000';
const BLOG_MEMBER_URL = 'https://www.hinatazaka46.com/s/official/diary/member?ima=0000';

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

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const MEMBERS_DIR = path.join(PUBLIC_DIR, 'images', 'members');
const ARCHIVE_DIR = path.join(MEMBERS_DIR, 'archive');
const MANIFEST_PATH = path.join(ARCHIVE_DIR, 'manifest.json');
const BLOGS_JSON_PATH = path.join(PUBLIC_DIR, 'blogs.json');
const MEMBER_JSON_DIR = path.join(PUBLIC_DIR, 'member');

function getHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

interface ArchiveManifestEntry {
  memberId: string;
  memberName: string;
  slug: string;
  archivedFile: string;
  archivedAt: string;
  hash: string;
  reason: string;
}

interface ArchiveManifest {
  lastUpdated: string;
  archives: ArchiveManifestEntry[];
}

function loadManifest(): ArchiveManifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
      // ignore
    }
  }
  return {
    lastUpdated: new Date().toISOString(),
    archives: [],
  };
}

function saveManifest(manifest: ArchiveManifest) {
  manifest.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Optimize / Compress image using Jimp
 */
async function processImageBuffer(rawBuffer: Buffer, maxWidth = 800): Promise<Buffer> {
  try {
    const image = await Jimp.read(rawBuffer);
    if (image.width > maxWidth) {
      image.resize({ w: maxWidth });
    }
    return await image.getBuffer('image/jpeg', { quality: 85 });
  } catch (err) {
    console.warn('[Optimizer] Fallback to raw buffer due to Jimp issue:', err);
    return rawBuffer;
  }
}

export async function updateProfiles() {
  console.log('='.repeat(60));
  console.log('  Hinatazaka46 Member Profile Refresh & Archive Engine');
  console.log('='.repeat(60));

  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(MEMBERS_DIR)) fs.mkdirSync(MEMBERS_DIR, { recursive: true });
  if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  if (!fs.existsSync(MEMBER_JSON_DIR)) fs.mkdirSync(MEMBER_JSON_DIR, { recursive: true });

  const manifest = loadManifest();

  // 1. Fetch artist directory
  console.log(`\n[Profile Refresher] Fetching artist search page: ${ARTIST_URL}`);
  const artistHtml = await fetchHtml(ARTIST_URL, 3, 1000);
  const artistMembers = parseArtistSearchMembers(artistHtml);
  console.log(`[Profile Refresher] Found ${artistMembers.length} active members from artist directory.`);

  // 2. Fetch blog member page to detect mascot Poka (000) or others
  console.log(`[Profile Refresher] Fetching blog member list: ${BLOG_MEMBER_URL}`);
  let blogMembers: Member[] = [];
  try {
    const blogHtml = await fetchHtml(BLOG_MEMBER_URL, 3, 1000);
    blogMembers = parseMembers(blogHtml);
  } catch (err: any) {
    console.warn(`[Profile Refresher] Failed to fetch blog member page: ${err.message}`);
  }

  // Combine artist members + Poka (000)
  const combinedMembers: Member[] = [...artistMembers];
  for (const bm of blogMembers) {
    if (!combinedMembers.some((m) => m.id === bm.id)) {
      console.log(`[Profile Refresher] Adding additional member/mascot from blog list: ${bm.name} (${bm.id})`);
      combinedMembers.push(bm);
    }
  }

  console.log(`[Profile Refresher] Total members to process: ${combinedMembers.length}\n`);

  let updatedCount = 0;
  let archivedCount = 0;
  let skippedCount = 0;

  const finalMembersList: Member[] = [];

  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');

  for (let i = 0; i < combinedMembers.length; i++) {
    const member = combinedMembers[i];
    const slug = MEMBER_SLUGS[member.id] || `member_${member.id}`;
    const localDestFile = `${member.id}.jpg`;
    const localDestPath = path.join(MEMBERS_DIR, localDestFile);
    const relativeAvatarPath = `/images/members/${localDestFile}`;

    console.log(`[${i + 1}/${combinedMembers.length}] Checking ${member.name} (${slug}, ID: ${member.id})...`);

    try {
      // Download remote new image buffer
      const res = await axios.get(member.avatar, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 20000,
      });
      const remoteRawBuffer = Buffer.from(res.data);
      const newOptimizedBuffer = await processImageBuffer(remoteRawBuffer, 800);
      const newHash = getHash(newOptimizedBuffer);

      let needsUpdate = true;

      if (fs.existsSync(localDestPath)) {
        const existingBuffer = fs.readFileSync(localDestPath);
        const existingHash = getHash(existingBuffer);

        if (existingHash === newHash) {
          console.log(`   -> Avatar is already up-to-date (Hash: ${newHash.substring(0, 8)}).`);
          needsUpdate = false;
          skippedCount++;
        } else {
          // ARCHIVE the old avatar!
          const archiveFilename = `${slug}_${member.id}_${timestampStr}.jpg`;
          const archivePath = path.join(ARCHIVE_DIR, archiveFilename);
          fs.writeFileSync(archivePath, existingBuffer);

          manifest.archives.push({
            memberId: member.id,
            memberName: member.name,
            slug,
            archivedFile: archiveFilename,
            archivedAt: new Date().toISOString(),
            hash: existingHash,
            reason: 'Profile image updated with new single / official profile',
          });

          console.log(`   -> [ARCHIVED] Previous avatar saved to archive/${archiveFilename} (${existingBuffer.length} bytes)`);
          archivedCount++;
        }
      } else {
        console.log(`   -> Initial download for ${member.name}.`);
      }

      if (needsUpdate) {
        fs.writeFileSync(localDestPath, newOptimizedBuffer);
        console.log(`   -> [UPDATED] Saved new avatar to images/members/${localDestFile} (${newOptimizedBuffer.length} bytes)`);
        updatedCount++;
      }

      finalMembersList.push({
        id: member.id,
        name: member.name,
        avatar: relativeAvatarPath,
        slug,
      });

      await sleep(150);
    } catch (err: any) {
      console.error(`   -> [ERROR] Failed to process ${member.name}: ${err.message}`);
      finalMembersList.push({
        id: member.id,
        name: member.name,
        avatar: fs.existsSync(localDestPath) ? relativeAvatarPath : member.avatar,
        slug,
      });
    }
  }

  // Save manifest
  saveManifest(manifest);

  // 3. Update public/blogs.json with refreshed member list
  if (fs.existsSync(BLOGS_JSON_PATH)) {
    try {
      console.log(`\n[Database] Updating member metadata in ${BLOGS_JSON_PATH}...`);
      const db: BlogDatabase = JSON.parse(fs.readFileSync(BLOGS_JSON_PATH, 'utf-8'));
      db.members = finalMembersList;
      fs.writeFileSync(BLOGS_JSON_PATH, JSON.stringify(db, null, 2), 'utf-8');
      console.log(`[Database] Successfully updated ${db.members.length} members in blogs.json!`);
    } catch (err: any) {
      console.error(`[Database] Failed to update blogs.json: ${err.message}`);
    }
  }

  // 4. Update individual public/member/{slug}.json files
  console.log(`[Database] Updating individual member JSON files in ${MEMBER_JSON_DIR}...`);
  for (const m of finalMembersList) {
    const slug = m.slug || `member_${m.id}`;
    const memberFile = path.join(MEMBER_JSON_DIR, `${slug}.json`);
    let memberData: any = {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      slug,
      blogs: [],
    };

    if (fs.existsSync(memberFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(memberFile, 'utf-8'));
        memberData = {
          ...existing,
          name: m.name,
          avatar: m.avatar,
          slug,
        };
      } catch {}
    }

    fs.writeFileSync(memberFile, JSON.stringify(memberData, null, 2), 'utf-8');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`[Summary] Profile Refresh Completed!`);
  console.log(`  - Total Members Processed : ${combinedMembers.length}`);
  console.log(`  - Avatars Updated         : ${updatedCount}`);
  console.log(`  - Old Avatars Archived    : ${archivedCount}`);
  console.log(`  - Unchanged (Skipped)     : ${skippedCount}`);
  console.log(`  - Archive Manifest Saved  : ${MANIFEST_PATH}`);
  console.log('='.repeat(60) + '\n');
}

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  updateProfiles().catch((err) => {
    console.error('[Fatal Error]', err);
    process.exit(1);
  });
}
