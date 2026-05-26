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
  const ITEMS_PER_PAGE = 7; // Asymmetrical lists feel better with fewer items per page

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
  }, [blogs, sortOrder]);

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
    // Scroll to the main content top
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
      {/* 1. Featured Spotlight Story (Hero Section) */}
      {featuredBlog && (
        <section className="featured-hero animate-fade-in">
          <div className="hero-badge">Featured Story</div>
          <div className="hero-card" onClick={() => onSelectBlog(featuredBlog)}>
            <div className="hero-image-wrapper">
              <img
                src={featuredBlog.thumbnail || 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg'}
                alt={featuredBlog.title}
                className="hero-image"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                }}
              />
              <div className="hero-gradient" />
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
                <time className="hero-date">{featuredBlog.date}</time>
              </div>
              <h2 className="hero-title">{featuredBlog.title}</h2>
              <p className="hero-snippet">{featuredBlog.summary}</p>
              <div className="hero-read-more">
                <span>Read Article</span>
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
        <h3 className="feed-toolbar-title">
          {searchQuery ? 'Search Results' : 'Latest Articles'}
          <span className="feed-count-badge">{blogs.length}</span>
        </h3>
        
        <div className="feed-toolbar-controls">
          <div className="sort-wrapper">
            <span className="sort-label">Sort:</span>
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

      {/* 3. Main Articles List */}
      {paginatedBlogs.length > 0 ? (
        <div className="editorial-list">
          {paginatedBlogs.map((blog, idx) => {
            const member = members.find((m) => m.id === blog.authorId);
            return (
              <article
                key={blog.id}
                className="editorial-item animate-slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => onSelectBlog(blog)}
              >
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
                            (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
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
                    <span className="read-time">Read more</span>
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

          {/* 4. Elegant Editorial Pagination */}
          {totalPages > 1 && (
            <nav className="editorial-pagination" aria-label="Pagination">
              <button
                className="pagination-arrow"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &larr; Previous
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
        </div>
      ) : (
        <div className="feed-empty-state">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            width="40"
            height="40"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h4>No posts match your filters</h4>
          <p>Try refining your search keywords or choosing another Hinatazaka46 member.</p>
          <button className="reset-search-btn" onClick={() => setSearchQuery('')}>
            Show All Articles
          </button>
        </div>
      )}
    </div>
  );
};
