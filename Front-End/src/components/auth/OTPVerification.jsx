import { useState, useRef } from 'react';
import './OTPVerification.css';

const LEN = 6;

export default function OTPVerification({ email, onBack, onSuccess }) {
  const [digits,  setDigits]  = useState(Array(LEN).fill(''));
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  const filled = digits.every(d => d !== '');

  function handleChange(i, val) {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < LEN - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; setDigits(next);
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && i > 0)       refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < LEN - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN);
    if (!pasted) return;
    const next = Array(LEN).fill('');
    [...pasted].forEach((c, i) => { next[i] = c; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, LEN - 1);
    refs.current[focusIdx]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!filled) { setError('Please enter all 6 digits.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    // Accept any 6-digit code for now (mock)
    onSuccess?.(digits.join(''));
  }

  async function handleResend() {
    setDigits(Array(LEN).fill(''));
    setError('');
    refs.current[0]?.focus();
    // Simulate resend
    await new Promise(r => setTimeout(r, 800));
  }

  const shortEmail = email
    ? email.replace(/(.{2}).+(@.+)/, '$1•••$2')
    : '•••@•••';

  return (
    <div className="otp-root">
      <div className="otp-blob-purple" />
      <div className="otp-blob-green" />

      {/* Header */}
      <header className="otp-header">
        <button className="otp-back-btn" onClick={onBack} aria-label="Go back">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="otp-logo">UM6P_FIT</span>
        <div style={{ width: 40 }} />
      </header>

      {/* Main */}
      <main className="otp-main">

        {/* Icon badge */}
        <div className="otp-icon-badge" aria-hidden="true">
          <div className="otp-badge-back" />
          <div className="otp-badge-front">✉️</div>
          <div className="otp-sticker">Code sent!</div>
        </div>

        {/* Copy */}
        <div className="otp-copy">
          <h1 className="otp-heading">Check your<br />email</h1>
          <p className="otp-subtext">
            We sent a 6-digit code to<br />
            <strong className="otp-email">{shortEmail}</strong>
          </p>
        </div>

        {/* OTP inputs */}
        <form className="otp-form" onSubmit={handleSubmit} noValidate>
          <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-box${d ? ' otp-box--filled' : ''}${error ? ' otp-box--error' : ''}`}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && <p className="otp-error">{error}</p>}

          <button type="submit" className="otp-btn" disabled={!filled || loading}>
            {loading ? (
              <div className="otp-spinner" />
            ) : (
              <>
                <span>Verify Code</span>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1 7H17M11 1L17 7L11 13" stroke="#d6ffb7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="otp-resend-row">
          Didn't receive it?{' '}
          <button type="button" className="otp-resend-btn" onClick={handleResend}>
            Resend code
          </button>
        </p>
      </main>
    </div>
  );
}
