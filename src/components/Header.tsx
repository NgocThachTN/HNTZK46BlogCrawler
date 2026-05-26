import React from 'react';
import type { Member } from '../types/blog';
import '../styles/header.css';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  placeholder?: string;
  onBack?: () => void;
  activeMember?: Member;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  placeholder = 'Search blog posts...',
  onBack,
  activeMember,
}) => {
  const handleHomeClick = () => {
    window.history.pushState(null, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <header className="header-container">
      <div className="brand-section">
        {onBack && (
          <button className="header-back-btn" onClick={onBack} aria-label="Back to home">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Home</span>
          </button>
        )}
        
        <div className="header-titles">
          <h1 className="brand-title" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
            <span className="brand-dot"></span>
            {activeMember ? activeMember.name : 'HNTZK46 ARCHIVE'}
          </h1>
          <p className="brand-subtitle">
            {activeMember ? `${activeMember.slug || ''} • Blogs Feed` : 'Hinatazaka46 Official Blog Archive'}
          </p>
        </div>
      </div>

      <div className="header-controls">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
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
      </div>
    </header>
  );
};

