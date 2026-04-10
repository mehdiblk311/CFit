import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
      { name: 'Barbell Bench Press', muscle: 'Chest',           sets: 4, reps: '8-12',      pr: '85kg x 8',  icon: '🏋️' },
      { name: 'Incline DB Press',    muscle: 'Upper Chest',     sets: 3, reps: '10-12',     pr: '30kg x 12', icon: '💪' },
      { name: 'Overhead Press',      muscle: 'Shoulders',       sets: 3, reps: '8-10',      pr: '50kg x 8',  icon: '🔝' },
      { name: 'Tricep Pushdown',     muscle: 'Triceps',         sets: 3, reps: '12-15',     pr: null,        icon: '💪' },
      { name: 'Lateral Raises',      muscle: 'Shoulders',       sets: 4, reps: '15-20',     pr: null,        icon: '🦾' },
      { name: 'Weighted Dips',       muscle: 'Chest & Triceps', sets: 3, reps: 'AMRAP',     pr: null,        icon: '⬇️' },
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
      { name: 'Barbell Row',   muscle: 'Back & Rear Delts', sets: 4, reps: '8-12',       pr: '85kg x 8',  icon: '🏋️' },
      { name: 'Pull-up',       muscle: 'Lats & Biceps',     sets: 3, reps: 'To Failure',  pr: 'BW + 15kg', icon: '🔝' },
      { name: 'Cable Row',     muscle: 'Mid Back',          sets: 3, reps: '10-12',      pr: null,        icon: '🔗' },
      { name: 'Face Pulls',    muscle: 'Rear Delts',        sets: 3, reps: '15-20',      pr: null,        icon: '🎯' },
      { name: 'Hammer Curl',   muscle: 'Biceps',            sets: 3, reps: '10-12',      pr: null,        icon: '🔨' },
      { name: 'Lat Pulldown',  muscle: 'Lats',              sets: 3, reps: '10-12',      pr: null,        icon: '⬇️' },
      { name: 'Barbell Curl',  muscle: 'Biceps',            sets: 3, reps: '10-12',      pr: null,        icon: '💪' },
      { name: 'Deadlift',      muscle: 'Full Back',         sets: 3, reps: '5-8',        pr: null,        icon: '💀' },
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
      { name: 'Barbell Squat',      muscle: 'Quads & Glutes', sets: 4, reps: '8-10',   pr: null, icon: '🦵' },
      { name: 'Romanian Deadlift',  muscle: 'Hamstrings',     sets: 3, reps: '10-12',  pr: null, icon: '🏋️' },
      { name: 'Leg Press',          muscle: 'Quads',          sets: 3, reps: '12-15',  pr: null, icon: '🦵' },
      { name: 'Leg Curl',           muscle: 'Hamstrings',     sets: 3, reps: '12-15',  pr: null, icon: '🔄' },
      { name: 'Calf Raises',        muscle: 'Calves',         sets: 4, reps: '20-25',  pr: null, icon: '🦶' },
    ],
  },
];

const LIBRARY_EXERCISES = [
  { name: 'Bench Press',        muscle: 'Chest',        cat: 'Push',   icon: '🏋️', diff: 'Intermediate', equipment: 'Barbell' },
  { name: 'Incline Press',      muscle: 'Upper Chest',  cat: 'Push',   icon: '💪', diff: 'Intermediate', equipment: 'Dumbbell' },
  { name: 'Overhead Press',     muscle: 'Shoulders',    cat: 'Push',   icon: '🔝', diff: 'Intermediate', equipment: 'Barbell' },
  { name: 'Tricep Dips',        muscle: 'Triceps',      cat: 'Push',   icon: '⬇️', diff: 'Beginner',     equipment: 'Bodyweight' },
  { name: 'Lateral Raises',     muscle: 'Shoulders',    cat: 'Push',   icon: '🦾', diff: 'Beginner',     equipment: 'Dumbbell' },
  { name: 'Pull-up',            muscle: 'Lats',         cat: 'Pull',   icon: '🔝', diff: 'Intermediate', equipment: 'Bodyweight' },
  { name: 'Barbell Row',        muscle: 'Mid Back',     cat: 'Pull',   icon: '🏋️', diff: 'Intermediate', equipment: 'Barbell' },
  { name: 'Cable Row',          muscle: 'Back',         cat: 'Pull',   icon: '🔗', diff: 'Beginner',     equipment: 'Cable' },
  { name: 'Lat Pulldown',       muscle: 'Lats',         cat: 'Pull',   icon: '⬇️', diff: 'Beginner',     equipment: 'Cable' },
  { name: 'Barbell Curl',       muscle: 'Biceps',       cat: 'Pull',   icon: '💪', diff: 'Beginner',     equipment: 'Barbell' },
  { name: 'Barbell Squat',      muscle: 'Quads',        cat: 'Legs',   icon: '🦵', diff: 'Expert',       equipment: 'Barbell' },
  { name: 'Romanian Deadlift',  muscle: 'Hamstrings',   cat: 'Legs',   icon: '🏋️', diff: 'Intermediate', equipment: 'Barbell' },
  { name: 'Leg Press',          muscle: 'Quads',        cat: 'Legs',   icon: '🦵', diff: 'Beginner',     equipment: 'Machine' },
  { name: 'Calf Raises',        muscle: 'Calves',       cat: 'Legs',   icon: '🦶', diff: 'Beginner',     equipment: 'Bodyweight' },
  { name: 'Plank',              muscle: 'Core',         cat: 'Core',   icon: '🧘', diff: 'Beginner',     equipment: 'Bodyweight' },
  { name: 'Cable Crunch',       muscle: 'Abs',          cat: 'Core',   icon: '🔗', diff: 'Beginner',     equipment: 'Cable' },
  { name: 'Russian Twist',      muscle: 'Obliques',     cat: 'Core',   icon: '🔄', diff: 'Beginner',     equipment: 'Bodyweight' },
  { name: 'Running',            muscle: 'Full Body',    cat: 'Cardio', icon: '🏃', diff: 'Beginner',     equipment: 'None' },
  { name: 'Jump Rope',          muscle: 'Full Body',    cat: 'Cardio', icon: '⭕', diff: 'Beginner',     equipment: 'Equipment' },
];

