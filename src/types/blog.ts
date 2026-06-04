export interface Member {
  id: string;      // ct query parameter, e.g. "14" or "000" for Poka
  name: string;    // Japanese name, e.g. "小坂 菜緒"
  avatar: string;  // Local avatar path, e.g. "/images/members/14.jpg"
  slug?: string;   // Romaji name slug, e.g. "shimoda.izuki"
}

export interface BlogPost {
  id: string;          // Post ID from URL, e.g. "69466"
  authorId: string;    // Refers to Member.id
  title: string;       // Post title
  date: string;        // Formatted date, e.g. "2026.05.25 22:25"
  summary: string;     // Short text snippet preview (without HTML)
  contentHtml?: string; // Full HTML content with resolved local image paths (optional in index)
  contentHtmlFurigana?: string; // Full HTML content with dynamic Morphological Furigana tags
  images: string[];    // Local image paths inside this post, e.g. ["/images/blogs/69466_0.jpg"]
  detailUrl: string;   // Original Hinatazaka46 URL
  thumbnail: string;   // Local path to main post thumbnail image
}

export interface BlogDatabase {
  members: Member[];
  blogs: BlogPost[];
}
