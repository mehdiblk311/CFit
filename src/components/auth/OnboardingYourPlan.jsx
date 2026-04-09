import { useAuth } from '../../hooks/useAuth';
import './OnboardingYourPlan.css';

const MACRO_COLORS = {
  protein: '#38671a',
  carbs:   '#5d3fd3',
  fats:    '#f95630',
};

function MacroBar({ label, grams, pct, color }) {
  return (
    <div className="yp-macro">
      <div className="yp-macro-header">
        <span className="yp-macro-label">{label}</span>
        <span className="yp-macro-g">{grams}<span className="yp-macro-unit">g</span></span>
      </div>
      <div className="yp-macro-track">
        <div className="yp-macro-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function OnboardingYourPlan({ step = 3, totalSteps = 3, onBack }) {
  const { completeOnboarding } = useAuth();

  return (
    <div className="yp-root">
      <div className="yp-blob-green" />
      <div className="yp-blob-purple" />

      {/* ── Header ── */}
      <header className="yp-header">
        <button className="yp-back-btn" onClick={onBack} aria-label="Go back">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="#2e2f2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="yp-progress-dots">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`yp-dot${i < step ? ' yp-dot--active' : ''}`}
              style={i === step - 1 ? { width: 40 } : {}}
            />
          ))}
        </div>

        <span className="yp-logo">UM6P_FIT</span>
      </header>

      {/* ── Main ── */}
      <main className="yp-main">
        {/* Hero */}
        <div className="yp-hero">
          <span className="yp-step-label">Step 03 — Final Plan</span>
          <h1 className="yp-title">Your Daily Target</h1>
        </div>

        {/* TDEE Bento Card */}
        <div className="yp-tdee-card">
          <div className="yp-tdee-bg-orb" />
          <span className="yp-tdee-sub">Estimated Maintenance</span>
          <div className="yp-tdee-row">
            <span className="yp-tdee-cal">2,300</span>
            <span className="yp-tdee-unit">kcal</span>
          </div>
          <div className="yp-tdee-badges">
            <span className="yp-badge yp-badge--green">Weight Loss Plan</span>
            <span className="yp-badge yp-badge--neutral">Active Mode</span>
          </div>
        </div>

        {/* Macros */}
        <div className="yp-macros">
          <span className="yp-macros-title">Nutritional Split</span>
          <MacroBar label="Protein" grams={150} pct={75} color={MACRO_COLORS.protein} />
          <MacroBar label="Carbs"   grams={250} pct={62} color={MACRO_COLORS.carbs}   />
          <MacroBar label="Fats"    grams={75}  pct={45} color={MACRO_COLORS.fats}    />
        </div>

        {/* Info note */}
        <div className="yp-info">
          <span className="material-symbols-outlined yp-info-icon">info</span>
          <p>These targets are calculated based on your profile. You can adjust them anytime in Settings.</p>
        </div>

        {/* Spacer for fixed footer */}
        <div style={{ height: 24 }} />
      </main>

      {/* ── Fixed CTA ── */}
      <footer className="yp-footer">
        <button className="yp-cta-btn" onClick={() => completeOnboarding()}>
          Let's Go
          <span className="material-symbols-outlined">rocket_launch</span>
        </button>
      </footer>
    </div>
  );
}
