import React, { useState, useEffect, useMemo } from 'react';
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
  const [fontFamily, setFontFamily] = useState<'gothic' | 'mincho' | 'kyokasho' | 'maru'>('mincho');
  const [themeMode, setThemeMode] = useState<'editorial' | 'navy' | 'darker'>('navy');
  const [showFurigana, setShowFurigana] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setShowSettings(false); // Close settings drawer when changing posts
  }, [blog]);

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
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: `Đọc bài viết "${blog.title}" của Hinatazaka46`,
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
    if (showFurigana && blog.contentHtmlFurigana) {
      return blog.contentHtmlFurigana;
    }
    return blog.contentHtml;
  }, [blog.contentHtml, blog.contentHtmlFurigana, showFurigana]);

  return (
    <div className={`detail-page-container theme-${themeMode}`}>
      {/* 1. Immersive Asymmetrical Side Control Panel (Hidden on Mobile) */}
      <aside className="detail-side-panel">
        <button className="panel-btn back" onClick={onClose} title="Quay lại danh mục" aria-label="Quay lại">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <div className="panel-divider" />

        <button 
          className={`panel-btn furigana ${showFurigana ? 'active' : ''}`} 
          onClick={() => setShowFurigana(!showFurigana)} 
          title="Bật/Tắt trợ âm Furigana chữ Hán"
        >
          <span>あ</span>
        </button>

        <button 
          className={`panel-btn settings-toggle ${showSettings ? 'active' : ''}`} 
          onClick={() => setShowSettings(!showSettings)} 
          title="Tùy chỉnh chế độ đọc (Cỡ chữ, Phông chữ, Màu nền)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <button className={`panel-btn share ${copied ? 'active' : ''}`} onClick={handleShare} title="Chia sẻ bài viết">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <div className="panel-divider" />

        <button className="panel-btn nav" onClick={onPrev} disabled={!hasPrev} title="Bài cũ hơn">&lt;</button>
        <button className="panel-btn nav" onClick={onNext} disabled={!hasNext} title="Bài mới hơn">&gt;</button>
      </aside>

      {/* 2. Smart Mobile Sticky Top Toolbar */}
      <div className="mobile-header">
        <button className="mobile-header-btn" onClick={onClose} aria-label="Quay lại">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="mobile-header-title">{blog.title}</span>
        <button className="mobile-header-btn" onClick={() => setShowSettings(!showSettings)} aria-label="Tùy chọn đọc">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* 3. Sliding typography Drawer Customizer */}
      <div className={`settings-drawer ${showSettings ? 'open' : ''}`}>
        <div className="drawer-header">
          <h4>Cài đặt đọc</h4>
          <button className="drawer-close" onClick={() => setShowSettings(false)}>×</button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <span className="section-label">Phông chữ</span>
            <div className="select-buttons">
              <button className={fontFamily === 'gothic' ? 'active' : ''} onClick={() => setFontFamily('gothic')}>Gothic</button>
              <button className={fontFamily === 'mincho' ? 'active' : ''} onClick={() => setFontFamily('mincho')}>Mincho</button>
              <button className={fontFamily === 'kyokasho' ? 'active' : ''} onClick={() => setFontFamily('kyokasho')}>Giáo khoa</button>
              <button className={fontFamily === 'maru' ? 'active' : ''} onClick={() => setFontFamily('maru')}>Tròn</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Cỡ chữ</span>
            <div className="select-buttons">
              <button className={fontSize === 'small' ? 'active' : ''} onClick={() => setFontSize('small')}>Nhỏ</button>
              <button className={fontSize === 'medium' ? 'active' : ''} onClick={() => setFontSize('medium')}>Vừa</button>
              <button className={fontSize === 'large' ? 'active' : ''} onClick={() => setFontSize('large')}>Lớn</button>
              <button className={fontSize === 'xlarge' ? 'active' : ''} onClick={() => setFontSize('xlarge')}>Rất lớn</button>
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">Màu nền</span>
            <div className="select-buttons">
              <button className={themeMode === 'editorial' ? 'active' : ''} onClick={() => setThemeMode('editorial')}>Ấm áp</button>
              <button className={themeMode === 'navy' ? 'active' : ''} onClick={() => setThemeMode('navy')}>Tối Navy</button>
              <button className={themeMode === 'darker' ? 'active' : ''} onClick={() => setThemeMode('darker')}>Đêm thẳm</button>
            </div>
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
              <span className="meta-category">BÀI VIẾT BLOG</span>
              <span className="meta-bullet">•</span>
              <time className="meta-date">{blog.date}</time>
            </div>
            
            <h1 className="article-editorial-title">{blog.title}</h1>

            {member && (
              <div className="article-author-signature">
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="signature-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                  }}
                />
                <div className="signature-info">
                  <span className="signature-by">Tác giả</span>
                  <span className="signature-name">{member.name}</span>
                </div>
                <span className="signature-bullet">•</span>
                <a
                  href={blog.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signature-original-link"
                >
                  Bài viết gốc ↗
                </a>
              </div>
            )}
          </header>

          {/* Article Body HTML with resolved local images and Furigana support */}
          <section
            className={`detail-article-body font-${fontSize} family-${fontFamily}`}
            dangerouslySetInnerHTML={{ __html: processedHtmlContent }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                setLightboxImg((target as HTMLImageElement).src);
              }
            }}
          />

          {/* Bottom compact Image Gallery */}
          {blog.images && blog.images.length > 0 && (
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
                <span>Bộ sưu tập ảnh ({blog.images.length})</span>
              </h3>
              
              <div className="detail-gallery-grid">
                {blog.images.map((imgUrl, i) => (
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
          )}
        </article>
      </div>

      {/* Mobile Sticky navigation footer */}
      <div className="mobile-footer-nav">
        <button className="mobile-nav-btn" onClick={onPrev} disabled={!hasPrev}>
          &lt; Bài cũ hơn
        </button>
        <button className="mobile-nav-btn" onClick={onNext} disabled={!hasNext}>
          Bài mới hơn &gt;
        </button>
      </div>

      {/* Lightbox full-size overlay */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={handleLightboxClick}>
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxImg(null)}
            aria-label="Đóng ảnh"
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
          title="Cuộn lên đầu trang"
          aria-label="Cuộn lên đầu trang"
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
