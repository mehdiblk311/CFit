import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { authStore } from '../../../stores/authStore';
import TwoFactorSetup from '../../auth/TwoFactorSetup';
import SessionsManager from './SessionsManager';
import ExportManager from './ExportManager';
import DeleteAccountManager from './DeleteAccountManager';
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
  const [show2FA,    setShow2FA]    = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showExport, setShowExport]     = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const twoFactorEnabled = user?.two_factor_enabled ?? false;

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

        {/* ── Security / 2FA ── */}
        <section className="st-card st-card--shadow" id="security">
          <h2 className="st-section-title">Security</h2>
          <div className="st-2fa-row" style={{marginBottom: '16px'}}>
            <div className="st-2fa-left">
              <div className="st-2fa-icon" aria-hidden="true">{twoFactorEnabled ? '🔐' : '🛡️'}</div>
              <div className="st-2fa-info">
                <span className="st-2fa-label">Two-Factor Authentication</span>
                <span className={`st-2fa-status ${twoFactorEnabled ? 'st-2fa-status--on' : 'st-2fa-status--off'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <button
              className={`st-2fa-btn ${twoFactorEnabled ? 'st-2fa-btn--manage' : 'st-2fa-btn--enable'}`}
              onClick={() => setShow2FA(true)}
            >
              {twoFactorEnabled ? 'Manage' : 'Enable'}
            </button>
          </div>

          <div className="st-2fa-row">
            <div className="st-2fa-left">
              <div className="st-2fa-icon" aria-hidden="true">💻</div>
              <div className="st-2fa-info">
                <span className="st-2fa-label">Active Sessions</span>
                <span className="st-2fa-status" style={{background: '#f5f4f2', color: '#5b5c5a', border: '2px solid #dad4c8'}}>
                  Manage Devices
                </span>
              </div>
            </div>
            <button
              className="st-2fa-btn st-2fa-btn--manage"
              onClick={() => setShowSessions(true)}
            >
              View All
            </button>
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
          <div className="st-legal-row">
            <span>Privacy Policy</span>
            <span className="material-symbols-outlined" style={{ color: '#5b5c5a', fontSize: 20 }}>chevron_right</span>
          </div>
          <div className="st-legal-row">
            <span>Terms of Service</span>
            <span className="material-symbols-outlined" style={{ color: '#5b5c5a', fontSize: 20 }}>chevron_right</span>
          </div>
          <div className="st-legal-row" onClick={() => setShowExport(true)}>
            <span>Export My Data</span>
            <span className="material-symbols-outlined" style={{ color: '#5b5c5a', fontSize: 20 }}>download</span>
          </div>
          <div className="st-legal-row st-legal-row--danger" onClick={() => setShowDelete(true)}>
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

      {show2FA && (
        <TwoFactorSetup
          isEnabled={twoFactorEnabled}
          onClose={() => setShow2FA(false)}
          onSuccess={({ enabled }) => {
            // Update user in store so badge reflects new state
            authStore.getState().updateProfile({ two_factor_enabled: enabled });
            if (!enabled) setShow2FA(false);
          }}
        />
      )}
      {showSessions && <SessionsManager onClose={() => setShowSessions(false)} />}
      {showExport && <ExportManager onClose={() => setShowExport(false)} />}
      {showDelete && <DeleteAccountManager onClose={() => setShowDelete(false)} />}
    </div>
  );
}
