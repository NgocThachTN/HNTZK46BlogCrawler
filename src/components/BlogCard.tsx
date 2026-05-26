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
  // Add staggering delay animation based on card grid index
  const cardDelayStyle = {
    animationDelay: `${index * 0.05}s`,
  };

  return (
    <article
      className="blog-card animate-slide-up"
      style={cardDelayStyle}
      onClick={onClick}
    >
      <div className="blog-card-image-wrapper">
        <img
          src={blog.thumbnail || 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg'}
          alt={blog.title}
          className="blog-card-image"
          loading="lazy"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
          }}
        />
        <div className="blog-card-image-overlay" />
      </div>

      <div className="blog-card-body">
        <div className="blog-card-header">
          {member && (
            <>
              <img
                src={member.avatar}
                alt={member.name}
                className="blog-card-author-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.hinatazaka46.com/files/14/hinata/img/logo_side.svg';
                }}
              />
              <span className="blog-card-author-name">{member.name}</span>
            </>
          )}
          <time className="blog-card-date">{blog.date}</time>
        </div>

        <h3 className="blog-card-title">{blog.title}</h3>
        <p className="blog-card-snippet">{blog.summary}</p>

        <div className="blog-card-footer">
          Read more
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </article>
  );
};
