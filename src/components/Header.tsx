import React from 'react';
import '../styles/header.css';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalBlogs: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  totalBlogs,
}) => {
  return (
    <header className="header-container">
      <div className="brand-section">
        <h1 className="brand-title">
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-brand)' }}
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          HNTZK46 ARCHIVE
        </h1>
        <p className="brand-subtitle">日向坂46 公式ブログ アーカイブ</p>
      </div>

      <div className="header-controls">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm bài viết, thành viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="stats-badge">
          {totalBlogs} BÀI VIẾT ĐÃ CÀO
        </div>
      </div>
    </header>
  );
};
