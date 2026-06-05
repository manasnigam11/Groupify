import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SignupScreen.css';

export default function SignupScreen() {
  const navigate = useNavigate();
  // verifyOtp ko yahan import kiya hai
  const { signup, loginWithGoogle, verifyOtp } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NAYE STATES OTP KE LIYE
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Signup, 2 = OTP
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signup-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signup_with" }
      );
    }
  }, []);

  async function handleGoogleResponse(response) {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential);
      if (!user.skills?.technical?.length) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google Sign-Up failed.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 1: Basic Registration
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, name);
      // NAYA LOGIC: Yahan navigate nahi hoga, bas step 2 pe jayenge
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // STEP 2: OTP Verification
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      // OTP verify hone ke baad Token milega aur Onboarding pe jayenge
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-screen" id="signup-screen">
      <div className="auth-split-left">
        <div className="auth-brand-split">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="auth-brand-name-split">Groupify</span>
        </div>
        <div className="auth-hero-content">
          <h1>Start building with the right people</h1>
          <p>Join a community of innovators and find the missing piece to your hackathon project today.</p>
        </div>
      </div>

      <div className="auth-split-right">
        <div className="auth-container">
          
          {/* ================= STEP 1: SIGNUP FORM ================= */}
          {step === 1 && (
            <>
              <div className="auth-header animate-fade-in-up">
                <h1 className="auth-title">Create an account</h1>
                <p className="auth-subtitle">Join Groupify to find your perfect hackathon team</p>
              </div>

              <div className="auth-social animate-fade-in-up stagger-1">
                {googleClientId ? (
                  <div id="google-signup-btn" className="google-btn-wrapper"></div>
                ) : (
                  <button type="button" className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    Google Sign-In not configured
                  </button>
                )}
              </div>

              <div className="auth-divider animate-fade-in-up stagger-1">
                <span>or continue with email</span>
              </div>

              <form className="auth-form animate-fade-in-up stagger-2" onSubmit={handleSubmit} id="signup-form">
                {error && <div className="auth-error" id="signup-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-name">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    className="form-input"
                    placeholder="Must be at least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  id="signup-submit"
                >
                  {loading ? 'Sending OTP...' : 'Create Account'}
                </button>
              </form>

              <p className="auth-switch animate-fade-in-up stagger-3">
                Already have an account?{' '}
                <Link to="/login" className="auth-link" id="go-to-login">Log in</Link>
              </p>
            </>
          )}

          {/* ================= STEP 2: OTP FORM ================= */}
          {step === 2 && (
            <>
              <div className="auth-header animate-fade-in-up">
                <h1 className="auth-title">Verify your email</h1>
                <p className="auth-subtitle">We've sent a 6-digit code to <strong>{email}</strong></p>
              </div>

              <form className="auth-form animate-fade-in-up stagger-1" onSubmit={handleOtpSubmit}>
                {error && <div className="auth-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="otp-input">Verification Code</label>
                  <input
                    id="otp-input"
                    type="text"
                    className="form-input"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    style={{ letterSpacing: '8px', fontSize: '18px', textAlign: 'center' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Code & Login'}
                </button>
                
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(1)}
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  Back to Signup
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}