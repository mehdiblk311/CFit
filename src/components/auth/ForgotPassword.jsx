import { useState } from 'react';
import './ForgotPassword.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ForgotPassword({ onBack, onSuccess }) {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setEmail(e.target.value);
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!isValidEmail(email)) { setError("That doesn't look like a valid email."); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onSuccess?.(email.trim());
  }

  return (
    <div className="fp-root">
      <div className="fp-orb-green" />
      <div className="fp-orb-purple" />

      {/* Header */}
      <header className="fp-header">
        <button className="fp-back-btn" onClick={onBack} aria-label="Go back">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="fp-logo">UM6P_FIT</span>
        <div style={{ width: 40 }} />
      </header>

      {/* Main */}
      <main className="fp-main">

        {/* Illustration stacked cards */}
        <div className="fp-hero" aria-hidden="true">
          <div className="fp-card-back" />
          <div className="fp-card-front">
            <span className="fp-lock-symbol">&#128274;</span>
          </div>
          <div className="fp-sticker">Security_First</div>
        </div>

        {/* Copy */}
        <div className="fp-copy">
          <h1 className="fp-heading">Reset Password</h1>
          <p className="fp-subtext">
            Enter your email and we'll send<br />you a 6-digit reset code.
          </p>
        </div>

        {/* Form */}
        <form className="fp-form" onSubmit={handleSubmit} noValidate>
          <div className="fp-field">
            <label className="fp-field-label" htmlFor="fp-email">Account Email</label>
            <div className="fp-input-wrap">
              <input
                id="fp-email"
                type="email"
                className={`fp-input${error ? ' fp-input--error' : ''}`}
                placeholder="hello@um6p.ma"
                value={email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
              />
              <span className="fp-input-icon">
                <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
                  <rect x="1" y="1" width="18" height="14" rx="3" stroke={error ? '#b02500' : '#adadab'} strokeWidth="1.5"/>
                  <path d="M1 4L10 9L19 4" stroke={error ? '#b02500' : '#adadab'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
            {error && <p className="fp-error-msg">{error}</p>}
          </div>

          <button type="submit" className="fp-btn" disabled={loading}>
            {loading ? (
              <div className="fp-spinner" />
            ) : (
              <>
                <span>Send Reset Code</span>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 7H17M11 1L17 7L11 13" stroke="#d6ffb7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <button className="fp-back-link" onClick={onBack}>Back to Login</button>
      </main>

      <footer className="fp-footer">
        <span>UM6P_FIT_CORE</span>
        <span>v1.0.3</span>
      </footer>
    </div>
  );
}
