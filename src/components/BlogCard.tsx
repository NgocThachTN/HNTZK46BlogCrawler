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
  // Add staggering delay animation based on index
  const cardDelayStyle = {
    animationDelay: `${index * 0.04}s`,
  };

  // Extract date part (YYYY.MM.DD) for a cleaner layout
  const dateString = blog.date.split(' ')[0] || blog.date;

  return (
    <article
      className="blog-editorial-row animate-slide-up"
      style={cardDelayStyle}
      onClick={onClick}
    >
      <div className="editorial-meta-col">
        <time className="editorial-date">{dateString}</time>
        {member && (
          <div className="editorial-author-badge">
            <img
              src={member.avatar}
              alt={member.name}
              className="editorial-author-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
              }}
            />
            <span className="editorial-author-name">{member.name}</span>
          </div>
        )}
      </div>

      <div className="editorial-main-col">
        <h3 className="editorial-title">{blog.title}</h3>
        <p className="editorial-snippet">{blog.summary}</p>
        <span className="editorial-read-link">
          Đọc bài viết
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            style={{ marginLeft: '4px', transition: 'transform 0.2s' }}
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>

      {blog.thumbnail && (
        <div className="editorial-thumbnail-wrapper">
          <img
            src={blog.thumbnail}
            alt={blog.title}
            className="editorial-thumbnail"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
            }}
          />
        </div>
      )}
    </article>
  );
};
