import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Helper to delay execution
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch HTML page content with retry logic
 */
export async function fetchHtml(url: string, retries = 3, delayMs = 1000): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
        timeout: 15000,
      });
      
      // Polite rate limit delay after a successful fetch
      await sleep(delayMs);
      return response.data;
    } catch (error: any) {
      console.warn(`[Client] Attempt ${attempt} failed for URL ${url}. Error: ${error.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to fetch ${url} after ${retries} attempts. Original error: ${error.message}`);
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw new Error('Unreachable state in fetchHtml');
}

import { Jimp } from 'jimp';

/**
 * Download a remote binary file to local path, with automatic Jimp resizing & compression
 */
export async function downloadFile(
  url: string,
  destPath: string,
  retries = 3,
  maxWidth = 1000
): Promise<void> {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Download remote image file as a buffer
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': USER_AGENT,
        },
        timeout: 25000,
      });

      const buffer = Buffer.from(response.data);

      try {
        // Read buffer with Jimp for high-performance compression
        const image = await Jimp.read(buffer);
        
        // Resize if larger than maximum width to save Git storage
        if (image.width > maxWidth) {
          image.resize({ w: maxWidth });
        }
        
        // Save compressed image
        const ext = path.extname(destPath).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') {
          // Compress JPEG using quality 70 (high compression, excellent visual quality)
          const compressedBuffer = await image.getBuffer('image/jpeg', { quality: 70 });
          fs.writeFileSync(destPath, compressedBuffer);
        } else if (ext === '.png') {
          const compressedBuffer = await image.getBuffer('image/png');
          fs.writeFileSync(destPath, compressedBuffer);
        } else {
          // Fallback to default write
          await image.write(destPath as any);
        }
        
        // Log compression status
        const originalSizeKB = Math.round(buffer.length / 1024);
        const newSizeKB = Math.round(fs.statSync(destPath).size / 1024);
        const savedPercent = originalSizeKB > 0 ? Math.round((1 - newSizeKB / originalSizeKB) * 100) : 0;
        console.log(`[Compressor] Optimized ${path.basename(destPath)}: ${originalSizeKB}KB -> ${newSizeKB}KB (${savedPercent}% saved)`);
      } catch (jimpErr: any) {
        // Log warning but fallback to direct binary write so crawler never fails
        console.warn(`[Compressor] Jimp processing failed, falling back to raw save: ${jimpErr.message}`);
        fs.writeFileSync(destPath, buffer);
      }
      
      // Polite rate limit delay after download
      await sleep(150);
      return;
    } catch (error: any) {
      console.warn(`[Client] Image download attempt ${attempt} failed for URL ${url}. Error: ${error.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to download ${url} to ${destPath} after ${retries} attempts.`);
      }
      await sleep(500 * Math.pow(2, attempt));
    }
  }
}