const CALENDAR_DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const HISTORY_SESSIONS = [
  {
    day: 2,  dot: 'green',  session: {
      name: 'Push Day',  duration: '62m', volume: '3.8k kg', sets: 16, sessionNote: 'Overall strong day, managed fatigue well',
      exercises: [
        { name: 'Barbell Bench Press', sets: [{ weight: 80, reps: 10 }, { weight: 82, reps: 9 }, { weight: 85, reps: 8 }, { weight: 85, reps: 8 }], note: 'Felt strong, good chest activation' },
        { name: 'Overhead Press',       sets: [{ weight: 50, reps: 8 }, { weight: 50, reps: 8 }, { weight: 47, reps: 9 }], note: '' },
        { name: 'Lateral Raises',       sets: [{ weight: 12, reps: 15 }, { weight: 12, reps: 15 }, { weight: 12, reps: 14 }, { weight: 12, reps: 13 }], note: 'Shoulder felt tight on last set' },
      ],
    },
  },
  {
    day: 4,  dot: 'purple', session: {
      name: 'Pull Day',  duration: '71m', volume: '4.1k kg', sets: 18, sessionNote: 'Great back day with new PR on rows!',
      exercises: [
        { name: 'Barbell Row',   sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 8 }, { weight: 82, reps: 9 }, { weight: 80, reps: 10 }], note: 'New PR on first set!' },
        { name: 'Pull-up',       sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }], note: '' },
        { name: 'Hammer Curl',   sets: [{ weight: 20, reps: 12 }, { weight: 20, reps: 12 }, { weight: 18, reps: 13 }], note: '' },
      ],
    },
  },
  {
    day: 9,  dot: 'green',  session: {
      name: 'Push Day',  duration: '72m', volume: '4.2k kg', sets: 18, sessionNote: '',
      exercises: [
        { name: 'Barbell Bench Press', sets: [{ weight: 85, reps: 8 }, { weight: 85, reps: 8 }, { weight: 83, reps: 9 }, { weight: 80, reps: 10 }], note: '' },
        { name: 'Weighted Dips',       sets: [{ weight: 20, reps: 10 }, { weight: 20, reps: 9 }, { weight: 20, reps: 8 }], note: 'Added weight this week' },
      ],
    },
  },
  {
    day: 11, dot: 'green',  session: {
      name: 'Push Day',  duration: '58m', volume: '3.5k kg', sets: 14, sessionNote: 'Shorter session but very intense',
      exercises: [
        { name: 'Incline DB Press', sets: [{ weight: 30, reps: 12 }, { weight: 30, reps: 11 }, { weight: 28, reps: 12 }], note: 'Upper chest pump was crazy' },
        { name: 'Tricep Pushdown',  sets: [{ weight: 35, reps: 15 }, { weight: 35, reps: 14 }, { weight: 33, reps: 15 }], note: '' },
      ],
    },
  },
  {
    day: 13, dot: 'purple', session: {
      name: 'Pull Day',  duration: '68m', volume: '4.0k kg', sets: 17, sessionNote: 'Solid foundation session, form over weight',
      exercises: [
        { name: 'Deadlift',      sets: [{ weight: 120, reps: 5 }, { weight: 120, reps: 5 }, { weight: 115, reps: 6 }], note: 'Back tight, focused on form' },
        { name: 'Cable Row',     sets: [{ weight: 65, reps: 12 }, { weight: 65, reps: 12 }, { weight: 62, reps: 13 }], note: '' },
        { name: 'Barbell Curl',  sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }, { weight: 38, reps: 11 }], note: '' },
      ],
    },
  },
];

// ── Context Nav ───────────────────────────────────────────────────────

const CTX_NAV = [
  { id: 'close',    icon: 'close',          label: 'Close'    },
  { id: 'programs', icon: 'grid_view',      label: 'Programs' },
  { id: 'library',  icon: 'book',           label: 'Library'  },
  { id: 'history',  icon: 'history',        label: 'History'  },
];

