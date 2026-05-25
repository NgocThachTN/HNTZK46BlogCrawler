import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member, BlogDatabase } from './types/blog';
import { Header } from './components/Header';
import { MemberFilter } from './components/MemberFilter';
import { BlogList } from './components/BlogList';
import { BlogDetail } from './components/BlogDetail';
import './styles/index.css';

function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentBlogId, setCurrentBlogId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with URL Hash for high-fidelity browser routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/blog\/(\d+)$/);
      if (match) {
        setCurrentBlogId(match[1]);
      } else {
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

  const selectedBlog = useMemo(() => {
    if (!currentBlogId) return null;
    return blogs.find((b) => b.id === currentBlogId) || null;
  }, [currentBlogId, blogs]);

  const handleSelectBlog = (blog: BlogPost) => {
    window.location.hash = `#/blog/${blog.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseBlog = () => {
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

  // Handle live filtering and search query
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      // 1. Filter by selected member
      if (selectedMemberId !== null && blog.authorId !== selectedMemberId) {
        return false;
      }

      // 2. Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = blog.title.toLowerCase().includes(query);
        const summaryMatch = blog.summary.toLowerCase().includes(query);
        
        const matchedMember = members.find((m) => m.id === blog.authorId);
        const authorMatch = matchedMember ? matchedMember.name.toLowerCase().includes(query) : false;

        return titleMatch || summaryMatch || authorMatch;
      }

      return true;
    });
  }, [blogs, members, selectedMemberId, searchQuery]);

  // Clear all active filters and inputs
  const handleClearFilters = () => {
    setSelectedMemberId(null);
    setSearchQuery('');
  };

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

  // If a blog post is selected, render the dedicated Blog Detail page
  if (selectedBlog) {
    const selectedMember = members.find((m) => m.id === selectedBlog.authorId);
    
    // Find index in filtered list to determine next/prev chronological navigation
    const currentIndex = filteredBlogs.findIndex((b) => b.id === selectedBlog.id);
    const hasNext = currentIndex > 0;
    const hasPrev = currentIndex < filteredBlogs.length - 1;

    const handleNext = () => {
      if (hasNext) {
        const nextBlog = filteredBlogs[currentIndex - 1];
        window.location.hash = `#/blog/${nextBlog.id}`;
      }
    };

    const handlePrev = () => {
      if (hasPrev) {
        const prevBlog = filteredBlogs[currentIndex + 1];
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

  return (
    <div className="app-container">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalBlogs={blogs.length}
      />

      <main className="main-content">
        <MemberFilter
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
          blogCounts={blogCounts}
          totalBlogs={blogs.length}
        />

        <BlogList
          blogs={filteredBlogs}
          members={members}
          onSelectBlog={handleSelectBlog}
          onClearFilters={handleClearFilters}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      </main>
    </div>
  );
}

export default App;
