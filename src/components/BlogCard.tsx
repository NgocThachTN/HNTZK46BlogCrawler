import type React from 'react';
import type { BlogPost, Member } from '../types/blog';
import '../styles/card.css';

interface BlogCardProps {
  blog: BlogPost;
  member: Member | undefined;
  onClick: () => void;
  index: number;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  member,
  onClick,
  index,
}) => {
  const cardDelayStyle = {
    animationDelay: `${index * 0.04}s`,
  };

  const dateOnly = blog.date.split(' ')[0] || blog.date;
  const timeOnly = blog.date.split(' ')[1] || '';

  return (
    <article
      className="blog-card animate-slide-up"
      style={cardDelayStyle}
      onClick={onClick}
    >
      {/* 1. Thumbnail Media Box */}
      <div className="blog-card-image-wrapper">
        <img
          src={blog.thumbnail || (member ? member.avatar : '/favicon.svg')}
          alt={blog.title}
          className="blog-card-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = member ? member.avatar : '/favicon.svg';
          }}
        />
        <div className="blog-card-image-overlay" />
        
        {/* Date pill badge */}
        <span className="blog-card-date-badge">{dateOnly}</span>

        {/* Photo count pill if images exist */}
        {blog.images && blog.images.length > 0 && (
          <span className="blog-card-photos-badge">
            <svg viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" strokeWidth="2" fill="none" style={{ marginRight: '3px' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            {blog.images.length}
          </span>
        )}
      </div>

      {/* 2. Card Content Body */}
      <div className="blog-card-body">
        {member && (
          <div className="blog-card-header">
            <img
              src={member.avatar}
              alt={member.name}
              className="blog-card-author-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.svg';
              }}
            />
            <div className="blog-card-author-meta">
              <span className="blog-card-author-name">{member.name}</span>
              {member.slug && (
                <span className="blog-card-author-slug">{member.slug.replace('.', ' ')}</span>
              )}
            </div>
          </div>
        )}

        <h3 className="blog-card-title">{blog.title}</h3>
        <p className="blog-card-snippet">{blog.summary}</p>

        <div className="blog-card-footer">
          <span className="blog-card-read-label">
            <span>Read Blog</span>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
          {timeOnly && <time className="blog-card-time">{timeOnly}</time>}
        </div>
      </div>
    </article>
  );
};
