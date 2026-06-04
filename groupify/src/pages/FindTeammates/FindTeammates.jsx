import { useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e?.preventDefault();
    if (mode === 'standard' && !query.trim()) return;
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

  function handleCompleteMyTeam() {
    setMode('complete_my_team');
    setQuery('Complete My Team');
    // Trigger search immediately
    setTimeout(() => {
      setError('');
      setLoading(true);
      setResults(null);
      api.findTeammates('', 'complete_my_team')
        .then((data) => setResults(data))
        .catch((err) => setError(err.message || 'Matching failed.'))
        .finally(() => setLoading(false));
    }, 0);
  }

  return (
    <div className="page-container find-page" id="find-teammates-screen">
      <div className="find-hero animate-fade-in-up">
        <h1 className="find-title">Find Your Perfect Teammates</h1>
        <p className="find-subtitle">
          Describe who you're looking for, or let AI analyze your gaps
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="find-modes animate-fade-in-up stagger-1">
        <button
          className={`mode-btn ${mode === 'standard' ? 'mode-active' : ''}`}
          onClick={() => setMode('standard')}
          id="mode-standard"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Search
        </button>
        <button
          className={`mode-btn ${mode === 'complete_my_team' ? 'mode-active' : ''}`}
          onClick={handleCompleteMyTeam}
          id="mode-complete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Complete My Team
        </button>
      </div>

      {/* Search Input */}
      {mode === 'standard' && (
        <form className="find-search animate-fade-in-up stagger-2" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Describe your ideal teammate..."
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
      )}

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
            <p className="thinking-text">Groupify Agent is analyzing...</p>
            <div className="thinking-steps">
              <div className="thinking-step active">Parsing your query</div>
              <div className="thinking-step">Searching profiles</div>
              <div className="thinking-step">Scoring compatibility</div>
              <div className="thinking-step">Generating explanations</div>
            </div>
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
              {results.results?.length || 0} Teammate{results.results?.length !== 1 ? 's' : ''} Found
            </h2>
            {results.fallback_triggered && (
              <span className="results-badge-fallback">Heuristic Search</span>
            )}
          </div>

          {results.results?.length === 0 && (
            <div className="results-empty">
              <p>No matching teammates found. Try broadening your search.</p>
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
                    <h3 className="match-name">
                      {match.matched_for_role ? `${match.matched_for_role}` : `Match #${idx + 1}`}
                    </h3>
                    {match.matched_for_role && (
                      <span className="match-role-badge">{match.matched_for_role}</span>
                    )}
                  </div>
                </div>

                <p className="match-reasoning">{match.reasoning}</p>

                {match.skill_complement?.length > 0 && (
                  <div className="match-skills">
                    <span className="match-skills-label">Brings:</span>
                    <div className="match-skill-chips">
                      {match.skill_complement.map((s) => (
                        <span key={s} className="match-skill-chip complement">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {match.skill_overlap?.length > 0 && (
                  <div className="match-skills">
                    <span className="match-skills-label">Shared:</span>
                    <div className="match-skill-chips">
                      {match.skill_overlap.map((s) => (
                        <span key={s} className="match-skill-chip overlap">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
