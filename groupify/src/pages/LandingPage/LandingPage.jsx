import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* SECTION 1 & 2: HERO & PRODUCT VISUALIZATION */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content animate-fade-in-up">
            <div className="hero-badge">🚀 The Ultimate Hackathon Team Builder</div>
            <h1 className="hero-headline">
              Build Your Dream Team with <span className="text-gradient">Agentic AI</span>
            </h1>
            <p className="hero-subheadline">
              Groupify uses advanced AI and vector search to match you with the perfect teammates based on skills, complementarity, and hackathon goals. Stop searching, start building.
            </p>
            <div className="hero-cta-group">
              <button className="btn-primary btn-large" onClick={() => navigate('/signup')}>
                Get Started for Free
              </button>
              <button className="btn-outline btn-large" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Watch Demo
              </button>
            </div>
          </div>

          <div className="hero-visual animate-float">
            <div className="visual-card">
              <div className="visual-header">
                <span>AI Match Analysis</span>
                <span className="visual-score">98% Match</span>
              </div>
              <div className="visual-body">
                <div className="user-node">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Frontend" alt="User 1" />
                  <p>Frontend Dev</p>
                </div>
                <div className="connection-line">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div className="user-node">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Backend" alt="User 2" />
                  <p>AI Engineer</p>
                </div>
              </div>
              <div className="visual-footer">
                <p><strong>Reasoning:</strong> Complementary skillsets detected. High probability of success for Google Cloud Hackathon.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="section-header text-center">
          <h2>How Groupify Works</h2>
          <p>From solo developer to a winning team in three simple steps.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <h3>Create Profile</h3>
            <p>Tell us about your technical skills, hackathon interests, and preferred roles. Let our system understand your unique strengths.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <h3>AI Matching</h3>
            <p>Our proprietary Gemini AI algorithms analyze profiles to find highly compatible teammates that fill your skill gaps.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <h3>Build Teams</h3>
            <p>Send invitations, chat in real-time, and organize your project workspace to dominate your next hackathon.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES */}
      <section className="features-section" id="features">
        <div className="section-header text-center">
          <h2>Everything You Need to Win</h2>
          <p>Traditional networking tools are broken. Groupify is built specifically for hackathons.</p>
        </div>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></div>
            <h4>Smart AI Matching</h4>
            <p>Vector-based matchmaking ensures you find teammates who complement your exact technical stack.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <h4>Instant Team Formation</h4>
            <p>Define your project's missing roles and let the platform automatically suggest the perfect candidates.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
            <h4>Real-time Chat</h4>
            <p>Communicate seamlessly with potential teammates and your current team members in one place.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg></div>
            <h4>Project Management</h4>
            <p>Centralize your hackathon details, GitHub repositories, and submission links within your team dashboard.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
            <h4>Seamless Invitations</h4>
            <p>Send and receive project invites with custom messages. Build your roster faster than ever.</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: TECHNOLOGY STACK */}
      <section className="tech-stack-section">
        <div className="section-header text-center">
          <h2>Powered by Next-Gen Tech</h2>
        </div>
        <div className="tech-flex">
          <div className="tech-badge">
            <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini AI" />
            <span>Google Gemini AI</span>
          </div>
          <div className="tech-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#47A248" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>MongoDB Atlas</span>
          </div>
          <div className="tech-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#47A248" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            <span>Vector Search</span>
          </div>
          <div className="tech-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Google Cloud</span>
          </div>
        </div>
      </section>

      {/* SECTION 6: PLATFORM STATISTICS */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-box">
            <h2>4,500+</h2>
            <p>AI Matches Generated</p>
          </div>
          <div className="stat-box">
            <h2>850+</h2>
            <p>Projects Created</p>
          </div>
          <div className="stat-box">
            <h2>3,200+</h2>
            <p>Users Registered</p>
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CALL TO ACTION */}
      <section className="cta-section">
        <div className="cta-container text-center">
          <h2>Ready to win your next hackathon?</h2>
          <p>Join thousands of developers, designers, and innovators building the future.</p>
          <button className="btn-primary btn-large" onClick={() => navigate('/signup')}>
            Join Groupify Today
          </button>
        </div>
      </section>
    </div>
  );
}