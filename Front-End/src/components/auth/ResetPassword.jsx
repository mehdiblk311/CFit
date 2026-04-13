import { useState, useMemo } from 'react';
import './ResetPassword.css';

function strength(pw) {
  if (!pw) return { score: 0, label: '', cls: 'empty' };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12)         s++;
  if (s <= 1) return { score: s, label: 'WEAK',   cls: 'weak' };
  if (s === 2) return { score: s, label: 'FAIR',   cls: 'fair' };
  if (s === 3) return { score: s, label: 'GOOD',   cls: 'good' };
  return           { score: s, label: 'STRONG', cls: 'strong' };
}

const segColor = (i, str) => {
  if (i >= str.score) return '#d4d5d2';
  if (str.cls === 'weak')   return '#b02500';
  if (str.cls === 'fair')   return '#f7751f';
  return '#38671a';
};

export default function ResetPassword({ onBack, onSuccess }) {
  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const str = useMemo(() => strength(pw), [pw]);

  function clearErr(f) { setErrors(p => ({ ...p, [f]: undefined })); }

  function validate() {
    const e = {};
    if (!pw)               e.pw      = 'Password is required.';
    else if (pw.length < 8) e.pw     = 'At least 8 characters.';
    if (confirm !== pw)    e.confirm = "Passwords don't match.";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    onSuccess?.();
  }

  const EyeIcon = ({ crossed }) => (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
      <path d="M1 9C1 9 4.5 2 11 2C17.5 2 21 9 21 9C21 9 17.5 16 11 16C4.5 16 1 9 1 9Z" stroke="#adadab" strokeWidth="1.5"/>
      <circle cx="11" cy="9" r="3" stroke="#adadab" strokeWidth="1.5"/>
      {crossed && <line x1="2" y1="1" x2="20" y2="17" stroke="#adadab" strokeWidth="1.5" strokeLinecap="round"/>}
    </svg>
  );

  return (
    <div className="rp-root">
      <div className="rp-blob-green" />
      <div className="rp-blob-purple" />

      {/* Header */}
      <header className="rp-header">
        <button className="rp-back-btn" onClick={onBack} aria-label="Go back">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="rp-logo">UM6P_FIT</span>
        <div style={{ width: 40 }} />
      </header>

      {/* Main */}
      <main className="rp-main">

        {/* Heading */}
        <div className="rp-copy">
          <div className="rp-tag">Step 3 of 3</div>
          <h1 className="rp-heading">New<br />Password</h1>
          <p className="rp-subtext">Choose something strong.<br />You won't regret it.</p>
        </div>

        {/* Form */}
        <form className="rp-form" onSubmit={handleSubmit} noValidate>

          {/* New password */}
          <div className="rp-field">
            <label className="rp-label" htmlFor="rp-pw">New Password</label>
            <div className="rp-input-wrap">
              <input
                id="rp-pw"
                type={showPw ? 'text' : 'password'}
                className={`rp-input${errors.pw ? ' rp-input--error' : ''}`}
                placeholder="••••••••••••"
                value={pw}
                onChange={e => { setPw(e.target.value); clearErr('pw'); }}
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className="rp-eye" onClick={() => setShowPw(v => !v)} aria-label="Toggle visibility">
                <EyeIcon crossed={showPw} />
              </button>
            </div>
            {errors.pw && <p className="rp-error">{errors.pw}</p>}
          </div>

          {/* Strength bar */}
          {pw.length > 0 && (
            <div className="rp-strength">
              <div className="rp-strength-bar">
                {[0,1,2,3].map(i => (
                  <div key={i} className="rp-strength-seg" style={{ background: segColor(i, str) }} />
                ))}
                <span className={`rp-strength-label ${str.cls}`}>{str.label}</span>
              </div>
            </div>
          )}

          {/* Confirm */}
          <div className="rp-field">
            <label className="rp-label" htmlFor="rp-confirm">Confirm Password</label>
            <div className="rp-input-wrap">
              <input
                id="rp-confirm"
                type={showPw ? 'text' : 'password'}
                className={`rp-input${errors.confirm ? ' rp-input--error' : ''}`}
                placeholder="••••••••••••"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); clearErr('confirm'); }}
                autoComplete="new-password"
              />
            </div>
            {errors.confirm && <p className="rp-error">{errors.confirm}</p>}
          </div>

          <button type="submit" className="rp-btn" disabled={loading}>
            {loading ? (
              <div className="rp-spinner" />
            ) : (
              <>
                <span>Reset Password</span>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 7H17M11 1L17 7L11 13" stroke="#d6ffb7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
