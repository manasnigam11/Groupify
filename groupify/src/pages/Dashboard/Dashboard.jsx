import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user, notifications } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock Data for showcase (Replace with API calls when backend is ready)
  const mockAiMatches = [
    { id: '1', name: 'Aarav', role: 'UI/UX Designer', score: 92 },
    { id: '2', name: 'Priya', role: 'Frontend Developer', score: 88 },
    { id: '3', name: 'Rohan', role: 'AI Engineer', score: 85 }
  ];

  const mockActivityFeed = [
    { id: 1, type: 'match', text: 'AI found 3 new highly compatible teammates', time: '2 hours ago' },
    { id: 2, type: 'invite', text: 'You sent an invitation to Rahul', time: '5 hours ago' },
    { id: 3, type: 'project', text: 'Updated project description for Smart India Hackathon', time: '1 day ago' }
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const [projData, invitesData] = await Promise.all([
          api.getMyProject().catch(() => null),
          api.getInvites().catch(() => ({ received: [], sent: [] }))
        ]);
        setProject(projData);
        setInvites(invitesData.received || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  if (!user) return null;
  if (loading) return <div className="page-container" style={{padding: '2rem'}}>Loading Command Center...</div>;

  const profile = user.profile || {};
  const firstName = profile.name?.split(' ')[0] || 'User';
  
  // === SMART LOGIC FOR TEAM HEALTH ===
  const teamSize = project?.team_size || 4;
  const currentMembersList = project?.members || [];
  const currentMembersCount = currentMembersList.length || 1;
  const completionPercent = Math.round((currentMembersCount / teamSize) * 100);

  // 1. Current team ke roles nikaalo
  const currentTeamRoles = currentMembersList.map(m => m.role?.toLowerCase().trim() || '');

  // 2. Pata lagao actually missing roles kaunse hain
  const trulyMissingRoles = project?.required_roles?.filter(r => {
    const peopleWithRole = currentTeamRoles.filter(role => role === r.role?.toLowerCase().trim()).length;
    return peopleWithRole < (r.count || 1);
  }) || [];

  // 3. Dynamic Health Score (Formula: 40 + completion + bonus if roles filled)
  const healthScore = completionPercent === 100 ? 100 : Math.min(95, 40 + completionPercent + (trulyMissingRoles.length === 0 ? 15 : 0));

  // 4. Smart Recommendation Text
  let recommendationText = "Your team is perfectly balanced and ready for the hackathon!";
  if (completionPercent < 100) {
    if (trulyMissingRoles.length > 0) {
      recommendationText = `"Adding a ${trulyMissingRoles[0].role} would significantly improve project coverage."`;
    } else {
      recommendationText = `"Roles are filled! You just need ${teamSize - currentMembersCount} more member(s) for a full squad."`;
    }
  }

  return (
    <div className="page-container dashboard-cmd" id="dashboard-screen">
      
      {/* SECTION 1: HERO AREA */}
      <section className="cmd-hero animate-fade-in-up">
        {project ? (
          <div className="cmd-hero-content">
            <div className="cmd-hero-text">
              <span className="hackathon-badge">{project.hackathon_name || 'Hackathon Project'}</span>
              <h1>{project.title}</h1>
              <p className="hero-subtext">
                Team Size: {currentMembersCount} / {teamSize} 
                <span className="separator">•</span> 
                Open Roles: {trulyMissingRoles.map(r => r.role).join(', ') || 'None'}
              </p>
            </div>
            <div className="cmd-hero-actions">
              <button className="btn-primary" onClick={() => navigate('/find')}>Find Teammates</button>
              <button className="btn-secondary" onClick={() => navigate(`/projects/${project.id || project._id}/edit`)}>Edit Project</button>
            </div>
          </div>
        ) : (
          <div className="cmd-hero-content empty-hero">
            <div className="cmd-hero-text">
              <h1>Welcome to Groupify, {firstName}</h1>
              <p className="hero-subtext">You are not part of any project yet. Start by creating one or finding a team.</p>
            </div>
            <div className="cmd-hero-actions">
              <button className="btn-primary" onClick={() => navigate('/projects/create')}>Create Project</button>
              <button className="btn-secondary" onClick={() => navigate('/find')}>Find Teams</button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: STATS CARDS */}
      <section className="cmd-stats-grid animate-fade-in-up stagger-1">
        <div className="cmd-stat-card">
          <div className="stat-icon team-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div className="stat-data">
            <h3>{currentMembersCount}/{teamSize}</h3>
            <p>Team Members</p>
          </div>
        </div>
        <div className="cmd-stat-card">
          <div className="stat-icon invite-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div className="stat-data">
            <h3>{invites.length}</h3>
            <p>Pending Invites</p>
          </div>
        </div>
        <div className="cmd-stat-card">
          <div className="stat-icon chat-icon">
            {notifications?.unreadChats && <span className="stat-dot"></span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div className="stat-data">
            <h3>{notifications?.unreadChats ? 'New' : '0'}</h3>
            <p>Unread Messages</p>
          </div>
        </div>
        <div className="cmd-stat-card">
          <div className="stat-icon ai-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
          <div className="stat-data">
            <h3>{mockAiMatches.length}</h3>
            <p>AI Matches Found</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: HEALTH & OVERVIEW */}
      <section className="cmd-split-section animate-fade-in-up stagger-2">
        {/* AI Team Health */}
        <div className="cmd-card ai-health-card">
          <h2>AI Team Health</h2>
          <div className="health-display">
            <div className="health-circle">
              <svg viewBox="0 0 36 36" className={`circular-chart ${healthScore >= 80 ? 'green' : 'orange'}`}>
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle" strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="health-score">{healthScore}%</div>
            </div>
            <div className="health-details">
              {completionPercent < 100 && trulyMissingRoles.length > 0 ? (
                <>
                  <p className="missing-title">Missing Core Roles:</p>
                  <div className="missing-skills">
                    {trulyMissingRoles.slice(0, 2).map(r => <span key={r.role} className="skill-chip-danger">{r.role}</span>)}
                  </div>
                  <p className="health-recommendation">{recommendationText}</p>
                </>
              ) : (
                <p className="health-recommendation success">{recommendationText}</p>
              )}
            </div>
          </div>
        </div>

        {/* Project Overview */}
        <div className="cmd-card project-overview-card">
          <h2>Project Readiness</h2>
          {project ? (
            <div className="overview-content">
              <div className="overview-row">
                <span className="overview-label">Category</span>
                <span className="overview-value badge-primary">{project.hackathon_category || 'General'}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">Team Completion</span>
                <div className="progress-container">
                  <div className="progress-bar" style={{ width: `${completionPercent}%`, background: completionPercent === 100 ? '#10b981' : '' }}></div>
                  <span className="progress-text">{completionPercent}%</span>
                </div>
              </div>
              <div className="overview-row">
                <span className="overview-label">Required Roles</span>
                <span className="overview-value">{trulyMissingRoles.map(r => r.role).join(', ') || 'All roles filled!'}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">Required Skills</span>
                <div className="dash-chips small-chips">
                  {project.required_skills?.map(s => <span key={s} className="dash-chip">{s}</span>) || 'None'}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-placeholder">No active project to analyze.</div>
          )}
        </div>
      </section>

      {/* SECTION 4: AI RECOMMENDED TEAMMATES */}
      <section className="cmd-section animate-fade-in-up stagger-3">
        <div className="section-header">
          <h2>AI Recommended Teammates</h2>
          <button className="btn-text" onClick={() => navigate('/find')}>View All Matches →</button>
        </div>
        <div className="recommendations-grid">
          {mockAiMatches.map(match => (
            <div key={match.id} className="match-mini-card">
              <div className="match-mini-header">
                <div className="match-avatar"><img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${match.name}`} alt={match.name} /></div>
                <div>
                  <h4>{match.name}</h4>
                  <p>{match.role}</p>
                </div>
              </div>
              <div className="match-mini-score">
                <span className="score-badge">{match.score}% Match</span>
              </div>
              <div className="match-mini-actions">
                <button className="btn-secondary btn-small" onClick={() => navigate(`/profile/${match.id}`)}>View Profile</button>
                <button className="btn-primary btn-small" onClick={() => navigate(`/chats?userId=${match.id}`)}>Chat</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 & 6: ACTIVITY & COMMUNICATIONS */}
      <section className="cmd-split-section animate-fade-in-up stagger-4">
        
        {/* Activity Feed */}
        <div className="cmd-card activity-card">
          <h2>Recent Activity</h2>
          <div className="timeline">
            {mockActivityFeed.map(item => (
              <div key={item.id} className="timeline-item">
                <div className={`timeline-dot ${item.type}`}></div>
                <div className="timeline-content">
                  <p>{item.text}</p>
                  <span className="timeline-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invitations & Messages */}
        <div className="cmd-card comms-card">
          <h2>Invitations & Messages</h2>
          
          <div className="comms-section">
            <h3>Pending Invites ({invites.length})</h3>
            {invites.length > 0 ? (
              <ul className="comms-list">
                {invites.slice(0, 2).map(inv => (
                  <li key={inv.id}>
                    <span className="comms-title">{inv.project_name}</span>
                    <button className="btn-text-small" onClick={() => navigate('/team')}>Review</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-text">No pending invitations.</p>
            )}
          </div>

          <div className="comms-section" style={{marginTop: '1.5rem'}}>
            <h3>Recent Chats</h3>
            <div className="quick-chat-action">
              <button className="btn-secondary w-100" onClick={() => navigate('/chats')}>
                {notifications?.unreadChats ? 'View Unread Messages' : 'Open Messages'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: QUICK ACTIONS (Footer) */}
      <section className="cmd-quick-actions animate-fade-in-up stagger-5">
        <button onClick={() => navigate('/profile')} className="quick-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Edit Profile
        </button>
        <button onClick={() => navigate('/projects/create')} className="quick-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          New Project
        </button>
        <button onClick={() => navigate('/team')} className="quick-action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Manage Team
        </button>
      </section>

    </div>
  );
}