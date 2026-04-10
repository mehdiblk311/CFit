import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

const IMG_GOOGLE = 'https://www.figma.com/api/mcp/asset/782a9f22-34dc-433c-8213-40c23ce0a9f4';

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const isReady = email.trim() && password.length >= 1;

  function validate() {
    const e = {};
    if (!email.trim())        e.email    = 'Email is required.';
    else if (!isValidEmail(email)) e.email = 'Not a valid email.';
    if (!password)            e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await login(email, password);
      // auth state update drives routing in App.jsx automatically
    } catch {
      setErrors({ email: 'Invalid email or password.' });
    } finally {
      setLoading(false);
    }
  }

  function clearError(field) { setErrors(p => ({ ...p, [field]: undefined })); }

  return (
    <div className="login-root">
      <div className="login-blob-green" />
      <div className="login-blob-purple" />

      <div className="login-container">
        <div className="login-wordmark">UM6P_FIT</div>

        {/* Desktop hero — only visible on md+ */}
        <div className="login-desktop-hero">
          <div className="login-desktop-sticker" aria-hidden="true">
            <span className="login-desktop-sticker-icon">⚡</span>
            <span>READY TO TRAIN?</span>
          </div>
          <h2 className="login-desktop-hero-title">
            Your kinetic<br/>fitness<br/>journal.
          </h2>
          <p className="login-desktop-hero-subtitle">
            Track workouts, fuel with precision, and unlock your performance data — all in one artisanal space built for UM6P athletes.
          </p>
          <div className="login-desktop-features">
            {[
              { icon: '🏋️', text: 'Personalized workout programs with PR tracking' },
              { icon: '🥗', text: 'Smart nutrition logging and macro analysis' },
              { icon: '🤖', text: 'AI coaching with real-time performance insights' },
            ].map((f, i) => (
              <div className="login-desktop-feature" key={i}>
                <span className="login-desktop-feature-emoji">{f.icon}</span>
                <span className="login-desktop-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-card">
          {/* Heading */}
          <div className="login-heading">
            <h1 className="login-title">Welcome<br/>back</h1>
            <p className="login-subtitle">Personalized Performance Portal</p>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className={`login-input${errors.email ? ' login-input--error' : ''}`}
                placeholder="name@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                autoComplete="email"
                autoFocus
              />
              {errors.email && <p className="login-error-msg">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-pw">Password</label>
              <input
                id="login-pw"
                type={showPw ? 'text' : 'password'}
                className={`login-input${errors.password ? ' login-input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError('password'); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-input-icon"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? (
                  <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <path d="M1 9C1 9 4.5 2 11 2C17.5 2 21 9 21 9C21 9 17.5 16 11 16C4.5 16 1 9 1 9Z" stroke="#adadab" strokeWidth="1.5"/>
                    <circle cx="11" cy="9" r="3" stroke="#adadab" strokeWidth="1.5"/>
                    <line x1="2" y1="1" x2="20" y2="17" stroke="#adadab" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                    <path d="M1 8C1 8 4.5 1 11 1C17.5 1 21 8 21 8C21 8 17.5 15 11 15C4.5 15 1 8 1 8Z" stroke="#adadab" strokeWidth="1.5"/>
                    <circle cx="11" cy="8" r="3" stroke="#adadab" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
              {errors.password && <p className="login-error-msg">{errors.password}</p>}
            </div>

            {/* Forgot */}
            <div className="login-forgot-row">
              <button type="button" className="login-forgot" onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </button>
            </div>

            {/* Sign In */}
            <button type="submit" className="login-btn" disabled={!isReady || loading}>
              {loading ? <div className="login-spinner" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-label">or</span>
            <div className="login-divider-line" />
          </div>

          {/* Google */}
          <button className="login-google-btn" type="button">
            <img src={IMG_GOOGLE} alt="Google" />
            <span className="login-google-label">Continue with Google</span>
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer-link">
          <span>Don't have an account?</span>
          <button type="button" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </div>
    </div>
  );
}
