import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './FindTeammates.css';

const PROMPT_TEMPLATES = [
  'Find me a frontend developer who knows React and TypeScript',
  'I need a UI/UX designer with Figma experience',
  'Looking for an AI/ML engineer for a healthcare project',
  'Find a backend developer who knows Python and MongoDB',
  'I need a mobile developer for a cross-platform app',
];

export default function FindTeammates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) return;

    // Basic email validation for 'find_a_person' mode
    if (mode === 'find_a_person' && !query.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    setResults(null);

    try {
      const data = await api.findTeammates(query, mode);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Matching failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateClick(template) {
    setQuery(template);
    setMode('standard');
  }

  function handleModeSwitch(newMode) {
    setMode(newMode);
    setQuery('');
    setResults(null);
    setError('');
  }

  return (
    <div className="page-container find-page" id="find-teammates-screen">
      <div className="find-hero animate-fade-in-up">
        <h1 className="find-title">Find Your Perfect Teammates</h1>
        <p className="find-subtitle">
          Describe who you're looking for, or invite a specific person by email
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="find-modes animate-fade-in-up stagger-1">
        <button
          className={`mode-btn ${mode === 'standard' ? 'mode-active' : ''}`}
          onClick={() => handleModeSwitch('standard')}
          id="mode-standard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Search by Skills
        </button>
        
        <button
          className={`mode-btn ${mode === 'find_a_person' ? 'mode-active' : ''}`}
          onClick={() => handleModeSwitch('find_a_person')}
          id="mode-find-person"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Find a Person
        </button>
      </div>

      {/* Search Input */}
      <form className="find-search animate-fade-in-up stagger-2" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mode === 'find_a_person' ? (
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
            ) : (
              <>
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </>
            )}
          </svg>
          <input
            type={mode === 'find_a_person' ? "email" : "text"}
            className="search-input"
            placeholder={
              mode === 'find_a_person' 
                ? "Enter their email address (e.g., friend@university.edu)..." 
                : "Describe your ideal teammate..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="teammate-search-input"
          />
          <button
            type="submit"
            className="search-submit"
            disabled={loading || !query.trim()}
            id="teammate-search-submit"
          >
            {loading ? (
              <div className="search-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Quick Prompts */}
      {mode === 'standard' && !results && !loading && (
        <div className="find-prompts animate-fade-in-up stagger-3">
          <p className="prompts-label">Try a prompt:</p>
          <div className="prompts-grid">
            {PROMPT_TEMPLATES.map((template) => (
              <button
                key={template}
                className="prompt-chip"
                onClick={() => handleTemplateClick(template)}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="find-loading animate-fade-in">
          <div className="agent-thinking">
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
            <p className="thinking-text">
              {mode === 'find_a_person' ? 'Looking up user...' : 'Groupify Agent is analyzing...'}
            </p>
            {mode === 'standard' && (
              <div className="thinking-steps">
                <div className="thinking-step active">Parsing your query</div>
                <div className="thinking-step">Searching profiles</div>
                <div className="thinking-step">Scoring compatibility</div>
                <div className="thinking-step">Generating explanations</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="find-error animate-fade-in">
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="find-results animate-fade-in-up">
          <div className="results-header">
            <h2 className="results-title">
              {results.results?.length || 0} {mode === 'find_a_person' ? 'User' : 'Teammate'}{results.results?.length !== 1 ? 's' : ''} Found
            </h2>
            {results.fallback_triggered && (
              <span className="results-badge-fallback">Heuristic Search</span>
            )}
          </div>

          {results.results?.length === 0 && (
            <div className="results-empty">
              <p>
                {mode === 'find_a_person' 
                  ? "No user found with that email. Make sure they have a Groupify account." 
                  : "No matching teammates found. Try broadening your search."}
              </p>
            </div>
          )}

          <div className="results-list">
            {results.results?.map((match, idx) => (
              <div
                key={match.user_id || idx}
                className="match-card animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="match-card-top">
                  <div className="match-score-ring">
                    <svg viewBox="0 0 36 36" className="score-circle">
                      <path
                        className="score-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="score-fill"
                        strokeDasharray={`${match.compatibility_score}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="score-value">{match.compatibility_score}</span>
                  </div>
                  <div className="match-info">
                    {/* NAYA LOGIC: Yahan ab direct Name - Role dikhega */}
                    <h3 className="match-name">
                      {match.name ? `${match.name} - ${match.role}` : `Match #${idx + 1}`}
                    </h3>
                    
                    {/* Extra badge sirf tab dikhega jab mode Complete My Team ho */}
                    {match.matched_for_role && match.matched_for_role !== "Direct Invite" && (
                      <span className="match-role-badge">Fills Gap: {match.matched_for_role}</span>
                    )}
                  </div>
                </div>

                <div className="match-why-section">
                  <h4 className="match-why-title">Why matched?</h4>
                  <ul className="match-why-list">
                    {match.skill_overlap?.length > 0 && (
                      <li>
                        <strong>Shared Skills:</strong> {match.skill_overlap.join(', ')}
                      </li>
                    )}
                    {match.skill_complement?.length > 0 && (
                      <li>
                        <strong>Complementary:</strong> {match.skill_complement.join(', ')}
                      </li>
                    )}
                    <li>
                      <strong>Reasoning:</strong> {match.reasoning}
                    </li>
                  </ul>
                </div>

                <div className="match-card-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate(`/profile/${match.user_id}`)}
                    style={{ flex: 1 }}
                  >
                    View Profile
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={() => navigate(`/chats?userId=${match.user_id}`)}
                    style={{ flex: 1 }}
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}