import { useState } from 'react';

const MUSCLE_GROUPS = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'];
const DIFFICULTIES  = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'EXPERT'];
const CATEGORIES    = ['ALL', 'COMPOUND', 'ISOLATION', 'ISOMETRIC', 'CARDIO'];

// Difficulty → filled bars (1-3)
const DIFF_BARS = { BEGINNER: 1, INTERMEDIATE: 2, EXPERT: 3 };
// Muscle chip colours
const MUSCLE_COLOR = {
  CHEST:     { bg: '#c3fb9c', color: '#214f01' },
  BACK:      { bg: '#c3fb9c', color: '#214f01' },
  LEGS:      { bg: '#b4a5ff', color: '#180058' },
  SHOULDERS: { bg: '#f8cc65', color: '#9d6a09' },
  ARMS:      { bg: '#3bd3fd', color: '#0089ad' },
  CORE:      { bg: '#f8cc65', color: '#9d6a09' },
  CARDIO:    { bg: '#f95630', color: '#520c00' },
};
// Category sub-label
const CAT_LABEL = {
  COMPOUND:  'Compound Movement',
  ISOLATION: 'Isolation Exercise',
  ISOMETRIC: 'Isometric Hold',
  CARDIO:    'Cardiovascular',
};

// Exercise placeholder images (solid bg + emoji icon)
const EXERCISE_BG = {
  CHEST:     '#f7e8e8',
  BACK:      '#e8f0e8',
  LEGS:      '#ede8f7',
  SHOULDERS: '#f7f2e8',
  ARMS:      '#e8f4f7',
  CORE:      '#f7f4e8',
  CARDIO:    '#f7ede8',
};

const INITIAL_EXERCISES = [
  { id: 1,  name: 'Barbell Bench Press',    muscle: 'CHEST',     cat: 'COMPOUND',  icon: '🏋️', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'OCT 12, 2023' },
  { id: 2,  name: 'Incline Dumbbell Press', muscle: 'CHEST',     cat: 'COMPOUND',  icon: '🏋️', equipment: 'Dumbbells',    diff: 'BEGINNER',     addedOn: 'OCT 14, 2023' },
  { id: 3,  name: 'Pull-up',                muscle: 'BACK',      cat: 'COMPOUND',  icon: '💪', equipment: 'Bodyweight',   diff: 'INTERMEDIATE', addedOn: 'NOV 01, 2023' },
  { id: 4,  name: 'Deadlift',               muscle: 'BACK',      cat: 'COMPOUND',  icon: '🔩', equipment: 'Barbell',      diff: 'EXPERT',       addedOn: 'DEC 01, 2023' },
  { id: 5,  name: 'Barbell Row',            muscle: 'BACK',      cat: 'COMPOUND',  icon: '🏋️', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'NOV 15, 2023' },
  { id: 6,  name: 'Squat',                  muscle: 'LEGS',      cat: 'COMPOUND',  icon: '🦵', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'OCT 20, 2023' },
  { id: 7,  name: 'Romanian Deadlift',      muscle: 'LEGS',      cat: 'COMPOUND',  icon: '🦵', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'NOV 04, 2023' },
  { id: 8,  name: 'Leg Press',              muscle: 'LEGS',      cat: 'COMPOUND',  icon: '🦵', equipment: 'Machine',      diff: 'BEGINNER',     addedOn: 'NOV 10, 2023' },
  { id: 9,  name: 'Overhead Press',         muscle: 'SHOULDERS', cat: 'COMPOUND',  icon: '🔼', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'DEC 05, 2023' },
  { id: 10, name: 'Lateral Raise',          muscle: 'SHOULDERS', cat: 'ISOLATION', icon: '↔️', equipment: 'Dumbbells',    diff: 'BEGINNER',     addedOn: 'DEC 08, 2023' },
  { id: 11, name: 'Bicep Curl',             muscle: 'ARMS',      cat: 'ISOLATION', icon: '💪', equipment: 'Dumbbells',    diff: 'BEGINNER',     addedOn: 'JAN 03, 2024' },
  { id: 12, name: 'Tricep Pushdown',        muscle: 'ARMS',      cat: 'ISOLATION', icon: '⬇️', equipment: 'Cable',        diff: 'BEGINNER',     addedOn: 'JAN 05, 2024' },
  { id: 13, name: 'Plank',                  muscle: 'CORE',      cat: 'ISOMETRIC', icon: '🧘', equipment: 'Bodyweight',   diff: 'BEGINNER',     addedOn: 'JAN 10, 2024' },
  { id: 14, name: 'Cable Crunch',           muscle: 'CORE',      cat: 'ISOLATION', icon: '⚡', equipment: 'Cable',        diff: 'INTERMEDIATE', addedOn: 'JAN 12, 2024' },
  { id: 15, name: 'Running',                muscle: 'CARDIO',    cat: 'CARDIO',    icon: '🏃', equipment: 'Treadmill',    diff: 'BEGINNER',     addedOn: 'FEB 01, 2024' },
  { id: 16, name: 'Jump Rope',              muscle: 'CARDIO',    cat: 'CARDIO',    icon: '⭕', equipment: 'Bodyweight',   diff: 'BEGINNER',     addedOn: 'FEB 05, 2024' },
  { id: 17, name: 'Chest Fly',              muscle: 'CHEST',     cat: 'ISOLATION', icon: '🦋', equipment: 'Cable',        diff: 'INTERMEDIATE', addedOn: 'FEB 10, 2024' },
  { id: 18, name: 'Face Pull',              muscle: 'SHOULDERS', cat: 'ISOLATION', icon: '🔄', equipment: 'Cable',        diff: 'BEGINNER',     addedOn: 'MAR 01, 2024' },
  { id: 19, name: 'Hip Thrust',             muscle: 'LEGS',      cat: 'COMPOUND',  icon: '🍑', equipment: 'Barbell',      diff: 'INTERMEDIATE', addedOn: 'MAR 05, 2024' },
];

