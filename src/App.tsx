import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member, BlogDatabase } from './types/blog';
import { Header } from './components/Header';
import { MemberFilter } from './components/MemberFilter';
import { BlogList } from './components/BlogList';
import { BlogDetail } from './components/BlogDetail';
import { MemberCatalog } from './components/MemberCatalog';
import './styles/index.css';

function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [currentMemberSlug, setCurrentMemberSlug] = useState<string | null>(null);
  const [currentBlogId, setCurrentBlogId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with URL Hash for high-fidelity browser routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const memberMatch = hash.match(/^#\/member\/([a-zA-Z0-9._-]+)$/);
      const blogMatch = hash.match(/^#\/blog\/(\d+)$/);

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

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch blogs database on mount
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        setLoading(true);
        const response = await fetch('/blogs.json');
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu blog. Hãy chắc chắn rằng bạn đã chạy crawler: `npm run crawl`');
        }
        const data: BlogDatabase = await response.json();
        
        setBlogs(data.blogs || []);
        setMembers(data.members || []);
      } catch (err: any) {
        setError(err.message || 'Lỗi không xác định khi tải cơ sở dữ liệu blog.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDatabase();
  }, []);

  // Find active member & blog post based on current route/hash
  const activeMember = useMemo(() => {
    if (!currentMemberSlug) return null;
    return members.find((m) => m.slug === currentMemberSlug) || null;
  }, [currentMemberSlug, members]);

  const selectedBlog = useMemo(() => {
    if (!currentBlogId) return null;
    return blogs.find((b) => b.id === currentBlogId) || null;
  }, [currentBlogId, blogs]);

  // Routing handlers
  const handleSelectMember = (slug: string) => {
    setSearchQuery(''); // reset search query on transition
    window.location.hash = `#/member/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBlog = (blog: BlogPost) => {
    window.location.hash = `#/blog/${blog.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseBlog = () => {
    if (selectedBlog) {
      const author = members.find((m) => m.id === selectedBlog.authorId);
      if (author) {
        window.location.hash = `#/member/${author.slug}`;
        return;
      }
    }
    window.location.hash = '';
  };

  const handleBackToCatalog = () => {
    setSearchQuery('');
    window.location.hash = '';
  };

  // Compute posts frequency map for each member
  const blogCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    blogs.forEach((blog) => {
      counts[blog.authorId] = (counts[blog.authorId] || 0) + 1;
    });
    return counts;
  }, [blogs]);

  // Group and filter blogs for the active member feed
  const memberBlogs = useMemo(() => {
    if (!activeMember) return [];
    return blogs.filter((b) => b.authorId === activeMember.id);
  }, [activeMember, blogs]);

  const filteredBlogs = useMemo(() => {
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Đang tải dữ liệu lưu trữ blog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h3 className="error-title">Lỗi tải dữ liệu</h3>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  // 1. ROUTE: Blog Reader
  if (selectedBlog) {
    const selectedMember = members.find((m) => m.id === selectedBlog.authorId);
    
    // Browse chronological navigation only within the active member's specific blogs
    const contextualBlogs = activeMember ? memberBlogs : blogs;
    const currentIndex = contextualBlogs.findIndex((b) => b.id === selectedBlog.id);
    const hasNext = currentIndex > 0;
    const hasPrev = currentIndex < contextualBlogs.length - 1;

    const handleNext = () => {
      if (hasNext) {
        const nextBlog = contextualBlogs[currentIndex - 1];
        window.location.hash = `#/blog/${nextBlog.id}`;
      }
    };

    const handlePrev = () => {
      if (hasPrev) {
        const prevBlog = contextualBlogs[currentIndex + 1];
        window.location.hash = `#/blog/${prevBlog.id}`;
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
          placeholder={`Tìm kiếm blog của ${activeMember.name}...`}
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
              if (target) handleSelectMember(target.slug || `member_${target.id}`);
            }}
            blogCounts={blogCounts}
            totalBlogs={blogs.length}
          />

          <BlogList
            blogs={filteredBlogs}
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

  // 3. ROUTE: Home Member Catalog
  return (
    <div className="app-container">
      <MemberCatalog
        members={members}
        blogCounts={blogCounts}
        onSelectMember={handleSelectMember}
      />
    </div>
  );
}

export default App;
