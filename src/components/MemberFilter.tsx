import type React from 'react';
import type { Member } from '../types/blog';
import '../styles/filter.css';

interface MemberFilterProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  blogCounts: Record<string, number>;
  totalBlogs: number;
}

export const MemberFilter: React.FC<MemberFilterProps> = ({
  members,
  selectedMemberId,
  onSelectMember,
  blogCounts,
  totalBlogs,
}) => {
  // Sort members so that those with posts appear first, then alphabetically
  const sortedMembers = [...members].sort((a, b) => {
    const countA = blogCounts[a.id] || 0;
    const countB = blogCounts[b.id] || 0;
    if (countA !== countB) {
      return countB - countA; // Descending count
    }
    return a.name.localeCompare(b.name, 'ja'); // Japanese alphabetical order
  });

  return (
    <section className="filter-section animate-fade-in">
      <div className="filter-label">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Filter by Member
      </div>

      <div className="member-list">
        {/* Special 'ALL' Badge */}
        <button
          className={`member-badge all-badge ${selectedMemberId === null ? 'active' : ''}`}
          onClick={() => onSelectMember(null)}
        >
          <span className="member-badge-name">All Posts</span>
          <span className="member-badge-count">{totalBlogs}</span>
        </button>

        {/* Individual Member Badges */}
        {sortedMembers.map((member) => {
          const count = blogCounts[member.id] || 0;
          
          return (
            <button
              key={member.id}
              className={`member-badge ${selectedMemberId === member.id ? 'active' : ''}`}
              onClick={() => onSelectMember(member.id)}
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="member-badge-avatar"
                onError={(e) => {
                  // Fallback icon if avatar fails to load
                  (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                }}
              />
              <span className="member-badge-name">{member.name}</span>
              <span className="member-badge-count">{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