function WorkoutContextNav({ active, onChange, onClose, visible }) {
  return (
    <nav className={`wk-ctx-nav${visible ? ' wk-ctx-nav--visible' : ''}`}>
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

function ProgramsView({ onProgramPreview, onProgramStart, programs, onCreateProgram }) {
  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Your Regimen</span>
          <h2 className="wk-heading">My Programs</h2>
        </div>
        <div className="wk-header-badge">{programs.length} programs</div>
      </div>

      <div className="wk-cards-list">
        {programs.map((prog, i) => (
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
            <div
              className="wk-card-body"
              onClick={() => onProgramPreview(prog)}
              style={{ cursor: 'pointer' }}
            >
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
              style={{ background: prog.accentColor, borderColor: prog.accentColor }}
              onClick={() => onProgramStart(prog)}
              aria-label={`Start ${prog.name}`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="wk-create-banner">
        <h4 className="wk-create-title">Ready for a new craft?</h4>
        <p className="wk-create-desc">Explore templates or build from scratch</p>
        <button className="wk-create-btn" onClick={onCreateProgram}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Create Program
        </button>
      </div>

      <button className="wk-fab" aria-label="Create new program" onClick={onCreateProgram}>
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}

// ── Program Preview ───────────────────────────────────────────────────

function AddExerciseModal({ onClose, onAdd }) {
  const [tab, setTab] = useState('library'); // 'library' | 'create'
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [form, setForm] = useState({ name: '', muscle: '', sets: 3, reps: '10-12', equipment: '' });

  const cats = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];
  const filtered = LIBRARY_EXERCISES.filter(ex => {
    const q = search.toLowerCase();
    const matchesCat = cat === 'All' || ex.cat === cat;
    const matchesSearch = !q || ex.name.toLowerCase().includes(q) || ex.muscle.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  function handleCreate() {
    if (!form.name.trim() || !form.muscle.trim()) return;
    onAdd({ name: form.name, muscle: form.muscle, sets: Number(form.sets), reps: form.reps, pr: null, icon: '💪', equipment: form.equipment });
  }

  return (
    <div className="wk-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wk-modal">
        <div className="wk-modal-header">
          <h3 className="wk-modal-title">Add Exercise</h3>
          <button className="wk-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="wk-modal-tabs">
          <button className={`wk-modal-tab${tab === 'library' ? ' wk-modal-tab--active' : ''}`} onClick={() => setTab('library')}>
            From Library
          </button>
          <button className={`wk-modal-tab${tab === 'create' ? ' wk-modal-tab--active' : ''}`} onClick={() => setTab('create')}>
            Create New
          </button>
        </div>

        {tab === 'library' ? (
          <div className="wk-modal-body">
            <div className="wk-search-wrap" style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined wk-search-icon">search</span>
              <input className="wk-search" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="wk-cat-chips" style={{ marginBottom: 12 }}>
              {cats.map(c => (
                <button key={c} className={`wk-cat-chip${cat === c ? ' wk-cat-chip--active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
            <div className="wk-modal-list">
              {filtered.map((ex, i) => (
                <button key={i} className="wk-modal-ex-row" onClick={() => onAdd({ ...ex, sets: 3, reps: '10-12', pr: null })}>
                  <span className="wk-modal-ex-icon">{ex.icon}</span>
                  <div className="wk-modal-ex-info">
                    <span className="wk-lib-name">{ex.name}</span>
                    <span className="wk-lib-muscle">{ex.muscle} · {ex.equipment}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#38671a' }}>add_circle</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="wk-modal-body">
            <div className="wk-form-field">
              <label className="wk-form-label">Exercise Name</label>
              <input className="wk-form-input" placeholder="e.g. Spider Curl" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="wk-form-field">
              <label className="wk-form-label">Muscle Group</label>
              <input className="wk-form-input" placeholder="e.g. Biceps" value={form.muscle} onChange={e => setForm(f => ({ ...f, muscle: e.target.value }))} />
            </div>
            <div className="wk-form-row">
              <div className="wk-form-field">
                <label className="wk-form-label">Sets</label>
                <input className="wk-form-input" type="number" min="1" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} />
              </div>
              <div className="wk-form-field">
                <label className="wk-form-label">Reps</label>
                <input className="wk-form-input" placeholder="e.g. 10-12" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} />
              </div>
            </div>
            <div className="wk-form-field">
              <label className="wk-form-label">Equipment</label>
              <input className="wk-form-input" placeholder="e.g. Barbell" value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} />
            </div>
            <button className="wk-create-btn" onClick={handleCreate}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Add Exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramPreview({ program, onBack, onStart, onProgramUpdate }) {
  const [exercises, setExercises] = useState(program.exerciseList);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExIndex, setEditingExIndex] = useState(null);

  function handleAddExercise(ex) {
    if (editingExIndex !== null) {
      const updated = [...exercises];
      updated[editingExIndex] = ex;
      setExercises(updated);
      onProgramUpdate({ ...program, exerciseList: updated });
      setEditingExIndex(null);
    } else {
      const updated = [...exercises, ex];
      setExercises(updated);
      onProgramUpdate({ ...program, exerciseList: updated, exerciseCount: updated.length });
    }
    setShowAddModal(false);
  }

  function handleDeleteExercise(i) {
    const updated = exercises.filter((_, idx) => idx !== i);
    setExercises(updated);
    onProgramUpdate({ ...program, exerciseList: updated, exerciseCount: updated.length });
  }

  return (
    <div className="wk-view">
      {/* Header */}
      <div className="wk-preview-header">
        <button className="wk-back-btn" onClick={onBack}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          <span>Programs</span>
        </button>
        <button className="wk-add-ex-btn" onClick={() => setShowAddModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Exercise
        </button>
      </div>

      {/* Hero */}
      <div className="wk-detail-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="wk-preview-color-dot" style={{ background: program.accentColor }} />
          {program.tag && (
            <span className="wk-card-tag" style={{
              background: program.tagColor === 'green' ? '#c3fb9c' : program.tagColor === 'purple' ? '#b4a5ff' : '#e8e2d6',
              color: program.tagColor === 'green' ? '#214f01' : program.tagColor === 'purple' ? '#180058' : '#2e2f2e',
            }}>
              {program.tag}
            </span>
          )}
        </div>
        <h2 className="wk-preview-title">{program.name}</h2>
        <p className="wk-eyebrow" style={{ marginBottom: 12 }}>Estimated Duration</p>
        <h3 className="wk-detail-duration" style={{ color: program.accentColor }}>
          {program.duration} MINS
        </h3>
        <div className="wk-detail-pills">
          <span className="wk-detail-pill wk-detail-pill--green">{exercises.length} EXERCISES</span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="wk-ex-list">
        {exercises.map((ex, i) => (
          <div key={i} className="wk-ex-card">
            <div className="wk-ex-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="wk-ex-emoji">{ex.icon}</div>
                <div className="wk-ex-card-left">
                  <span className="wk-ex-muscle">{ex.muscle}</span>
                  <h4 className="wk-ex-name">{ex.name}</h4>
                </div>
              </div>
              <div className="wk-ex-actions">
                {ex.pr && (
                  <div className="wk-ex-pr" style={{ background: program.accentColor }}>
                    PR: {ex.pr}
                  </div>
                )}
                <button
                  className="wk-ex-action-btn"
                  onClick={() => {
                    setEditingExIndex(i);
                    setShowAddModal(true);
                  }}
                  title="Edit exercise"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  className="wk-ex-action-btn wk-ex-action-btn--delete"
                  onClick={() => handleDeleteExercise(i)}
                  title="Delete exercise"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
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
            <div className="wk-sparkline">
              <p className="wk-ex-stat-label">Volume Trend</p>
              <div className="wk-spark-bars">
                {[20, 40, 35, 60, 50, 75, 90].map((h, j) => (
                  <div key={j} className="wk-spark-bar" style={{ height: `${h}%`, background: program.accentColor, opacity: 0.3 + j * 0.1 }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Start CTA */}
      <div className="wk-detail-cta">
        <button className="wk-start-btn" style={{ background: program.accentColor }} onClick={() => onStart({ ...program, exerciseList: exercises })}>
          <span>Start Program</span>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
        </button>
      </div>

      {showAddModal && <AddExerciseModal onClose={() => setShowAddModal(false)} onAdd={handleAddExercise} />}
    </div>
  );
}

// ── Library View ──────────────────────────────────────────────────────

const LIB_CATS = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio'];

function CreateProgramModal({ onClose, onCreate }) {
  const [step, setStep] = useState(1); // 1 = details, 2 = exercises
  const [details, setDetails] = useState({ name: '', tag: '', tagColor: 'green', duration: 45 });
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = LIBRARY_EXERCISES.filter(ex => {
    const q = search.toLowerCase();
    const matchesCat = cat === 'All' || ex.cat === cat;
    const matchesSearch = !q || ex.name.toLowerCase().includes(q) || ex.muscle.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  function toggleExercise(ex) {
    setSelected(prev => prev.find(e => e.name === ex.name)
      ? prev.filter(e => e.name !== ex.name)
      : [...prev, { ...ex, sets: 3, reps: '10-12', pr: null }]
    );
  }

  function handleCreate() {
    if (!details.name.trim() || selected.length === 0) return;
    onCreate({
      id: Date.now().toString(),
      name: details.name,
      tag: details.tag || null,
      tagColor: details.tagColor,
      accentColor: '#38671a',
      exerciseCount: selected.length,
      duration: Number(details.duration),
      lastDone: 'Never',
      sticker: null,
      exerciseList: selected,
    });
  }

  return (
    <div className="wk-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wk-modal">
        <div className="wk-modal-header">
          <h3 className="wk-modal-title">{step === 1 ? 'New Program' : 'Pick Exercises'}</h3>
          <button className="wk-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {step === 1 ? (
          <div className="wk-modal-body">
            <div className="wk-form-field">
              <label className="wk-form-label">Program Name</label>
              <input className="wk-form-input" placeholder="e.g. Upper Body A" value={details.name} onChange={e => setDetails(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="wk-form-field">
              <label className="wk-form-label">Tag (optional)</label>
              <input className="wk-form-input" placeholder="e.g. STRENGTH" value={details.tag} onChange={e => setDetails(d => ({ ...d, tag: e.target.value.toUpperCase() }))} />
            </div>
            <div className="wk-form-field">
              <label className="wk-form-label">Estimated Duration (mins)</label>
              <input className="wk-form-input" type="number" min="10" value={details.duration} onChange={e => setDetails(d => ({ ...d, duration: e.target.value }))} />
            </div>
            <button className="wk-create-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => details.name.trim() && setStep(2)}>
              Next: Add Exercises
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>
        ) : (
          <div className="wk-modal-body">
            <div className="wk-search-wrap" style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined wk-search-icon">search</span>
              <input className="wk-search" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="wk-cat-chips" style={{ marginBottom: 12 }}>
              {LIB_CATS.map(c => (
                <button key={c} className={`wk-cat-chip${cat === c ? ' wk-cat-chip--active' : ''}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
            <p className="wk-eyebrow" style={{ marginBottom: 8 }}>{selected.length} selected</p>
            <div className="wk-modal-list">
              {filtered.map((ex, i) => {
                const isSelected = selected.find(e => e.name === ex.name);
                return (
                  <button key={i} className={`wk-modal-ex-row${isSelected ? ' wk-modal-ex-row--selected' : ''}`} onClick={() => toggleExercise(ex)}>
                    <span className="wk-modal-ex-icon">{ex.icon}</span>
                    <div className="wk-modal-ex-info">
                      <span className="wk-lib-name">{ex.name}</span>
                      <span className="wk-lib-muscle">{ex.muscle}</span>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: isSelected ? '#38671a' : '#dad4c8' }}>
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="wk-btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="wk-create-btn" style={{ flex: 1 }} onClick={handleCreate} disabled={selected.length === 0}>
                Create Program
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryView({ programs, onAddProgram, onCreateProgram, onBrowseProgram }) {
  const [libTab, setLibTab] = useState('my-programs'); // 'my-programs' | 'programs'
  const [search, setSearch] = useState('');

  // Built-in library programs (sample data)
  const BUILTIN_PROGRAMS = [
    { id: 'lib-push', name: 'Upper Body Push', tag: 'HYPERTROPHY', tagColor: 'green', accentColor: '#38671a', exerciseList: [], duration: 50 },
    { id: 'lib-pull', name: 'Full Back Focus', tag: 'STRENGTH', tagColor: 'purple', accentColor: '#5d3fd3', exerciseList: [], duration: 60 },
    { id: 'lib-legs', name: 'Lower Body Power', tag: null, tagColor: null, accentColor: '#b02500', exerciseList: [], duration: 55 },
    { id: 'lib-full', name: 'Full Body Blast', tag: 'HYPERTROPHY', tagColor: 'green', accentColor: '#38671a', exerciseList: [], duration: 75 },
  ];

  const filteredMyPrograms = programs.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLibPrograms = BUILTIN_PROGRAMS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Browse & Discover</span>
          <h2 className="wk-heading">Library</h2>
        </div>
      </div>

      {/* Search */}
      <div className="wk-search-wrap" style={{ marginBottom: 16 }}>
        <span className="material-symbols-outlined wk-search-icon">search</span>
        <input className="wk-search" type="text" placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button className="wk-search-clear" onClick={() => setSearch('')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {/* Library tabs */}
      <div className="wk-lib-tabs">
        <button className={`wk-lib-tab${libTab === 'my-programs' ? ' wk-lib-tab--active' : ''}`} onClick={() => setLibTab('my-programs')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>favorite</span>
          My Programs
        </button>
        <button className={`wk-lib-tab${libTab === 'programs' ? ' wk-lib-tab--active' : ''}`} onClick={() => setLibTab('programs')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>grid_view</span>
          Programs
        </button>
      </div>

      {libTab === 'my-programs' ? (
        <>
          <div className="wk-lib-programs">
            {filteredMyPrograms.length === 0 ? (
              <div className="wk-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <span className="material-symbols-outlined wk-empty-icon">library_books</span>
                <p>No programs created yet.</p>
              </div>
            ) : (
              filteredMyPrograms.map((prog, i) => (
                <div key={prog.id} className="wk-lib-prog-card" onClick={() => onBrowseProgram(prog)}>
                  <div className="wk-lib-prog-stripe" style={{ background: prog.accentColor }} />
                  <div className="wk-lib-prog-info">
                    <h4 className="wk-lib-prog-name">{prog.name}</h4>
                    <p className="wk-lib-prog-meta">
                      {prog.exerciseList.length} exercises · {prog.duration} mins
                    </p>
                  </div>
                  {prog.tag && (
                    <span className="wk-card-tag" style={{
                      background: prog.tagColor === 'green' ? '#c3fb9c' : prog.tagColor === 'purple' ? '#b4a5ff' : '#e8e2d6',
                      color: prog.tagColor === 'green' ? '#214f01' : prog.tagColor === 'purple' ? '#180058' : '#2e2f2e',
                      fontSize: 9,
                    }}>
                      {prog.tag}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          <button className="wk-create-btn" onClick={onCreateProgram}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Create Program
          </button>
        </>
      ) : (
        <>
          <div className="wk-lib-programs">
            {filteredLibPrograms.length === 0 ? (
              <div className="wk-empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <span className="material-symbols-outlined wk-empty-icon">search_off</span>
                <p>No programs found.</p>
              </div>
            ) : (
              filteredLibPrograms.map((prog, i) => (
                <div key={prog.id} className="wk-lib-prog-card">
                  <div className="wk-lib-prog-stripe" style={{ background: prog.accentColor }} />
                  <div className="wk-lib-prog-info">
                    <h4 className="wk-lib-prog-name">{prog.name}</h4>
                    <p className="wk-lib-prog-meta">
                      {prog.exerciseList.length || '?'} exercises · {prog.duration} mins
                    </p>
                  </div>
                  {prog.tag && (
                    <span className="wk-card-tag" style={{
                      background: prog.tagColor === 'green' ? '#c3fb9c' : prog.tagColor === 'purple' ? '#b4a5ff' : '#e8e2d6',
                      color: prog.tagColor === 'green' ? '#214f01' : prog.tagColor === 'purple' ? '#180058' : '#2e2f2e',
                      fontSize: 9,
                    }}>
                      {prog.tag}
                    </span>
                  )}
                  <button
                    className="wk-lib-prog-add"
                    onClick={() => onAddProgram(prog)}
                    title="Add to My Programs"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Active Session ────────────────────────────────────────────────────

function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const display = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return { elapsed, display };
}

function RestTimer({ onSkip }) {
  const [restTime, setRestTime] = useState(90);
  const [initial] = useState(90);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRestTime(t => {
        if (t <= 1) { clearInterval(intervalRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mins = Math.floor(restTime / 60);
  const secs = restTime % 60;
  const progress = restTime / initial;
  const circumference = 2 * Math.PI * 88;
  const offset = circumference * (1 - progress);

  return (
    <div className="wk-rest-sheet">
      <div className="wk-rest-handle" />
      <div className="wk-rest-content">
        <div className="wk-rest-ring">
          <svg viewBox="0 0 192 192" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="96" cy="96" r="88" fill="transparent" stroke="#e8e8e6" strokeWidth="8" />
            <circle cx="96" cy="96" r="88" fill="transparent" stroke="#38671a" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="wk-rest-time">
            <span className="wk-rest-countdown">{mins}:{String(secs).padStart(2, '0')}</span>
            <span className="wk-eyebrow">Resting</span>
          </div>
        </div>
        <div className="wk-rest-btns">
          <button className="wk-rest-adj" onClick={() => setRestTime(t => Math.max(0, t - 15))}>-15s</button>
          <button className="wk-start-btn wk-rest-skip" onClick={onSkip}>Skip</button>
          <button className="wk-rest-adj" onClick={() => setRestTime(t => t + 15)}>+15s</button>
        </div>
      </div>
    </div>
  );
}

function ActiveSession({ program, onFinish }) {
  const { display: timerDisplay } = useTimer();
  const [exIndex, setExIndex] = useState(0);
  const [setData, setSetData] = useState(() =>
    program.exerciseList.map(ex => ({
      ...ex,
      note: '',
      sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', done: false })),
    }))
  );
  const [showRest, setShowRest] = useState(false);

  const currentEx = setData[exIndex];
  const totalExercises = setData.length;

  function updateSet(exIdx, setIdx, field, value) {
    setSetData(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s),
      };
    }));
  }

  function toggleDone(exIdx, setIdx) {
    setSetData(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const sets = ex.sets.map((s, si) => si === setIdx ? { ...s, done: !s.done } : s);
      return { ...ex, sets };
    }));
    // Trigger rest timer when marking a set done
    const set = setData[exIdx].sets[setIdx];
    if (!set.done) setShowRest(true);
  }

  function updateNote(exIdx, value) {
    setSetData(prev => prev.map((ex, ei) => ei === exIdx ? { ...ex, note: value } : ex));
  }

  function addSet(exIdx) {
    setSetData(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: [...ex.sets, { weight: '', reps: '', done: false }] };
    }));
  }

  const allDone = setData.every(ex => ex.sets.every(s => s.done));

  return (
    <div className="wk-session-root">
      {/* Session header */}
      <header className="wk-session-header">
        <div className="wk-session-meta">
          <span className="wk-eyebrow">Exercise {exIndex + 1}/{totalExercises}</span>
          <div className="wk-session-timer">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38671a' }}>timer</span>
            <span className="wk-session-timer-val">{timerDisplay}</span>
          </div>
        </div>
        <button className="wk-finish-btn" onClick={() => onFinish(setData)}>Finish</button>
      </header>

      <div className="wk-session-scroll">
        {/* Exercise hero */}
        <section className="wk-session-hero">
          <div className="wk-session-hero-top">
            <div>
              <h1 className="wk-session-ex-name">{currentEx.name}</h1>
              <span className="wk-session-muscle-tag">{currentEx.muscle}</span>
            </div>
            <div className="wk-spark-mini">
              {[30, 50, 45, 70, 85].map((h, i) => (
                <div key={i} className="wk-spark-mini-bar" style={{ height: `${h}%`, opacity: 0.2 + i * 0.18 }} />
              ))}
            </div>
          </div>
          {currentEx.pr && (
            <div className="wk-pr-sticker">NEW PR! {currentEx.pr}</div>
          )}
        </section>

        {/* Set logging */}
        <section className="wk-sets-section">
          <div className="wk-sets-header">
            <span>Set #</span>
            <span>Weight (kg)</span>
            <span>Reps</span>
            <span>Done</span>
          </div>
          {currentEx.sets.map((s, si) => (
            <div key={si} className={`wk-set-row${s.done ? ' wk-set-row--done' : si === currentEx.sets.findIndex(s => !s.done) ? ' wk-set-row--active' : ' wk-set-row--future'}`}>
              <span className="wk-set-num">{si + 1}</span>
              <input
                className="wk-set-input"
                type="number"
                placeholder={s.done ? String(s.weight || '—') : 'kg'}
                value={s.weight}
                onChange={e => updateSet(exIndex, si, 'weight', e.target.value)}
                disabled={s.done}
              />
              <input
                className="wk-set-input"
                type="number"
                placeholder={s.done ? String(s.reps || '—') : 'reps'}
                value={s.reps}
                onChange={e => updateSet(exIndex, si, 'reps', e.target.value)}
                disabled={s.done}
              />
              <button
                className={`wk-set-check${s.done ? ' wk-set-check--done' : ''}`}
                onClick={() => toggleDone(exIndex, si)}
              >
                {s.done
                  ? <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 18, color: '#d6ffb7' }}>check</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#767775' }}>radio_button_unchecked</span>
                }
              </button>
            </div>
          ))}
          <button className="wk-add-set-btn" onClick={() => addSet(exIndex)}>+ Add Set</button>
        </section>

        {/* Notes */}
        <section className="wk-session-notes">
          <label className="wk-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Remarks</label>
          <textarea
            className="wk-notes-input"
            placeholder="How did this exercise feel? Any notes..."
            value={currentEx.note}
            onChange={e => updateNote(exIndex, e.target.value)}
          />
        </section>

        {/* Exercise navigation */}
        <div className="wk-ex-nav">
          <button
            className="wk-ex-nav-btn"
            onClick={() => setExIndex(i => Math.max(0, i - 1))}
            disabled={exIndex === 0}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Previous
          </button>
          {exIndex < totalExercises - 1 ? (
            <button className="wk-ex-nav-btn wk-ex-nav-btn--next" onClick={() => setExIndex(i => i + 1)}>
              Next
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          ) : (
            <button className="wk-finish-btn wk-ex-nav-btn--next" onClick={() => onFinish(setData)}>
              Finish Workout
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </button>
          )}
        </div>

        {/* Exercise dots */}
        <div className="wk-ex-dots">
          {setData.map((_, i) => (
            <button
              key={i}
              className={`wk-ex-dot${i === exIndex ? ' wk-ex-dot--active' : setData[i].sets.every(s => s.done) ? ' wk-ex-dot--done' : ''}`}
              onClick={() => setExIndex(i)}
            />
          ))}
        </div>
      </div>

      {showRest && <RestTimer onSkip={() => setShowRest(false)} />}
    </div>
  );
}

// ── Discard Confirmation Modal ────────────────────────────────────────

function DiscardModal({ onCancel, onConfirm }) {
  return (
    <div className="wk-discard-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="wk-discard-modal">
        <div className="wk-discard-icon" aria-hidden="true">
          <span className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1", fontSize: 28, color: '#b02500' }}>
            delete_forever
          </span>
        </div>
        <h3 className="wk-discard-title">Discard Session?</h3>
        <p className="wk-discard-body">
          All your logged sets and data for this session will be permanently lost.
        </p>
        <div className="wk-discard-actions">
          <button className="wk-discard-cancel" onClick={onCancel}>
            Keep Going
          </button>
          <button className="wk-discard-confirm" onClick={onConfirm}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Workout Summary ───────────────────────────────────────────────────

function WorkoutSummary({ program, sessionData, onClose }) {
  const [notes, setNotes] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const totalSets   = sessionData ? sessionData.reduce((a, ex) => a + ex.sets.filter(s => s.done).length, 0) : 16;
  const doneSets    = sessionData ? sessionData.reduce((a, ex) => a + ex.sets.filter(s => s.done).length, 0) : 16;
  const totalExsDone = sessionData ? sessionData.filter(ex => ex.sets.some(s => s.done)).length : program.exerciseCount;

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
          <p className="wk-summary-big">
            {sessionData
              ? (sessionData.reduce((a, ex) => a + ex.sets.filter(s => s.done && s.weight).reduce((b, s) => b + Number(s.weight) * Number(s.reps || 1), 0), 0)).toLocaleString()
              : '12,450'
            }
            <span className="wk-summary-unit"> kg</span>
          </p>
        </div>
        <div className="wk-summary-stat">
          <p className="wk-ex-stat-label">Duration</p>
          <p className="wk-summary-med">~{program.duration}m</p>
        </div>
        <div className="wk-summary-stat wk-summary-stat--green">
          <p className="wk-ex-stat-label" style={{ color: '#3d6c1f' }}>Exercises</p>
          <p className="wk-summary-med" style={{ color: '#214f01' }}>
            {totalExsDone}/{program.exerciseList.length}
          </p>
        </div>
        <div className="wk-summary-stat wk-summary-stat--full" style={{ background: '#e8e2d6' }}>
          <p className="wk-ex-stat-label">Sets Completed</p>
          <p className="wk-summary-med">{doneSets} sets</p>
        </div>
      </div>

      {/* Exercise breakdown */}
      {sessionData && (
        <div className="wk-summary-breakdown">
          <h4 className="wk-eyebrow" style={{ marginBottom: 12 }}>EXERCISES PERFORMED</h4>
          {sessionData.filter(ex => ex.sets.some(s => s.done)).map((ex, i) => {
            const doneSets = ex.sets.filter(s => s.done);
            const peakWeight = doneSets.reduce((max, s) => Math.max(max, Number(s.weight) || 0), 0);
            return (
              <div key={i} className="wk-summary-ex-row">
                <div className="wk-summary-ex-info">
                  <p className="wk-summary-ex-name">{ex.name}</p>
                  <p className="wk-summary-ex-meta">{doneSets.length} sets{peakWeight > 0 ? ` · ${peakWeight}kg peak` : ''}</p>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38671a', fontVariationSettings: "'FILL' 1" }}>expand_more</span>
              </div>
            );
          })}
        </div>
      )}

      {/* PR Milestones */}
      {program.exerciseList.some(ex => ex.pr) && (
        <div className="wk-pr-card">
          <div className="wk-pr-float-sticker">Heavy Hitter</div>
          <h4 className="wk-ex-stat-label" style={{ marginBottom: 12 }}>Milestones Reached</h4>
          {program.exerciseList.filter(ex => ex.pr).map((ex, i) => (
            <div key={i} className="wk-pr-row">
              <div className="wk-pr-icon" style={{ background: program.accentColor }}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", color: '#d6ffb7', fontSize: 22 }}>military_tech</span>
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
        <button className="wk-discard-btn" onClick={() => setShowDiscardConfirm(true)}>Discard Session</button>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <DiscardModal
          onCancel={() => setShowDiscardConfirm(false)}
          onConfirm={onClose}
        />
      )}
    </div>
  );
}

// ── History View ──────────────────────────────────────────────────────

function HistoryView() {
  const [selectedDay, setSelectedDay] = useState(4);
  const [expandedEx, setExpandedEx] = useState(null);

  const selectedEntry = HISTORY_SESSIONS.find(s => s.day === selectedDay) ?? null;
  const selectedSession = selectedEntry?.session ?? null;

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
            <button className="wk-cal-nav-btn"><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="wk-cal-nav-btn"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
        <div className="wk-cal-grid">
          {CALENDAR_DAYS.map(d => (
            <div key={d} className="wk-cal-day-hdr">{d}</div>
          ))}
          {prevDays.map(d => (
            <div key={`p${d}`} className="wk-cal-day wk-cal-day--prev">{d}</div>
          ))}
          {currDays.map(d => {
            const dot = dotMap[d];
            const isSelected = d === selectedDay;
            return (
              <button
                key={d}
                className={`wk-cal-day${isSelected ? ' wk-cal-day--active' : ''}${dot ? ' wk-cal-day--has-dot' : ''}`}
                onClick={() => { setSelectedDay(d); setExpandedEx(null); }}
              >
                {d}
                {dot && !isSelected && (
                  <span className="wk-cal-dot" style={{ background: dotColor[dot] }} />
                )}
              </button>
            );
          })}
        </div>
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
            <h3 className="wk-sess-date">October {String(selectedDay).padStart(2, '0')}</h3>
            <span className="wk-sess-badge">Strength Session</span>
          </div>

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

          {/* Exercises performed — expandable */}
          <div className="wk-hist-ex-section">
            <h4 className="wk-eyebrow" style={{ marginBottom: 10 }}>EXERCISES PERFORMED</h4>
            {selectedSession.exercises.map((ex, i) => {
              const isOpen = expandedEx === i;
              const peakWeight = ex.sets.reduce((max, s) => Math.max(max, s.weight || 0), 0);
              return (
                <div key={i} className="wk-hist-ex-item">
                  <button className="wk-hist-ex-header" onClick={() => setExpandedEx(isOpen ? null : i)}>
                    <div>
                      <p className="wk-hist-ex-name">{ex.name}</p>
                      <p className="wk-hist-ex-meta">
                        {ex.sets.length} sets{peakWeight > 0 ? ` · ${peakWeight}kg peak` : ''}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: '#5b5c5a', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="wk-hist-ex-detail">
                      <div className="wk-sets-header" style={{ marginBottom: 8 }}>
                        <span>Set #</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span></span>
                      </div>
                      {ex.sets.map((s, si) => (
                        <div key={si} className="wk-hist-set-row">
                          <span className="wk-set-num" style={{ color: '#38671a' }}>{si + 1}</span>
                          <span className="wk-hist-set-val">{s.weight > 0 ? `${s.weight}kg` : 'BW'}</span>
                          <span className="wk-hist-set-val">{s.reps} reps</span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#38671a', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      ))}
                      {ex.note && (
                        <div className="wk-hist-ex-note">
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#767775' }}>notes</span>
                          <p>{ex.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Session Notes */}
          {selectedSession.sessionNote && (
            <div className="wk-sess-notes-card">
              <div className="wk-sess-notes-header">
                <span className="material-symbols-outlined">notes</span>
                <h4 className="wk-eyebrow">Session Notes</h4>
              </div>
              <p className="wk-sess-notes-text">{selectedSession.sessionNote}</p>
            </div>
          )}

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
                <div key={i} className="wk-chart-bar" style={{ height: `${h}%`, opacity: i === 11 ? 1 : 0.4 }} />
              ))}
            </div>
            <div className="wk-chart-labels">
              <span className="wk-eyebrow">Sep 01</span>
              <span className="wk-eyebrow">Oct 01</span>
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

// ── Main Workouts ─────────────────────────────────────────────────────

export default function Workouts() {
  const navigate = useNavigate();
  const onClose = () => navigate('/dashboard');
  const [navVisible,       setNavVisible]       = useState(false);
  const [wkTab,            setWkTab]            = useState('programs');
  const [programs,         setPrograms]         = useState(PROGRAMS);
  const [previewProgram,   setPreviewProgram]   = useState(null); // ProgramPreview
  const [activeProgram,    setActiveProgram]    = useState(null); // ActiveSession
  const [sessionData,      setSessionData]      = useState(null);
  const [showSummary,      setShowSummary]      = useState(false);
  const [showCreateProg,   setShowCreateProg]   = useState(false);

  // Animate nav in on mount
  useEffect(() => {
    const t = setTimeout(() => setNavVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleProgramPreview(prog) {
    setPreviewProgram(prog);
  }

  function handleProgramStart(prog) {
    setActiveProgram(prog);
    setPreviewProgram(null);
  }

  function handleSessionFinish(data) {
    setSessionData(data);
    setShowSummary(true);
  }

  function handleSummaryClose() {
    setShowSummary(false);
    setActiveProgram(null);
    setSessionData(null);
    setWkTab('programs');
  }

  function handleCreateProgram(prog) {
    setPrograms(prev => [...prev, prog]);
    setShowCreateProg(false);
  }

  function handleProgramUpdate(updated) {
    setPrograms(prev => prev.map(p => p.id === updated.id ? updated : p));
    setPreviewProgram(updated);
  }

  // Active session takes over full screen
  if (activeProgram && !showSummary) {
    return <ActiveSession program={activeProgram} onFinish={handleSessionFinish} />;
  }

  // Summary takes over full screen
  if (showSummary && activeProgram) {
    return <WorkoutSummary program={activeProgram} sessionData={sessionData} onClose={handleSummaryClose} />;
  }

  return (
    <div className="wk-root">
      <div className="wk-scroll-area">

        {/* Program Preview is a sub-view within the scroll area */}
        {previewProgram ? (
          <ProgramPreview
            program={previewProgram}
            onBack={() => setPreviewProgram(null)}
            onStart={handleProgramStart}
            onProgramUpdate={handleProgramUpdate}
          />
        ) : (
          <>
            {wkTab === 'programs' && (
              <ProgramsView
                programs={programs}
                onProgramPreview={handleProgramPreview}
                onProgramStart={handleProgramStart}
                onCreateProgram={() => setShowCreateProg(true)}
              />
            )}
            {wkTab === 'library' && (
              <LibraryView
                programs={programs}
                onAddProgram={prog => {
                  if (!programs.find(p => p.id === prog.id)) {
                    setPrograms(prev => [...prev, prog]);
                  }
                }}
                onCreateProgram={() => setShowCreateProg(true)}
                onBrowseProgram={handleProgramPreview}
              />
            )}
            {wkTab === 'history' && <HistoryView />}
          </>
        )}
      </div>

      <WorkoutContextNav
        active={wkTab}
        onChange={tab => { setPreviewProgram(null); setWkTab(tab); }}
        onClose={onClose ?? (() => {})}
        visible={navVisible}
      />

      {showCreateProg && (
        <CreateProgramModal
          onClose={() => setShowCreateProg(false)}
          onCreate={handleCreateProgram}
        />
      )}
    </div>
  );
}
