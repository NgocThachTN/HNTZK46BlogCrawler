import * as cheerio from 'cheerio';

/**
 * Converts Katakana characters to their Hiragana equivalents.
 */
export function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

/**
 * Trims identical matching prefixes and suffixes from the surface form and Hiragana reading
 * to wrap only the unique Kanji core with a `<ruby>` tag.
 */
export function alignAndWrapRuby(surface: string, reading: string): string {
  const readingHiragana = katakanaToHiragana(reading);
  
  // If they are already identical after conversion, no wrap is needed
  if (surface === readingHiragana) {
    return surface;
  }

  // Trim matching prefix from the start
  let start = 0;
  while (
    start < surface.length &&
    start < readingHiragana.length &&
    surface[start] === readingHiragana[start]
  ) {
    start++;
  }

  // Trim matching suffix from the end
  let endSurface = surface.length;
  let endReading = readingHiragana.length;
  while (
    endSurface > start &&
    endReading > start &&
    surface[endSurface - 1] === readingHiragana[endReading - 1]
  ) {
    endSurface--;
    endReading--;
  }

  const prefix = surface.slice(0, start);
  const suffix = surface.slice(endSurface);
  const midSurface = surface.slice(start, endSurface);
  const midReading = readingHiragana.slice(start, endReading);

  // Fallback: If no Kanji core was resolved or left, return original surface
  if (!midSurface || !/[\u4e00-\u9faf\u3400-\u4dbf]/.test(midSurface)) {
    return surface;
  }

  return `${prefix}<ruby>${midSurface}<rt>${midReading}</rt></ruby>${suffix}`;
}

/**
 * Tokenizes plain Japanese text and wraps Kanji characters in `<ruby>` tags.
 */
export function tokenizeTextToRuby(text: string, tokenizer: any): string {
  if (!/[\u4e00-\u9faf\u3400-\u4dbf]/.test(text)) {
    return text;
  }

  try {
    const tokens = tokenizer.tokenize(text);
    let result = '';

    for (const token of tokens) {
      const surface = token.surface_form;
      const reading = token.reading;

      if (reading && reading !== '*' && /[\u4e00-\u9faf\u3400-\u4dbf]/.test(surface)) {
        result += alignAndWrapRuby(surface, reading);
      } else {
        result += surface;
      }
    }

    return result;
  } catch (err) {
    console.error('[Furigana] Tokenization failed, falling back to raw text:', err);
    return text;
  }
}

/**
 * Traverses an HTML document and compiles a high-fidelity Furigana version.
 * Leaves DOM tags, attributes, images, scripts, styles, and existing ruby tags untouched.
 */
export function compileHtmlWithFurigana(html: string, tokenizer: any): string {
  if (!html) return '';

  try {
    const $ = cheerio.load(html, null, false);

    const processNode = (node: any) => {
      if (node.type === 'text') {
        const originalText = node.data;
        if (originalText && /[\u4e00-\u9faf\u3400-\u4dbf]/.test(originalText)) {
          const furiganaHtml = tokenizeTextToRuby(originalText, tokenizer);
          $(node).replaceWith(furiganaHtml);
        }
      } else if (node.children) {
        // Build a static list before traversing because DOM structure might mutate
        const children = [...node.children];
        for (const child of children) {
          if (
            child.name !== 'script' &&
            child.name !== 'style' &&
            child.name !== 'ruby'
          ) {
            processNode(child);
          }
        }
      }
    };

    $.root().each((_, el) => {
      processNode(el);
    });

    return $.html() || '';
  } catch (err) {
    console.error('[Furigana] HTML Furigana compilation failed, falling back to original:', err);
    return html;
  }
}
