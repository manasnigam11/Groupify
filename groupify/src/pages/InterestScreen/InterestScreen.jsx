import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InterestChip from '../../components/InterestChip/InterestChip';
import { interests } from '../../data/mockData';
import './InterestScreen.css';

export default function InterestScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const toggleInterest = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    navigate('/home');
  };

  return (
    <div className="interest-screen" id="interest-screen">
      <div className="interest-bg-orb interest-orb-1" />

      <div className="interest-content">
        <div className="interest-header animate-fade-in-up">
          <div className="interest-step">Step 1 of 1</div>
          <h1 className="interest-title">What are you into?</h1>
          <p className="interest-subtitle">
            Pick at least 3 interests. We'll use these to find your perfect communities.
          </p>
        </div>

        <div className="interest-count animate-fade-in-up stagger-1">
          <span className={`count-number ${selected.length >= 3 ? 'ready' : ''}`}>
            {selected.length}
          </span>
          <span className="count-label">selected</span>
          {selected.length < 3 && (
            <span className="count-hint">Pick {3 - selected.length} more</span>
          )}
          {selected.length >= 3 && (
            <span className="count-ready">You're all set! ✨</span>
          )}
        </div>

        <div className="interest-grid animate-fade-in-up stagger-2">
          {interests.map((interest, index) => (
            <InterestChip
              key={interest.id}
              interest={interest}
              selected={selected.includes(interest.id)}
              onToggle={toggleInterest}
            />
          ))}
        </div>

        <div className="interest-footer animate-fade-in-up stagger-3">
          <button
            className={`primary-btn interest-continue ${selected.length >= 3 ? '' : 'disabled'}`}
            onClick={handleContinue}
            disabled={selected.length < 3}
            id="interest-continue"
          >
            Find My Communities
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
          <button className="skip-btn" onClick={() => navigate('/home')}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
