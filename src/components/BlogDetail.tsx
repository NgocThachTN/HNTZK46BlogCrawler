import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { BlogPost, Member } from '../types/blog';
import '../styles/detail.css';

interface BlogDetailProps {
  blog: BlogPost;
  member: Member | undefined;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const formatFolderDate = (dateStr: string): string => {
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
};

export const BlogDetail: React.FC<BlogDetailProps> = ({
  blog,
  member,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [fontFamily, setFontFamily] = useState<'gothic' | 'mincho' | 'kyokasho' | 'maru' | 'brush' | 'handwritten' | 'noto-serif' | 'retro' | 'pop' | 'pixel' | 'antique' | 'display'>('gothic');
  const [themeMode, setThemeMode] = useState<'editorial' | 'navy' | 'darker'>('navy');
  const [showFurigana, setShowFurigana] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState<boolean>(false);

  // Translation state
  const [targetLang, setTargetLang] = useState<string>('en');
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  // Full post loading state
  const [fullBlog, setFullBlog] = useState<BlogPost | null>(null);
  const [loadingPost, setLoadingPost] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Scroll to top and load full blog post content dynamically when post changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setShowSettings(false);
    setShowTranslateMenu(false);
    setTranslatedHtml(null);
    setTranslatedTitle(null);
    setTranslateError(null);
    setFullBlog(null);
    setLoadError(null);

    const fetchFullBlog = async () => {
      try {
        setLoadingPost(true);
        const memberSlug = member?.slug || `member_${blog.authorId}`;
        const folderDate = formatFolderDate(blog.date);
        const response = await fetch(`/posts/${memberSlug}/${folderDate}/${blog.id}.json`);
        if (!response.ok) {
          throw new Error('Failed to load blog post content.');
        }
        const data = await response.json();
        setFullBlog(data);
      } catch (err: any) {
        console.error('[BlogDetail] Error fetching full post content:', err);
        setLoadError(err.message || 'Failed to load post.');
      } finally {
        setLoadingPost(false);
      }
    };

    fetchFullBlog();
  }, [blog.id, member]);

  // Listen to scroll events to show/hide Scroll-to-Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lightbox close on backdrop click
  const handleLightboxClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setLightboxImg(null);
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    const currentTitle = translatedTitle || blog.title;
    if (navigator.share) {
      navigator.share({
        title: currentTitle,
        text: `Đọc bài viết "${currentTitle}" của Hinatazaka46`,
        url: shareUrl,
      }).catch((err) => console.log(err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // High-fidelity dynamic Furigana injector
  const processedHtmlContent = useMemo(() => {
    const activeBlog = fullBlog || blog;
    if (showFurigana && activeBlog.contentHtmlFurigana) {
      return activeBlog.contentHtmlFurigana;
    }
    return activeBlog.contentHtml || '';
  }, [blog, fullBlog, showFurigana]);

  // --- Google Translate Integration ---
  const translateChunk = useCallback(async (text: string, lang: string): Promise<string> => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data[0] as any[]).map((seg: any[]) => seg[0]).join('');
  }, []);

  const langOptions = [
    { code: 'en', label: 'English (EN)' },
    { code: 'vi', label: 'Vietnamese (VI)' },
  ];

  // DOM TreeWalker-based translation that preserves ALL HTML structure
  const doTranslate = useCallback(async (lang: string) => {
    setTargetLang(lang);
    setIsTranslating(true);
    setTranslateError(null);

    try {
      // 1. Translate the blog title
      if (blog.title) {
        const transTitle = await translateChunk(blog.title, lang);
        setTranslatedTitle(transTitle);
      }

      // 2. Translate the blog content HTML
      // Parse HTML into a real DOM to preserve structure
      const tempDiv = document.createElement('div');
      const activeBlog = fullBlog || blog;
      tempDiv.innerHTML = activeBlog.contentHtml || '';

      // Walk all text nodes, skip ruby annotations (rt)
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (node.parentElement?.closest('rt')) return NodeFilter.FILTER_REJECT;
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
      }

      if (textNodes.length === 0) return;

      // Batch text nodes into chunks (~4000 chars) to minimize API calls
      const batches: Text[][] = [[]];
      let batchLen = 0;
      for (const node of textNodes) {
        const len = (node.textContent?.length || 0) + 1;
        if (batchLen + len > 4000 && batches[batches.length - 1].length > 0) {
          batches.push([]);
          batchLen = 0;
        }
        batches[batches.length - 1].push(node);
        batchLen += len;
      }

      // Translate each batch sequentially
      for (const batch of batches) {
        const originals = batch.map(n => n.textContent!);
        // Translate one-by-one within each batch to ensure accurate mapping
        const translated = await Promise.all(
          originals.map(text => translateChunk(text, lang))
        );
        batch.forEach((node, i) => {
          node.textContent = translated[i];
        });
      }

      setTranslatedHtml(tempDiv.innerHTML);
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslateError('Translation failed. Please try again later.');
    } finally {
      setIsTranslating(false);
    }
  }, [blog.title, fullBlog, translateChunk]);

