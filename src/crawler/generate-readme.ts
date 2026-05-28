import * as fs from 'fs';
import * as path from 'path';
import type { BlogDatabase, BlogPost } from '../types/blog';

// Define project paths
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const CONTRIBUTIONS_DIR = path.join(IMAGES_DIR, 'contributions');
const SPARKLINES_DIR = path.join(IMAGES_DIR, 'sparklines');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'blogs.json');
const readmeFile = path.join(PROJECT_ROOT, 'README.md');


// Helper to generate SVG contribution heatmap for a specific year
function generateYearlySvg(year: number, blogs: BlogPost[], imagesDir: string): { svgPath: string; totalBlogs: number } {
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
  blogs.forEach(blog => {
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
}

async function main() {
  console.log('[Generator] Starting year-by-year README and SVG heatmap generation...');
  
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`[Error] Database file ${OUTPUT_FILE} not found. Please run the crawl first.`);
    process.exit(1);
  }
  
  if (!fs.existsSync(SPARKLINES_DIR)) {
    fs.mkdirSync(SPARKLINES_DIR, { recursive: true });
  }

  // Load existing database
  const database: BlogDatabase = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  const blogs = database.blogs;
  const members = database.members;
  console.log(`[Generator] Loaded ${blogs.length} blogs and ${members.length} members from local database.`);

  const totalBlogs = blogs.length;
  const totalImages = blogs.reduce((sum: number, b: BlogPost) => sum + (b.images ? b.images.length : 0), 0);

  // 1. Detect all years present in the database
  const yearsSet = new Set<number>();
  blogs.forEach(blog => {
    try {
      const year = Number(blog.date.split(' ')[0].split('.')[0]);
      if (!isNaN(year) && year >= 2010 && year <= 2030) {
        yearsSet.add(year);
      }
    } catch (e) {}
  });

  // Sort years in descending order (newest first)
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
  console.log(`[Generator] Detected years with blog posts: ${availableYears.join(', ')}`);

  if (availableYears.length === 0) {
    console.error('[Error] No valid years detected in blog posts.');
    process.exit(1);
  }

  // 2. Generate SVG heatmap files for each detected year
  const yearlyResults: { year: number; totalBlogs: number; relativePath: string }[] = [];
  availableYears.forEach(year => {
    const { totalBlogs } = generateYearlySvg(year, blogs, CONTRIBUTIONS_DIR);
    yearlyResults.push({
      year,
      totalBlogs,
      relativePath: `public/images/contributions/${year}.svg`
    });
    console.log(`[Generator] Successfully processed year ${year} with ${totalBlogs} blogs.`);
  });

  // 3. Build the markdown section for README.md
  // The first year (newest, e.g. 2026) will be shown expanded at the top
  const newestYearResult = yearlyResults[0];
  let contributionsMarkdown = `### ${newestYearResult.year} Contribution Calendar\n\n`;
  contributionsMarkdown += `This grid displays the total crawled blog posts across all members during the year ${newestYearResult.year} (Total: ${newestYearResult.totalBlogs} posts):\n\n`;
  contributionsMarkdown += `![Hinatazaka46 Blog Contributions ${newestYearResult.year}](${newestYearResult.relativePath})\n\n`;

  // Previous years will be listed inside collapsible details tags
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

  // B. Helper to get the 30-day sparkline for each member
  const getMemberSparkline = (memberBlogs: BlogPost[], slug: string) => {
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
    
    let rects = '';
    for (let i = 0; i < 30; i++) {
      const count = dailyCounts[i];
      const dateLabel = formattedDates[i];
      const postLabel = count === 1 ? '1 blog post' : `${count} blog posts`;
      
      let levelClass = 'level0';
      if (count === 1) levelClass = 'level1';
      else if (count === 2) levelClass = 'level2';
      else if (count === 3) levelClass = 'level3';
      else if (count > 3) levelClass = 'level4';
      
      rects += `<rect x="${(i * 8.5).toFixed(1)}" y="1" width="7" height="7" rx="1.5" ry="1.5" class="${levelClass}"><title>${dateLabel}: ${postLabel}</title></rect>`;
    }
    
    const styleBlock = `<style>
      .level0 { fill: #ebedf0; }
      .level1 { fill: #bce4fa; }
      .level2 { fill: #75c7f7; }
      .level3 { fill: #30a9f2; }
      .level4 { fill: #008ee6; }
      @media (prefers-color-scheme: dark) {
        .level0 { fill: #161b22; }
        .level1 { fill: #0b3b5c; }
        .level2 { fill: #0a6299; }
        .level3 { fill: #008ee6; }
        .level4 { fill: #5bc4ff; }
      }
    </style>`;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="255" height="9">${styleBlock}${rects}</svg>`;
    const fileName = `${slug}.svg`;
    const filePath = path.join(SPARKLINES_DIR, fileName);
    fs.writeFileSync(filePath, svgContent, 'utf-8');
    
    return `<img src="public/images/sparklines/${slug}.svg" alt="Sparkline" height="9" style="vertical-align: middle;">`;
  };

  // Table 2: Complete member database statistics in English
  let statsTable = '| No | Member Name | Romaji Slug | 30-Day Activity Sparkline | Total Posts | Oldest Post | Newest Post |\n';
  statsTable += '| --- | --- | --- | --- | --- | --- | --- |\n';
  
  members.forEach((member, index) => {
    const memberBlogs = blogs.filter((b: BlogPost) => b.authorId === member.id);
    const count = memberBlogs.length;
    const slug = member.slug || `member_${member.id}`;
    const sparkline = getMemberSparkline(memberBlogs, slug);
    const oldest = count > 0 ? memberBlogs[count - 1].date : 'N/A';
    const newest = count > 0 ? memberBlogs[0].date : 'N/A';
    statsTable += `| ${index + 1} | ${member.name} | ${slug} | ${sparkline} | ${count} | ${oldest} | ${newest} |\n`;
  });

  const readmeContent = `# Hinatazaka46 Blog Archive Data (日向坂46メンバーのブログアーカイブデータ)

This repository automatically archives official diaries from Hinatazaka46 members, compresses image assets to optimize storage efficiency, and compiles Japanese text into dynamic Hiragana Furigana tags using morphological analysis.

The archiving process runs periodically via GitHub Actions, establishing a persistent, self-updating, and high-performance Japanese learning and reading resource.

## Project Contribution Calendar

${contributionsMarkdown}

## Member Statistics and Activity

- Total active members: ${members.length}
- Total archived blog posts: ${totalBlogs}
- Total optimized images: ${totalImages}
- Database last updated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })} (Indochina Time)

### Member Progress Dashboard

\n${statsTable}\n
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
  console.log('[Generator] Successfully updated README.md with year-by-year SVG contributions heatmap archive!');
}

main().catch(err => {
  console.error('[Generator] Critical failure:', err);
  process.exit(1);
});
