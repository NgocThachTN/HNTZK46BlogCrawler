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

/**
 * Download a remote binary file to local path
 */
export async function downloadFile(url: string, destPath: string, retries = 3): Promise<void> {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': USER_AGENT,
        },
        timeout: 20000,
      });

      const writer = fs.createWriteStream(destPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', (err) => reject(err));
      });
      
      // Polite rate limit delay after download
      await sleep(200);
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
