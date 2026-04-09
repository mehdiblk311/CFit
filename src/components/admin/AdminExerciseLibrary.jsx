import { useState } from 'react';

const MUSCLE_GROUPS = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'];

const INITIAL_EXERCISES = [
  { id: 1,  name: 'Barbell Bench Press',    muscle: 'CHEST',     cat: 'COMPOUND', icon: '🏋️', sets: '4×8-12', equipment: 'Barbell' },
  { id: 2,  name: 'Incline Dumbbell Press', muscle: 'CHEST',     cat: 'COMPOUND', icon: '🏋️', sets: '3×10',   equipment: 'Dumbbells' },
  { id: 3,  name: 'Pull-up',                muscle: 'BACK',      cat: 'COMPOUND', icon: '💪', sets: '4×6-10', equipment: 'Bodyweight' },
  { id: 4,  name: 'Deadlift',               muscle: 'BACK',      cat: 'COMPOUND', icon: '🔩', sets: '4×5',    equipment: 'Barbell' },
  { id: 5,  name: 'Barbell Row',            muscle: 'BACK',      cat: 'COMPOUND', icon: '🏋️', sets: '4×8',    equipment: 'Barbell' },
  { id: 6,  name: 'Squat',                  muscle: 'LEGS',      cat: 'COMPOUND', icon: '🦵', sets: '4×8-10', equipment: 'Barbell' },
  { id: 7,  name: 'Romanian Deadlift',      muscle: 'LEGS',      cat: 'COMPOUND', icon: '🦵', sets: '3×10',   equipment: 'Barbell' },
  { id: 8,  name: 'Leg Press',              muscle: 'LEGS',      cat: 'COMPOUND', icon: '🦵', sets: '3×12',   equipment: 'Machine' },
  { id: 9,  name: 'Overhead Press',         muscle: 'SHOULDERS', cat: 'COMPOUND', icon: '🔼', sets: '4×8-10', equipment: 'Barbell' },
  { id: 10, name: 'Lateral Raise',          muscle: 'SHOULDERS', cat: 'ISOLATION', icon: '↔️', sets: '4×12-15', equipment: 'Dumbbells' },
  { id: 11, name: 'Bicep Curl',             muscle: 'ARMS',      cat: 'ISOLATION', icon: '💪', sets: '3×12',   equipment: 'Dumbbells' },
  { id: 12, name: 'Tricep Pushdown',        muscle: 'ARMS',      cat: 'ISOLATION', icon: '⬇️', sets: '3×12',   equipment: 'Cable' },
  { id: 13, name: 'Plank',                  muscle: 'CORE',      cat: 'ISOMETRIC', icon: '🧘', sets: '3×60s',  equipment: 'Bodyweight' },
  { id: 14, name: 'Cable Crunch',           muscle: 'CORE',      cat: 'ISOLATION', icon: '⚡', sets: '3×15',   equipment: 'Cable' },
  { id: 15, name: 'Running',                muscle: 'CARDIO',    cat: 'CARDIO',    icon: '🏃', sets: '30 min', equipment: 'Treadmill' },
  { id: 16, name: 'Jump Rope',              muscle: 'CARDIO',    cat: 'CARDIO',    icon: '⭕', sets: '10 min', equipment: 'Bodyweight' },
  { id: 17, name: 'Chest Fly',              muscle: 'CHEST',     cat: 'ISOLATION', icon: '🦋', sets: '3×12',   equipment: 'Cable' },
  { id: 18, name: 'Face Pull',              muscle: 'SHOULDERS', cat: 'ISOLATION', icon: '🔄', sets: '4×15',   equipment: 'Cable' },
  { id: 19, name: 'Hip Thrust',             muscle: 'LEGS',      cat: 'COMPOUND',  icon: '🍑', sets: '4×10',   equipment: 'Barbell' },
];

