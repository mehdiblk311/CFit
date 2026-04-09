import { useState } from 'react';

const PROGRAM_TAGS = ['ALL', 'HYPERTROPHY', 'STRENGTH', 'ENDURANCE', 'BEGINNER', 'ADVANCED'];

const INITIAL_PROGRAMS = [
  {
    id: 1,
    name: 'PPL Hypertrophy — Beginner',
    tag: 'HYPERTROPHY',
    tagColor: '#c3fb9c',
    tagText: '#214f01',
    level: 'BEGINNER',
    days: 6,
    weeks: 12,
    exercises: 18,
    assignedUsers: 142,
    status: 'ACTIVE',
    description: 'Push-Pull-Legs split for muscle building. Ideal for those with 1–2 years of training.',
  },
  {
    id: 2,
    name: 'Powerlifting Strength Base',
    tag: 'STRENGTH',
    tagColor: '#b4a5ff',
    tagText: '#180058',
    level: 'ADVANCED',
    days: 4,
    weeks: 16,
    exercises: 12,
    assignedUsers: 67,
    status: 'ACTIVE',
    description: 'Competition prep and max strength development using RPE-based loading.',
  },
  {
    id: 3,
    name: 'Full Body 3x / Week',
    tag: 'BEGINNER',
    tagColor: '#f8cc65',
    tagText: '#9d6a09',
    level: 'BEGINNER',
    days: 3,
    weeks: 8,
    exercises: 9,
    assignedUsers: 289,
    status: 'ACTIVE',
    description: 'Simple full-body program for new lifters. 3 sessions per week.',
  },
  {
    id: 4,
    name: 'Cardio Conditioning',
    tag: 'ENDURANCE',
    tagColor: '#3bd3fd',
    tagText: '#0089ad',
    level: 'INTERMEDIATE',
    days: 5,
    weeks: 6,
    exercises: 8,
    assignedUsers: 98,
    status: 'DRAFT',
    description: 'Mixed cardio: steady state + HIIT intervals for aerobic capacity.',
  },
  {
    id: 5,
    name: 'Upper/Lower Split',
    tag: 'HYPERTROPHY',
    tagColor: '#c3fb9c',
    tagText: '#214f01',
    level: 'INTERMEDIATE',
    days: 4,
    weeks: 10,
    exercises: 14,
    assignedUsers: 176,
    status: 'ACTIVE',
    description: 'Classic 4-day upper/lower split for hypertrophy and strength gains.',
  },
  {
    id: 6,
    name: 'HIIT Advanced Protocol',
    tag: 'ADVANCED',
    tagColor: '#f95630',
    tagText: '#520c00',
    level: 'ADVANCED',
    days: 5,
    weeks: 8,
    exercises: 20,
    assignedUsers: 34,
    status: 'DRAFT',
    description: 'High intensity interval training for advanced athletes. Not for beginners.',
  },
];

const LEVEL_CHIP = {
  BEGINNER:     { bg: '#c3fb9c', color: '#214f01' },
  INTERMEDIATE: { bg: '#f8cc65', color: '#9d6a09' },
  ADVANCED:     { bg: '#f95630', color: '#520c00' },
};
const STATUS_CHIP = {
  ACTIVE: { bg: '#c3fb9c', color: '#214f01' },
  DRAFT:  { bg: '#e8e2d6', color: '#5b5c5a' },
};

