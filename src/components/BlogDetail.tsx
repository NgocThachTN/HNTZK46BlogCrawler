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
  const [themeMode, setThemeMode] = useState<'editorial' | 'navy' | 'darker'>('editorial');
  const [showFurigana, setShowFurigana] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Scroll to top when post changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [blog]);

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

  // High-fidelity dynamic Furigana injector using HTML5 Ruby tags compiled at crawl-time
  const processedHtmlContent = useMemo(() => {
    if (showFurigana && blog.contentHtmlFurigana) {
      return blog.contentHtmlFurigana;
    }
    return blog.contentHtml;
  }, [blog.contentHtml, blog.contentHtmlFurigana, showFurigana]);

  return (
    <div className={`detail-page-container theme-${themeMode}`}>
      {/* Immersive Top Controls Toolbar (matching user's classic blog screenshot) */}
      <div className="detail-toolbar-wrapper">
        <div className="detail-toolbar">
          <div className="toolbar-left">
            <button className="tb-btn back-btn" onClick={onClose} aria-label="Quay lại danh sách">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Quay lại</span>
            </button>
            
            <button className="tb-btn list-btn" onClick={onClose} aria-label="Danh sách">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="3" cy="6" r="1.2" fill="currentColor" />
                <circle cx="3" cy="12" r="1.2" fill="currentColor" />
                <circle cx="3" cy="18" r="1.2" fill="currentColor" />
              </svg>
              <span>Danh sách</span>
            </button>

            <div className="tb-nav-group">
              <button 
                className="tb-nav-btn" 
                onClick={onPrev} 
                disabled={!hasPrev} 
                title="Bài viết cũ hơn"
                aria-label="Bài viết cũ hơn"
              >
                &lt;
              </button>
              <button 
                className="tb-nav-btn" 
                onClick={onNext} 
                disabled={!hasNext} 
                title="Bài viết mới hơn"
                aria-label="Bài viết mới hơn"
              >
                &gt;
              </button>
            </div>
            
            {/* Furigana Kanji Toggle Button */}
            <button 
              className={`tb-btn furigana-btn ${showFurigana ? 'active' : ''}`}
              onClick={() => setShowFurigana(!showFurigana)}
              title="Hiện trợ âm Furigana cho chữ Hán Kanji"
            >
              <span className="tb-text-desktop">ふりがな (Furigana)</span>
              <span className="tb-text-mobile" style={{ display: 'none' }}>ふりがな</span>
            </button>
          </div>

          <div className="toolbar-right">
            {/* Font Family selector optimized for Japanese */}
            <div className="tb-select-group">
              <button 
                className={`tb-toggle-btn ${fontFamily === 'gothic' ? 'active' : ''}`}
                onClick={() => setFontFamily('gothic')}
                title="Font Gothic (Mặc định)"
              >
                Gothic
              </button>
              <button 
                className={`tb-toggle-btn ${fontFamily === 'mincho' ? 'active' : ''}`}
                onClick={() => setFontFamily('mincho')}
                title="Font Mincho (Có chân)"
              >
                Mincho
              </button>
              <button 
                className={`tb-toggle-btn ${fontFamily === 'kyokasho' ? 'active' : ''}`}
                onClick={() => setFontFamily('kyokasho')}
                title="Font Kyōkasho (Giáo khoa)"
              >
                Kyōkasho
              </button>
              <button 
                className={`tb-toggle-btn ${fontFamily === 'maru' ? 'active' : ''}`}
                onClick={() => setFontFamily('maru')}
                title="Font Maru (Gothic Tròn)"
              >
                Maru
              </button>
            </div>

            {/* Theme selector */}
            <div className="tb-theme-group">
              <button 
                className={`tb-theme-btn ${themeMode === 'editorial' ? 'active' : ''}`}
                onClick={() => setThemeMode('editorial')}
                title="Giao diện sáng Hinatazaka46 (Mặc định)"
              >
                Sáng Hinata
              </button>
              <button 
                className={`tb-theme-btn ${themeMode === 'navy' ? 'active' : ''}`}
                onClick={() => setThemeMode('navy')}
                title="Giao diện tối Navy"
              >
                Tối Navy
              </button>
              <button 
                className={`tb-theme-btn ${themeMode === 'darker' ? 'active' : ''}`}
                onClick={() => setThemeMode('darker')}
                title="Giao diện đêm thẳm"
              >
                Đêm thẳm
              </button>
            </div>

            {/* Font Size controls */}
            <div className="tb-size-group">
              <button className={`tb-size-btn ${fontSize === 'small' ? 'active' : ''}`} onClick={() => setFontSize('small')}>Nhỏ</button>
              <button className={`tb-size-btn ${fontSize === 'medium' ? 'active' : ''}`} onClick={() => setFontSize('medium')}>Vừa</button>
              <button className={`tb-size-btn ${fontSize === 'large' ? 'active' : ''}`} onClick={() => setFontSize('large')}>Lớn</button>
              <button className={`tb-size-btn ${fontSize === 'xlarge' ? 'active' : ''}`} onClick={() => setFontSize('xlarge')}>Rất lớn</button>
            </div>

            {/* Share button */}
            <button className="tb-btn share-btn" onClick={handleShare}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{copied ? 'Đã sao chép!' : 'Chia sẻ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="detail-main-wrapper">
        <article className="detail-article-card">
          {/* Article Header (matches layout in user screenshot) */}
          <header className="detail-header-classic">
            <div className="header-left">
              <span className="classic-date-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {blog.date}
              </span>
            </div>
            
            <div className="header-right">
              <span className="classic-label">BÀI VIẾT BLOG</span>
              <h1 className="classic-title">{blog.title}</h1>
            </div>
          </header>

          {/* Author Badge banner for local context */}
          {member && (
            <div className="detail-author-bar">
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="author-bar-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                }}
              />
              <div className="author-bar-info">
                <span className="author-bar-label">Thành viên viết bài</span>
                <span className="author-bar-name">{member.name}</span>
              </div>
              <a
                href={blog.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="classic-original-link"
              >
                Bài viết gốc ↗
              </a>
            </div>
          )}

          {/* Article Body HTML with resolved local images and Furigana support */}
          <section
            className={`detail-article-body font-${fontSize} family-${fontFamily}`}
            dangerouslySetInnerHTML={{ __html: processedHtmlContent }}
            onClick={(e) => {
              // Click to enlarge inline images
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                setLightboxImg((target as HTMLImageElement).src);
              }
            }}
          />

          {/* Image Gallery */}
          {blog.images && blog.images.length > 0 && (
            <footer className="detail-gallery-section">
              <h3 className="detail-gallery-title">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
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

      {/* Lightbox full-size overlay */}
      {lightboxImg && (
        <div
          className="lightbox-overlay"
          onClick={handleLightboxClick}
        >
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxImg(null)}
            aria-label="Đóng ảnh phóng to"
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
    </div>
  );
};