const PAGE_SIZE = 10;

// Custom pill-styled select
function PillSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: '#faf9f7',
          border: '2px solid #dad4c8',
          borderRadius: 9999,
          padding: '8px 36px 8px 16px',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: '#2e2f2e',
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = '#38671a'; }}
        onBlur={e => { e.target.style.borderColor = '#dad4c8'; }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 16,
          color: '#5b5c5a',
          pointerEvents: 'none',
        }}
      >
        expand_more
      </span>
    </div>
  );
}

// Modal select (inside form)
function FormSelect({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: '#fff',
          border: '2px solid #dad4c8',
          borderRadius: 9999,
          padding: '12px 42px 12px 18px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 14,
          color: '#2e2f2e',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = '#38671a'; }}
        onBlur={e => { e.target.style.borderColor = '#dad4c8'; }}
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 18,
          color: '#5b5c5a',
          pointerEvents: 'none',
        }}
      >
        expand_more
      </span>
    </div>
  );
}

function DiffBars({ diff }) {
  const filled = DIFF_BARS[diff] ?? 1;
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            width: 8,
            height: 18,
            borderRadius: 9999,
            background: i <= filled ? '#38671a' : '#e8e2d6',
          }}
        />
      ))}
    </div>
  );
}

function ExerciseModal({ exercise, onClose, onSave }) {
  const [form, setForm] = useState(
    exercise
      ? { name: exercise.name, muscle: exercise.muscle, cat: exercise.cat, equipment: exercise.equipment, icon: exercise.icon, diff: exercise.diff }
      : { name: '', muscle: 'CHEST', cat: 'COMPOUND', equipment: 'Barbell', icon: '🏋️', diff: 'BEGINNER' }
  );
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 540 }}>
        <button className="adm-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        <h2 className="adm-modal-title">{exercise ? 'Edit Exercise' : 'Add Exercise'}</h2>

        <div className="adm-form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="adm-form-label">Exercise Name</label>
          <input
            className="adm-form-input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Barbell Bench Press"
          />
        </div>

        <div className="adm-grid-2">
          <div className="adm-form-field">
            <label className="adm-form-label">Muscle Group</label>
            <FormSelect
              value={form.muscle}
              onChange={v => set('muscle', v)}
              options={['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO']}
            />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Category</label>
            <FormSelect
              value={form.cat}
              onChange={v => set('cat', v)}
              options={['COMPOUND', 'ISOLATION', 'ISOMETRIC', 'CARDIO']}
            />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Difficulty</label>
            <FormSelect
              value={form.diff}
              onChange={v => set('diff', v)}
              options={['BEGINNER', 'INTERMEDIATE', 'EXPERT']}
            />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Equipment</label>
            <input
              className="adm-form-input"
              value={form.equipment}
              onChange={e => set('equipment', e.target.value)}
              placeholder="e.g. Barbell, Dumbbells"
            />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Icon (emoji)</label>
            <input
              className="adm-form-input"
              value={form.icon}
              onChange={e => set('icon', e.target.value)}
              placeholder="🏋️"
              maxLength={2}
            />
          </div>
        </div>

        <div className="adm-form-actions">
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="adm-btn-primary"
            onClick={() => { if (form.name.trim()) onSave(form); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            {exercise ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { PillSelect, FormSelect };

export default function AdminExerciseLibrary() {
  const [exercises, setExercises] = useState(INITIAL_EXERCISES);
  const [search,    setSearch]    = useState('');
  const [muscle,    setMuscle]    = useState('ALL');
  const [diffF,     setDiffF]     = useState('ALL');
  const [modal,     setModal]     = useState(null);
  const [toDelete,  setToDelete]  = useState(null);
  const [page,      setPage]      = useState(1);

  const filtered = exercises.filter(ex => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscle !== 'ALL' && ex.muscle !== muscle) return false;
    if (diffF  !== 'ALL' && ex.diff  !== diffF)  return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSave(form) {
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    if (modal?.id) {
      setExercises(es => es.map(e => e.id === modal.id ? { ...e, ...form } : e));
    } else {
      setExercises(es => [...es, { id: Date.now(), ...form, addedOn: now }]);
    }
    setModal(null);
  }

  function handleDelete() {
    setExercises(es => es.filter(e => e.id !== toDelete.id));
    setToDelete(null);
  }

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">// CURATED_DIRECTORY</p>
          <h1 className="adm-page-title">Exercise<br/>Library</h1>
        </div>
        <button className="adm-btn-primary" onClick={() => setModal({})}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 16 }}>add</span>
          Add Exercise
        </button>
      </div>

      {/* ── Bento filters + stats ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
        {/* Filters box */}
        <div style={{
          background: '#f1f1ef',
          border: '2px dashed #dad4c8',
          borderRadius: 16,
          padding: '16px 20px',
        }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#767775', marginBottom: 10 }}>
            Quick Filters
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="adm-search-wrap">
              <span className="material-symbols-outlined adm-search-icon">search</span>
              <input
                className="adm-search"
                style={{ width: 220 }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search exercises..."
              />
            </div>
            <PillSelect
              value={muscle}
              onChange={v => { setMuscle(v); setPage(1); }}
              options={MUSCLE_GROUPS.map(m => ({ value: m, label: m === 'ALL' ? 'Muscle: All' : m }))}
            />
            <PillSelect
              value={diffF}
              onChange={v => { setDiffF(v); setPage(1); }}
              options={DIFFICULTIES.map(d => ({ value: d, label: d === 'ALL' ? 'Difficulty: All' : d }))}
            />
            {(muscle !== 'ALL' || diffF !== 'ALL' || search) && (
              <button
                onClick={() => { setMuscle('ALL'); setDiffF('ALL'); setSearch(''); setPage(1); }}
                style={{
                  background: 'transparent',
                  border: '2px solid #dad4c8',
                  borderRadius: 9999,
                  padding: '8px 16px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: '#5b5c5a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Stat: Total */}
        <div style={{
          background: '#c3fb9c',
          border: '2px solid #dad4c8',
          borderRadius: 16,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 130,
          boxShadow: '-4px 4px 0 #2e2f2e',
        }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#214f01' }}>
            Total Exercises
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: '#214f01', lineHeight: 1 }}>
            {exercises.length}
          </p>
        </div>

        {/* Stat: Compound */}
        <div style={{
          background: '#b4a5ff',
          border: '2px solid #dad4c8',
          borderRadius: 16,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 130,
          boxShadow: '-4px 4px 0 #2e2f2e',
        }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#180058' }}>
            Compound Moves
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: '#180058', lineHeight: 1 }}>
            {exercises.filter(e => e.cat === 'COMPOUND').length}
          </p>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Preview</th>
              <th>Exercise Name</th>
              <th>Muscle Group</th>
              <th>Equipment</th>
              <th style={{ textAlign: 'center' }}>Difficulty</th>
              <th>Added On</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(ex => {
              const mc = MUSCLE_COLOR[ex.muscle] ?? { bg: '#e8e2d6', color: '#555148' };
              return (
                <tr key={ex.id}>
                  {/* Preview thumbnail */}
                  <td>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: EXERCISE_BG[ex.muscle] ?? '#f1f1ef',
                      border: '2px solid #dad4c8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                    }}>
                      {ex.icon}
                    </div>
                  </td>

                  {/* Name + category */}
                  <td>
                    <p style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.2, marginBottom: 2 }}>
                      {ex.name}
                    </p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#767775' }}>
                      {CAT_LABEL[ex.cat]}
                    </p>
                  </td>

                  {/* Muscle chip */}
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: mc.bg,
                      color: mc.color,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: 9999,
                    }}>
                      {ex.muscle}
                    </span>
                  </td>

                  {/* Equipment */}
                  <td className="adm-td-mono">{ex.equipment}</td>

                  {/* Difficulty bars */}
                  <td style={{ textAlign: 'center' }}>
                    <DiffBars diff={ex.diff} />
                  </td>

                  {/* Date */}
                  <td className="adm-td-mono">{ex.addedOn}</td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="adm-icon-btn adm-icon-btn--edit" onClick={() => setModal(ex)} title="Edit">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setToDelete(ex)} title="Delete">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">
                    <span className="material-symbols-outlined adm-empty-icon">fitness_center</span>
                    <p className="adm-empty-text">No exercises match your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 4px' }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#767775' }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid #dad4c8', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: p === page ? 'none' : '2px solid #dad4c8',
                background: p === page ? '#38671a' : 'transparent',
                color: p === page ? '#d6ffb7' : '#2e2f2e',
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid #dad4c8', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {modal !== null && (
        <ExerciseModal
          exercise={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {toDelete && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setToDelete(null)}>
          <div className="adm-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{toDelete.icon}</div>
            <h2 className="adm-modal-title">Delete Exercise?</h2>
            <p style={{ color: '#5b5c5a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Remove <strong>{toDelete.name}</strong> from the library?
              Programs using it may be affected.
            </p>
            <div className="adm-form-actions" style={{ justifyContent: 'center' }}>
              <button className="adm-btn-ghost" onClick={() => setToDelete(null)}>Cancel</button>
              <button
                className="adm-btn-primary"
                style={{ background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
