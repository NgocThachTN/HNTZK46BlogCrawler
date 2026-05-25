import type React from 'react';
import type { BlogPost, Member } from '../types/blog';
import { BlogCard } from './BlogCard';
import '../styles/list.css';

interface BlogListProps {
  blogs: BlogPost[];
  members: Member[];
  onSelectBlog: (blog: BlogPost) => void;
  onClearFilters: () => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const BlogList: React.FC<BlogListProps> = ({
  blogs,
  members,
  onSelectBlog,
  onClearFilters,
  sortOrder,
  setSortOrder,
}) => {
  // Sort blogs based on selected date ordering
  const sortedBlogs = [...blogs].sort((a, b) => {
    const timeA = new Date(a.date.replace(/\./g, '/')).getTime();
    const timeB = new Date(b.date.replace(/\./g, '/')).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* List Toolbar */}
      <div className="list-toolbar">
        <div className="results-count">
          Hiển thị <span className="results-count-number">{blogs.length}</span> bài viết
        </div>

        <div className="sort-wrapper">
          <span className="sort-label">Sắp xếp:</span>
          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards or Empty State */}
      {sortedBlogs.length > 0 ? (
        <div className="blogs-grid">
          {sortedBlogs.map((blog, idx) => {
            const member = members.find((m) => m.id === blog.authorId);
            return (
              <BlogCard
                key={blog.id}
                blog={blog}
                member={member}
                index={idx}
                onClick={() => onSelectBlog(blog)}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <svg
            className="empty-state-icon"
            viewBox="0 0 24 24"
            width="48"
            height="48"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h4 className="empty-state-title">Không tìm thấy bài viết</h4>
          <p className="empty-state-desc">
            Không tìm thấy bài viết nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
          </p>
          <button className="clear-search-btn" onClick={onClearFilters}>
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      )}
    </div>
  );
};
