import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './TopNav.css';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, notifications } = useAuth();

  const hiddenPaths = ['/', '/login', '/signup', '/onboarding'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const profile = user?.profile || {};

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
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
          
          {/* CHATS - Position relative set kiya hai yahan */}
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
          
          {/* MY TEAM - Position relative set kiya hai yahan */}
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
            <button onClick={handleLogout} className="dropdown-item text-danger">Log Out</button>
          </div>
        </div>
      </div>
    </header>
  );
}