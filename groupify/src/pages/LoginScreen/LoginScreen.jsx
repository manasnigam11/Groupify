import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google'; // <-- NAYA IMPORT
import './LoginScreen.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // useEffect hata diya kyunki ab <GoogleLogin /> component khud sab handle karta hai

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
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // If profile is incomplete (no skills), go to onboarding
      if (!user.skills?.technical?.length) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-screen" id="login-screen">
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
          <h1>Find your hackathon dream team</h1>
          <p>Join thousands of builders using AI to form the perfect team based on skills, roles, and project ideas.</p>
        </div>
      </div>
      
      <div className="auth-split-right">
        <div className="auth-container">
          <div className="auth-header animate-fade-in-up">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Log in to find your perfect teammates</p>
          </div>

          <div className="auth-social animate-fade-in-up stagger-1">
            <div className="google-btn-wrapper">
              {/* YAHAN TERA NAYA GOOGLE BUTTON AAYEGA */}
              <GoogleLogin
                onSuccess={handleGoogleResponse}
                onError={() => setError('Google Sign-In failed.')}
                theme="outline"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>
          </div>

          <div className="auth-divider animate-fade-in-up stagger-1">
            <span>or continue with email</span>
          </div>

          <form className="auth-form animate-fade-in-up stagger-2" onSubmit={handleSubmit} id="login-form">
            {error && <div className="auth-error" id="login-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
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
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              id="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch animate-fade-in-up stagger-3">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="auth-link" id="go-to-signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}