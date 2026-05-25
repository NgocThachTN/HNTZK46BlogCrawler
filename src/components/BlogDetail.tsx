import React, { useState, useEffect } from 'react';
import type { BlogPost, Member } from '../types/blog';
import '../styles/detail.css';

interface BlogDetailProps {
  blog: BlogPost;
  member: Member | undefined;
  onClose: () => void;
}

export const BlogDetail: React.FC<BlogDetailProps> = ({
  blog,
  member,
  onClose,
}) => {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

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

  return (
    <div className="detail-page-container">
      {/* Top Glassmorphic Navbar */}
      <nav className="detail-navbar">
        <div className="detail-navbar-content">
          <button className="back-feed-btn" onClick={onClose} aria-label="Quay lại">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Quay lại trang chủ</span>
          </button>
          
          <div className="navbar-logo">
            <span className="brand-dot"></span>
            HINATAZAKA46 BLOGS
          </div>

          <a
            href={blog.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-original-btn"
          >
            Xem bài gốc ↗
          </a>
        </div>
      </nav>

      {/* Main Container */}
      <div className="detail-main-wrapper">
        <article className="detail-article-card">
          {/* Article Header */}
          <header className="detail-header">
            <h1 className="detail-title">{blog.title}</h1>
            
            <div className="detail-meta-card">
              {member && (
                <div className="detail-author-info">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="detail-author-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                    }}
                  />
                  <div className="detail-author-meta">
                    <span className="detail-author-label">Thành viên</span>
                    <span className="detail-author-name">{member.name}</span>
                  </div>
                </div>
              )}

              <div className="detail-post-time">
                <span className="detail-time-label">Ngày đăng</span>
                <time className="detail-date">{blog.date}</time>
              </div>
            </div>
          </header>

          {/* Article Body HTML */}
          <section
            className="detail-article-body"
            dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
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
                <span>Thư viện ảnh ({blog.images.length})</span>
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
    </div>
  );
};
