import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member, BlogDatabase } from './types/blog';
import { Header } from './components/Header';
import { MemberFilter } from './components/MemberFilter';
import { BlogList } from './components/BlogList';
import { BlogDetail } from './components/BlogDetail';
import { HomeBlogList } from './components/HomeBlogList';
import './styles/index.css';
import './styles/home.css';
import './styles/notfound.css';

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
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with URL Pathname for clean, high-fidelity browser routing
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const memberMatch = path.match(/^\/member\/([a-zA-Z0-9._-]+)$/);
      const blogMatch = path.match(/^\/blog\/(\d+)$/);

      setIsNotFound(false);

      if (path === '/') {
        setCurrentMemberSlug(null);
        setCurrentBlogId(null);
      } else if (memberMatch) {
        setCurrentMemberSlug(memberMatch[1]);
        setCurrentBlogId(null);
      } else if (blogMatch) {
        setCurrentBlogId(blogMatch[1]);
      } else {
        setIsNotFound(true);
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

  // Check if current route is invalid or data is missing
  const showNotFound = useMemo(() => {
    if (loading) return false;
    if (isNotFound) return true;
    if (currentMemberSlug && !activeMember) return true;
    if (currentBlogId && !selectedBlog) return true;
    return false;
  }, [loading, isNotFound, currentMemberSlug, activeMember, currentBlogId, selectedBlog]);

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

  // 0. ROUTE: 404 Not Found Page
  if (showNotFound) {
    return (
      <div className="app-container">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search blog posts..."
          onBack={handleBackToCatalog}
        />
        <main className="main-content">
          <div className="notfound-container animate-fade-in">
            <div className="notfound-artwork">
              <div className="notfound-glow"></div>
              <div className="notfound-icon-wrapper">
                <svg viewBox="0 0 24 24" width="80" height="80" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <h1 className="notfound-code">404</h1>
            <h2 className="notfound-title">Lost in the Archive</h2>
            <p className="notfound-subtitle">
              The article or member page you are looking for has been moved, deleted, or does not exist in the Hinatazaka46 archive database.
            </p>
            <button className="notfound-btn" onClick={handleBackToCatalog}>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Return to Homepage
            </button>
          </div>
        </main>
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

  // State for generation filter on homepage
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');

  // Generation classification helper
  const getMemberGen = (id: string): string => {
    if (['12', '14'].includes(id)) return '2';
    if (['21', '22', '23', '24'].includes(id)) return '3';
    if (['25', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(id)) return '4';
    if (['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].includes(id)) return '5';
    if (id === '000') return 'mascot';
    return 'all';
  };

  // Filtered members by generation
  const displayedMembers = useMemo(() => {
    if (selectedGeneration === 'all') return sortedMembersSpotlight;
    return sortedMembersSpotlight.filter((m) => getMemberGen(m.id) === selectedGeneration);
  }, [sortedMembersSpotlight, selectedGeneration]);

  // Generation statistics for sidebar
  const genStats = useMemo(() => {
    return [
      { key: 'all', label: 'All Active', count: members.length },
      { key: '2', label: '2期生 (2nd Gen)', count: members.filter(m => getMemberGen(m.id) === '2').length },
      { key: '3', label: '3期生 (3rd Gen)', count: members.filter(m => getMemberGen(m.id) === '3').length },
      { key: '4', label: '4期生 (4th Gen)', count: members.filter(m => getMemberGen(m.id) === '4').length },
      { key: '5', label: '5期生 (5th Gen)', count: members.filter(m => getMemberGen(m.id) === '5').length },
      { key: 'mascot', label: 'ポカ (Poka Mascot)', count: members.filter(m => getMemberGen(m.id) === 'mascot').length },
    ];
  }, [members]);

  // 3. ROUTE: Home Magazine Catalog
  return (
    <div className="app-container">
      {/* Sleek Modern Brand Masthead */}
      <header className="home-masthead">
        <div className="masthead-badge-row">
          <span className="masthead-badge">
            <span className="badge-live-pulse"></span>
            日向坂46 Official Blog Archive
          </span>
          <span className="masthead-badge masthead-era-badge">18th Single Edition</span>
        </div>
        
        <h1 className="masthead-title">
          <span className="masthead-title-text">HINATAZAKA46</span>
          <span className="masthead-title-sub">BLOG ARCHIVE</span>
        </h1>
        <p className="masthead-subtitle">
          Khám phá và lưu trữ toàn bộ nhật ký chính thức của các thành viên Nhật Bản với hỗ trợ Furigana & hình ảnh tối ưu hoá
        </p>

        {/* Quick Stats Metric Pills */}
        <div className="masthead-stats-bar">
          <div className="stat-pill">
            <span className="stat-pill-num">{members.length}</span>
            <span className="stat-pill-label">Members</span>
          </div>
          <div className="stat-pill-divider"></div>
          <div className="stat-pill">
            <span className="stat-pill-num">{blogs.length}</span>
            <span className="stat-pill-label">Archived Posts</span>
          </div>
          <div className="stat-pill-divider"></div>
          <div className="stat-pill">
            <span className="stat-pill-num">100%</span>
            <span className="stat-pill-label">High-Res Profiles</span>
          </div>
          <div className="stat-pill-divider"></div>
          <div className="stat-pill">
            <span className="stat-pill-num">Furigana</span>
            <span className="stat-pill-label">Japanese Study</span>
          </div>
        </div>
      </header>

      {/* Centered Modern Member Roster Section */}
      <section className="contributors-guild-section">
        <div className="guild-header-row">
          <h2 className="guild-title">
            <span className="guild-title-dot"></span>
            Hinatazaka46 Members
          </h2>

          {/* Generation Tab Selector */}
          <div className="gen-tabs-container">
            <button
              className={`gen-tab ${selectedGeneration === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('all')}
            >
              All ({members.length})
            </button>
            <button
              className={`gen-tab ${selectedGeneration === '2' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('2')}
            >
              2期生
            </button>
            <button
              className={`gen-tab ${selectedGeneration === '3' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('3')}
            >
              3期生
            </button>
            <button
              className={`gen-tab ${selectedGeneration === '4' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('4')}
            >
              4期生
            </button>
            <button
              className={`gen-tab ${selectedGeneration === '5' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('5')}
            >
              5期生
            </button>
            <button
              className={`gen-tab ${selectedGeneration === 'mascot' ? 'active' : ''}`}
              onClick={() => setSelectedGeneration('mascot')}
            >
              ポカ
            </button>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="contributors-guild-grid">
          {displayedMembers.map((member) => {
            const count = blogCounts[member.id] || 0;
            const gen = getMemberGen(member.id);
            const genLabel = gen === 'mascot' ? 'Mascot' : `${gen}期生`;

            return (
              <div
                key={member.id}
                className="guild-member-card"
                onClick={() => handleSelectMember(member.slug || `member_${member.id}`)}
                title={`${member.name} (${genLabel}) - ${count} bài viết`}
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
                  <span className="guild-member-slug">{member.slug?.replace('.', ' ') || ''}</span>
                  <span className="guild-gen-tag">{genLabel}</span>
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
          {/* Widget 1: Search Archive */}
          <div className="sidebar-widget">
            <h4 className="widget-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
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
                placeholder="Search blog title or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="sidebar-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Widget 2: Generations Quick Filter */}
          <div className="sidebar-widget">
            <h4 className="widget-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Generations
            </h4>
            <div className="sidebar-gen-list">
              {genStats.map((g) => (
                <button
                  key={g.key}
                  className={`sidebar-gen-item ${selectedGeneration === g.key ? 'active' : ''}`}
                  onClick={() => setSelectedGeneration(g.key)}
                >
                  <span className="sidebar-gen-label">{g.label}</span>
                  <span className="sidebar-gen-badge">{g.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Widget 3: Archive Statistics */}
          <div className="sidebar-widget">
            <h4 className="widget-title">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" style={{ marginRight: '6px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              Archive Status
            </h4>
            <div className="stats-list">
              <div className="stat-item">
                <span>Total Posts</span>
                <span className="stat-val">{blogs.length.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span>Active Members</span>
                <span className="stat-val">{members.length}</span>
              </div>
              <div className="stat-item">
                <span>Profile Visuals</span>
                <span className="stat-val" style={{ color: 'var(--color-brand)' }}>18th Single HD</span>
              </div>
              <div className="stat-item">
                <span>Furigana Engine</span>
                <span className="stat-val" style={{ color: '#4ade80' }}>Kuromoji Active</span>
              </div>
              <div className="stat-item">
                <span>System Status</span>
                <span className="stat-val" style={{ color: '#4ade80' }}>● Online</span>
              </div>
            </div>
          </div>

          {/* Widget 4: Profile Archival Status Notice */}
          <div className="sidebar-widget profile-archive-widget">
            <div className="profile-archive-header">
              <span className="profile-archive-icon">📁</span>
              <span className="profile-archive-title">Profile Vault</span>
            </div>
            <p className="profile-archive-desc">
              Ảnh profile của toàn bộ thành viên đã được đồng bộ chuẩn HD mới nhất. Các bản profile tiền nhiệm được bảo toàn trong thư mục lưu trữ.
            </p>
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
