import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NutritionHistory.css';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/* Days that have logged data (dots) */
const LOGGED_DAYS = new Set([1, 2, 3, 6, 7]);
const SELECTED_DAY = 4;

const DAILY_BARS = [60, 75, 55, 85, 70, 90, 65, 50];
const MACRO_STACKS = [
  { p: 40, c: 30, f: 20 },
  { p: 45, c: 25, f: 25 },
  { p: 35, c: 35, f: 20 },
  { p: 50, c: 20, f: 15 },
];

const TIME_RANGES = ['1W', '1M', '3M'];

const INSIGHTS = [
  { icon: 'eco',       text: 'Fiber Goal Met 5/7 Days',    bg: '#dddddb', rot: -2, border: '#dad4c8' },
  { icon: 'water_drop',text: 'Hydration Peak: 3.2L',        bg: '#b4a5ff', rot:  3, border: '#5d3fd3' },
  { icon: 'restaurant',text: 'Balanced Breakfasts Streak',  bg: '#c3fb9c', rot: -1, border: '#38671a' },
];

export default function NutritionHistory() {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState('1M');

  return (
    <div className="nh-root">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <nav className="nh-header">
        <div className="nh-header-left">
          <button
            id="nh-back-btn"
            className="nh-back-btn"
            onClick={() => navigate('/nutrition')}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="nh-title">Nutrition History</h1>
        </div>
        <div className="nh-header-right">
          <span className="nh-logged-label">Logged</span>
          <div className="nh-avatar">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20, color: '#38671a' }}>person</span>
          </div>
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="nh-main">

        {/* Calendar + Summary */}
        <section className="nh-cal-section">
          {/* Calendar */}
          <div className="nh-calendar-card">
            <div className="nh-cal-header">
              <h2 className="nh-cal-month">October 2023</h2>
              <div className="nh-cal-nav">
                <button className="nh-cal-nav-btn" aria-label="Previous month">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="nh-cal-nav-btn" aria-label="Next month">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="nh-cal-grid">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="nh-cal-day-label">{d}</div>
              ))}
              {/* Empty offset cells */}
              {[25, 26, 27, 28, 29, 30].map(n => (
                <div key={`prev-${n}`} className="nh-cal-cell nh-cal-cell--dim">{n}</div>
              ))}
              {/* October days 1–7 */}
              {[1, 2, 3, 4, 5, 6, 7].map(d => {
                const isSelected = d === SELECTED_DAY;
                const hasLog = LOGGED_DAYS.has(d);
                return (
                  <button
                    key={d}
                    id={`nh-day-${d}`}
                    className={`nh-cal-cell nh-cal-cell--btn${isSelected ? ' nh-cal-cell--selected' : ''}`}
                  >
                    {d}
                    {hasLog && (
                      <span className={`nh-day-dot${isSelected ? ' nh-day-dot--light' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Summary */}
          <div className="nh-summary-card">
            <span className="nh-summary-tag">Selected Date</span>
            <h3 className="nh-summary-date">Oct 04, 2023</h3>
            <div className="nh-summary-body">
              <div className="nh-summary-cal-row">
                <span className="nh-summary-cal-label">Total Calories</span>
                <span className="nh-summary-cal-val">2,140 kcal</span>
              </div>
              <div className="nh-progress-track">
                <div className="nh-progress-fill" style={{ width: '85%' }} />
              </div>
              <div className="nh-macros-grid">
                {[
                  { label: 'Prot', val: '160g', bg: '#c3fb9c' },
                  { label: 'Carb', val: '210g', bg: '#b4a5ff' },
                  { label: 'Fat',  val: '72g',  bg: '#e8e2d6' },
                ].map(m => (
                  <div key={m.label} className="nh-macro-chip" style={{ background: m.bg }}>
                    <span className="nh-macro-chip-label">{m.label}</span>
                    <span className="nh-macro-chip-val">{m.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              id="nh-view-journal-btn"
              className="nh-view-journal-btn"
              onClick={() => navigate('/nutrition')}
            >
              View Full Journal
            </button>
          </div>
        </section>

        {/* Time Range Selector */}
        <div className="nh-range-wrap">
          <div className="nh-range-group">
            {TIME_RANGES.map(r => (
              <button
                key={r}
                id={`nh-range-${r}`}
                className={`nh-range-btn${activeRange === r ? ' nh-range-btn--active' : ''}`}
                onClick={() => setActiveRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="nh-charts-grid">
          {/* Daily Calories */}
          <div className="nh-chart-card">
            <div className="nh-chart-card-header">
              <h4 className="nh-chart-card-title">Daily Calories</h4>
              <span className="material-symbols-outlined" style={{ color: '#38671a' }}>show_chart</span>
            </div>
            <div className="nh-bar-chart">
              <div className="nh-bar-chart-grid">
                <div className="nh-grid-line" />
                <div className="nh-grid-line" />
                <div className="nh-grid-line" />
              </div>
              {DAILY_BARS.map((h, i) => (
                <div key={i} className="nh-bar-col">
                  <div
                    className={`nh-bar-item${i === 5 ? ' nh-bar-item--accent' : ''}`}
                    style={{ height: `${h}%` }}
                  />
                  {i === 5 && <span className="nh-bar-tooltip">2.3k</span>}
                </div>
              ))}
            </div>
            <div className="nh-chart-x-axis">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="nh-chart-card">
            <div className="nh-chart-card-header">
              <h4 className="nh-chart-card-title">Macro Breakdown</h4>
              <span className="material-symbols-outlined" style={{ color: '#5d3fd3' }}>donut_small</span>
            </div>
            <div className="nh-stacked-chart">
              {MACRO_STACKS.map((s, i) => (
                <div key={i} className="nh-stack-col">
                  <div className="nh-stack-seg nh-stack-seg--protein" style={{ height: `${s.p}%` }} />
                  <div className="nh-stack-seg nh-stack-seg--carbs"   style={{ height: `${s.c}%` }} />
                  <div className="nh-stack-seg nh-stack-seg--fats"    style={{ height: `${s.f}%` }} />
                </div>
              ))}
            </div>
            <div className="nh-legend">
              {[
                { label: 'Protein', color: '#38671a' },
                { label: 'Carbs',   color: '#5d3fd3' },
                { label: 'Fats',    color: '#e8e2d6', border: '#dad4c8' },
              ].map(l => (
                <div key={l.label} className="nh-legend-item">
                  <span className="nh-legend-dot" style={{ background: l.color, border: l.border ? `1px solid ${l.border}` : 'none' }} />
                  <span className="nh-legend-label">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Stickers */}
        <section className="nh-insights">
          <h4 className="nh-insights-heading">Recent Insights</h4>
          <div className="nh-insights-strip">
            {INSIGHTS.map((ins, i) => (
              <div
                key={i}
                className="nh-insight-card"
                style={{
                  background: ins.bg,
                  borderColor: ins.border,
                  transform: `rotate(${ins.rot}deg)`,
                }}
              >
                <span className="material-symbols-outlined" style={{ color: ins.border }}>
                  {ins.icon}
                </span>
                <p className="nh-insight-text">{ins.text}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
