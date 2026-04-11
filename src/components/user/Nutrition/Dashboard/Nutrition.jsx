import { useNavigate } from 'react-router-dom';
import './Nutrition.css';

/* ── Static data (replace with real state/API later) ───────────────── */
const MACROS = {
  calories:     { consumed: 1840, goal: 2300 },
  protein:      { consumed: 142,  goal: 180 },
  carbs:        { consumed: 185,  goal: 240 },
  fats:         { consumed: 52,   goal: 65  },
};

const MEALS = [
  {
    id: 'breakfast',
    label: 'Breakfast',
    kcal: 420,
    items: [
      { id: 'eggs',  name: 'Scrambled Eggs (3)', emoji: '🍳' },
      { id: 'toast', name: 'Whole Grain Toast',   emoji: '🍞' },
    ],
  },
  {
    id: 'lunch',
    label: 'Lunch',
    kcal: 650,
    items: [
      { id: 'bowl', name: 'Chicken Quinoa Bowl', emoji: '🥗' },
    ],
  },
  { id: 'dinner', label: 'Dinner', kcal: 0, items: [] },
  { id: 'snacks', label: 'Snacks', kcal: 0, items: [] },
];

const WEIGHT_BARS = [80, 85, 82, 75, 78, 70, 65];
const WEIGHT_LABELS = ['MAR 04', 'MAR 14', 'MAR 24', 'APR 04'];

export default function Nutrition() {
  const navigate = useNavigate();

  const { calories, protein, carbs, fats } = MACROS;
  const kcalLeft = calories.goal - calories.consumed;

  /* SVG ring math */
  const R = 88;
  const CIRC = 2 * Math.PI * R;
  const progress = calories.consumed / calories.goal;
  const offset = CIRC * (1 - progress);

  /* Today's date display */
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="nd-root">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="nd-header">
        <div className="nd-header-left">
          <div className="nd-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 22, color: '#38671a' }}>
              person
            </span>
          </div>
          <h1 className="nd-title">Nutrition</h1>
        </div>
        <div className="nd-header-right">
          <div className="nd-date-pill">
            <span className="nd-date-text">Today, {today}</span>
            <span className="material-symbols-outlined nd-date-icon">calendar_today</span>
          </div>
          <button
            id="nd-history-btn"
            className="nd-icon-btn"
            onClick={() => navigate('/nutrition/history')}
            aria-label="View nutrition history"
          >
            <span className="material-symbols-outlined">history</span>
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main className="nd-main">

        {/* Macro Dashboard */}
        <section className="nd-macro-card">
          <div className="nd-macro-inner">

            {/* Calorie Ring */}
            <div className="nd-ring-wrap">
              <svg className="nd-ring-svg" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r={R} fill="transparent" stroke="#dad4c8" strokeWidth="16" />
                <circle
                  cx="96" cy="96" r={R} fill="transparent"
                  stroke="#38671a" strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={offset}
                  transform="rotate(-90 96 96)"
                  className="nd-ring-progress"
                />
              </svg>
              <div className="nd-ring-center">
                <span className="nd-ring-kcal">{calories.consumed.toLocaleString()}</span>
                <span className="nd-ring-goal">/ {calories.goal.toLocaleString()} KCAL</span>
              </div>
              <div className="nd-ring-sticker">{kcalLeft} KCAL LEFT</div>
            </div>

            {/* Macro Bars */}
            <div className="nd-bars">
              {[
                { label: 'Protein', data: protein, color: '#38671a' },
                { label: 'Carbs',   data: carbs,   color: '#5d3fd3' },
                { label: 'Fats',    data: fats,    color: '#f95630' },
              ].map(({ label, data, color }) => (
                <div key={label} className="nd-bar-row">
                  <div className="nd-bar-labels">
                    <span>{label}</span>
                    <span>{data.consumed}g / {data.goal}g</span>
                  </div>
                  <div className="nd-bar-track">
                    <div
                      className="nd-bar-fill"
                      style={{ width: `${(data.consumed / data.goal) * 100}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Meal Cards Grid ──────────────────────────────────────── */}
        <div className="nd-meals-grid">
          {MEALS.map((meal, i) => {
            const isEmpty = meal.items.length === 0;
            const rotate = i % 2 === 0 ? 'nd-card--tilt-left' : 'nd-card--tilt-right';
            if (isEmpty) {
              return (
                <div
                  key={meal.id}
                  id={`nd-meal-${meal.id}`}
                  className="nd-card nd-card--empty"
                  onClick={() => navigate(`/nutrition/food-search?meal=${meal.id}`)}
                  role="button"
                  aria-label={`Add food to ${meal.label}`}
                >
                  <h3 className="nd-card-title nd-card-title--faded">{meal.label}</h3>
                  <span className="nd-card-empty-label">NO ITEMS LOGGED</span>
                  <button className="nd-card-add-circle" tabIndex={-1}>
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
              );
            }
            return (
              <div key={meal.id} id={`nd-meal-${meal.id}`} className={`nd-card ${rotate}`}>
                <div>
                  <div className="nd-card-header">
                    <h3 className="nd-card-title">{meal.label}</h3>
                    <span className="nd-card-kcal-pill">{meal.kcal} KCAL</span>
                  </div>
                  <ul className="nd-card-items">
                    {meal.items.map(item => (
                      <li key={item.id} className="nd-card-item">
                        <div className="nd-item-thumb">{item.emoji}</div>
                        <span className="nd-item-name">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  id={`nd-add-food-${meal.id}`}
                  className="nd-add-food-btn"
                  onClick={() => navigate(`/nutrition/food-search?meal=${meal.id}`)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  ADD FOOD
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Weekly Weight Log ────────────────────────────────────── */}
        <section className="nd-weight-card">
          <div className="nd-weight-top">
            <div>
              <h3 className="nd-weight-title">Weekly&nbsp;&nbsp;&nbsp;Weight&nbsp;&nbsp;&nbsp;&nbsp;Log</h3>
              <p className="nd-weight-desc">Stay consistent with your progress tracking.</p>
            </div>
            <div className="nd-weight-input-row">
              <div className="nd-weight-input-wrap">
                <input
                  id="nd-weight-input"
                  type="text"
                  className="nd-weight-input"
                  placeholder="00.0"
                  aria-label="Enter weight in kg"
                />
                <span className="nd-weight-unit">KG</span>
              </div>
              <button id="nd-log-weight-btn" className="nd-log-btn">LOG WEIGHT</button>
            </div>
          </div>

          {/* Chart */}
          <div className="nd-chart-section">
            <div className="nd-chart-labels">
              <span className="nd-chart-period">1M TREND</span>
              <span className="nd-chart-delta">-1.2 KG THIS MONTH</span>
            </div>
            <div className="nd-chart-bars">
              {WEIGHT_BARS.map((h, idx) => (
                <div
                  key={idx}
                  className={`nd-chart-bar${idx === WEIGHT_BARS.length - 1 ? ' nd-chart-bar--active' : ''}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="nd-chart-x-labels">
              {WEIGHT_LABELS.map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
