import { useAuth } from '../../../hooks/useAuth';
import './Dashboard.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TRAINED = [true, false, true, false, false, true, false];

function MacroRing({ value, total, color, label }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / total) * circ;
  return (
    <div className="dash-ring-wrap">
      <svg className="dash-ring-svg" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="transparent"
          stroke="#e2e3e0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="transparent"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="dash-ring-center">
        <span className="dash-ring-val">{value}g</span>
      </div>
      <span className="dash-ring-label">{label}</span>
    </div>
  );
}

export default function Dashboard({ onTabChange }) {
  const { user } = useAuth();
  const name = user?.name ?? 'Athlete';
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dash-root">
      {/* ── Top Bar ── */}
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">Hey, {firstName}</h1>
          <p className="dash-tagline">The Kinetic Craft is a journey.</p>
        </div>
        <div className="dash-header-right">
          <button className="dash-notif-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="dash-notif-badge">3</span>
          </button>
          <div className="dash-avatar">
            <span>{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="dash-main">
        {/* Card 1: Today's Summary */}
        <section className="dash-card dash-card--summary">
          <div className="dash-card-bg-icon">
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_today
            </span>
          </div>
          <div className="dash-summary-top">
            <div>
              <span className="dash-section-label">Today's Summary</span>
              <h2 className="dash-date">{today}</h2>
            </div>
          </div>
          <div className="dash-summary-grid">
            <div className="dash-stat-box">
              <span className="dash-stat-label">Calories</span>
              <div className="dash-stat-row">
                <span className="dash-stat-val">1,840</span>
                <span className="dash-stat-sub">/ 2,300 kcal</span>
              </div>
            </div>
            <div className="dash-stat-box dash-stat-box--green">
              <span className="dash-stat-label" style={{ color: '#2c5a0d' }}>Workout</span>
              <div className="dash-stat-row">
                <span className="dash-stat-val" style={{ fontSize: 14, color: '#2c5a0d' }}>Push Day</span>
                <span className="material-symbols-outlined" style={{ color: '#38671a', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Macro Rings */}
        <section className="dash-card dash-card--macros">
          <span className="dash-section-label" style={{ color: '#5d3fd3' }}>Macro Progress</span>
          <div className="dash-rings">
            <MacroRing value={120} total={150} color="#38671a"  label="Protein" />
            <MacroRing value={210} total={250} color="#5d3fd3"  label="Carbs"   />
            <MacroRing value={55}  total={75}  color="#f95630"  label="Fats"    />
          </div>
        </section>

        {/* Card 3: Quick Actions */}
        <div className="dash-actions">
          <button className="dash-action-btn dash-action-btn--primary" onClick={() => onTabChange?.('nutrition')}>
            <span className="material-symbols-outlined">nutrition</span>
            <span>Log Meal</span>
          </button>
          <button className="dash-action-btn dash-action-btn--secondary" onClick={() => onTabChange?.('workouts')}>
            <span className="material-symbols-outlined">fitness_center</span>
            <span>Start Workout</span>
          </button>
        </div>

        {/* Card 4: Weekly Workout Counter */}
        <section className="dash-card dash-card--counter">
          <div className="dash-counter-top">
            <div>
              <h3 className="dash-counter-num">3 / 4 workouts</h3>
              <p className="dash-section-label">This Week's Goal</p>
            </div>
            <div className="dash-counter-dots">
              {[1,2,3,4].map(i => (
                <div key={i} className={`dash-counter-dot${i <= 3 ? ' dash-counter-dot--done' : ''}`} />
              ))}
            </div>
          </div>
          <div className="dash-progress-track">
            <div className="dash-progress-fill" style={{ width: '75%' }} />
          </div>
        </section>

        {/* Card 5: Training Streak */}
        <section className="dash-card dash-card--streak">
          <div className="dash-streak-top">
            <span className="dash-section-label" style={{ color: '#38671a' }}>Training Streak</span>
            <div className="dash-streak-badge">🔥 12 Days</div>
          </div>
          <div className="dash-calendar">
            {DAYS.map((day, i) => (
              <div key={day} className="dash-day-col">
                <span className={`dash-day-name${i === 5 ? ' dash-day-name--today' : ''}`}>{day}</span>
                <div className={`dash-day-dot${TRAINED[i] ? ' dash-day-dot--done' : ''}${i === 5 ? ' dash-day-dot--today' : ''}`}>
                  {TRAINED[i] && (
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#fff' }}>done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