  const clearTranslation = useCallback(() => {
    setTranslatedHtml(null);
    setTranslatedTitle(null);
    setTranslateError(null);
  }, []);

  return (
    <div className={`detail-page-container theme-${themeMode}`}>
      {/* 1. Immersive Asymmetrical Side Control Panel (Hidden on Mobile) */}
      <aside className="detail-side-panel">
        <button className="panel-btn back" onClick={onClose} title="Back to Feed" aria-label="Go Back">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="panel-divider" />

        <button 
          className={`panel-btn furigana ${showFurigana ? 'active' : ''}`} 
          onClick={() => setShowFurigana(!showFurigana)} 
          title="Toggle Japanese Furigana"
        >
          <span>あ</span>
        </button>

        <div className={`translate-wrapper ${showTranslateMenu ? 'menu-open' : ''}`}>
          <button 
            className={`panel-btn translate ${translatedHtml ? 'active' : ''} ${isTranslating ? 'translating' : ''} ${showTranslateMenu ? 'menu-active' : ''}`}
            disabled={isTranslating}
            title="Translate Post"
            onClick={() => setShowTranslateMenu(!showTranslateMenu)}
          >
            {isTranslating ? (
              <span className="btn-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
          </button>
          {showTranslateMenu && !isTranslating && (
            <div className="translate-vertical-menu">
              {langOptions.map(lang => (
                <button
                  key={lang.code}
                  className={`panel-btn-sub ${targetLang === lang.code && translatedHtml ? 'active' : ''}`}
                  onClick={() => {
                    doTranslate(lang.code);
                    setShowTranslateMenu(false);
                  }}
                  title={`Translate to ${lang.label}`}
                >
                  {lang.code === 'vi' ? 'VN' : 'EN'}
                </button>
              ))}
              {translatedHtml && (
                <button 
                  className="panel-btn-sub original" 
                  onClick={() => {
                    clearTranslation();
                    setShowTranslateMenu(false);
                  }}
                  title="Show Original"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        <button 
          className={`panel-btn settings-toggle ${showSettings ? 'active' : ''}`} 
          onClick={() => setShowSettings(!showSettings)} 
          title="Reading Settings (Fonts, Size, Themes)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button className={`panel-btn share ${copied ? 'active' : ''}`} onClick={handleShare} title="Share Post">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <div className="panel-divider" />

        <button className="panel-btn nav" onClick={onPrev} disabled={!hasPrev} title="Older Post">&lt;</button>
        <button className="panel-btn nav" onClick={onNext} disabled={!hasNext} title="Newer Post">&gt;</button>
      </aside>

      {/* 2. Smart Mobile Sticky Top Toolbar */}
      <div className="mobile-header">
        <button className="mobile-header-btn" onClick={onClose} aria-label="Go Back">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="mobile-header-title">{translatedTitle || blog.title}</span>
        <div className="mobile-header-actions">
          <div className="translate-wrapper mobile">
            <button
              className={`mobile-header-btn ${showTranslateMenu ? 'active' : ''}`}
              disabled={isTranslating}
              aria-label="Translate Post"
              onClick={() => setShowTranslateMenu(!showTranslateMenu)}
            >
              {isTranslating ? (
                <span className="btn-spinner small" />
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke={translatedHtml ? 'var(--color-brand)' : 'currentColor'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              )}
            </button>
            {showTranslateMenu && !isTranslating && (
              <div className="translate-popup mobile-dropdown">
                <span className="translate-popup-title">Translate to</span>
                {langOptions.map(lang => (
                  <button
                    key={lang.code}
                    className={`translate-popup-option ${targetLang === lang.code && translatedHtml ? 'active' : ''}`}
                    onClick={() => {
                      doTranslate(lang.code);
                      setShowTranslateMenu(false);
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
                {translatedHtml && (
                  <button 
                    className="translate-popup-option original" 
                    onClick={() => {
                      clearTranslation();
                      setShowTranslateMenu(false);
                    }}
                  >
                    Show Original
                  </button>
                )}
              </div>
            )}
          </div>
          
          <button 
            className={`mobile-header-btn mobile-furigana-btn ${showFurigana ? 'active' : ''}`} 
            onClick={() => setShowFurigana(!showFurigana)} 
            title="Toggle Japanese Furigana"
            aria-label="Toggle Japanese Furigana"
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>あ</span>
          </button>

          <button className="mobile-header-btn" onClick={() => setShowSettings(!showSettings)} aria-label="Reading Settings">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Sliding typography Drawer Customizer */}
      <div className={`settings-drawer ${showSettings ? 'open' : ''}`}>
        <div className="drawer-header">
          <h4>Reading Settings</h4>
          <button className="drawer-close" onClick={() => setShowSettings(false)}>×</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <span className="section-label">Font Family</span>
            <div className="select-buttons font-grid">
              <button className={fontFamily === 'gothic' ? 'active' : ''} onClick={() => setFontFamily('gothic')}>Gothic</button>
              <button className={fontFamily === 'mincho' ? 'active' : ''} onClick={() => setFontFamily('mincho')}>Mincho</button>
              <button className={fontFamily === 'noto-serif' ? 'active' : ''} onClick={() => setFontFamily('noto-serif')}>Noto Serif</button>
              <button className={fontFamily === 'kyokasho' ? 'active' : ''} onClick={() => setFontFamily('kyokasho')}>Textbook</button>
              <button className={fontFamily === 'maru' ? 'active' : ''} onClick={() => setFontFamily('maru')}>Rounded</button>
              <button className={fontFamily === 'brush' ? 'active' : ''} onClick={() => setFontFamily('brush')}>Brush</button>
              <button className={fontFamily === 'handwritten' ? 'active' : ''} onClick={() => setFontFamily('handwritten')}>Handwritten</button>
              <button className={fontFamily === 'retro' ? 'active' : ''} onClick={() => setFontFamily('retro')}>Retro</button>
              <button className={fontFamily === 'pop' ? 'active' : ''} onClick={() => setFontFamily('pop')}>Pop</button>
              <button className={fontFamily === 'pixel' ? 'active' : ''} onClick={() => setFontFamily('pixel')}>Pixel</button>
              <button className={fontFamily === 'antique' ? 'active' : ''} onClick={() => setFontFamily('antique')}>Classic</button>
              <button className={fontFamily === 'display' ? 'active' : ''} onClick={() => setFontFamily('display')}>Display</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Font Size</span>
            <div className="select-buttons">
              <button className={fontSize === 'small' ? 'active' : ''} onClick={() => setFontSize('small')}>Small</button>
              <button className={fontSize === 'medium' ? 'active' : ''} onClick={() => setFontSize('medium')}>Medium</button>
              <button className={fontSize === 'large' ? 'active' : ''} onClick={() => setFontSize('large')}>Large</button>
              <button className={fontSize === 'xlarge' ? 'active' : ''} onClick={() => setFontSize('xlarge')}>Extra Large</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Theme Background</span>
            <div className="select-buttons">
              <button className={themeMode === 'editorial' ? 'active' : ''} onClick={() => setThemeMode('editorial')}>Warm</button>
              <button className={themeMode === 'navy' ? 'active' : ''} onClick={() => setThemeMode('navy')}>Dark Navy</button>
              <button className={themeMode === 'darker' ? 'active' : ''} onClick={() => setThemeMode('darker')}>Midnight</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Furigana (Reading Aid)</span>
            <div className="select-buttons">
              <button className={showFurigana ? 'active' : ''} onClick={() => setShowFurigana(true)}>Enable (あ)</button>
              <button className={!showFurigana ? 'active' : ''} onClick={() => setShowFurigana(false)}>Disable</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Translation</span>
            <div className="select-buttons font-grid">
              {langOptions.map(lang => (
                <button
                  key={lang.code}
                  className={targetLang === lang.code ? 'active' : ''}
                  onClick={() => {
                    setTargetLang(lang.code);
                    // Reset translation when language changes so user re-translates
                    if (translatedHtml) {
                      setTranslatedHtml(null);
                    }
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <button
              className={`translate-drawer-btn ${translatedHtml ? 'active' : ''}`}
              onClick={() => translatedHtml ? clearTranslation() : doTranslate(targetLang)}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <><span className="btn-spinner small" /> Translating...</>
              ) : translatedHtml ? (
                'Show Original'
              ) : (
                'Translate Post'
              )}
            </button>
            {translateError && <p className="translate-error">{translateError}</p>}
          </div>
        </div>
      </div>

      {/* Backdrop for settings drawer */}
      {showSettings && <div className="drawer-backdrop" onClick={() => setShowSettings(false)} />}

      {/* 4. Immersive Typography Canvas Wrapper */}
      <div className="detail-main-wrapper">
        <article className="detail-article-card">
          {/* Novelistic typography header */}
          <header className="article-editorial-header">
            <div className="article-meta-info">
              <span className="meta-category">BLOG POST</span>
              <span className="meta-bullet">•</span>
              <time className="meta-date">{blog.date}</time>
            </div>
            
            <h1 className="article-editorial-title">{translatedTitle || blog.title}</h1>

            {member && (
              <div className="article-author-signature">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="signature-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.svg';
                  }}
                />
                <div className="signature-info">
                  <span className="signature-by">Author</span>
                  <span className="signature-name">{member.name}</span>
                </div>
                <span className="signature-bullet">•</span>
                <a
                  href={blog.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signature-original-link"
                >
                  Original Post ↗
                </a>
              </div>
            )}
          </header>

          {/* Translation Banner */}
          {translatedHtml && !isTranslating && (
            <div className="translate-banner">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              <span>Automated translation by Google Translate — {langOptions.find(l => l.code === targetLang)?.label}</span>
              <button className="translate-banner-dismiss" onClick={() => setTranslatedHtml(null)}>Show Original</button>
            </div>
          )}

          {/* Translating status badge */}
          {isTranslating && (
            <div className="translate-status-badge">
              <span className="btn-spinner small" />
              <span>Translating post into {langOptions.find(l => l.code === targetLang)?.label}...</span>
            </div>
          )}

          {/* Article Body HTML or Shimmering Skeleton Loader */}
          {loadError ? (
            <div className="error-container" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="error-card" style={{ maxWidth: '400px', width: '100%' }}>
                <h3 className="error-title">Error Loading Post</h3>
                <p className="error-message">{loadError}</p>
              </div>
            </div>
          ) : loadingPost || isTranslating ? (
            <div className="blog-skeleton-loader">
              <div className="skeleton-paragraph">
                <div className="skeleton-line width-95" />
                <div className="skeleton-line width-90" />
                <div className="skeleton-line width-85" />
                <div className="skeleton-line width-60" />
              </div>
              <div className="skeleton-paragraph">
                <div className="skeleton-line width-90" />
                <div className="skeleton-line width-95" />
                <div className="skeleton-line width-40" />
              </div>
              <div className="skeleton-image-block" />
              <div className="skeleton-paragraph">
                <div className="skeleton-line width-95" />
                <div className="skeleton-line width-90" />
                <div className="skeleton-line width-85" />
                <div className="skeleton-line width-50" />
              </div>
            </div>
          ) : (
            <section
              className={`detail-article-body font-${fontSize} family-${fontFamily}`}
              dangerouslySetInnerHTML={{ __html: translatedHtml || processedHtmlContent }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'IMG') {
                  setLightboxImg((target as HTMLImageElement).src);
                }
              }}
            />
          )}

          {/* Bottom compact Image Gallery */}
          {(() => {
            const activeImages = fullBlog?.images || blog.images;
            if (!activeImages || activeImages.length === 0) return null;
            return (
              <footer className="detail-gallery-section">
                <h3 className="detail-gallery-title">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Image Gallery ({activeImages.length})</span>
                </h3>
                
                <div className="detail-gallery-grid">
                  {activeImages.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="detail-gallery-item"
                      onClick={() => setLightboxImg(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Blog gallery image ${i + 1}`}
                        className="detail-gallery-img"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </footer>
            );
          })()}
        </article>
      </div>

      {/* Mobile Sticky navigation footer */}
      <div className="mobile-footer-nav">
        <button className="mobile-nav-btn" onClick={onPrev} disabled={!hasPrev}>
          &lt; Older Post
        </button>
        <button className="mobile-nav-btn" onClick={onNext} disabled={!hasNext}>
          Newer Post &gt;
        </button>
      </div>

      {/* Lightbox full-size overlay */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={handleLightboxClick}>
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxImg(null)}
            aria-label="Close image"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxImg}
            alt="Enlarged view"
            className="lightbox-img"
          />
        </div>
      )}

      {/* Premium Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button 
          className="scroll-to-top-btn" 
          onClick={scrollToTop}
          title="Scroll to Top"
          aria-label="Scroll to Top"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
