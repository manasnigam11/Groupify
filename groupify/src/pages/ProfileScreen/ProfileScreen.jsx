import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './ProfileScreen.css';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [profileUser, setProfileUser] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [myProject, setMyProject] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteStatus, setInviteStatus] = useState(''); // '', 'loading', 'success', 'error'

  const isMyProfile = !userId || (user && userId === user.id);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        if (isMyProfile) {
          setProfileUser(user);
        } else {
          const publicProf = await api.getPublicProfile(userId);
          // Backend structure can be nested under .user or direct, resolving both safely
          const resolvedUser = publicProf.user ? publicProf.user : publicProf;
          setProfileUser(resolvedUser);
          
          const compData = await api.getCompatibility(userId).catch(() => null);
          setCompatibility(compData);
          
          const proj = await api.getMyProject().catch(() => null);
          setMyProject(proj);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, userId, isMyProfile]);

  if (!user) return null;
  if (loading) return <div className="page-container" style={{padding: '2rem'}}>Loading profile...</div>;
  if (error) return <div className="page-container" style={{padding: '2rem', color: '#ef4444'}}>{error}</div>;
  if (!profileUser) return null;

  // Safeguarding structure to prevent any undefined splits
  const profile = profileUser.profile || {};
  const skills = profileUser.skills?.technical || profileUser.skills || [];
  const prefs = profileUser.preferences || {};

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleEditProfile() {
    navigate('/edit-profile');
  }
  
  function handleStartChat() {
    navigate(`/chats?userId=${userId}`);
  }
  
  async function handleSendInvite() {
    const projectId = myProject?.id || myProject?._id;
    if (!projectId) {
      setInviteStatus('error');
      return;
    }
    setInviteStatus('loading');
    try {
      await api.sendInvite(userId, projectId, inviteMessage);
      setInviteStatus('success');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus('');
        setInviteMessage('');
      }, 2000);
    } catch (err) {
      setInviteStatus('error');
      console.error(err);
    }
  }

  return (
    <div className="page-container profile-page" id="profile-screen">
      <div className="profile-header animate-fade-in-up">
        <div className="profile-avatar-large">
          <img
            src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}
            alt={profile.name || 'User'}
          />
        </div>
        <h1 className="profile-name">{profile.name || 'User'}</h1>
        <p className="profile-role-badge">{prefs.role_preference || 'Participant'}</p>
        {profile.university && (
          <p className="profile-university">{profile.university}{profile.year ? ` · ${profile.year}` : ''}</p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="profile-section animate-fade-in-up stagger-1">
          <h2 className="section-title">About</h2>
          <p className="profile-bio">{profile.bio}</p>
        </div>
      )}

      {/* Why We Matched */}
      {!isMyProfile && compatibility && (
        <div className="profile-section animate-fade-in-up stagger-2" style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            Why We Matched (Score: {compatibility.compatibility_score || compatibility.score || 0}%)
          </h2>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, marginTop: '1rem' }}>
            {compatibility.skill_overlap?.length > 0 && (
              <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Shared Skills:</strong> {compatibility.skill_overlap.join(', ')}
              </li>
            )}
            {compatibility.skill_complement?.length > 0 && (
              <li style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Complementary Roles:</strong> {compatibility.skill_complement.join(', ')}
              </li>
            )}
            {compatibility.reasoning && (
              <li style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Reasoning:</strong> {compatibility.reasoning}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="profile-section animate-fade-in-up stagger-3">
          <h2 className="section-title">Skills</h2>
          <div className="dash-chips">
            {skills.map((s) => (
              <span key={s} className="dash-chip">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {prefs.hackathon_interests?.length > 0 && (
        <div className="profile-section animate-fade-in-up stagger-4">
          <h2 className="section-title">Interests</h2>
          <div className="dash-chips">
            {prefs.hackathon_interests.map((i) => (
              <span key={i} className="dash-chip dash-chip-accent">{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Project Idea */}
      {prefs.project_idea && (
        <div className="profile-section animate-fade-in-up stagger-5">
          <h2 className="section-title">Project Idea</h2>
          <div className="dash-idea-card">
            <p>{prefs.project_idea}</p>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="profile-section animate-fade-in-up stagger-6">
        <h2 className="section-title">Links</h2>
        <div className="profile-links">
          {profile.github_url && (
            <a href={profile.github_url} target="_blank" rel="noreferrer" className="profile-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="profile-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
          )}
          {!profile.github_url && !profile.linkedin_url && (
            <p className="profile-no-links">No links added yet</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions animate-fade-in-up stagger-7" style={{ display: 'flex', gap: '1rem' }}>
        {isMyProfile ? (
          <>
            <button className="btn-secondary profile-action-btn" onClick={handleEditProfile} id="edit-profile-btn" style={{ flex: 1 }}>
              Edit Profile
            </button>
            <button className="profile-logout-btn" onClick={handleLogout} id="logout-btn" style={{ flex: 1 }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <button className="btn-secondary profile-action-btn" onClick={handleStartChat} style={{ flex: 1 }}>
              Start Chat
            </button>
            <button className="btn-primary profile-action-btn" onClick={() => setShowInviteModal(true)} style={{ flex: 1 }}>
              Invite To Team
            </button>
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface-light)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Invite to Team</h3>
            
            {!myProject ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You need to create a project before inviting teammates.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button className="btn-primary" onClick={() => navigate('/team')}>Create Project</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border-default)' }}>
                  <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>{myProject.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{myProject.description}</p>
                  
                  {myProject.required_roles?.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>We're looking for:</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {myProject.required_roles.map(r => (
                          <span key={r.role} style={{ background: 'var(--bg-surface-dark)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid var(--border-default)' }}>
                            {r.role} <span style={{ color: 'var(--text-tertiary)' }}>(x{r.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Add a message:</label>
                <textarea 
                  style={{ width: '100%', height: '100px', background: 'var(--bg-surface-dark)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}
                  placeholder={`Hi ${profile.name ? profile.name.split(' ')[0] : 'there'}, I'd love for you to join our team...`}
                  value={inviteMessage}
                  onChange={e => setInviteMessage(e.target.value)}
                />
                
                {inviteStatus === 'error' && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Failed to send invite. They may already be in your team or have a pending invite.</p>}
                {inviteStatus === 'success' && <p style={{ color: '#10b981', marginBottom: '1rem' }}>Invitation sent successfully!</p>}
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowInviteModal(false)} disabled={inviteStatus === 'loading'}>Cancel</button>
                  <button className="btn-primary" onClick={handleSendInvite} disabled={inviteStatus === 'loading' || inviteStatus === 'success'}>
                    {inviteStatus === 'loading' ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}