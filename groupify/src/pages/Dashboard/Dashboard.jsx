import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import TeamHealthCard from '../../components/TeamHealthCard/TeamHealthCard';
import './Dashboard.css';

export default function Dashboard() {
  const { user, notifications } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Recommendations aur Naya Invitation Status
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);
  const [invitingId, setInvitingId] = useState(null);

// Asli Invitation Bhejne Wala Function (Real API)
  const handleRecruit = async (matchId) => {
    setInvitingId(matchId); 
    try {
      await api.sendTeamInvitation(project.id || project._id, matchId);
      setInvitedIds(prev => [...prev, matchId]);
    } catch (error) {
      console.error("Failed to send invite:", error);
    } finally {
      setInvitingId(null); 
    }
  };

  // Asli Backend se Smart Recommendations fetch karne wala function
  // Asli Backend se Smart Recommendations fetch + Shuffle karne wala function
  const generateSmartAiRecs = useCallback(async (projectData) => {
    if (!projectData) return;
    try {
      const realRecommendations = await api.getAiRecommendations(projectData.id || projectData._id);
      
      // Agar backend se array aayi hai, toh usko randomly shuffle karo
      if (realRecommendations && realRecommendations.length > 0) {
        const shuffled = [...realRecommendations].sort(() => 0.5 - Math.random());
        
        // Shuffle hone ke baad sirf starting ke 3 logo ko UI par dikhao
        setAiRecommendations(shuffled.slice(0, 3));
      } else {
        setAiRecommendations([]);
      }
      
    } catch (error) {
      console.error("Failed to fetch genuine AI recommendations:", error);
    }
  }, []);

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
        
        if (projData) {
          generateSmartAiRecs(projData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user, generateSmartAiRecs]);

  const handleProjectHealthUpdate = (newHealth) => {
    const updatedProject = { ...project, team_health: newHealth };
    setProject(updatedProject);
    generateSmartAiRecs(updatedProject); 
  };

  if (!user) return null;
  if (loading) return <div className="page-container" style={{padding: '2rem'}}>Loading Command Center...</div>;

  const profile = user.profile || {};
  const firstName = profile.name?.split(' ')[0] || 'User';
  
  const teamSize = project?.team_size || 4;
  const currentMembersList = project?.members || [];
  const currentMembersCount = currentMembersList.length || 1;
  const completionPercent = Math.round((currentMembersCount / teamSize) * 100);

  const currentTeamRoles = currentMembersList.map(m => m.role?.toLowerCase().trim() || '');
  const trulyMissingRoles = project?.required_roles?.filter(r => {
    const peopleWithRole = currentTeamRoles.filter(role => role === r.role?.toLowerCase().trim()).length;
    return peopleWithRole < (r.count || 1);
  }) || [];

  const mockActivityFeed = [
    { id: 1, type: 'match', text: 'AI analyzed your team requirements', time: 'Just now' },
    { id: 2, type: 'invite', text: 'You sent an invitation to Rahul', time: '5 hours ago' },
    { id: 3, type: 'project', text: 'Updated project description', time: '1 day ago' }
  ];

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
            <h3>{project ? aiRecommendations.length : 0}</h3>
            <p>AI Deficit Matches</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: HEALTH & OVERVIEW */}
      <section className="cmd-split-section animate-fade-in-up stagger-2">
        <TeamHealthCard project={project} onUpdate={handleProjectHealthUpdate} />

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

      {/* SECTION 4: SMART AI DRIVEN RECOMMENDED TEAMMATES */}
      <section className="cmd-section animate-fade-in-up stagger-3">
        <div className="section-header">
          <h2>AI Team-Deficit Recommendations (Based on Skill Gaps)</h2>
          {project && aiRecommendations.length > 0 && (
            <button className="btn-text" onClick={() => generateSmartAiRecs(project)}>
              ✨ Shuffle Recommendations
            </button>
          )}
        </div>
        
        {project ? (
          aiRecommendations.length > 0 ? (
            <div className="recommendations-grid">
              {aiRecommendations.map(match => (
                <div key={match.id} className="match-mini-card">
                  <div className="match-mini-header">
                    <div className="match-avatar"><img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${match.name}`} alt={match.name} /></div>
                    <div>
                      <h4>{match.name}</h4>
                      <p style={{ color: 'var(--primary-light)', fontWeight: '600', fontSize: '0.85rem' }}>{match.role}</p>
                    </div>
                  </div>
                  <div className="match-mini-score">
                    <span className="score-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      {match.score}% Gap Resolver
                    </span>
                  </div>
                  <div className="match-mini-actions">
                    <button className="btn-secondary btn-small" onClick={() => navigate('/find', { state: { filterRole: match.role } })}>
                      View Matches
                    </button>
                    
                    {/* DYNAMIC RECRUIT BUTTON LOGIC YAHAN LAGA HAI */}
                    {invitedIds.includes(match.id) ? (
                      <button className="btn-primary btn-small" disabled style={{ background: '#10b981', borderColor: '#10b981', color: 'white' }}>
                        Invited ✅
                      </button>
                    ) : invitingId === match.id ? (
                      <button className="btn-primary btn-small" disabled style={{ opacity: 0.7 }}>
                        Sending...
                      </button>
                    ) : (
                      <button className="btn-primary btn-small" onClick={() => handleRecruit(match.id)}>
                        Recruit
                      </button>
                    )}
                    
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cmd-card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Run AI Health analysis first to discover hidden talent requirements.</p>
            </div>
          )
        ) : (
          <div className="cmd-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Create a project first to activate AI Predictive matchmaking.</p>
          </div>
        )}
      </section>

      {/* SECTION 5 & 6: ACTIVITY & COMMUNICATIONS */}
      <section className="cmd-split-section animate-fade-in-up stagger-4">
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

      {/* SECTION 8: QUICK ACTIONS */}
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