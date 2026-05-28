import * as fs from 'fs';
import * as path from 'path';
import type { BlogDatabase, BlogPost } from '../types/blog';

// Define project paths
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');
const readmeFile = path.join(PROJECT_ROOT, 'README.md');

async function main() {
  console.log('[Generator] Starting instant README and SVG heatmap generation...');
  
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`[Error] Database file ${OUTPUT_FILE} not found. Please run the crawl first.`);
    process.exit(1);
  }

  // Load existing database
  const database: BlogDatabase = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const blogs = database.blogs;
  const members = database.members;
  console.log(`[Generator] Loaded ${blogs.length} blogs and ${members.length} members from local database.`);

  const totalBlogs = blogs.length;
  const totalImages = blogs.reduce((sum: number, b: BlogPost) => sum + (b.images ? b.images.length : 0), 0);

  // A. Helper to build the unified Git-like project contribution calendar SVG
  const projectContributionGrid = (() => {
    const tzOffset = 7 * 60 * 60 * 1000; // GMT+7
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const todayGmt7 = new Date(utc + tzOffset);
    
    const currentDayOfWeek = todayGmt7.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = 6 - currentDayOfWeek;
    const endSaturday = new Date(todayGmt7.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    
    const totalDays = 371; // 53 weeks * 7 days
    const startSunday = new Date(endSaturday.getTime() - (totalDays - 1) * 24 * 60 * 60 * 1000);
    
    const dailyCounts: number[] = new Array(totalDays).fill(0);
    const dateStrings: string[] = [];
    const formattedDates: string[] = [];
    
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startSunday.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      
      // key format "YYYY.M.D" used in blogs list sorting
      dateStrings.push(`${yyyy}.${m}.${day}`);
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      formattedDates.push(`${monthNames[d.getMonth()]} ${day}, ${yyyy}`);
    }
    
    blogs.forEach(blog => {
      const blogDatePart = blog.date.split(' ')[0];
      const idx = dateStrings.indexOf(blogDatePart);
      if (idx !== -1) {
        dailyCounts[idx]++;
      }
    });
    
    // Build the SVG string with premium sky-blue styling
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 790 150" width="790" height="150">\n`;
    // background
    svgContent += `  <rect width="790" height="150" fill="#0d1117" rx="8" ry="8" />\n`;
    
    // day labels (Mon, Wed, Fri)
    svgContent += `  <text x="8" y="43" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Mon</text>\n`;
    svgContent += `  <text x="8" y="71" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Wed</text>\n`;
    svgContent += `  <text x="8" y="99" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Fri</text>\n`;
    
    // Draw month labels & grid squares
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonthName = '';
    
    for (let col = 0; col < 53; col++) {
      // Look at Sunday (row = 0) of this week
      const sundayIdx = col * 7;
      const sundayDate = new Date(startSunday.getTime() + sundayIdx * 24 * 60 * 60 * 1000);
      const currentMonthName = monthNames[sundayDate.getMonth()];
      
      if (currentMonthName !== lastMonthName) {
        // If first column or new month
        svgContent += `  <text x="${32 + col * 14}" y="12" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">${currentMonthName}</text>\n`;
        lastMonthName = currentMonthName;
      }
      
      for (let row = 0; row < 7; row++) {
        const idx = col * 7 + row;
        const count = dailyCounts[idx];
        const dateLabel = formattedDates[idx];
        const postLabel = count === 1 ? '1 blog post' : `${count} blog posts`;
        
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
    svgContent += `  <text x="610" y="138" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">Less</text>\n`;
    svgContent += `  <rect x="642" y="129" width="11" height="11" rx="2" ry="2" fill="#161b22" />\n`;
    svgContent += `  <rect x="658" y="129" width="11" height="11" rx="2" ry="2" fill="#0b3b5c" />\n`;
    svgContent += `  <rect x="674" y="129" width="11" height="11" rx="2" ry="2" fill="#0a6299" />\n`;
    svgContent += `  <rect x="690" y="129" width="11" height="11" rx="2" ry="2" fill="#008ee6" />\n`;
    svgContent += `  <rect x="706" y="129" width="11" height="11" rx="2" ry="2" fill="#5bc4ff" />\n`;
    svgContent += `  <text x="724" y="138" fill="#9ca3af" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif">More</text>\n`;
    
    svgContent += `</svg>\n`;
    
    // Ensure IMAGES_DIR exists
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    
    // Write the SVG file locally
    const svgPath = path.join(IMAGES_DIR, 'contributions.svg');
    fs.writeFileSync(svgPath, svgContent, 'utf-8');
    console.log(`[Generator] Generated beautiful SVG heatmap and saved to: ${svgPath}`);
    
    return `![Hinatazaka46 Blog Contributions](public/images/contributions.svg)`;
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
    const memberBlogs = blogs.filter((b: BlogPost) => b.authorId === member.id);
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
  console.log('[Generator] Successfully updated README.md with SVG contributions heatmap!');
}

main().catch(err => {
  console.error('[Generator] Critical failure:', err);
  process.exit(1);
});
