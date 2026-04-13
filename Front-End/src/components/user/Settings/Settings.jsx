import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import './Settings.css';

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`st-toggle${checked ? ' st-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <div className="st-toggle-thumb" />
    </button>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [goal,       setGoal]       = useState('maintain');
  const [frequency,  setFrequency]  = useState(5);
  const [darkMode,   setDarkMode]   = useState(false);
  const [language,   setLanguage]   = useState('EN');

  const name  = user?.name  ?? 'Athlete';
  const email = user?.email ?? 'athlete@um6p.ma';

  return (
    <div className="st-root">
      {/* Header */}
      <header className="st-header">
        <h1 className="st-header-title">Settings</h1>
        <span className="st-logo">UM6P_FIT</span>
      </header>

      <main className="st-main">

        {/* ── Profile ── */}
        <section className="st-card st-card--shadow" id="profile">
          <div className="st-profile-row">
            <div className="st-profile-avatar">
              <span>{name.charAt(0).toUpperCase()}</span>
              <div className="st-avatar-edit">
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>edit</span>
              </div>
            </div>
            <div className="st-profile-fields">
              <div className="st-input-group">
                <label className="st-field-label">Full Name</label>
                <input className="st-input" type="text" defaultValue={name} />
              </div>
              <div className="st-input-group">
                <label className="st-field-label">Email Address</label>
                <div className="st-input-static">{email}</div>
              </div>
              <button className="st-change-pw">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_reset</span>
                Change Password
              </button>
            </div>
          </div>
        </section>

        {/* ── Body Metrics ── */}
        <section className="st-section" id="metrics">
          <h2 className="st-section-title">Body Metrics</h2>
          <div className="st-metrics-grid">
            <div className="st-metric-box">
              <label className="st-field-label">Height (cm)</label>
              <input className="st-metric-input" type="number" defaultValue="182" />
            </div>
            <div className="st-metric-box">
              <label className="st-field-label">Weight (kg)</label>
              <div className="st-metric-val">78.5</div>
              <span className="st-metric-sub">Last: Apr 4</span>
            </div>
            <div className="st-metric-box">
              <label className="st-field-label">Age</label>
              <input className="st-metric-input" type="number" defaultValue="24" />
            </div>
            <div className="st-metric-box">
              <label className="st-field-label">Gender</label>
              <div className="st-gender-toggle">
                <button className="st-gender-btn st-gender-btn--on">Male</button>
                <button className="st-gender-btn">Female</button>
              </div>
            </div>
          </div>
          <button className="st-recalc-btn">
            <span className="material-symbols-outlined">calculate</span>
            Recalculate TDEE
          </button>
        </section>

        {/* ── Fitness Goals ── */}
        <section className="st-card st-card--shadow" id="goals">
          <h2 className="st-section-title">Fitness Goals</h2>
          <div className="st-input-group">
            <label className="st-field-label">Primary Objective</label>
            <div className="st-goal-row">
              {['lose', 'maintain', 'gain'].map(g => (
                <button
                  key={g}
                  className={`st-goal-btn${goal === g ? ' st-goal-btn--active' : ''}`}
                  onClick={() => setGoal(g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="st-two-col">
            <div className="st-input-group">
              <label className="st-field-label">Target Weight (kg)</label>
              <input className="st-input" type="number" defaultValue="75" />
            </div>
            <div className="st-input-group">
              <label className="st-field-label">Activity Level</label>
              <select className="st-select">
                <option>Moderate (3-5 days/week)</option>
                <option>Sedentary</option>
                <option>Very Active</option>
              </select>
            </div>
          </div>
          <div className="st-input-group">
            <div className="st-freq-row">
              <label className="st-field-label">Workout Frequency</label>
              <span className="st-freq-val">{frequency} days</span>
            </div>
            <input
              type="range" min="1" max="7"
              value={frequency}
              onChange={e => setFrequency(Number(e.target.value))}
              className="st-range"
            />
          </div>
        </section>

        {/* ── TDEE & Macros ── */}
        <section className="st-tdee-card" id="macros">
          <div className="st-tdee-top">
            <div>
              <span className="st-tdee-label">Daily TDEE Target</span>
              <div className="st-tdee-val">2,300 <span className="st-tdee-unit">kcal</span></div>
            </div>
            <button className="st-reset-link">Reset to Calculated</button>
          </div>
          <div className="st-macro-grid">
            {[['Protein','180g'],['Carbs','250g'],['Fats','65g']].map(([n, v]) => (
              <div key={n} className="st-macro-box">
                <label className="st-macro-label">{n}</label>
                <input className="st-macro-input" type="text" defaultValue={v} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className="st-section" id="preferences">
          <div className="st-pref-row">
            <div className="st-pref-left">
              <span className="material-symbols-outlined" style={{ color: '#38671a' }}>dark_mode</span>
              <span className="st-pref-label">Dark Mode</span>
            </div>
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </div>
          <div className="st-pref-row">
            <div className="st-pref-left">
              <span className="material-symbols-outlined" style={{ color: '#38671a' }}>language</span>
              <span className="st-pref-label">Language</span>
            </div>
            <div className="st-lang-row">
              {['EN','FR','AR'].map(l => (
                <button
                  key={l}
                  className={`st-lang-btn${language === l ? ' st-lang-btn--active' : ''}`}
                  onClick={() => setLanguage(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Legal ── */}
        <section className="st-section" id="legal">
          {[
            ['Privacy Policy',   'chevron_right'],
            ['Terms of Service', 'chevron_right'],
            ['Export My Data',   'download'     ],
          ].map(([label, icon]) => (
            <div key={label} className="st-legal-row">
              <span>{label}</span>
              <span className="material-symbols-outlined" style={{ color: '#5b5c5a', fontSize: 20 }}>{icon}</span>
            </div>
          ))}
          <div className="st-legal-row st-legal-row--danger">
            <span>Delete Account</span>
            <span className="material-symbols-outlined" style={{ color: '#b02500', fontSize: 20 }}>delete_forever</span>
          </div>
        </section>

        {/* ── Logout ── */}
        <footer className="st-footer">
          <button className="st-logout-btn" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
          <p className="st-version">UM6P_FIT — Kinetic Craft Build v1.0</p>
        </footer>

      </main>
    </div>
  );
}
