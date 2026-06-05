import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './MyTeamScreen.css';

export default function MyTeamScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [invites, setInvites] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const proj = await api.getMyProject();
      setProject(proj);
      const invs = await api.getInvites();
      setInvites(invs);
    } catch (err) {
      console.error(err);
      setError('Failed to load team data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function handleRespondInvite(inviteId, action) {
    try {
      await api.respondInvite(inviteId, action);
      loadData(); // refresh to show updated team/invites
    } catch (err) {
      alert(err.message || 'Failed to respond to invite');
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.removeTeamMember(project.id, userId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  }

  async function handleLeaveTeam() {
    if (!window.confirm("Are you sure you want to leave this team? If you are the only member, the project will be deleted.")) return;
    try {
      await api.leaveTeam(project.id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to leave team');
    }
  }

  if (loading && !project) {
    return <div className="page-container" style={{padding: '2rem'}}>Loading...</div>;
  }

  // EMPTY STATE
  if (!project) {
    return (
      <div className="page-container my-team-page empty-state animate-fade-in">
        <div className="empty-state-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h1>You don't have a project yet.</h1>
          <p>Create a project to start building your team and sending invitations.</p>
          
          <button className="btn-primary" onClick={() => navigate('/projects/create')} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>
            Create Project
          </button>
          
          {invites.received.length > 0 && (
            <div className="pending-invites-section" style={{ marginTop: '3rem', width: '100%', textAlign: 'left' }}>
              <h3>Pending Invitations</h3>
              {invites.received.map(inv => (
                <div key={inv.id} className="invite-card">
                  <div className="invite-card-header">
                    <h4>{inv.project_name}</h4>
                    <span className="badge">From: {inv.sender_name}</span>
                  </div>
                  <p className="invite-desc">{inv.project_description}</p>
                  {inv.invitation_message && (
                    <div className="invite-msg">"{inv.invitation_message}"</div>
                  )}
                  <div className="invite-actions">
                    <button className="btn-primary" onClick={() => handleRespondInvite(inv.id, 'accept')}>Accept</button>
                    <button className="btn-secondary" onClick={() => handleRespondInvite(inv.id, 'decline')}>Decline</button>
                    {/* Chat button for empty state received invites */}
                    {inv.sender_id && (
                      <button className="btn-secondary" onClick={() => navigate(`/chats?userId=${inv.sender_id}`)}>Chat</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // TEAM DASHBOARD
  const isOwner = project.owner_id === user.id;

  return (
    <div className="page-container my-team-page" id="my-team-screen">
      
      <div className="team-header animate-fade-in-up">
        <h1>{project.title}</h1>
        <div className="team-meta">
          <span className="badge">Team Size: {project.members.length} / {project.team_size}</span>
          <span className="badge highlight">{isOwner ? 'You are the Owner' : 'Member'}</span>
        </div>
      </div>

      <div className="team-grid">
        
        {/* Left Column */}
        <div className="team-col-main">
          
          <section className="dashboard-section animate-fade-in-up stagger-1">
            <h2 className="section-title">Current Team</h2>
            <div className="members-list">
              {project.members.map((m, index) => (
                <div key={m.user_id || `unregistered-${index}`} className="member-card">
                  <div className="member-info">
                    <h3>
                      {m.name} 
                      {m.user_id === user.id && ' (You)'}
                      {!m.user_id && ' (Pending Invite)'}
                    </h3>
                    <p>{m.role}</p>
                  </div>
                  <div className="member-actions">
                    {/* Sirf tabhi chat button dikhao jab user_id available ho (Registered member) */}
                    {m.user_id && m.user_id !== user.id && (
                      <button className="btn-secondary btn-small" onClick={() => navigate(`/chats?userId=${m.user_id}`)}>Chat</button>
                    )}
                    {isOwner && m.user_id !== user.id && (
                      <button className="btn-secondary text-danger btn-small" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="team-actions-bar">
              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button className="btn-secondary text-danger" onClick={handleLeaveTeam}>
                  Leave Team
                </button>
                {isOwner && (
                  <button className="btn-secondary" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                    Edit Project
                  </button>
                )}
              </div>
              {project.members.length < project.team_size && (
                <button className="btn-primary" onClick={() => navigate('/find')}>
                  Find Teammates
                </button>
              )}
            </div>
          </section>

          <section className="dashboard-section animate-fade-in-up stagger-2">
            <h2 className="section-title">Project Details</h2>
            <div className="project-details-card">
              <p>{project.description}</p>
              
              {project.hackathon_name && (
                <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>
                  <strong style={{color: 'var(--text-primary)'}}>Hackathon:</strong> {project.hackathon_name} {project.hackathon_category ? `(${project.hackathon_category})` : ''}
                </p>
              )}
              
              {project.problem_statement && (
                <>
                  <h4 style={{marginTop: '1rem', color: 'var(--text-primary)'}}>Problem Statement</h4>
                  <p>{project.problem_statement}</p>
                </>
              )}

              {project.required_roles?.length > 0 && (
                <>
                  <h4 style={{marginTop: '1rem', color: 'var(--text-primary)'}}>Open Roles ({project.team_size - project.members.length} spots left)</h4>
                  <div className="dash-chips" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                    {project.required_roles.map(r => (
                      <span key={r.role} className="dash-chip" style={{display: 'inline-flex', gap: '8px', padding: '6px 12px'}}>
                        <strong>{r.role}</strong>
                        <span style={{background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem'}}>x{r.count}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}

              {project.required_skills?.length > 0 && (
                <>
                  <h4 style={{marginTop: '1rem', color: 'var(--text-primary)'}}>Required Skills</h4>
                  <div className="dash-chips">
                    {project.required_skills.map(s => <span key={s} className="dash-chip">{s}</span>)}
                  </div>
                </>
              )}

              {(project.github_url || project.communication_link) && (
                <>
                  <h4 style={{marginTop: '1rem', color: 'var(--text-primary)'}}>Links</h4>
                  <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                    {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" style={{color: 'var(--primary-light)'}}>GitHub Repository</a>}
                    {project.communication_link && <a href={project.communication_link} target="_blank" rel="noreferrer" style={{color: 'var(--primary-light)'}}>Communication Chat</a>}
                  </div>
                </>
              )}
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="team-col-side">
          
          <section className="dashboard-section animate-fade-in-up stagger-3">
            <h2 className="section-title">Received Invitations</h2>
            {invites.received.length === 0 ? (
              <p className="empty-text">No pending invites.</p>
            ) : (
              <div className="invites-list">
                {invites.received.map(inv => (
                  <div key={inv.id} className="invite-card small">
                    <p className="invite-title">From <strong>{inv.sender_name}</strong> for <strong>{inv.project_name}</strong></p>
                    <div className="invite-actions" style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn-primary btn-small" onClick={() => handleRespondInvite(inv.id, 'accept')}>Accept</button>
                      <button className="btn-secondary btn-small" onClick={() => handleRespondInvite(inv.id, 'decline')}>Decline</button>
                      
                      {/* NEW: Chat button with sender */}
                      {inv.sender_id && (
                        <button className="btn-secondary btn-small" onClick={() => navigate(`/chats?userId=${inv.sender_id}`)}>Chat</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section animate-fade-in-up stagger-4">
            <h2 className="section-title">Sent Invitations</h2>
            {invites.sent.length === 0 ? (
              <p className="empty-text">No sent invites.</p>
            ) : (
              <div className="invites-list">
                {invites.sent.map(inv => (
                  <div key={inv.id} className="invite-card small">
                    <p className="invite-title">To user ID <strong>{inv.receiver_id.slice(-4)}</strong></p>
                    <p className="invite-status">Status: {inv.status}</p>
                    
                    {/* NEW: Chat button with invited person */}
                    <div className="invite-actions" style={{ marginTop: '0.8rem' }}>
                      <button className="btn-secondary btn-small" onClick={() => navigate(`/chats?userId=${inv.receiver_id}`)}>
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
      
    </div>
  );
}