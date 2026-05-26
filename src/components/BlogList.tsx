import React, { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 9;

  // Sort blogs based on selected date ordering
  const sortedBlogs = [...blogs].sort((a, b) => {
    const timeA = new Date(a.date.replace(/\./g, '/')).getTime();
    const timeB = new Date(b.date.replace(/\./g, '/')).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // Reset page to 1 when the feed list changes (due to member filtering or search query input)
  useEffect(() => {
    setCurrentPage(1);
  }, [blogs, sortOrder]);

  // Compute pagination parameters
  const totalPages = Math.ceil(sortedBlogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBlogs = sortedBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Scroll to top of list area when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // High-fidelity dynamic ellipsis pagination numbers generator
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* List Toolbar */}
      <div className="list-toolbar">
        <div className="results-count">
          Showing <span className="results-count-number">{blogs.length}</span> {blogs.length === 1 ? 'post' : 'posts'}
          {totalPages > 1 && (
            <span className="page-indicator"> (Page {currentPage} of {totalPages})</span>
          )}
        </div>

        <div className="sort-wrapper">
          <span className="sort-label">Sort by:</span>
          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards or Empty State */}
      {paginatedBlogs.length > 0 ? (
        <>
          <div className="blogs-grid">
            {paginatedBlogs.map((blog, idx) => {
              const member = members.find((m) => m.id === blog.authorId);
              return (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  member={member}
                  index={startIndex + idx}
                  onClick={() => onSelectBlog(blog)}
                />
              );
            })}
          </div>

          {/* Premium Bottom Pagination Controls */}
          {totalPages > 1 && (
            <nav className="pagination-container" aria-label="Pagination Navigation">
              {/* Previous Page Button */}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                &lt;
              </button>

              {/* Numbered Buttons */}
              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`ell-${idx}`} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={`page-${page}`}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page as number)}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Page Button */}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                &gt;
              </button>
            </nav>
          )}
        </>
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
          <h4 className="empty-state-title">No posts found</h4>
          <p className="empty-state-desc">
            No blog posts matched your search queries or selected filters.
          </p>
          <button className="clear-search-btn" onClick={onClearFilters}>
            Clear search filters
          </button>
        </div>
      )}
    </div>
  );
};
