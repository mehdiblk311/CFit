import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workoutStore } from '../../../stores/workoutStore';
import {
  useWorkoutList,
  useTemplateList,
  useExercises,
  useCreateWorkout,
  useAddSet,
  useAddExercise,
  useFinishWorkout,
} from '../../../hooks/queries/useWorkouts';
import {
  useActivityCalendar,
} from '../../../hooks/queries/useAnalytics';
import './Workouts.css';

// ── Helpers ────────────────────────────────────────────────────────────

function fmtSeconds(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function calcVolume(exercises) {
  if (!exercises) return 0;
  return exercises.reduce((total, ex) => {
    const sets = ex.sets || [];
    return total + sets.reduce((s, set) => s + (Number(set.weight_kg) || 0) * (Number(set.reps) || 0), 0);
  }, 0);
}

function getAccentForType(type) {
  const map = { strength: '#38671a', hypertrophy: '#5d3fd3', cardio: '#3bd3fd', endurance: '#fbbd41', custom: '#b02500' };
  return map[type?.toLowerCase()] || '#38671a';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

// ── useTimer ──────────────────────────────────────────────────────────

function useTimer(running = true) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  return { elapsed, display: fmtSeconds(elapsed), reset: () => setElapsed(0) };
}

// ── Context Nav ───────────────────────────────────────────────────────

const CTX_NAV = [
  { id: 'close',    icon: 'close',         label: 'Close'    },
  { id: 'programs', icon: 'grid_view',     label: 'Programs' },
  { id: 'library',  icon: 'book',          label: 'Library'  },
  { id: 'history',  icon: 'history',       label: 'History'  },
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

// ── Exercise Search Modal ──────────────────────────────────────────────

function ExerciseSearchModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const params = {};
  if (debouncedSearch) params.name = debouncedSearch;
  if (cat) params.muscle = cat;

  const { data: exercisesData, isLoading } = useExercises(params);
  const exercises = asArray(exercisesData?.exercises || exercisesData?.data || exercisesData);

  const CATS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];

  return (
    <div className="wk-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wk-modal">
        <div className="wk-modal-header">
          <h3 className="wk-modal-title">Add Exercise</h3>
          <button className="wk-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        <div className="wk-modal-body">
          <div className="wk-search-wrap" style={{ marginBottom: 12 }}>
            <span className="material-symbols-outlined wk-search-icon">search</span>
            <input
              className="wk-search"
              placeholder="Search exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="wk-cat-chips" style={{ marginBottom: 12 }}>
            {CATS.map(c => (
              <button
                key={c}
                className={`wk-cat-chip${(c === 'All' ? !cat : cat === c) ? ' wk-cat-chip--active' : ''}`}
                onClick={() => setCat(c === 'All' ? '' : c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="wk-modal-list">
            {isLoading ? (
              <div className="wk-loading-rows">
                {[1, 2, 3, 4].map(i => <div key={i} className="wk-skeleton-row" />)}
              </div>
            ) : exercises.length === 0 ? (
              <div className="wk-empty-state">
                <span className="material-symbols-outlined">fitness_center</span>
                <p>No exercises found</p>
              </div>
            ) : (
              exercises.map((ex) => (
                <button key={ex.id} className="wk-modal-ex-row" onClick={() => onSelect(ex)}>
                  <div className="wk-modal-ex-dot" style={{ background: getAccentForType(ex.type) }} />
                  <div className="wk-modal-ex-info">
                    <span className="wk-lib-name">{ex.name}</span>
                    <span className="wk-lib-muscle">{ex.muscle_group || ex.primary_muscle} · {ex.equipment || 'Bodyweight'}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#38671a' }}>add_circle</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Programs View ─────────────────────────────────────────────────────

function ProgramsView({ onProgramPreview, onProgramStart }) {
  const { data: templatesData, isLoading } = useTemplateList();
  const templates = asArray(templatesData?.templates || templatesData?.data || templatesData);

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Your Regimen</span>
          <h2 className="wk-heading">My Programs</h2>
        </div>
        {!isLoading && (
          <div className="wk-header-badge">{templates.length} programs</div>
        )}
      </div>

      {isLoading ? (
        <div className="wk-cards-list">
          {[1, 2].map(i => <div key={i} className="wk-card wk-skeleton-card" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="wk-empty-section">
          <span className="material-symbols-outlined wk-empty-icon" style={{ fontSize: 48, color: '#dad4c8' }}>fitness_center</span>
          <p className="wk-empty-text">No programs yet. Start a quick workout or browse the library.</p>
        </div>
      ) : (
        <div className="wk-cards-list">
          {templates.map((tmpl, i) => {
            const accent = getAccentForType(tmpl.type);
            return (
              <div key={tmpl.id} className={`wk-card wk-card--${i % 2 === 0 ? 'a' : 'b'}`}>
                <div className="wk-card-accent" style={{ background: accent }} />
                <div className="wk-card-body" onClick={() => onProgramPreview(tmpl)} style={{ cursor: 'pointer' }}>
                  <div className="wk-card-top">
                    <h3 className="wk-card-name">{tmpl.name}</h3>
                    {tmpl.type && (
                      <span className="wk-card-tag" style={{
                        background: i % 2 === 0 ? '#c3fb9c' : '#b4a5ff',
                        color: i % 2 === 0 ? '#214f01' : '#180058',
                        transform: `rotate(${i % 2 === 0 ? 3 : -2}deg)`,
                      }}>
                        {tmpl.type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="wk-card-meta">
                    {tmpl.exercises?.length > 0 && (
                      <div className="wk-card-meta-item">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fitness_center</span>
                        <span>{tmpl.exercises.length} exercises</span>
                      </div>
                    )}
                    {tmpl.estimated_duration_minutes && (
                      <div className="wk-card-meta-item">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                        <span>{tmpl.estimated_duration_minutes} mins</span>
                      </div>
                    )}
                  </div>
                  {tmpl.description && (
                    <p className="wk-card-last" style={{ color: '#767775', fontSize: 13 }}>
                      {tmpl.description}
                    </p>
                  )}
                </div>
                <button
                  className="wk-card-play"
                  style={{ background: accent, borderColor: accent }}
                  onClick={() => onProgramStart(tmpl)}
                  aria-label={`Start ${tmpl.name}`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick start blank workout */}
      <div className="wk-create-banner">
        <h4 className="wk-create-title">Ready for a quick session?</h4>
        <p className="wk-create-desc">Start a blank workout and build as you go</p>
        <button className="wk-create-btn" onClick={() => onProgramStart(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Quick Start
        </button>
      </div>
    </div>
  );
}

// ── Template Preview ───────────────────────────────────────────────────

function TemplatePreview({ template, onBack, onStart }) {
  const accent = getAccentForType(template?.type);
  const exercises = template?.exercises || [];

  return (
    <div className="wk-view">
      <div className="wk-preview-header">
        <button className="wk-back-btn" onClick={onBack}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          <span>Programs</span>
        </button>
      </div>

      <div className="wk-detail-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="wk-preview-color-dot" style={{ background: accent }} />
          {template?.type && (
            <span className="wk-card-tag" style={{ background: '#c3fb9c', color: '#214f01' }}>
              {template.type.toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="wk-preview-title">{template?.name}</h2>
        {template?.estimated_duration_minutes && (
          <>
            <p className="wk-eyebrow" style={{ marginBottom: 8 }}>Estimated Duration</p>
            <h3 className="wk-detail-duration" style={{ color: accent }}>
              {template.estimated_duration_minutes} MINS
            </h3>
          </>
        )}
        {template?.description && (
          <p style={{ fontSize: 14, color: '#767775', marginTop: 8 }}>{template.description}</p>
        )}
        <div className="wk-detail-pills">
          <span className="wk-detail-pill wk-detail-pill--green">{exercises.length} EXERCISES</span>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className="wk-ex-list">
          {exercises.map((ex, i) => (
            <div key={ex.id || i} className="wk-ex-card">
              <div className="wk-ex-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="wk-ex-emoji-dot" style={{ background: accent }} />
                  <div className="wk-ex-card-left">
                    <span className="wk-ex-muscle">{ex.muscle_group || ex.primary_muscle}</span>
                    <h4 className="wk-ex-name">{ex.name}</h4>
                  </div>
                </div>
                {(ex.sets_count || ex.sets?.length) && (
                  <div className="wk-ex-grid" style={{ marginTop: 0 }}>
                    <div className="wk-ex-stat">
                      <p className="wk-ex-stat-label">Sets</p>
                      <p className="wk-ex-stat-val">{ex.sets_count || ex.sets?.length}</p>
                    </div>
                    {ex.reps && (
                      <div className="wk-ex-stat">
                        <p className="wk-ex-stat-label">Reps</p>
                        <p className="wk-ex-stat-val">{ex.reps}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wk-detail-cta">
        <button className="wk-start-btn" style={{ background: accent }} onClick={() => onStart(template)}>
          <span>Start Program</span>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
        </button>
      </div>
    </div>
  );
}

// ── Library View ──────────────────────────────────────────────────────

function LibraryView() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const params = {};
  if (debouncedSearch) params.name = debouncedSearch;
  if (cat) params.muscle = cat;

  const { data: exercisesData, isLoading } = useExercises(params);
  const exercises = asArray(exercisesData?.exercises || exercisesData?.data || exercisesData);

  const CATS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Browse & Discover</span>
          <h2 className="wk-heading">Library</h2>
        </div>
      </div>

      <div className="wk-search-wrap" style={{ marginBottom: 16 }}>
        <span className="material-symbols-outlined wk-search-icon">search</span>
        <input
          className="wk-search"
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="wk-search-clear" onClick={() => setSearch('')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      <div className="wk-cat-chips" style={{ marginBottom: 16 }}>
        {CATS.map(c => (
          <button
            key={c}
            className={`wk-cat-chip${(c === 'All' ? !cat : cat === c) ? ' wk-cat-chip--active' : ''}`}
            onClick={() => setCat(c === 'All' ? '' : c)}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="wk-cards-list">
          {[1, 2, 3].map(i => <div key={i} className="wk-skeleton-row-large" />)}
        </div>
      ) : exercises.length === 0 ? (
        <div className="wk-empty-section">
          <span className="material-symbols-outlined wk-empty-icon" style={{ fontSize: 48, color: '#dad4c8' }}>search_off</span>
          <p className="wk-empty-text">No exercises match your search.</p>
        </div>
      ) : (
        <div className="wk-lib-list">
          {exercises.map(ex => {
            const accent = getAccentForType(ex.type);
            return (
              <div key={ex.id} className="wk-lib-row">
                <div className="wk-lib-dot" style={{ background: accent }} />
                <div className="wk-lib-info">
                  <span className="wk-lib-name">{ex.name}</span>
                  <span className="wk-lib-muscle">
                    {ex.muscle_group || ex.primary_muscle}
                    {ex.equipment ? ` · ${ex.equipment}` : ''}
                    {ex.difficulty ? ` · ${ex.difficulty}` : ''}
                  </span>
                </div>
                {ex.type && (
                  <span className="wk-lib-type-badge" style={{ background: accent + '22', color: accent }}>
                    {ex.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── History View ──────────────────────────────────────────────────────

function HistoryView() {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [expandedEx, setExpandedEx] = useState(null);
  const [currentPage] = useState(1);

  const { data: workoutsData, isLoading } = useWorkoutList({ limit: 20, page: currentPage });
  const { data: calendarData } = useActivityCalendar();

  const workouts = asArray(workoutsData?.workouts || workoutsData?.data || workoutsData);
  const calendarDots = calendarData?.dates || {};

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon-first offset
  const CALENDAR_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  function fmtDuration(start, end, durationMinutes) {
    const minsFromDuration = Number(durationMinutes);
    if (Number.isFinite(minsFromDuration) && minsFromDuration > 0) {
      return `${minsFromDuration}m`;
    }
    if (!start || !end) return '—';
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    return mins > 0 ? `${mins}m` : '—';
  }

  return (
    <div className="wk-view">
      <div className="wk-section-header">
        <div>
          <span className="wk-eyebrow">Your Archive</span>
          <h2 className="wk-heading">History</h2>
        </div>
      </div>

      {/* Calendar */}
      <div className="wk-cal-card">
        <div className="wk-cal-header">
          <div>
            <span className="wk-eyebrow">{year}</span>
            <h3 className="wk-cal-title">{monthName}</h3>
          </div>
        </div>
        <div className="wk-cal-grid">
          {CALENDAR_DAYS.map(d => (
            <div key={d} className="wk-cal-day-hdr">{d}</div>
          ))}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`pad-${i}`} className="wk-cal-day wk-cal-day--prev" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasActivity = calendarDots[dateStr];
            const isToday = day === now.getDate();
            return (
              <div
                key={day}
                className={`wk-cal-day${isToday ? ' wk-cal-day--active' : ''}${hasActivity ? ' wk-cal-day--has-dot' : ''}`}
              >
                {day}
                {hasActivity && !isToday && (
                  <span className="wk-cal-dot" style={{ background: '#38671a' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout list */}
      {isLoading ? (
        <div style={{ padding: '16px 0' }}>
          {[1, 2, 3].map(i => <div key={i} className="wk-skeleton-row-large" style={{ marginBottom: 8 }} />)}
        </div>
      ) : workouts.length === 0 ? (
        <div className="wk-sess-empty">
          <span className="material-symbols-outlined wk-empty-icon">event_busy</span>
          <p>No workout history yet. Complete your first session!</p>
        </div>
      ) : (
        <div className="wk-hist-list">
          {workouts.map(wo => {
            const isOpen = selectedWorkout?.id === wo.id;
            const vol = calcVolume(wo.exercises);
            return (
              <div key={wo.id} className="wk-hist-ex-item">
                <button className="wk-hist-ex-header" onClick={() => { setSelectedWorkout(isOpen ? null : wo); setExpandedEx(null); }}>
                  <div>
                    <p className="wk-hist-ex-name">{wo.name || 'Workout Session'}</p>
                    <p className="wk-hist-ex-meta">
                      {fmtDate(wo.started_at || wo.created_at)}
                      {' · '}
                      {fmtDuration(wo.started_at, wo.completed_at, wo.duration)}
                      {vol > 0 ? ` · ${vol.toLocaleString()}kg` : ''}
                    </p>
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: '#5b5c5a', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && wo.exercises?.length > 0 && (
                  <div className="wk-hist-ex-detail">
                    {wo.exercises.map((ex, ei) => {
                      const exOpen = expandedEx === ei;
                      const peakWeight = (ex.sets || []).reduce((max, s) => Math.max(max, Number(s.weight_kg) || 0), 0);
                      return (
                        <div key={ei}>
                          <button className="wk-hist-ex-header" style={{ paddingLeft: 8, background: 'transparent' }} onClick={() => setExpandedEx(exOpen ? null : ei)}>
                            <div>
                              <p className="wk-hist-ex-name" style={{ fontSize: 14 }}>{ex.exercise?.name || ex.name}</p>
                              <p className="wk-hist-ex-meta">
                                {(ex.sets || []).length} sets{peakWeight > 0 ? ` · ${peakWeight}kg peak` : ''}
                              </p>
                            </div>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#5b5c5a', transition: 'transform 0.2s', transform: exOpen ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
                          </button>
                          {exOpen && (
                            <div style={{ paddingLeft: 16 }}>
                              <div className="wk-sets-header" style={{ marginBottom: 8 }}>
                                <span>Set</span><span>Weight</span><span>Reps</span><span></span>
                              </div>
                              {(ex.sets || []).map((s, si) => (
                                <div key={si} className="wk-hist-set-row">
                                  <span className="wk-set-num" style={{ color: '#38671a' }}>{si + 1}</span>
                                  <span className="wk-hist-set-val">{s.weight_kg > 0 ? `${s.weight_kg}kg` : 'BW'}</span>
                                  <span className="wk-hist-set-val">{s.reps} reps</span>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#38671a', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                </div>
                              ))}
                              {ex.notes && (
                                <div className="wk-hist-ex-note">
                                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#767775' }}>notes</span>
                                  <p>{ex.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Rest Timer ────────────────────────────────────────────────────────

function RestTimer({ defaultSeconds = 60, onSkip }) {
  const [restTime, setRestTime] = useState(defaultSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRestTime(t => {
        if (t <= 1) { clearInterval(intervalRef.current); onSkip(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onSkip]);

  const pct = ((defaultSeconds - restTime) / defaultSeconds) * 100;

  return (
    <div className="wk-rest-overlay">
      <div className="wk-rest-card">
        <p className="wk-eyebrow" style={{ marginBottom: 12, textAlign: 'center' }}>REST TIME</p>
        <div className="wk-rest-ring">
          <svg viewBox="0 0 80 80" className="wk-rest-svg">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#eee9df" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#38671a"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="wk-rest-time">{fmtSeconds(restTime)}</span>
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

// ── Active Session ────────────────────────────────────────────────────

function ActiveSession({ workoutId, initialExercises = [], onFinish, onDiscard }) {
  const { display: timerDisplay, elapsed } = useTimer(true);
  const [exIndex, setExIndex] = useState(0);
  const [localSets, setLocalSets] = useState(() =>
    initialExercises.map(ex => ({
      ...ex,
      note: '',
      sets: [{ weight: '', reps: '', done: false }],
    }))
  );
  const [showRest, setShowRest] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const addSetMutation = useAddSet();
  const addExerciseMutation = useAddExercise();

  const storeAddExercise = workoutStore(s => s.addExercise);
  const storeAddSet = workoutStore(s => s.addSet);

  const currentEx = localSets[exIndex];
  const totalExercises = localSets.length;

  function updateSet(exIdx, setIdx, field, value) {
    setLocalSets(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s) };
    }));
  }

  function toggleDone(exIdx, setIdx) {
    const s = localSets[exIdx].sets[setIdx];
    if (!s.done) {
      // Persist to backend
      if (workoutId && localSets[exIdx].workoutExerciseId) {
        addSetMutation.mutate({
          workout_id: workoutId,
          exercise_id: localSets[exIdx].workoutExerciseId,
          data: {
            set_number: setIdx + 1,
            weight_kg: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: null,
          },
        });
      }
      storeAddSet(exIdx, { weight_kg: Number(s.weight) || 0, reps: Number(s.reps) || 0, set_number: setIdx + 1 });
      setShowRest(true);
    }
    setLocalSets(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: ex.sets.map((s2, si) => si === setIdx ? { ...s2, done: !s2.done } : s2) };
    }));
  }

  function addSet(exIdx) {
    setLocalSets(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      return { ...ex, sets: [...ex.sets, { weight: '', reps: '', done: false }] };
    }));
  }

  function handleAddExercise(ex) {
    const newEntry = { ...ex, note: '', workoutExerciseId: null, sets: [{ weight: '', reps: '', done: false }] };
    if (workoutId) {
      addExerciseMutation.mutate(
        { workout_id: workoutId, exercise_id: ex.id, notes: '' },
        { onSuccess: (data) => {
          setLocalSets(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, workoutExerciseId: data?.id } : e));
        }}
      );
    }
    storeAddExercise(newEntry);
    setLocalSets(prev => [...prev, newEntry]);
    setExIndex(localSets.length); // go to new exercise
    setShowAddExercise(false);
  }

  function updateNote(exIdx, value) {
    setLocalSets(prev => prev.map((ex, ei) => ei === exIdx ? { ...ex, note: value } : ex));
  }

  return (
    <div className="wk-session-root">
      <header className="wk-session-header">
        <div className="wk-session-meta">
          <span className="wk-eyebrow">Exercise {exIndex + 1}/{totalExercises}</span>
          <div className="wk-session-timer">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38671a' }}>timer</span>
            <span className="wk-session-timer-val">{timerDisplay}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="wk-discard-btn-sm" onClick={() => setShowDiscard(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
          <button className="wk-finish-btn" onClick={() => onFinish(localSets, elapsed)}>Finish</button>
        </div>
      </header>

      <div className="wk-session-scroll">
        {localSets.length === 0 ? (
          <div className="wk-empty-section" style={{ marginTop: 40 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#dad4c8' }}>fitness_center</span>
            <p className="wk-empty-text">No exercises yet. Add your first one!</p>
            <button className="wk-create-btn" style={{ marginTop: 16 }} onClick={() => setShowAddExercise(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Add Exercise
            </button>
          </div>
        ) : (
          <>
            <section className="wk-session-hero">
              <div className="wk-session-hero-top">
                <div>
                  <h1 className="wk-session-ex-name">{currentEx?.name}</h1>
                  <span className="wk-session-muscle-tag">{currentEx?.muscle_group || currentEx?.primary_muscle || currentEx?.muscle}</span>
                </div>
                <div className="wk-spark-mini">
                  {[30, 50, 45, 70, 85].map((h, i) => (
                    <div key={i} className="wk-spark-mini-bar" style={{ height: `${h}%`, opacity: 0.2 + i * 0.18 }} />
                  ))}
                </div>
              </div>
            </section>

            <section className="wk-sets-section">
              <div className="wk-sets-header">
                <span>Set #</span>
                <span>Weight (kg)</span>
                <span>Reps</span>
                <span>Done</span>
              </div>
              {currentEx?.sets.map((s, si) => (
                <div key={si} className={`wk-set-row${s.done ? ' wk-set-row--done' : si === currentEx.sets.findIndex(s2 => !s2.done) ? ' wk-set-row--active' : ' wk-set-row--future'}`}>
                  <span className="wk-set-num">{si + 1}</span>
                  <input
                    className="wk-set-input"
                    type="number"
                    inputMode="decimal"
                    placeholder="kg"
                    value={s.weight}
                    onChange={e => updateSet(exIndex, si, 'weight', e.target.value)}
                    disabled={s.done}
                  />
                  <input
                    className="wk-set-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
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

            <section className="wk-session-notes">
              <label className="wk-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Remarks</label>
              <textarea
                className="wk-notes-input"
                placeholder="How did this feel?"
                value={currentEx?.note || ''}
                onChange={e => updateNote(exIndex, e.target.value)}
              />
            </section>

            <div className="wk-ex-nav">
              <button className="wk-ex-nav-btn" onClick={() => setExIndex(i => Math.max(0, i - 1))} disabled={exIndex === 0}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Previous
              </button>
              {exIndex < totalExercises - 1 ? (
                <button className="wk-ex-nav-btn wk-ex-nav-btn--next" onClick={() => setExIndex(i => i + 1)}>
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                </button>
              ) : (
                <button className="wk-finish-btn wk-ex-nav-btn--next" onClick={() => onFinish(localSets, elapsed)}>
                  Finish
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </button>
              )}
            </div>

            <div className="wk-ex-dots">
              {localSets.map((_, i) => (
                <button
                  key={i}
                  className={`wk-ex-dot${i === exIndex ? ' wk-ex-dot--active' : localSets[i].sets.every(s => s.done) ? ' wk-ex-dot--done' : ''}`}
                  onClick={() => setExIndex(i)}
                />
              ))}
            </div>
          </>
        )}

        <button className="wk-add-ex-floating" onClick={() => setShowAddExercise(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add Exercise
        </button>
      </div>

      {showRest && <RestTimer onSkip={() => setShowRest(false)} />}
      {showAddExercise && <ExerciseSearchModal onClose={() => setShowAddExercise(false)} onSelect={handleAddExercise} />}
      {showDiscard && (
        <div className="wk-discard-overlay" onClick={e => e.target === e.currentTarget && setShowDiscard(false)}>
          <div className="wk-discard-modal">
            <div className="wk-discard-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 28, color: '#b02500' }}>delete_forever</span>
            </div>
            <h3 className="wk-discard-title">Discard Session?</h3>
            <p className="wk-discard-body">All logged sets will be permanently lost.</p>
            <div className="wk-discard-actions">
              <button className="wk-discard-cancel" onClick={() => setShowDiscard(false)}>Keep Going</button>
              <button className="wk-discard-confirm" onClick={onDiscard}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Workout Summary ───────────────────────────────────────────────────

function WorkoutSummary({ workoutId, sessionData, durationSeconds, programName, onSave, onDiscard }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const finishWorkoutMutation = useFinishWorkout();

  const totalSets = sessionData?.reduce((a, ex) => a + ex.sets.filter(s => s.done).length, 0) || 0;
  const totalExsDone = sessionData?.filter(ex => ex.sets.some(s => s.done)).length || 0;
  const totalVol = sessionData?.reduce((a, ex) =>
    a + ex.sets.filter(s => s.done && s.weight).reduce((b, s) => b + Number(s.weight) * Number(s.reps || 1), 0), 0
  ) || 0;

  function handleSave() {
    setSaving(true);
    if (workoutId) {
      finishWorkoutMutation.mutate(
        {
          workout_id: workoutId,
          data: {
            duration: Math.max(1, Math.round(durationSeconds / 60)),
            notes,
          },
        },
        { onSettled: () => { setSaving(false); onSave(); } }
      );
    } else {
      setSaving(false);
      onSave();
    }
  }

  return (
    <div className="wk-summary-root">
      <div className="wk-summary-hero">
        <div className="wk-summary-check">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 40, color: '#38671a' }}>check_circle</span>
        </div>
        <h2 className="wk-summary-title">Great Session!</h2>
        {programName && (
          <div className="wk-summary-badge">{programName}</div>
        )}
      </div>

      <div className="wk-summary-bento">
        <div className="wk-summary-stat wk-summary-stat--full">
          <p className="wk-ex-stat-label">Total Volume</p>
          <p className="wk-summary-big">
            {totalVol.toLocaleString()}
            <span className="wk-summary-unit"> kg</span>
          </p>
        </div>
        <div className="wk-summary-stat">
          <p className="wk-ex-stat-label">Duration</p>
          <p className="wk-summary-med">{fmtSeconds(durationSeconds)}</p>
        </div>
        <div className="wk-summary-stat wk-summary-stat--green">
          <p className="wk-ex-stat-label" style={{ color: '#3d6c1f' }}>Exercises</p>
          <p className="wk-summary-med" style={{ color: '#214f01' }}>{totalExsDone}</p>
        </div>
        <div className="wk-summary-stat wk-summary-stat--full" style={{ background: '#e8e2d6' }}>
          <p className="wk-ex-stat-label">Sets Done</p>
          <p className="wk-summary-med">{totalSets} sets</p>
        </div>
      </div>

      {sessionData && (
        <div className="wk-summary-breakdown">
          <h4 className="wk-eyebrow" style={{ marginBottom: 12 }}>EXERCISES PERFORMED</h4>
          {sessionData.filter(ex => ex.sets.some(s => s.done)).map((ex, i) => {
            const done = ex.sets.filter(s => s.done);
            const peak = done.reduce((max, s) => Math.max(max, Number(s.weight) || 0), 0);
            return (
              <div key={i} className="wk-summary-ex-row">
                <div className="wk-summary-ex-info">
                  <p className="wk-summary-ex-name">{ex.name}</p>
                  <p className="wk-summary-ex-meta">{done.length} sets{peak > 0 ? ` · ${peak}kg peak` : ''}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="wk-notes">
        <label className="wk-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Session Notes</label>
        <textarea
          className="wk-notes-input"
          placeholder="How did you feel today?"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="wk-summary-actions">
        <button className="wk-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Workout'}
          {!saving && <span className="material-symbols-outlined">send</span>}
        </button>
        <button className="wk-discard-btn" onClick={() => setShowDiscardConfirm(true)}>Discard Session</button>
      </div>

      {showDiscardConfirm && (
        <div className="wk-discard-overlay" onClick={e => e.target === e.currentTarget && setShowDiscardConfirm(false)}>
          <div className="wk-discard-modal">
            <div className="wk-discard-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 28, color: '#b02500' }}>delete_forever</span>
            </div>
            <h3 className="wk-discard-title">Discard Session?</h3>
            <p className="wk-discard-body">This workout will not be saved.</p>
            <div className="wk-discard-actions">
              <button className="wk-discard-cancel" onClick={() => setShowDiscardConfirm(false)}>Cancel</button>
              <button className="wk-discard-confirm" onClick={onDiscard}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete_forever</span>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Floating Active Workout Bar ────────────────────────────────────────

function FloatingSessionBar({ onClick }) {
  const activeWorkout = workoutStore(s => s.activeWorkout);
  if (!activeWorkout) return null;
  return (
    <button className="wk-floating-bar" onClick={onClick}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#38671a', fontVariationSettings: "'FILL' 1" }}>fitness_center</span>
      <span className="wk-floating-bar-text">Session in progress</span>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
    </button>
  );
}

// ── Main Workouts ─────────────────────────────────────────────────────

export default function Workouts() {
  const navigate = useNavigate();
  const onClose = () => navigate('/dashboard');

  const [navVisible, setNavVisible] = useState(false);
  const [wkTab, setWkTab] = useState('programs');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [activeInitialExercises, setActiveInitialExercises] = useState([]);
  const [activeProgramName, setActiveProgramName] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionPhase, setSessionPhase] = useState('browse'); // 'browse' | 'active' | 'summary'

  const createWorkoutMutation = useCreateWorkout();
  const startWorkout = workoutStore(s => s.startWorkout);
  const endWorkout = workoutStore(s => s.endWorkout);
  const storeActiveWorkout = workoutStore(s => s.activeWorkout);

  useEffect(() => {
    const t = setTimeout(() => setNavVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // If store has active workout on mount, resume it
  useEffect(() => {
    if (storeActiveWorkout) {
      setActiveWorkoutId(storeActiveWorkout.id || null);
      setActiveInitialExercises(storeActiveWorkout.exercises || []);
      setActiveProgramName(storeActiveWorkout.name || '');
      setSessionPhase('active');
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProgramStart(template) {
    const workoutName = template?.name || 'Workout';
    const templateExercises = asArray(template?.exercises);

    let workoutId = null;
    let initialExercises = templateExercises;

    try {
      const createPayload = {
        name: workoutName,
        exercises: templateExercises
          .filter((ex) => ex.exercise_id || ex.id)
          .map((ex, index) => ({
            exercise_id: ex.exercise_id || ex.id,
            order: index + 1,
            sets: ex.sets_count || ex.sets?.length || 0,
            reps: ex.reps || 0,
            weight: ex.weight_kg || 0,
            rest_time: ex.rest_time || 0,
            notes: ex.notes || '',
          })),
      };

      const data = await createWorkoutMutation.mutateAsync(createPayload);
      workoutId = data?.id || data?.workout?.id || null;
      if (Array.isArray(data?.exercises)) {
        initialExercises = data.exercises;
      }
    } catch {
      // Offline — continue locally
    }

    startWorkout({ id: workoutId, name: workoutName, exercises: initialExercises });
    setActiveWorkoutId(workoutId);
    setActiveInitialExercises(initialExercises);
    setActiveProgramName(workoutName);
    setSessionPhase('active');
  }

  function handleSessionFinish(data, durationSecs) {
    setSessionData(data);
    setSessionDuration(durationSecs);
    setSessionPhase('summary');
  }

  function handleSessionDiscard() {
    endWorkout();
    setSessionPhase('browse');
    setActiveWorkoutId(null);
    setActiveInitialExercises([]);
    setSessionData(null);
  }

  function handleSummarySave() {
    endWorkout();
    setSessionPhase('browse');
    setActiveWorkoutId(null);
    setActiveInitialExercises([]);
    setSessionData(null);
    setWkTab('history');
  }

  if (sessionPhase === 'active') {
    return (
      <ActiveSession
        workoutId={activeWorkoutId}
        initialExercises={activeInitialExercises}
        onFinish={handleSessionFinish}
        onDiscard={handleSessionDiscard}
      />
    );
  }

  if (sessionPhase === 'summary') {
    return (
      <WorkoutSummary
        workoutId={activeWorkoutId}
        sessionData={sessionData}
        durationSeconds={sessionDuration}
        programName={activeProgramName}
        onSave={handleSummarySave}
        onDiscard={handleSessionDiscard}
      />
    );
  }

  return (
    <div className="wk-root">
      <div className="wk-scroll-area">
        {previewTemplate ? (
          <TemplatePreview
            template={previewTemplate}
            onBack={() => setPreviewTemplate(null)}
            onStart={handleProgramStart}
          />
        ) : (
          <>
            {wkTab === 'programs' && (
              <ProgramsView
                onProgramPreview={t => setPreviewTemplate(t)}
                onProgramStart={handleProgramStart}
              />
            )}
            {wkTab === 'library' && <LibraryView onStartQuick={() => handleProgramStart(null)} />}
            {wkTab === 'history' && <HistoryView />}
          </>
        )}
      </div>

      <WorkoutContextNav
        active={wkTab}
        onChange={tab => { setPreviewTemplate(null); setWkTab(tab); }}
        onClose={onClose}
        visible={navVisible}
      />
    </div>
  );
}
