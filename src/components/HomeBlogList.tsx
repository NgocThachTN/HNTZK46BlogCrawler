import React, { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member } from '../types/blog';
import '../styles/home.css';

interface HomeBlogListProps {
  blogs: BlogPost[];
  members: Member[];
  onSelectBlog: (blog: BlogPost) => void;
  onSelectMember: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (order: 'newest' | 'oldest') => void;
}

const DEFAULT_FALLBACK_THUMB = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%230f172a'/%3E%3Cpath d='M200 110 L230 160 L170 160 Z' fill='%2338bdf8' opacity='0.4'/%3E%3Ctext x='200' y='200' font-family='sans-serif' font-size='16' fill='%2394a3b8' text-anchor='middle' font-weight='bold'%3EHNT46 BLOG%3C/text%3E%3C/svg%3E";

export const HomeBlogList: React.FC<HomeBlogListProps> = ({
  blogs,
  members,
  onSelectBlog,
  onSelectMember,
  searchQuery,
  setSearchQuery,
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

  // Separating the first post as the "Featured Spotlight Story" (only on page 1 and if no search query)
  const isDefaultView = searchQuery.trim() === '';
  
  const featuredBlog = useMemo(() => {
    if (isDefaultView && sortedBlogs.length > 0 && currentPage === 1) {
      return sortedBlogs[0];
    }
    return null;
  }, [sortedBlogs, isDefaultView, currentPage]);

  const feedBlogs = useMemo(() => {
    if (featuredBlog) {
      return sortedBlogs.slice(1);
    }
    return sortedBlogs;
  }, [sortedBlogs, featuredBlog]);

  // Pagination parameters
  const totalPages = Math.ceil(feedBlogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBlogs = feedBlogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const mainSection = document.getElementById('main-feed-start');
    if (mainSection) {
      mainSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
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

  const featuredMember = featuredBlog ? members.find(m => m.id === featuredBlog.authorId) : null;

  return (
    <div className="home-feed-container">
      {/* 1. Featured Spotlight Story (Pick Up Blog) */}
      {featuredBlog && (
        <section className="featured-hero animate-fade-in">
          <div className="hero-badge">
            <span className="hero-badge-icon">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.2" fill="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </span>
            <span className="hero-badge-jp">PICK UP BLOG</span>
          </div>
          
          <div className="hero-card" onClick={() => onSelectBlog(featuredBlog)}>
            <div className="hero-image-wrapper">
              <img
                src={featuredBlog.thumbnail || DEFAULT_FALLBACK_THUMB}
                alt={featuredBlog.title}
                className="hero-image"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_THUMB;
                }}
              />
              <div className="hero-gradient" />
              <span className="hero-single-tag">Featured Blog</span>
            </div>
            
            <div className="hero-content">
              <div className="hero-meta">
                {featuredMember && (
                  <div 
                    className="hero-author"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMember(featuredMember.slug || `member_${featuredMember.id}`);
                    }}
                  >
                    <img src={featuredMember.avatar} alt={featuredMember.name} className="hero-author-avatar" />
                    <span className="hero-author-name">{featuredMember.name}</span>
                  </div>
                )}
                <span className="hero-dot">•</span>
                <time className="hero-date">
                  <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: '4px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {featuredBlog.date}
                </time>
              </div>
              
              <h2 className="hero-title">{featuredBlog.title}</h2>
              <p className="hero-snippet">{featuredBlog.summary}</p>
              
              <div className="hero-read-more">
                <span>Read Blog</span>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Anchor point for pagination scroll */}
      <div id="main-feed-start" />

      {/* 2. Feed Toolbar */}
      <div className="feed-toolbar">
        <div className="feed-toolbar-left">
          <h3 className="feed-toolbar-title">
            <span className="feed-title-en">{searchQuery ? 'SEARCH RESULTS' : 'LATEST BLOGS'}</span>
          </h3>
          <span className="feed-count-badge">{blogs.length} posts</span>
        </div>
        
        <div className="feed-toolbar-controls">
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

          {/* Sort Dropdown */}
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

      {/* 3. Main Articles List / Grid */}
      {paginatedBlogs.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            /* Idol Card Grid View */
            <div className="idol-blog-grid">
              {paginatedBlogs.map((blog, idx) => {
                const member = members.find((m) => m.id === blog.authorId);
                return (
                  <article
                    key={blog.id}
                    className="idol-blog-card animate-slide-up"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                    onClick={() => onSelectBlog(blog)}
                  >
                    <div className="idol-card-thumb-wrapper">
                      <img
                        src={blog.thumbnail || (member ? member.avatar : DEFAULT_FALLBACK_THUMB)}
                        alt={blog.title}
                        className="idol-card-thumb"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = member ? member.avatar : DEFAULT_FALLBACK_THUMB;
                        }}
                      />
                      <div className="idol-card-thumb-overlay"></div>
                      <span className="idol-card-date-badge">{blog.date.split(' ')[0]}</span>
                    </div>

                    <div className="idol-card-body">
                      {member && (
                        <div
                          className="idol-card-author"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMember(member.slug || `member_${member.id}`);
                          }}
                        >
                          <img src={member.avatar} alt={member.name} className="idol-card-avatar" />
                          <div className="idol-card-author-info">
                            <span className="idol-card-author-name">{member.name}</span>
                            <span className="idol-card-author-slug">{member.slug?.replace('.', ' ') || ''}</span>
                          </div>
                        </div>
                      )}

                      <h4 className="idol-card-title" title={blog.title}>{blog.title}</h4>
                      <p className="idol-card-snippet">{blog.summary}</p>

                      <div className="idol-card-footer">
                        <span className="idol-read-cta">
                          Read Blog
                          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth="2.5" fill="none">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </span>
                        <span className="idol-card-time">{blog.date.split(' ')[1] || ''}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Editorial List View */
            <div className="editorial-list">
              {paginatedBlogs.map((blog, idx) => {
                const member = members.find((m) => m.id === blog.authorId);
                const rank = String(startIndex + idx + 1).padStart(2, '0');
                return (
                  <article
                    key={blog.id}
                    className="editorial-item animate-slide-up"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                    onClick={() => onSelectBlog(blog)}
                  >
                    <div className="editorial-rank-column">
                      <span className="editorial-rank-number">{rank}</span>
                    </div>

                    <div className="editorial-item-text">
                      <div className="editorial-item-meta">
                        {member && (
                          <div 
                            className="editorial-item-author"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMember(member.slug || `member_${member.id}`);
                            }}
                          >
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="editorial-item-avatar"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_THUMB;
                              }}
                            />
                            <span className="editorial-item-name">{member.name}</span>
                          </div>
                        )}
                        <span className="editorial-item-dot">•</span>
                        <time className="editorial-item-date">{blog.date}</time>
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

          {/* 4. Japanese Style Pagination */}
          {totalPages > 1 && (
            <nav className="editorial-pagination" aria-label="Pagination">
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
          <p>Try searching with another keyword or selecting a different member.</p>
          <button className="reset-search-btn" onClick={() => setSearchQuery('')}>
            Show All Blogs
          </button>
        </div>
      )}
    </div>
  );
};
