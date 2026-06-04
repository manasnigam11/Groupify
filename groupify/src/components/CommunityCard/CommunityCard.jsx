import { useState } from 'react';
import './CommunityCard.css';

export default function CommunityCard({ community, onJoin, onClick, variant = 'default' }) {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(community.isJoined);

  const handleJoin = (e) => {
    e.stopPropagation();
    if (joined) return;
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      setJoined(true);
      onJoin?.(community.id);
    }, 600);
  };

  if (variant === 'compact') {
    return (
      <div className="community-card-compact" onClick={() => onClick?.(community.id)}>
        <div className="compact-cover">
          <img src={community.cover} alt={community.name} loading="lazy" />
          <div className="compact-overlay" />
        </div>
        <div className="compact-info">
          <h4 className="compact-name">{community.name}</h4>
          <div className="compact-meta">
            <span className="compact-members">{community.memberCount} members</span>
            <span className="compact-distance">{community.distance}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="community-card-featured" onClick={() => onClick?.(community.id)}>
        <div className="featured-cover">
          <img src={community.cover} alt={community.name} loading="lazy" />
          <div className="featured-gradient" />
          {community.isTrending && (
            <div className="featured-badge">🔥 Trending</div>
          )}
        </div>
        <div className="featured-content">
          <h3 className="featured-name">{community.name}</h3>
          <p className="featured-desc">{community.description}</p>
          <div className="featured-footer">
            <div className="featured-stats">
              <span className="stat-members">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {community.memberCount}
              </span>
              <span className="stat-distance">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {community.distance}
              </span>
            </div>
            <button
              className={`join-btn ${joined ? 'joined' : ''} ${joining ? 'joining' : ''}`}
              onClick={handleJoin}
              disabled={joining}
            >
              {joined ? '✓ Joined' : joining ? '...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-card" onClick={() => onClick?.(community.id)}>
      <div className="card-cover">
        <img src={community.cover} alt={community.name} loading="lazy" />
        <div className="card-cover-gradient" />
        {community.isTrending && (
          <div className="card-badge">🔥 Trending</div>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-name">{community.name}</h3>
        <p className="card-desc">{community.description}</p>
        <div className="card-tags">
          {community.tags.map((tag) => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>
        <div className="card-footer">
          <div className="card-stats">
            <span className="stat-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {community.memberCount}
            </span>
            <span className="stat-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {community.distance}
            </span>
          </div>
          <button
            className={`join-btn ${joined ? 'joined' : ''} ${joining ? 'joining' : ''}`}
            onClick={handleJoin}
            disabled={joining}
          >
            {joined ? '✓ Joined' : joining ? '...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
}
