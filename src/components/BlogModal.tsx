import type React from 'react';
import { useState } from 'react';
import type { BlogPost, Member } from '../types/blog';
import '../styles/modal.css';

interface BlogModalProps {
  blog: BlogPost;
  member: Member | undefined;
  onClose: () => void;
}

export const BlogModal: React.FC<BlogModalProps> = ({
  blog,
  member,
  onClose,
}) => {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close lightbox on backdrop click
  const handleLightboxClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setLightboxImg(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-window">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
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

        {/* Scrollable Container */}
        <div className="modal-content-scroll">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-meta">
              {member && (
                <>
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="modal-author-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                    }}
                  />
                  <span className="modal-author-name">{member.name}</span>
                </>
              )}
              <time className="modal-date">{blog.date}</time>

              <a
                href={blog.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-original-link"
              >
                Bài gốc ↗
              </a>
            </div>
            <h2 className="modal-title">{blog.title}</h2>
          </div>

          {/* Article Body HTML */}
          <div
            className="modal-article-body"
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
            <div className="modal-gallery-section">
              <h3 className="modal-gallery-title">
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
                Thư viện ảnh ({blog.images.length})
              </h3>
              <div className="modal-gallery-grid">
                {blog.images.map((imgUrl, i) => (
                  <div
                    key={i}
                    className="modal-gallery-item"
                    onClick={() => setLightboxImg(imgUrl)}
                  >
                    <img
                      src={imgUrl}
                      alt={`Blog image ${i + 1}`}
                      className="modal-gallery-img"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox full-size overlay */}
      {lightboxImg && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 110,
            background: 'rgba(5, 7, 12, 0.95)',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.25s ease-out',
          }}
          onClick={handleLightboxClick}
        >
          <button
            className="modal-close-btn"
            onClick={() => setLightboxImg(null)}
            style={{ top: '20px', right: '20px' }}
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
            style={{
              maxWidth: '95vw',
              maxHeight: '95vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      )}
    </div>
  );
};
