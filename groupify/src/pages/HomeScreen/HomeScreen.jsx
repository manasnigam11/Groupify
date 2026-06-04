import { useNavigate } from 'react-router-dom';
import CommunityCard from '../../components/CommunityCard/CommunityCard';
import MeetupCard from '../../components/MeetupCard/MeetupCard';
import { communities, meetups, currentUser } from '../../data/mockData';
import './HomeScreen.css';

export default function HomeScreen() {
  const navigate = useNavigate();

  const recommended = communities.filter((c) => !c.isJoined).slice(0, 5);
  const nearby = [...communities].sort(() => 0.5 - Math.random()).slice(0, 5);
  const trending = communities.filter((c) => c.isTrending);
  const upcomingMeetups = meetups.slice(0, 4).map((m) => ({
    ...m,
    communityName: communities.find((c) => c.id === m.communityId)?.name,
  }));

  const handleCommunityClick = (id) => {
    navigate(`/community/${id}`);
  };

  return (
    <div className="home-screen" id="home-screen">
      {/* Header */}
      <div className="home-header animate-fade-in-up">
        <div className="home-greeting">
          <div>
            <p className="greeting-label">Good evening 👋</p>
            <h1 className="greeting-name">{currentUser.name.split(' ')[0]}</h1>
          </div>
          <button className="avatar-btn" onClick={() => navigate('/profile')}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="header-avatar"
            />
            <span className="avatar-online" />
          </button>
        </div>

        {/* Search bar */}
        <div className="home-search" onClick={() => navigate('/discover')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <span>Search communities...</span>
        </div>
      </div>

      {/* Recommended */}
      <section className="home-section animate-fade-in-up stagger-2">
        <div className="section-header">
          <h2 className="section-title">Recommended for You</h2>
          <button className="see-all" onClick={() => navigate('/discover')}>See all</button>
        </div>
        <div className="horizontal-scroll">
          {recommended.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              variant="featured"
              onClick={handleCommunityClick}
            />
          ))}
        </div>
      </section>

      {/* Nearby */}
      <section className="home-section animate-fade-in-up stagger-3">
        <div className="section-header">
          <h2 className="section-title">Nearby Communities</h2>
          <button className="see-all" onClick={() => navigate('/discover')}>See all</button>
        </div>
        <div className="horizontal-scroll">
          {nearby.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              variant="compact"
              onClick={handleCommunityClick}
            />
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="home-section animate-fade-in-up stagger-4">
        <div className="section-header">
          <h2 className="section-title">🔥 Trending Now</h2>
          <button className="see-all" onClick={() => navigate('/discover')}>See all</button>
        </div>
        <div className="horizontal-scroll">
          {trending.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              variant="featured"
              onClick={handleCommunityClick}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Meetups */}
      <section className="home-section animate-fade-in-up stagger-5">
        <div className="section-header">
          <h2 className="section-title">Upcoming Meetups</h2>
        </div>
        <div className="meetup-list">
          {upcomingMeetups.map((meetup) => (
            <MeetupCard
              key={meetup.id}
              meetup={meetup}
              communityName={meetup.communityName}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
