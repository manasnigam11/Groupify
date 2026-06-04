import { useNavigate } from 'react-router-dom';

export default function MatchResults() {
  const navigate = useNavigate();

  return (
    <div className="page-container" id="match-results-screen">
      <div className="find-header animate-fade-in-up">
        <button className="find-back" onClick={() => navigate('/find')} id="results-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="page-title">Match Results</h1>
      </div>

      <div className="find-placeholder animate-fade-in-up stagger-1">
        <div className="find-placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="find-placeholder-title">Results Coming Soon</h2>
        <p className="find-placeholder-desc">
          Match results will appear here after the AI matching engine is connected.
        </p>
      </div>
    </div>
  );
}
