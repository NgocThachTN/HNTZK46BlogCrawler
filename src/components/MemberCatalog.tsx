import React, { useState, useMemo } from 'react';
import type { Member } from '../types/blog';
import '../styles/catalog.css'; // We will create a premium stylesheet for this catalog grid!

interface MemberCatalogProps {
  members: Member[];
  blogCounts: Record<string, number>;
  onSelectMember: (slug: string) => void;
}

export const MemberCatalog: React.FC<MemberCatalogProps> = ({
  members,
  blogCounts,
  onSelectMember,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live filter members by name or romaji slug
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const nameMatch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
      const slugMatch = member.slug?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      return nameMatch || slugMatch;
    });
  }, [members, searchQuery]);

  return (
    <div className="catalog-container">
      {/* Premium Sleek Welcome Header */}
      <header className="catalog-sleek-header">
        <span className="sleek-badge">Blog Archive</span>
        <h1 className="sleek-title">HINATAZAKA46</h1>
        <p className="sleek-subtitle">Kho lưu trữ và đọc bài viết của các thành viên Hinatazaka46</p>
      </header>

      {/* Directory Search Control */}
      <div className="catalog-controls">
        <div className="catalog-search-wrapper">
          <svg
            className="catalog-search-icon"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="catalog-search-input"
            placeholder="Tìm kiếm thành viên theo tên hoặc Romaji (vd: Izuki, Nao)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="catalog-search-clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Members Cards Directory Grid */}
      <div className="catalog-grid">
        {filteredMembers.map((member) => {
          const count = blogCounts[member.id] || 0;
          return (
            <div
              key={member.id}
              className="catalog-member-card"
              onClick={() => onSelectMember(member.slug || `member_${member.id}`)}
            >
              <div className="card-avatar-wrapper">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="card-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                  }}
                />
                <span className="card-badge-dot"></span>
              </div>
              <h3 className="card-name">{member.name}</h3>
              <span className="card-slug">{member.slug || `member_${member.id}`}</span>
              <div className="card-stat-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: '4px' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {count} bài viết
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="catalog-empty">
          <p>Không tìm thấy thành viên nào khớp với từ khóa "{searchQuery}"</p>
          <button className="tb-btn" onClick={() => setSearchQuery('')}>
            Làm sạch bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};