function ProgramModal({ program, onClose, onSave }) {
  const [form, setForm] = useState(
    program
      ? { name: program.name, tag: program.tag, level: program.level, days: program.days, weeks: program.weeks, description: program.description, status: program.status }
      : { name: '', tag: 'HYPERTROPHY', level: 'BEGINNER', days: 3, weeks: 8, description: '', status: 'DRAFT' }
  );
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 560 }}>
        <button className="adm-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        <h2 className="adm-modal-title">{program ? 'Edit Program' : 'Create Program'}</h2>

        <div className="adm-form-field">
          <label className="adm-form-label">Program Name</label>
          <input className="adm-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. PPL Hypertrophy" />
        </div>
        <div className="adm-grid-2">
          <div className="adm-form-field">
            <label className="adm-form-label">Tag / Focus</label>
            <select className="adm-form-select" value={form.tag} onChange={e => set('tag', e.target.value)}>
              {['HYPERTROPHY', 'STRENGTH', 'ENDURANCE', 'BEGINNER', 'ADVANCED'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Level</label>
            <select className="adm-form-select" value={form.level} onChange={e => set('level', e.target.value)}>
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Days per Week</label>
            <input className="adm-form-input" type="number" min={1} max={7} value={form.days} onChange={e => set('days', Number(e.target.value))} />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Duration (weeks)</label>
            <input className="adm-form-input" type="number" min={1} max={52} value={form.weeks} onChange={e => set('weeks', Number(e.target.value))} />
          </div>
          <div className="adm-form-field">
            <label className="adm-form-label">Status</label>
            <select className="adm-form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>
        <div className="adm-form-field">
          <label className="adm-form-label">Description</label>
          <textarea className="adm-form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Briefly describe the program goals and methodology..." />
        </div>

        <div className="adm-form-actions">
          <button className="adm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="adm-btn-primary" onClick={() => { if (form.name.trim()) onSave(form); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            {program ? 'Save Changes' : 'Create Program'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserPrograms() {
  const [programs, setPrograms]   = useState(INITIAL_PROGRAMS);
  const [search, setSearch]       = useState('');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [modal, setModal]         = useState(null);
  const [toDelete, setToDelete]   = useState(null);

  const filtered = programs.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tagFilter !== 'ALL' && p.tag !== tagFilter) return false;
    return true;
  });

  function handleSave(form) {
    const tagMeta = { HYPERTROPHY: { bg: '#c3fb9c', text: '#214f01' }, STRENGTH: { bg: '#b4a5ff', text: '#180058' }, ENDURANCE: { bg: '#3bd3fd', text: '#0089ad' }, BEGINNER: { bg: '#f8cc65', text: '#9d6a09' }, ADVANCED: { bg: '#f95630', text: '#520c00' } };
    const meta = tagMeta[form.tag] ?? tagMeta.HYPERTROPHY;
    if (modal?.id) {
      setPrograms(ps => ps.map(p => p.id === modal.id ? { ...p, ...form, tagColor: meta.bg, tagText: meta.text } : p));
    } else {
      setPrograms(ps => [...ps, { id: Date.now(), ...form, tagColor: meta.bg, tagText: meta.text, exercises: 0, assignedUsers: 0 }]);
    }
    setModal(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <p className="adm-page-eyebrow">// WORKOUT_PROGRAMS</p>
          <h1 className="adm-page-title">User<br/>Programs</h1>
        </div>
        <div className="adm-page-actions">
          <div className="adm-search-wrap">
            <span className="material-symbols-outlined adm-search-icon">search</span>
            <input className="adm-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..." />
          </div>
          <button className="adm-btn-primary" onClick={() => setModal({})}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
            Create Program
          </button>
        </div>
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {PROGRAM_TAGS.map(t => (
          <button
            key={t}
            onClick={() => setTagFilter(t)}
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
              background: tagFilter === t ? '#38671a' : '#e8e2d6',
              color: tagFilter === t ? '#d6ffb7' : '#5b5c5a',
              boxShadow: tagFilter === t ? '-3px 3px 0 #2e2f2e' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <span className="adm-chip adm-chip--oat">{programs.length} programs total</span>
        <span className="adm-chip adm-chip--green">{programs.filter(p => p.status === 'ACTIVE').length} active</span>
        <span className="adm-chip adm-chip--purple">{programs.reduce((sum, p) => sum + p.assignedUsers, 0)} total assignments</span>
      </div>

      {/* Program cards grid */}
      <div className="adm-grid-3">
        {filtered.map(p => (
          <div key={p.id} className="adm-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                background: p.tagColor,
                color: p.tagText,
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '1px',
                padding: '4px 12px',
                borderRadius: 9999,
              }}>
                {p.tag}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="adm-icon-btn adm-icon-btn--edit" title="Edit" onClick={() => setModal(p)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button className="adm-icon-btn adm-icon-btn--danger" title="Delete" onClick={() => setToDelete(p)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.4px', lineHeight: 1.3, marginBottom: 8 }}>
              {p.name}
            </h3>

            {/* Description */}
            <p style={{ fontSize: 12, color: '#5b5c5a', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
              {p.description}
            </p>

            {/* Chips row */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ ...getStyleChip(LEVEL_CHIP[p.level]) }}>{p.level}</span>
              <span style={{ ...getStyleChip(STATUS_CHIP[p.status]) }}>{p.status}</span>
            </div>

            <hr className="adm-divider" style={{ margin: '0 0 14px' }} />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', gap: 0 }}>
              {[
                { label: 'Days/wk', val: p.days },
                { label: 'Weeks',   val: p.weeks },
                { label: 'Users',   val: p.assignedUsers },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: '#2e2f2e' }}>{s.val}</p>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#767775' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Create new placeholder */}
        <button
          className="adm-card"
          onClick={() => setModal({})}
          style={{
            padding: 24,
            background: 'transparent',
            border: '2px dashed #dad4c8',
            boxShadow: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            minHeight: 200,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f1ef'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#dad4c8' }}>add_circle</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#adadab' }}>
            Create Program
          </span>
        </button>
      </div>

      {/* Modals */}
      {modal !== null && (
        <ProgramModal
          program={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {toDelete && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setToDelete(null)}>
          <div className="adm-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h2 className="adm-modal-title">Delete Program?</h2>
            <p style={{ color: '#5b5c5a', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Remove <strong>{toDelete.name}</strong>? {toDelete.assignedUsers} users are currently assigned to it.
            </p>
            <div className="adm-form-actions" style={{ justifyContent: 'center' }}>
              <button className="adm-btn-ghost" onClick={() => setToDelete(null)}>Cancel</button>
              <button className="adm-btn-primary" style={{ background: '#b02500', boxShadow: '-4px 4px 0 #2e2f2e' }} onClick={() => { setPrograms(ps => ps.filter(p => p.id !== toDelete.id)); setToDelete(null); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStyleChip({ bg, color }) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 9999,
    background: bg,
    color,
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };
}
