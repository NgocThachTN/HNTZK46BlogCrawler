import * as cheerio from 'cheerio';
import type { Member } from '../types/blog';

const BASE_URL = 'https://www.hinatazaka46.com';

/**
 * Helper to extract query parameters (e.g. ct parameter) from a URL string
 */
export function getQueryParam(url: string, param: string): string | null {
  const match = url.match(new RegExp(`[?&]${param}=([^&#]*)`, 'i'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Helper to extract background image URL from element style attribute
 */
export function extractBackgroundUrl(styleAttr: string | undefined): string | null {
  if (!styleAttr) return null;
  const match = styleAttr.match(/url\(['"]?(.*?)['"]?\)/);
  if (!match) return null;
  const url = match[1];
  // Ensure it's absolute
  if (url.startsWith('/')) {
    return BASE_URL + url;
  }
  return url;
}

/**
 * Parse members from the official blog homepage HTML
 */
export function parseMembers(html: string): Member[] {
  const $ = cheerio.load(html);
  const members: Member[] = [];

  // Scrape the active member grid at the bottom
  $('.p-blog-face__list').each((_, el) => {
    const $el = $(el);
    const id = $el.attr('data-member') || getQueryParam($el.attr('href') || '', 'ct');
    const name = $el.find('.c-blog-face__name').text().trim();
    const styleAttr = $el.find('.c-blog-face__item').attr('style');
    const avatarUrl = extractBackgroundUrl(styleAttr);

    if (id && name && avatarUrl) {
      members.push({
        id,
        name,
        avatar: avatarUrl, // Will be replaced with local path after downloading
      });
    }
  });

  return members;
}

interface parsedFeedItem {
  id: string;
  title: string;
  date: string;
  authorName: string;
  thumbnailUrl: string;
  detailUrl: string;
}

/**
 * Parse recent blog posts feed
 */
export function parseBlogFeed(html: string): parsedFeedItem[] {
  const $ = cheerio.load(html);
  const items: parsedFeedItem[] = [];

  $('.p-blog-top__list li.p-blog-top__item').each((_, el) => {
    const $el = $(el);
    const $link = $el.find('a');
    const detailHref = $link.attr('href') || '';
    const detailUrl = detailHref.startsWith('http') ? detailHref : BASE_URL + detailHref;

    // Extract ID from detail href e.g., /s/official/diary/detail/69466
    const idMatch = detailHref.match(/\/detail\/(\d+)/);
    const id = idMatch ? idMatch[1] : '';

    const title = $el.find('.c-blog-top__title').text().trim();
    const date = $el.find('.c-blog-top__date').text().trim();
    const authorName = $el.find('.c-blog-top__name').text().trim();
    const styleAttr = $el.find('.c-blog__image').attr('style');
    const thumbnailUrl = extractBackgroundUrl(styleAttr) || '';

    if (id && title) {
      items.push({
        id,
        title,
        date,
        authorName,
        thumbnailUrl,
        detailUrl,
      });
    }
  });

  return items;
}

interface ParsedDetail {
  authorId: string;
  contentHtml: string;
  images: string[];
}

/**
 * Parse blog post detail page
 */
export function parseBlogDetail(html: string): ParsedDetail {
  const $ = cheerio.load(html);
  
  // Extract author ct ID from links like /s/official/diary/member/list?ima=0000&ct=000
  let authorId = '';
  $('.c-blog-article__name a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const ct = getQueryParam(href, 'ct');
    if (ct) {
      authorId = ct;
    }
  });

  // Fallback to table in sidebar if present
  if (!authorId) {
    const sidebarHref = $('.p-blog-member__info-table a').attr('href') || '';
    const ct = getQueryParam(sidebarHref, 'ct');
    if (ct) {
      authorId = ct;
    }
  }

  // Get raw content HTML inside the main text container
  const $content = $('.c-blog-article__text');
  const contentHtml = $content.html() || '';

  // Extract all inline images
  const images: string[] = [];
  $content.find('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      // Make absolute if relative
      const absoluteSrc = src.startsWith('/') ? BASE_URL + src : src;
      images.push(absoluteSrc);
    }
  });

  return {
    authorId,
    contentHtml,
    images,
  };
}
