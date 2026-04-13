import './PasswordChanged.css';

export default function PasswordChanged({ onBackToLogin }) {
  return (
    <div className="pc-root">
      <div className="pc-blob-green" />
      <div className="pc-blob-lemon" />

      {/* Header */}
      <header className="pc-header">
        <span className="pc-logo">UM6P_FIT</span>
      </header>

      {/* Main */}
      <main className="pc-main">

        {/* Success illustration */}
        <div className="pc-illustration" aria-hidden="true">
          <div className="pc-card-back" />
          <div className="pc-card-mid" />
          <div className="pc-card-front">
            <span className="pc-check">✓</span>
          </div>
          <div className="pc-sticker-top">All done!</div>
          <div className="pc-sticker-bot">Secured_✓</div>
        </div>

        {/* Copy */}
        <div className="pc-copy">
          <h1 className="pc-heading">Password<br />Changed!</h1>
          <p className="pc-subtext">
            Your account is secured.<br />You can now sign in with your new password.
          </p>
        </div>

        {/* CTA */}
        <button className="pc-btn" type="button" onClick={onBackToLogin}>
          <span>Back to Login</span>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M1 7H17M11 1L17 7L11 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </main>

      {/* Decorative footer */}
      <footer className="pc-footer">
        <span>UM6P_FIT_CORE</span>
        <span>v1.0.3</span>
      </footer>
    </div>
  );
}
