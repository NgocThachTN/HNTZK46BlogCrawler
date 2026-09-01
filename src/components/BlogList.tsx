import React, { useState, useEffect, useMemo } from 'react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const ITEMS_PER_PAGE = viewMode === 'grid' ? 9 : 8;

  // Sort blogs based on selected date ordering
  const sortedBlogs = useMemo(() => {
    return [...blogs].sort((a, b) => {
      const timeA = new Date(a.date.replace(/\./g, '/')).getTime();
      const timeB = new Date(b.date.replace(/\./g, '/')).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [blogs, sortOrder]);

  // Reset page to 1 when the feed list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [blogs, sortOrder, viewMode]);

  // Compute pagination parameters
  const totalPages = Math.ceil(sortedBlogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBlogs = sortedBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Scroll to top of list area when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const feedHeader = document.getElementById('member-feed-top');
    if (feedHeader) {
      feedHeader.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="member-bloglist-wrapper animate-fade-in">
      <div id="member-feed-top" />

      {/* Modern Feed Toolbar */}
      <div className="list-toolbar">
        <div className="toolbar-left">
          <h3 className="toolbar-feed-title">
            <span>Blog Timeline</span>
            <span className="toolbar-count-badge">{blogs.length} posts</span>
          </h3>
        </div>

        <div className="toolbar-right">
          {/* Grid vs List View Mode Toggle */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Sort Selector */}
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
      </div>

      {/* Grid of Cards, List of Articles, or Empty State */}
      {paginatedBlogs.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
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
          ) : (
            <div className="editorial-list">
              {paginatedBlogs.map((blog, idx) => {
                const member = members.find((m) => m.id === blog.authorId);
                const rank = String(startIndex + idx + 1).padStart(2, '0');
                return (
                  <article
                    key={blog.id}
                    className="editorial-item animate-slide-up"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                    onClick={() => onSelectBlog(blog)}
                  >
                    <div className="editorial-rank-column">
                      <span className="editorial-rank-number">{rank}</span>
                    </div>

                    <div className="editorial-item-text">
                      <div className="editorial-item-meta">
                        {member && (
                          <div className="editorial-item-author">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="editorial-item-avatar"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/favicon.svg';
                              }}
                            />
                            <span className="editorial-item-name">{member.name}</span>
                          </div>
                        )}
                        <span className="editorial-item-dot">•</span>
                        <time className="editorial-item-date">{blog.date}</time>
                        {blog.images && blog.images.length > 0 && (
                          <>
                            <span className="editorial-item-dot">•</span>
                            <span className="editorial-photo-count">
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" style={{ verticalAlign: '-1px', marginRight: '4px' }}>
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                              </svg>
                              {blog.images.length} photos
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="editorial-item-title">{blog.title}</h3>
                      <p className="editorial-item-snippet">{blog.summary}</p>

                      <div className="editorial-item-footer">
                        <span className="read-time">Read Blog</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </div>
                    </div>

                    {blog.thumbnail && (
                      <div className="editorial-item-thumbnail-wrapper">
                        <img
                          src={blog.thumbnail}
                          alt={blog.title}
                          className="editorial-item-thumbnail"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Japanese Style Pagination Controls */}
          {totalPages > 1 && (
            <nav className="editorial-pagination" aria-label="Pagination Navigation">
              <button
                className="pagination-arrow"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &larr; Prev
              </button>

              <div className="pagination-numbers">
                {getPageNumbers().map((page, idx) => {
                  if (page === '...') {
                    return <span key={`ell-${idx}`} className="pagination-ell">...</span>;
                  }
                  return (
                    <button
                      key={`page-${page}`}
                      className={`pagination-num ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page as number)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                className="pagination-arrow"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="feed-empty-state">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            width="44"
            height="44"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h4>No blog posts found</h4>
          <p>No posts matched your search keywords.</p>
          <button className="reset-search-btn" onClick={onClearFilters}>
            Clear Search Filter
          </button>
        </div>
      )}
    </div>
  );
};
