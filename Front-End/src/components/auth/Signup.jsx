import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Signup.css';

const IMG_GOOGLE = 'https://www.figma.com/api/mcp/asset/de0ce486-b6f9-4afd-82d5-3688a617a41d';

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', cls: 'empty' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12)         score++;
  if (score <= 1) return { score, label: 'WEAK',   cls: 'weak' };
  if (score === 2) return { score, label: 'FAIR',   cls: 'fair' };
  if (score === 3) return { score, label: 'GOOD',   cls: 'strong' };
  return                        { score, label: 'STRONG', cls: 'strong' };
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getStrength(pw), [pw]);

  const reqs = [
    { label: 'At least 8 characters',  met: pw.length >= 8 },
    { label: 'One capital letter',      met: /[A-Z]/.test(pw) },
    { label: 'One special character',   met: /[^A-Za-z0-9]/.test(pw) },
  ];

  function clearError(field) { setErrors(p => ({ ...p, [field]: undefined })); }

  function validate() {
    const e = {};
    if (!name.trim())               e.name    = 'Full name is required.';
    if (!email.trim())              e.email   = 'Email is required.';
    else if (!isValidEmail(email))  e.email   = 'Not a valid email.';
    if (!pw)                        e.pw      = 'Password is required.';
    else if (pw.length < 8)         e.pw      = 'At least 8 characters.';
    if (confirm !== pw)             e.confirm = 'Passwords don\'t match.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const response = await signup(name, email, pw);
      // Check if 2FA is required
      if (response.two_factor_required) {
        navigate('/2fa-challenge');
        return;
      }
      // Otherwise auth state update drives routing in App.jsx — goes to onboarding
    } catch (err) {
      const detail = err?.detail ?? err?.message ?? '';
      if (detail.toLowerCase().includes('duplicate') || detail.toLowerCase().includes('unique') || detail.toLowerCase().includes('already')) {
        setErrors({ email: 'An account with this email already exists.' });
      } else if (err?.status === 400) {
        setErrors({ email: detail || 'Invalid data. Please check your inputs.' });
      } else {
        setErrors({ email: 'Could not create account. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  // Segment colors: active uses strength class
  const segColor = (i) => {
    if (i >= strength.score) return '#d4d5d2';
    if (strength.cls === 'weak')   return '#e05c3a';
    if (strength.cls === 'fair')   return '#f7751f';
    return '#38671a';
  };

  return (
    <div className="su-root">
      <div className="su-blob-green" />
      <div className="su-blob-purple" />

      {/* Header */}
      <header className="su-header">
        <button className="su-back-btn" onClick={() => navigate('/login')} aria-label="Go back">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="su-logo">UM6P_FIT</span>
      </header>

      {/* Main */}
      <main className="su-main">
        <div className="su-heading-group">
          <h1 className="su-title">Create Account</h1>
          <p className="su-subtitle">Start your kinetic journey</p>
        </div>

        <form className="su-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="su-field">
            <label className="su-label" htmlFor="su-name">Full Name</label>
            <input
              id="su-name"
              type="text"
              className={`su-input${errors.name ? ' su-input--error' : ''}`}
              placeholder="Alex Rivera"
              value={name}
              onChange={e => { setName(e.target.value); clearError('name'); }}
              autoFocus
            />
            {errors.name && <p className="su-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="su-field">
            <label className="su-label" htmlFor="su-email">Email Address</label>
            <input
              id="su-email"
              type="email"
              className={`su-input${errors.email ? ' su-input--error' : ''}`}
              placeholder="alex@student.um6p.ma"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError('email'); }}
              autoComplete="email"
            />
            {errors.email && <p className="su-error">{errors.email}</p>}
          </div>

          {/* Password + Strength */}
          <div className="su-pw-group">
            <div className="su-field">
              <label className="su-label" htmlFor="su-pw">Password</label>
              <input
                id="su-pw"
                type={showPw ? 'text' : 'password'}
                className={`su-input${errors.pw ? ' su-input--error' : ''}`}
                placeholder="••••••••••••"
                value={pw}
                onChange={e => { setPw(e.target.value); clearError('pw'); }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="su-input-icon"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide' : 'Show'}
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
              {errors.pw && <p className="su-error">{errors.pw}</p>}
            </div>

            {/* Strength card — show only when user has typed */}
            {pw.length > 0 && (
              <div className="su-strength-card">
                <div className="su-strength-bar">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="su-strength-seg"
                      style={{ background: segColor(i) }}
                    />
                  ))}
                  <span className={`su-strength-label ${strength.cls}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="su-req-list">
                  {reqs.map(r => (
                    <div className="su-req-item" key={r.label}>
                      <div className={`su-req-dot${r.met ? ' met' : ''}`} />
                      <span className={`su-req-text${r.met ? ' met' : ' unmet'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="su-field">
            <label className="su-label" htmlFor="su-confirm">Confirm Password</label>
            <input
              id="su-confirm"
              type={showPw ? 'text' : 'password'}
              className={`su-input${errors.confirm ? ' su-input--error' : ''}`}
              placeholder="••••••••••••"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); clearError('confirm'); }}
              autoComplete="new-password"
            />
            {errors.confirm && <p className="su-error">{errors.confirm}</p>}
          </div>

          {/* Submit */}
          <button type="submit" className="su-btn" disabled={loading}>
            {loading ? (
              <div className="su-spinner" />
            ) : (
              <>
                <span className="su-btn-label">Create Account</span>
                <span className="su-btn-arrow">
                  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                    <path d="M1 7H15M9 1L15 7L9 13" stroke="#d6ffb7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="su-divider">
          <div className="su-divider-line" />
          <span className="su-divider-label">or</span>
        </div>

        {/* Google */}
        <button className="su-google-btn" type="button">
          <img src={IMG_GOOGLE} alt="Google" />
          <span className="su-google-label">Continue with Google</span>
        </button>

        {/* Login link */}
        <div className="su-footer-link">
          <span>Already have an account?</span>
          <button type="button" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </main>
    </div>
  );
}
