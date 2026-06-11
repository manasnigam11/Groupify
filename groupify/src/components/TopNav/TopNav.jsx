import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { useState } from 'react';
import './TopNav.css';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, notifications } = useAuth();

  // Modal control systems for Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const hiddenPaths = ['/', '/login', '/signup', '/onboarding'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const profile = user?.profile || {};

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleDeleteAccountSubmit(e) {
    e.preventDefault();
    if (!confirmEmail) return;

    if (window.confirm("⚠️ DANGER ZONE: Are you 100% sure you want to permanently delete your account? This action is irreversible.")) {
      setDeleteLoading(true);
      setDeleteError('');
      try {
        await api.deleteUserAccount(confirmEmail);
        setShowDeleteModal(false);
        logout();
        alert("Your Groupify account has been permanently purged.");
        navigate('/login', { replace: true });
      } catch (err) {
        setDeleteError(err.message || "Failed to delete account. Please verify your email.");
      } finally {
        setDeleteLoading(false);
      }
    }
  }

  return (
    <header className="top-nav" id="top-navigation">
      <div className="top-nav-inner">
        {/* Brand */}
        <NavLink to="/dashboard" className="top-nav-brand" id="nav-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="top-nav-brand-text">Groupify</span>
        </NavLink>

        {/* Nav Links */}
        <nav className="top-nav-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            id="nav-dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Dashboard
          </NavLink>
          <NavLink
            to="/find"
            className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            id="nav-find"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            Find Teammates
          </NavLink>
          
          <NavLink
            to="/chats"
            className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            id="nav-chats"
            style={{ position: 'relative' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Chats
            {notifications.unreadChats && <span className="nav-badge"></span>}
          </NavLink>
          
          <NavLink
            to="/team"
            className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
            id="nav-team"
            style={{ position: 'relative' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            My Team
            {notifications.pendingInvites && <span className="nav-badge"></span>}
          </NavLink>
        </nav>

        {/* User Menu */}
        <div className="top-nav-user dropdown-container">
          <div className="top-nav-avatar">
            <img
              src={profile.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'}
              alt={profile.name || 'User'}
            />
          </div>
          <span className="top-nav-username">{profile.name?.split(' ')[0] || 'User'}</span>
          
          <div className="dropdown-menu">
            <NavLink to="/profile" className="dropdown-item">View Profile</NavLink>
            <button onClick={() => setShowDeleteModal(true)} className="dropdown-item" style={{ color: '#ef4444', textAlign: 'left', width: '100%', border: 'none', background: 'none', fontWeight: '500' }}>Delete Account</button>
            <button onClick={handleLogout} className="dropdown-item text-danger" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>Log Out</button>
          </div>
        </div>
      </div>

      {/* Account Deletion Overlay Modal Layer */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#18181b', border: '1px solid #ef4444', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '450px', color: '#fff' }}>
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Danger Zone: Delete Account
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              This action is permanent. All your skill graphs, active projects, tracking metrics, and invitations will be erased completely.
            </p>
            
            <form onSubmit={handleDeleteAccountSubmit}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#e4e4e7' }}>
                Type your registered Gmail address to confirm:
              </label>
              <input 
                type="email" 
                placeholder="name@gmail.com"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', color: '#fff', marginBottom: '1rem', outline: 'none' }}
              />
              
              {deleteError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{deleteError}</p>}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowDeleteModal(false); setConfirmEmail(''); setDeleteError(''); }} disabled={deleteLoading} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#27272a', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={deleteLoading} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: deleteLoading ? '#71717a' : '#ef4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
                  {deleteLoading ? 'Processing...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}