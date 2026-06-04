import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SplashScreen.css';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, navigate]);

  return (
    <div className="splash-screen" id="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-ring">
          <div className="splash-logo-inner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>
        <h1 className="splash-title">Groupify</h1>
        <p className="splash-tagline">AI-Powered Teammate Matching</p>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>
      <p className="splash-footer">Google Cloud Rapid Agent Hackathon</p>
    </div>
  );
}
