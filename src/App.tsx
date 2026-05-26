import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member, BlogDatabase } from './types/blog';
import { Header } from './components/Header';
import { MemberFilter } from './components/MemberFilter';
import { BlogList } from './components/BlogList';
import { BlogDetail } from './components/BlogDetail';
import { HomeBlogList } from './components/HomeBlogList';
import './styles/index.css';
import './styles/home.css';

// Clean History-based SPA Navigation Helper
const navigate = (path: string) => {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [currentMemberSlug, setCurrentMemberSlug] = useState<string | null>(null);
  const [currentBlogId, setCurrentBlogId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with URL Pathname for clean, high-fidelity browser routing
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const memberMatch = path.match(/^\/member\/([a-zA-Z0-9._-]+)$/);
      const blogMatch = path.match(/^\/blog\/(\d+)$/);

      if (memberMatch) {
        setCurrentMemberSlug(memberMatch[1]);
        setCurrentBlogId(null);
      } else if (blogMatch) {
        setCurrentBlogId(blogMatch[1]);
      } else {
        setCurrentMemberSlug(null);
        setCurrentBlogId(null);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Fetch blogs database on mount
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        setLoading(true);
        const response = await fetch('/blogs.json');
        if (!response.ok) {
          throw new Error('Unable to load blog archive. Please ensure you have run the crawler: `npm run crawl`');
        }
        const data: BlogDatabase = await response.json();
        
        setBlogs(data.blogs || []);
        setMembers(data.members || []);
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred while loading the blog database.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  // Find active member & blog post based on current route/path
  const activeMember = useMemo(() => {
    if (!currentMemberSlug) return null;
    return members.find((m) => m.slug === currentMemberSlug) || null;
  }, [currentMemberSlug, members]);

  const selectedBlog = useMemo(() => {
    if (!currentBlogId) return null;
    return blogs.find((b) => b.id === currentBlogId) || null;
  }, [currentBlogId, blogs]);

  // Routing handlers using Clean History API
  const handleSelectMember = (slug: string) => {
    setSearchQuery(''); // reset search query on transition
    navigate(`/member/${slug}`);
  };

  const handleSelectBlog = (blog: BlogPost) => {
    navigate(`/blog/${blog.id}`);
  };

  const handleCloseBlog = () => {
    if (selectedBlog) {
      const author = members.find((m) => m.id === selectedBlog.authorId);
      if (author && currentMemberSlug) {
        navigate(`/member/${author.slug}`);
        return;
      }
    }
    navigate('/');
  };

  const handleBackToCatalog = () => {
    setSearchQuery('');
    navigate('/');
  };

  // Compute posts frequency map for each member
  const blogCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blogs.forEach((blog) => {
      counts[blog.authorId] = (counts[blog.authorId] || 0) + 1;
    });
    return counts;
  }, [blogs]);

  // Sort members spotlight list for the home page sidebar
  const sortedMembersSpotlight = useMemo(() => {
    return [...members].sort((a, b) => {
      const countA = blogCounts[a.id] || 0;
      const countB = blogCounts[b.id] || 0;
      if (countA !== countB) {
        return countB - countA;
      }
      return a.name.localeCompare(b.name, 'ja');
    });
  }, [members, blogCounts]);

  // Group and filter blogs for the active member feed
  const memberBlogs = useMemo(() => {
    if (!activeMember) return [];
    return blogs.filter((b) => b.authorId === activeMember.id);
  }, [activeMember, blogs]);

  // Filtered blogs for the active member feed
  const filteredMemberBlogs = useMemo(() => {
    return memberBlogs.filter((blog) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = blog.title.toLowerCase().includes(query);
        const summaryMatch = blog.summary.toLowerCase().includes(query);
        return titleMatch || summaryMatch;
      }
      return true;
    });
  }, [memberBlogs, searchQuery]);

  // Filtered global blogs for the global homepage feed
  const filteredGlobalBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = blog.title.toLowerCase().includes(query);
        const summaryMatch = blog.summary.toLowerCase().includes(query);
        return titleMatch || summaryMatch;
      }
      return true;
    });
  }, [blogs, searchQuery]);

  if (loading) {
    return <SkeletonHome />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h3 className="error-title">Error Loading Data</h3>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // 1. ROUTE: Blog Reader
  if (selectedBlog) {
    const selectedMember = members.find((m) => m.id === selectedBlog.authorId);
    
    // Browse chronological navigation inside the relevant contextual list
    const contextualBlogs = activeMember ? memberBlogs : blogs;
    const currentIndex = contextualBlogs.findIndex((b) => b.id === selectedBlog.id);
    const hasNext = currentIndex > 0;
    const hasPrev = currentIndex < contextualBlogs.length - 1;

    const handleNext = () => {
      if (hasNext) {
        const nextBlog = contextualBlogs[currentIndex - 1];
        navigate(`/blog/${nextBlog.id}`);
      }
    };

    const handlePrev = () => {
      if (hasPrev) {
        const prevBlog = contextualBlogs[currentIndex + 1];
        navigate(`/blog/${prevBlog.id}`);
      }
    };

    return (
      <BlogDetail
        blog={selectedBlog}
        member={selectedMember}
        onClose={handleCloseBlog}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={hasNext}
        hasPrev={hasPrev}
      />
    );
  }

  // 2. ROUTE: Member Blog Feed
  if (activeMember) {
    return (
      <div className="app-container">
        {/* Navigation & Header specifically for this member */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder={`Search ${activeMember.name}'s blogs...`}
          onBack={handleBackToCatalog}
          activeMember={activeMember}
        />

        <main className="main-content">
          {/* Horizontal scrollbar is maintained for fast switching to other members */}
          <MemberFilter
            members={members}
            selectedMemberId={activeMember.id}
            onSelectMember={(id) => {
              const target = members.find((m) => m.id === id);
              if (target) {
                handleSelectMember(target.slug || `member_${target.id}`);
              } else {
                navigate('/');
              }
            }}
            blogCounts={blogCounts}
            totalBlogs={blogs.length}
          />

          <BlogList
            blogs={filteredMemberBlogs}
            members={members}
            onSelectBlog={handleSelectBlog}
            onClearFilters={() => setSearchQuery('')}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </main>
      </div>
    );
  }

  // 3. ROUTE: Home Magazine Catalog
  return (
    <div className="app-container">
      {/* Brand Editorial Masthead */}
      <header className="home-masthead">
        <span className="masthead-badge">Hinatazaka46 Blog Archive</span>
        <h1 className="masthead-title">HNTZK46 ARCHIVE</h1>
        <p className="masthead-subtitle">An elegant, reading-centric archive for Hinatazaka46 members' official blog posts</p>
      </header>

      {/* Centralized Contributor Guild Grid Section (Centered Directory Grid with Aura Rings) */}
      <section className="contributors-guild-section">
        <h2 className="guild-title">
          <span className="guild-title-dot"></span>
          Hinatazaka46 Members
        </h2>
        <div className="contributors-guild-grid">
          {sortedMembersSpotlight.map((member) => {
            const count = blogCounts[member.id] || 0;
            return (
              <div
                key={member.id}
                className="guild-member-card"
                onClick={() => handleSelectMember(member.slug || `member_${member.id}`)}
              >
                <div className="guild-avatar-wrapper">
                  <div className="aura-glow-ring"></div>
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="guild-avatar-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                    }}
                  />
                  <span className="guild-badge-count">{count}</span>
                </div>
                <div className="guild-member-info">
                  <span className="guild-member-name">{member.name}</span>
                  <span className="guild-member-slug">{member.slug}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Asymmetric Magazine Layout */}
      <div className="home-container">
        {/* Left Column: Clean Articles List */}
        <main className="home-main-feed">
          <HomeBlogList
            blogs={filteredGlobalBlogs}
            members={members}
            onSelectBlog={handleSelectBlog}
            onSelectMember={handleSelectMember}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        </main>

        {/* Right Column: Editorial Sidebar Widgets */}
        <aside className="sidebar-container">
          {/* Widget 1: Archive Search */}
          <div className="sidebar-widget">
            <h4 className="widget-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '4px' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search Archive
            </h4>
            <div className="sidebar-search-box">
              <svg
                className="sidebar-search-icon"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="Search all posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Widget 3: Archive Statistics */}
          <div className="sidebar-widget">
            <h4 className="widget-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '4px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              Archive Stats
            </h4>
            <div className="stats-list">
              <div className="stat-item">
                <span>Total Posts</span>
                <span className="stat-val">{blogs.length}</span>
              </div>
              <div className="stat-item">
                <span>Active Writers</span>
                <span className="stat-val">{members.length}</span>
              </div>
              <div className="stat-item">
                <span>Language</span>
                <span className="stat-val">EN / JA</span>
              </div>
              <div className="stat-item">
                <span>System Status</span>
                <span className="stat-val" style={{ color: '#4ade80' }}>Online</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Immersive High-End Pulse Skeleton Loader Component
function SkeletonHome() {
  return (
    <div className="app-container loading-skeleton-active skeleton-pulse">
      {/* 1. Masthead Skeleton */}
      <header className="home-masthead">
        <div className="skeleton-badge" />
        <div className="skeleton-title" />
        <div className="skeleton-subtitle" />
      </header>

      {/* 2. Contributor Guild Spotlight Skeleton */}
      <div className="skeleton-guild-container">
        <div className="skeleton-guild-title" />
        <div className="skeleton-guild-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-member-circle">
              <div className="skeleton-avatar" />
              <div className="skeleton-name" />
              <div className="skeleton-badge-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Main Two-Column Layout Skeleton */}
      <div className="home-container">
        <div className="home-main-feed">
          <div className="skeleton-feed-toolbar" />
          <div className="skeleton-articles">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-article-row">
                <div className="skeleton-article-text">
                  <div className="skeleton-article-meta" />
                  <div className="skeleton-article-title" />
                  <div className="skeleton-article-snippet" />
                  <div className="skeleton-article-snippet-short" />
                </div>
                <div className="skeleton-article-thumb" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Sidebar Skeleton */}
        <aside className="sidebar-container mobile-hide">
          <div className="skeleton-widget">
            <div className="skeleton-widget-title" />
            <div className="skeleton-widget-body" />
          </div>
          <div className="skeleton-widget">
            <div className="skeleton-widget-title" />
            <div className="skeleton-widget-body" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
