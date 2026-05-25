import { useState, useEffect, useMemo } from 'react';
import type { BlogPost, Member, BlogDatabase } from './types/blog';
import { Header } from './components/Header';
import { MemberFilter } from './components/MemberFilter';
import { BlogList } from './components/BlogList';
import { BlogModal } from './components/BlogModal';
import './styles/index.css';

function App() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blogs database on mount
  useEffect(() => {
    const loadDatabase = async () => {
      try {
        setLoading(true);
        // Load the crawled blogs.json from public directory
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

      // 2. Filter by search query (live search title, summary, or author name)
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

  const selectedMember = members.find((m) => m.id === selectedBlog?.authorId);

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
          onSelectBlog={setSelectedBlog}
          onClearFilters={handleClearFilters}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      </main>

      {/* Full-screen immersive Blog Reader Modal */}
      {selectedBlog && (
        <BlogModal
          blog={selectedBlog}
          member={selectedMember}
          onClose={() => setSelectedBlog(null)}
        />
      )}
    </div>
  );
}

export default App;
