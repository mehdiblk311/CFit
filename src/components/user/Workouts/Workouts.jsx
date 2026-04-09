import { useState } from 'react';
import './Workouts.css';

// ── Data ─────────────────────────────────────────────────────────────

const PROGRAMS = [
  {
    id: 'push',
    name: 'Push Day',
    tag: 'HYPERTROPHY',
    tagColor: 'green',
    accentColor: '#38671a',
    exerciseCount: 6,
    duration: 55,
    lastDone: '2 days ago',
    sticker: 'PR STREAK',
    stickerRotate: 6,
    exerciseList: [
      { name: 'Barbell Bench Press', muscle: 'Chest',           sets: 4, reps: '8-12',      pr: '85kg x 8'  },
      { name: 'Incline DB Press',    muscle: 'Upper Chest',     sets: 3, reps: '10-12',     pr: '30kg x 12' },
      { name: 'Overhead Press',      muscle: 'Shoulders',       sets: 3, reps: '8-10',      pr: '50kg x 8'  },
      { name: 'Tricep Pushdown',     muscle: 'Triceps',         sets: 3, reps: '12-15',     pr: null        },
      { name: 'Lateral Raises',      muscle: 'Shoulders',       sets: 4, reps: '15-20',     pr: null        },
      { name: 'Weighted Dips',       muscle: 'Chest & Triceps', sets: 3, reps: 'AMRAP',     pr: null        },
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    tag: 'STRENGTH',
    tagColor: 'purple',
    accentColor: '#5d3fd3',
    exerciseCount: 8,
    duration: 65,
    lastDone: '4 days ago',
    sticker: null,
    exerciseList: [
      { name: 'Barbell Row',   muscle: 'Back & Rear Delts', sets: 4, reps: '8-12',      pr: '85kg x 8'   },
      { name: 'Pull-up',       muscle: 'Lats & Biceps',     sets: 3, reps: 'To Failure', pr: 'BW + 15kg' },
      { name: 'Cable Row',     muscle: 'Mid Back',          sets: 3, reps: '10-12',     pr: null         },
      { name: 'Face Pulls',    muscle: 'Rear Delts',        sets: 3, reps: '15-20',     pr: null         },
      { name: 'Hammer Curl',   muscle: 'Biceps',            sets: 3, reps: '10-12',     pr: null         },
      { name: 'Lat Pulldown',  muscle: 'Lats',              sets: 3, reps: '10-12',     pr: null         },
      { name: 'Barbell Curl',  muscle: 'Biceps',            sets: 3, reps: '10-12',     pr: null         },
      { name: 'Deadlift',      muscle: 'Full Back',         sets: 3, reps: '5-8',       pr: null         },
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    tag: null,
    tagColor: null,
    accentColor: '#b02500',
    exerciseCount: 5,
    duration: 45,
    lastDone: '1 week ago',
    sticker: 'DREAD IT',
    stickerRotate: -3,
    exerciseList: [
      { name: 'Barbell Squat',       muscle: 'Quads & Glutes', sets: 4, reps: '8-10',  pr: null },
      { name: 'Romanian Deadlift',   muscle: 'Hamstrings',     sets: 3, reps: '10-12', pr: null },
      { name: 'Leg Press',           muscle: 'Quads',          sets: 3, reps: '12-15', pr: null },
      { name: 'Leg Curl',            muscle: 'Hamstrings',     sets: 3, reps: '12-15', pr: null },
      { name: 'Calf Raises',         muscle: 'Calves',         sets: 4, reps: '20-25', pr: null },
    ],
  },
];

const LIBRARY = [
  { name: 'Bench Press',        muscle: 'Chest',      cat: 'Push', icon: 'fitness_center' },
  { name: 'Incline Press',      muscle: 'Upper Chest',cat: 'Push', icon: 'fitness_center' },
  { name: 'Overhead Press',     muscle: 'Shoulders',  cat: 'Push', icon: 'fitness_center' },
  { name: 'Tricep Dips',        muscle: 'Triceps',    cat: 'Push', icon: 'fitness_center' },
  { name: 'Lateral Raises',     muscle: 'Shoulders',  cat: 'Push', icon: 'fitness_center' },
  { name: 'Pull-up',            muscle: 'Lats',       cat: 'Pull', icon: 'accessibility_new' },
  { name: 'Barbell Row',        muscle: 'Mid Back',   cat: 'Pull', icon: 'accessibility_new' },
  { name: 'Cable Row',          muscle: 'Back',       cat: 'Pull', icon: 'accessibility_new' },
  { name: 'Lat Pulldown',       muscle: 'Lats',       cat: 'Pull', icon: 'accessibility_new' },
  { name: 'Barbell Curl',       muscle: 'Biceps',     cat: 'Pull', icon: 'accessibility_new' },
  { name: 'Barbell Squat',      muscle: 'Quads',      cat: 'Legs', icon: 'directions_run' },
  { name: 'Romanian Deadlift',  muscle: 'Hamstrings', cat: 'Legs', icon: 'directions_run' },
  { name: 'Leg Press',          muscle: 'Quads',      cat: 'Legs', icon: 'directions_run' },
  { name: 'Calf Raises',        muscle: 'Calves',     cat: 'Legs', icon: 'directions_run' },
  { name: 'Plank',              muscle: 'Core',       cat: 'Core', icon: 'self_improvement' },
  { name: 'Cable Crunch',       muscle: 'Abs',        cat: 'Core', icon: 'self_improvement' },
  { name: 'Russian Twist',      muscle: 'Obliques',   cat: 'Core', icon: 'self_improvement' },
  { name: 'Running',            muscle: 'Full Body',  cat: 'Cardio', icon: 'sprint' },
  { name: 'Jump Rope',          muscle: 'Full Body',  cat: 'Cardio', icon: 'sprint' },
];

const CALENDAR_DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const HISTORY_SESSIONS = [
  { day: 2,  dot: 'green',  session: { name: 'Push Day',  duration: '62m', volume: '3.8k kg', sets: 16 } },
  { day: 4,  dot: 'purple', session: { name: 'Pull Day',  duration: '71m', volume: '4.1k kg', sets: 18 } },
  { day: 6,  dot: 'ube',    session: { name: 'Cardio',    duration: '35m', volume: '—',       sets: 0  } },
  { day: 9,  dot: 'green',  session: { name: 'Push Day',  duration: '72m', volume: '4.2k kg', sets: 18 } },
  { day: 11, dot: 'green',  session: { name: 'Push Day',  duration: '58m', volume: '3.5k kg', sets: 14 } },
  { day: 13, dot: 'purple', session: { name: 'Pull Day',  duration: '68m', volume: '4.0k kg', sets: 17 } },
];

// ── Context Nav ───────────────────────────────────────────────────────

const CTX_NAV = [
  { id: 'close',    icon: 'close',         label: 'Close'    },
  { id: 'programs', icon: 'grid_view',     label: 'Programs' },
  { id: 'library',  icon: 'book',          label: 'Library'  },
  { id: 'workout',  icon: 'fitness_center',label: 'Workout'  },
  { id: 'history',  icon: 'history',       label: 'History'  },
];

function WorkoutContextNav({ active, onChange, onClose }) {
  return (
    <nav className="wk-ctx-nav">
      {CTX_NAV.map(item => {
        const isClose = item.id === 'close';
        const isActive = !isClose && item.id === active;
        return (
          <button
            key={item.id}
            className={`wk-ctx-btn${isActive ? ' wk-ctx-btn--active' : ''}${isClose ? ' wk-ctx-btn--close' : ''}`}
            onClick={() => isClose ? onClose() : onChange(item.id)}
            aria-label={item.label}
          >
            <span className="material-symbols-outlined wk-ctx-icon">{item.icon}</span>
            <span className="wk-ctx-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Programs View ─────────────────────────────────────────────────────

function ProgramsView({ onProgramStart }) {
  return (
    <div className="wk-view">
      {/* Header */}
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Your Regimen</span>
          <h2 className="wk-heading">Workouts</h2>
        </div>
        <div className="wk-header-badge">3 programs</div>
      </div>

      {/* Program Cards */}
      <div className="wk-cards-list">
        {PROGRAMS.map((prog, i) => (
          <div key={prog.id} className={`wk-card wk-card--${i % 2 === 0 ? 'a' : 'b'}`}>
            {prog.sticker && (
              <div
                className="wk-sticker"
                style={{ transform: `rotate(${prog.stickerRotate}deg)`, background: prog.accentColor }}
              >
                {prog.sticker}
              </div>
            )}
            <div className="wk-card-accent" style={{ background: prog.accentColor }} />
            <div className="wk-card-body">
              <div className="wk-card-top">
                <h3 className="wk-card-name">{prog.name}</h3>
                {prog.tag && (
                  <span
                    className="wk-card-tag"
                    style={{
                      background: prog.tagColor === 'green' ? '#c3fb9c' : '#b4a5ff',
                      color: prog.tagColor === 'green' ? '#214f01' : '#180058',
                      transform: `rotate(${prog.tagColor === 'green' ? 3 : -2}deg)`,
                    }}
                  >
                    {prog.tag}
                  </span>
                )}
              </div>
              <div className="wk-card-meta">
                <div className="wk-card-meta-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fitness_center</span>
                  <span>{prog.exerciseCount} exercises</span>
                </div>
                <div className="wk-card-meta-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                  <span>{prog.duration} mins</span>
                </div>
              </div>
              <p className="wk-card-last">Last: {prog.lastDone}</p>
            </div>
            <button
              className="wk-card-play"
              style={{
                background: prog.accentColor,
                borderColor: prog.accentColor,
              }}
              onClick={() => onProgramStart(prog)}
              aria-label={`Start ${prog.name}`}
            >
              <span className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Create New Banner */}
      <div className="wk-create-banner">
        <h4 className="wk-create-title">Ready for a new craft?</h4>
        <p className="wk-create-desc">Explore templates or build from scratch</p>
        <button className="wk-create-btn">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Browse Templates
        </button>
      </div>

      {/* FAB */}
      <button className="wk-fab" aria-label="Create new program">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}

// ── Library View ──────────────────────────────────────────────────────

const LIB_CATS = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];

function LibraryView() {
  const [search, setSearch] = useState('');
  const [cat, setCat]       = useState('All');

  const filtered = LIBRARY.filter(ex => {
    const matchesCat    = cat === 'All' || ex.cat === cat;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
                          ex.muscle.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Browse Movements</span>
          <h2 className="wk-heading">Library</h2>
        </div>
      </div>

      {/* Search */}
      <div className="wk-search-wrap">
        <span className="material-symbols-outlined wk-search-icon">search</span>
        <input
          className="wk-search"
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="wk-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="wk-cat-chips">
        {LIB_CATS.map(c => (
          <button
            key={c}
            className={`wk-cat-chip${cat === c ? ' wk-cat-chip--active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="wk-lib-list">
        {filtered.length === 0 ? (
          <div className="wk-empty">
            <span className="material-symbols-outlined wk-empty-icon">search_off</span>
            <p>No exercises found.</p>
          </div>
        ) : (
          filtered.map((ex, i) => (
            <div key={i} className="wk-lib-item">
              <div className="wk-lib-icon">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 20 }}>
                  {ex.icon}
                </span>
              </div>
              <div className="wk-lib-info">
                <span className="wk-lib-name">{ex.name}</span>
                <span className="wk-lib-muscle">{ex.muscle}</span>
              </div>
              <span className={`wk-lib-cat wk-lib-cat--${ex.cat.toLowerCase()}`}>{ex.cat}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Workout Detail View ───────────────────────────────────────────────

function WorkoutDetailView({ program, onWorkoutComplete }) {
  if (!program) {
    return (
      <div className="wk-view wk-view--center">
        <div className="wk-empty-state">
          <div className="wk-empty-state-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 48, color: '#38671a' }}>
              play_circle
            </span>
          </div>
          <h3 className="wk-empty-state-title">No Program Selected</h3>
          <p className="wk-empty-state-desc">Go to Programs and tap the play button on any program to preview it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wk-view">
      {/* Hero */}
      <div className="wk-detail-hero">
        <p className="wk-eyebrow">Estimated Duration</p>
        <h2 className="wk-detail-duration" style={{ color: program.accentColor }}>
          {program.duration} MINS
        </h2>
        <div className="wk-detail-pills">
          <span className="wk-detail-pill wk-detail-pill--green">
            {program.exerciseCount} EXERCISES
          </span>
          {program.tag && (
            <span className="wk-detail-pill wk-detail-pill--neutral">{program.tag}</span>
          )}
        </div>
      </div>

      {/* Exercise list */}
      <div className="wk-ex-list">
        {program.exerciseList.map((ex, i) => (
          <div key={i} className="wk-ex-card">
            <div className="wk-ex-card-top">
              <div className="wk-ex-card-left">
                <span className="wk-ex-muscle">{ex.muscle}</span>
                <h4 className="wk-ex-name">{ex.name}</h4>
              </div>
              {ex.pr && (
                <div className="wk-ex-pr" style={{ background: program.accentColor }}>
                  PR: {ex.pr}
                </div>
              )}
            </div>
            <div className="wk-ex-grid">
              <div className="wk-ex-stat">
                <p className="wk-ex-stat-label">Target Sets</p>
                <p className="wk-ex-stat-val">{ex.sets} Sets</p>
              </div>
              <div className="wk-ex-stat">
                <p className="wk-ex-stat-label">Rep Range</p>
                <p className="wk-ex-stat-val">{ex.reps}</p>
              </div>
            </div>
            {/* Volume trend sparkline */}
            <div className="wk-sparkline">
              <p className="wk-ex-stat-label">Volume Trend</p>
              <div className="wk-spark-bars">
                {[20, 40, 35, 60, 50, 75, 90].map((h, j) => (
                  <div
                    key={j}
                    className="wk-spark-bar"
                    style={{ height: `${h}%`, background: program.accentColor, opacity: 0.3 + j * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Start Workout CTA */}
      <div className="wk-detail-cta">
        <button className="wk-start-btn" onClick={onWorkoutComplete}>
          <span>Start Workout</span>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
        </button>
      </div>
    </div>
  );
}

// ── History View ──────────────────────────────────────────────────────

function HistoryView() {
  const [selectedDay, setSelectedDay] = useState(9);
  const selectedSession = HISTORY_SESSIONS.find(s => s.day === selectedDay)?.session ?? null;

  // Build calendar for October 2023 (starts on Sunday → offset of 6 Mon-based)
  const prevDays = [25, 26, 27, 28, 29, 30];
  const currDays = Array.from({ length: 22 }, (_, i) => i + 1);

  const dotMap = {};
  HISTORY_SESSIONS.forEach(s => { dotMap[s.day] = s.dot; });

  const dotColor = { green: '#38671a', purple: '#5d3fd3', ube: '#b4a5ff' };

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Your Archive</span>
          <h2 className="wk-heading">History</h2>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="wk-cal-card">
        <div className="wk-cal-header">
          <div>
            <span className="wk-eyebrow">October 2023</span>
            <h3 className="wk-cal-title">The Routine</h3>
          </div>
          <div className="wk-cal-nav">
            <button className="wk-cal-nav-btn" aria-label="Previous month">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="wk-cal-nav-btn" aria-label="Next month">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="wk-cal-grid">
          {CALENDAR_DAYS.map(d => (
            <div key={d} className="wk-cal-day-hdr">{d}</div>
          ))}
          {/* Prev month faded */}
          {prevDays.map(d => (
            <div key={`p${d}`} className="wk-cal-day wk-cal-day--prev">{d}</div>
          ))}
          {/* Current month */}
          {currDays.map(d => {
            const dot = dotMap[d];
            const isSelected = d === selectedDay;
            return (
              <button
                key={d}
                className={`wk-cal-day${isSelected ? ' wk-cal-day--active' : ''}${dot ? ' wk-cal-day--has-dot' : ''}`}
                onClick={() => setSelectedDay(d)}
              >
                {d}
                {dot && !isSelected && (
                  <span className="wk-cal-dot" style={{ background: dotColor[dot] }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="wk-cal-legend">
          {[['Strength', '#38671a'], ['Mobility', '#5d3fd3'], ['Cardio', '#b4a5ff']].map(([label, color]) => (
            <div key={label} className="wk-cal-legend-item">
              <span className="wk-cal-legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session Detail */}
      {selectedSession ? (
        <div className="wk-sess-section">
          <div className="wk-sess-title-row">
            <h3 className="wk-sess-date">October {String(selectedDay).padStart(2, '0')} Details</h3>
            <span className="wk-sess-badge">Strength Session</span>
          </div>

          <div className="wk-sess-cards">
            {/* Meta card */}
            <div className="wk-sess-meta-card">
              <div className="wk-sess-meta-bg-icon">
                <span className="material-symbols-outlined">fitness_center</span>
              </div>
              <h4 className="wk-sess-meta-name">{selectedSession.name}</h4>
              <div className="wk-sess-stats">
                <div>
                  <p className="wk-ex-stat-label">Duration</p>
                  <p className="wk-sess-stat-val">{selectedSession.duration}</p>
                </div>
                {selectedSession.volume !== '—' && (
                  <div>
                    <p className="wk-ex-stat-label">Volume</p>
                    <p className="wk-sess-stat-val">{selectedSession.volume}</p>
                  </div>
                )}
                {selectedSession.sets > 0 && (
                  <div>
                    <p className="wk-ex-stat-label">Sets</p>
                    <p className="wk-sess-stat-val">{selectedSession.sets}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Volume chart */}
            <div className="wk-vol-card">
              <div className="wk-vol-header">
                <h4 className="wk-vol-title">Volume Trend</h4>
                <div className="wk-vol-tabs">
                  {['1W','1M','3M'].map(t => (
                    <button key={t} className={`wk-vol-tab${t === '1M' ? ' wk-vol-tab--active' : ''}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="wk-chart">
                {[40, 60, 45, 75, 85, 65, 50, 60, 40, 30, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="wk-chart-bar"
                    style={{ height: `${h}%`, opacity: i === 11 ? 1 : 0.4 }}
                  />
                ))}
              </div>
              <div className="wk-chart-labels">
                <span className="wk-eyebrow">Sep 01</span>
                <span className="wk-eyebrow">Oct 01</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="wk-sess-empty">
          <span className="material-symbols-outlined wk-empty-icon">event_busy</span>
          <p>No session on this day. Select a highlighted day to view details.</p>
        </div>
      )}
    </div>
  );
}

// ── Workout Summary ───────────────────────────────────────────────────

function WorkoutSummary({ program, onClose }) {
  const [notes, setNotes] = useState('');

  return (
    <div className="wk-summary-root">
      {/* Hero */}
      <div className="wk-summary-hero">
        <div className="wk-summary-check">
          <span className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: 40, color: '#38671a' }}>
            check_circle
          </span>
        </div>
        <h2 className="wk-summary-title">Great Session!</h2>
        <div className="wk-summary-badge" style={{ background: program.accentColor }}>
          {program.name}
        </div>
      </div>

      {/* Stats Bento */}
      <div className="wk-summary-bento">
        <div className="wk-summary-stat wk-summary-stat--full">
          <p className="wk-ex-stat-label">Total Volume</p>
          <p className="wk-summary-big">12,450 <span className="wk-summary-unit">kg</span></p>
        </div>
        <div className="wk-summary-stat">
          <p className="wk-ex-stat-label">Duration</p>
          <p className="wk-summary-med">1h {program.duration % 60}m</p>
        </div>
        <div className="wk-summary-stat wk-summary-stat--green">
          <p className="wk-ex-stat-label" style={{ color: '#3d6c1f' }}>Exercises</p>
          <p className="wk-summary-med" style={{ color: '#214f01' }}>
            {program.exerciseCount - 1}/{program.exerciseCount}
          </p>
        </div>
      </div>

      {/* PR Milestone */}
      {program.exerciseList.some(ex => ex.pr) && (
        <div className="wk-pr-card">
          <div className="wk-pr-float-sticker">Heavy Hitter</div>
          <h4 className="wk-ex-stat-label" style={{ marginBottom: 12 }}>Milestones Reached</h4>
          {program.exerciseList.filter(ex => ex.pr).map((ex, i) => (
            <div key={i} className="wk-pr-row">
              <div className="wk-pr-icon" style={{ background: program.accentColor }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: '#d6ffb7', fontSize: 22 }}>
                  military_tech
                </span>
              </div>
              <div>
                <p className="wk-pr-exercise">{ex.name}: {ex.pr}</p>
                <p className="wk-pr-sub">New PR! +5% since last week</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="wk-notes">
        <label className="wk-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Session Notes</label>
        <textarea
          className="wk-notes-input"
          placeholder="How did you feel today? Any fatigue or highlights?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="wk-summary-actions">
        <button className="wk-save-btn" onClick={onClose}>
          Save Workout
          <span className="material-symbols-outlined">send</span>
        </button>
        <button className="wk-discard-btn" onClick={onClose}>
          Discard Session
        </button>
      </div>
    </div>
  );
}

// ── Main Workouts ─────────────────────────────────────────────────────

export default function Workouts({ onClose }) {
  const [wkTab,           setWkTab]           = useState('programs');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showSummary,     setShowSummary]     = useState(false);

  function handleProgramStart(program) {
    setSelectedProgram(program);
    setWkTab('workout');
  }

  function handleWorkoutComplete() {
    setShowSummary(true);
  }

  function handleSummaryClose() {
    setShowSummary(false);
    setSelectedProgram(null);
    setWkTab('programs');
  }

  if (showSummary) {
    return <WorkoutSummary program={selectedProgram} onClose={handleSummaryClose} />;
  }

  return (
    <div className="wk-root">
      <div className="wk-scroll-area">
        {wkTab === 'programs' && (
          <ProgramsView onProgramStart={handleProgramStart} />
        )}
        {wkTab === 'library' && (
          <LibraryView />
        )}
        {wkTab === 'workout' && (
          <WorkoutDetailView
            program={selectedProgram}
            onWorkoutComplete={handleWorkoutComplete}
          />
        )}
        {wkTab === 'history' && (
          <HistoryView />
        )}
      </div>

      <WorkoutContextNav
        active={wkTab}
        onChange={setWkTab}
        onClose={onClose ?? (() => {})}
      />
    </div>
  );
}
