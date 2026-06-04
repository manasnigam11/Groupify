import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeetupCard from '../../components/MeetupCard/MeetupCard';
import { communities, meetups, users } from '../../data/mockData';
import './CommunityDetailScreen.css';

export default function CommunityDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const community = communities.find((c) => c.id === id);
  const [joined, setJoined] = useState(community?.isJoined || false);
  const [joining, setJoining] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!community) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '40%' }}>
        <p>Community not found</p>
        <button className="primary-btn" onClick={() => navigate('/discover')} style={{ marginTop: 16 }}>
          Go Back
        </button>
      </div>
    );
  }

  const communityMeetups = meetups.filter((m) => m.communityId === community.id);
  const memberUsers = users.filter((u) => community.members.includes(u.id));

  const handleJoin = () => {
    if (joined) return;
    setJoining(true);
    setTimeout(() => {
      setJoining(false);
      setJoined(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }, 800);
  };

  return (
    <div className="community-detail" id="community-detail-screen">
      {/* Banner */}
      <div className="detail-banner">
        <img src={community.banner} alt={community.name} loading="lazy" />
        <div className="banner-gradient" />
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        {community.isTrending && (
          <div className="detail-trending-badge">🔥 Trending</div>
        )}
      </div>

      {/* Content */}
      <div className="detail-content">
        <div className="detail-header animate-fade-in-up">
          <h1 className="detail-name">{community.name}</h1>
          <div className="detail-stats">
            <div className="detail-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>{community.memberCount} members</span>
            </div>
            <div className="detail-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{community.distance} away</span>
            </div>
          </div>
        </div>

        <div className="detail-description animate-fade-in-up stagger-1">
          <h3 className="detail-section-title">About</h3>
          <p className="detail-about">{community.description}</p>
        </div>

        {/* Tags */}
        <div className="detail-tags animate-fade-in-up stagger-2">
          <h3 className="detail-section-title">Interests</h3>
          <div className="tag-list">
            {community.tags.map((tag) => (
              <span key={tag} className="detail-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="detail-members animate-fade-in-up stagger-3">
          <h3 className="detail-section-title">Members</h3>
          <div className="member-row">
            <div className="member-avatars">
              {memberUsers.slice(0, 4).map((user, i) => (
                <img
                  key={user.id}
                  src={user.avatar}
                  alt={user.name}
                  className="member-avatar"
                  style={{ zIndex: 4 - i, marginLeft: i > 0 ? '-10px' : 0 }}
                />
              ))}
              {community.memberCount > 4 && (
                <div className="member-more" style={{ marginLeft: '-10px' }}>
                  +{community.memberCount - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meetups */}
        {communityMeetups.length > 0 && (
          <div className="detail-meetups animate-fade-in-up stagger-4">
            <h3 className="detail-section-title">Upcoming Meetups</h3>
            <div className="meetup-list">
              {communityMeetups.map((meetup) => (
                <MeetupCard key={meetup.id} meetup={meetup} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Join Bar */}
      <div className="detail-join-bar animate-fade-in-up">
        <div className="join-bar-info">
          <p className="join-bar-name">{community.name}</p>
          <p className="join-bar-count">{community.memberCount} members</p>
        </div>
        <button
          className={`join-bar-btn ${joined ? 'joined' : ''} ${joining ? 'joining' : ''}`}
          onClick={handleJoin}
          disabled={joining}
          id="join-community-btn"
        >
          {joined ? '✓ Joined' : joining ? 'Requesting...' : 'Join Community'}
        </button>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="join-toast animate-scale-in">
          <span className="toast-icon">🎉</span>
          <span>Welcome to {community.name}!</span>
        </div>
      )}
    </div>
  );
}
