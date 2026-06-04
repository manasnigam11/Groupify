import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    path: '/find',
    label: 'Find',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();

  // Hide on auth/splash/onboarding screens
  const hiddenPaths = ['/', '/login', '/signup', '/onboarding'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav className="bottom-nav" id="bottom-navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          id={`nav-${item.label.toLowerCase()}`}
        >
          <div className="nav-icon-wrap">
            {item.icon}
          </div>
          <span className="nav-label">{item.label}</span>
          <div className="nav-indicator" />
        </NavLink>
      ))}
    </nav>
  );
}
