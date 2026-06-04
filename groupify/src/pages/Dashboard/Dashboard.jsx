import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const profile = user.profile || {};
  const skills = user.skills?.technical || [];
  const prefs = user.preferences || {};
  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="page-container dashboard-page" id="dashboard-screen">
      {/* Header */}
      <div className="dash-header animate-fade-in-up">
        <div className="dash-greeting">
          <h1 className="dash-hello">{greeting}, {profile.name?.split(' ')[0] || 'there'}</h1>
          <p className="dash-role">{prefs.role_preference || 'Hackathon Participant'}</p>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        className="dash-cta animate-fade-in-up stagger-1"
        onClick={() => navigate('/find')}
        id="find-teammates-cta"
      >
        <div className="dash-cta-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="dash-cta-text">
          <span className="dash-cta-title">Find Teammates</span>
          <span className="dash-cta-desc">Let AI analyze your profile and find compatible hackathon teammates</span>
        </div>
        <svg className="dash-cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Two-Column Grid */}
      <div className="dash-grid">
        <div>
          {/* Your Skills */}
          {skills.length > 0 && (
            <div className="dash-section animate-fade-in-up stagger-2">
              <h2 className="section-title">Your Skills</h2>
              <div className="dash-chips">
                {skills.map((skill) => (
                  <span key={skill} className="dash-chip">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {prefs.hackathon_interests?.length > 0 && (
            <div className="dash-section animate-fade-in-up stagger-3">
              <h2 className="section-title">Interests</h2>
              <div className="dash-chips">
                {prefs.hackathon_interests.map((interest) => (
                  <span key={interest} className="dash-chip dash-chip-accent">{interest}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Project Idea */}
          {prefs.project_idea && (
            <div className="dash-section animate-fade-in-up stagger-4">
              <h2 className="section-title">Your Project Idea</h2>
              <div className="dash-idea-card">
                <p>{prefs.project_idea}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="dash-stats animate-fade-in-up stagger-5">
            <div className="dash-stat">
              <span className="dash-stat-value">{skills.length}</span>
              <span className="dash-stat-label">Skills</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat-value">{prefs.hackathon_interests?.length || 0}</span>
              <span className="dash-stat-label">Interests</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat-value">{user.is_looking ? 'Yes' : 'No'}</span>
              <span className="dash-stat-label">Looking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