const CAT_CHIP = {
  COMPOUND:  'adm-chip--green',
  ISOLATION: 'adm-chip--purple',
  ISOMETRIC: 'adm-chip--oat',
  CARDIO:    { background: '#f8cc65', color: '#9d6a09', display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 9999, fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' },
};

function ExerciseModal({ exercise, onClose, onSave }) {
  const [form, setForm] = useState(
    exercise
      ? { name: exercise.name, muscle: exercise.muscle, cat: exercise.cat, sets: exercise.sets, equipment: exercise.equipment, icon: exercise.icon }
      : { name: '', muscle: 'CHEST', cat: 'COMPOUND', sets: '3×10', equipment: 'Barbell', icon: '🏋️' }
  );
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <button className="adm-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        <h2 className="adm-modal-title">{exercise ? 'Edit Exercise' : 'Add Exercise'}</h2>

        <div className="adm-grid-2">
          <div className="adm-form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="adm-form-label">Exercise Name</label>
            <input className="adm-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Barbell Bench Press" />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Muscle Group</label>
            <select className="adm-form-select" value={form.muscle} onChange={e => set('muscle', e.target.value)}>
              {['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Category</label>
            <select className="adm-form-select" value={form.cat} onChange={e => set('cat', e.target.value)}>
              {['COMPOUND', 'ISOLATION', 'ISOMETRIC', 'CARDIO'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Default Sets</label>
            <input className="adm-form-input" value={form.sets} onChange={e => set('sets', e.target.value)} placeholder="e.g. 4×8-12" />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Equipment</label>
            <input className="adm-form-input" value={form.equipment} onChange={e => set('equipment', e.target.value)} placeholder="e.g. Barbell" />
          </div>
          <div className="adm-form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="adm-form-label">Icon (emoji)</label>
            <input className="adm-form-input" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🏋️" maxLength={2} />
          </div>
        </div>

        <div className="adm-form-actions">
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn-primary" onClick={() => { if (form.name.trim()) onSave(form); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            {exercise ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExerciseLibrary() {
  const [exercises, setExercises] = useState(INITIAL_EXERCISES);
  const [search, setSearch]       = useState('');
  const [muscle, setMuscle]       = useState('ALL');
  const [modal, setModal]         = useState(null);  // null | {} | exercise
  const [toDelete, setToDelete]   = useState(null);

  const filtered = exercises.filter(ex => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscle !== 'ALL' && ex.muscle !== muscle) return false;
    return true;
  });

  function handleSave(form) {
    if (modal?.id) {
      setExercises(es => es.map(e => e.id === modal.id ? { ...e, ...form } : e));
    } else {
      setExercises(es => [...es, { id: Date.now(), ...form }]);
    }
    setModal(null);
  }

  function handleDelete() {
    setExercises(es => es.filter(e => e.id !== toDelete.id));
    setToDelete(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">// EXERCISE_DATABASE</p>
          <h1 className="adm-page-title">Exercise<br/>Library</h1>
        </div>
        <div className="adm-page-actions">
          <div className="adm-search-wrap">
            <span className="material-symbols-outlined adm-search-icon">search</span>
            <input
              className="adm-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
            />
          </div>
          <button className="adm-btn-primary" onClick={() => setModal({})}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Exercise
          </button>
        </div>
      </div>

      {/* Muscle group filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {MUSCLE_GROUPS.map(m => (
          <button
            key={m}
            onClick={() => setMuscle(m)}
            style={{
              border: 'none',
              borderRadius: 9999,
              padding: '8px 16px',
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: muscle === m ? '#38671a' : '#e8e2d6',
              color: muscle === m ? '#d6ffb7' : '#5b5c5a',
              boxShadow: muscle === m ? '-3px 3px 0 #2e2f2e' : 'none',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span className="adm-chip adm-chip--oat">{exercises.length} total exercises</span>
        <span className="adm-chip adm-chip--green">{exercises.filter(e => e.cat === 'COMPOUND').length} compound</span>
        <span className="adm-chip adm-chip--purple">{exercises.filter(e => e.cat === 'ISOLATION').length} isolation</span>
      </div>

      {/* Grid of exercise cards */}
      <div className="adm-grid-3">
        {filtered.map(ex => (
          <div key={ex.id} className="adm-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#f1f1ef',
                border: '2px solid #dad4c8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {ex.icon}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="adm-icon-btn adm-icon-btn--edit" onClick={() => setModal(ex)} title="Edit">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setToDelete(ex)} title="Delete">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>

            <h3 style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', marginBottom: 8, lineHeight: 1.3 }}>
              {ex.name}
            </h3>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`adm-chip ${CAT_CHIP[ex.cat] ?? 'adm-chip--oat'}`}>{ex.cat}</span>
              <span className="adm-chip adm-chip--oat">{ex.muscle}</span>
            </div>

            <hr className="adm-divider" style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#5b5c5a', letterSpacing: '0.5px' }}>
                {ex.sets}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775', letterSpacing: '0.5px' }}>
                {ex.equipment}
              </span>
            </div>
          </div>
        ))}

        {/* Add new placeholder card */}
        <button
          className="adm-card"
          onClick={() => setModal({})}
          style={{
            padding: 20,
            background: 'transparent',
            border: '2px dashed #dad4c8',
            boxShadow: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 160,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f1ef'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#dad4c8' }}>add_circle</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#adadab' }}>
            Add Exercise
          </span>
        </button>
      </div>

      {filtered.length === 0 && search && (
        <div className="adm-empty" style={{ marginTop: 40 }}>
          <span className="material-symbols-outlined adm-empty-icon">search_off</span>
          <p className="adm-empty-text">No exercises match "{search}"</p>
        </div>
      )}

      {/* Modals */}
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
              Remove <strong>{toDelete.name}</strong> from the library? Programs using it may be affected.
            </p>
            <div className="adm-form-actions" style={{ justifyContent: 'center' }}>
              <button className="adm-btn-ghost" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="adm-btn-primary" style={{ background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
