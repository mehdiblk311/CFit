import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import ExerciseImagePreview from '../shared/ExerciseImagePreview';
import {
  useCreateExercise,
  useDeleteExerciseMutation,
  useExerciseMeta,
  useExercises,
  useUpdateExerciseMutation,
} from '../../hooks/queries/useWorkouts';
import { resolveExerciseImageUrl } from '../../utils/exerciseImages';
import { uiStore } from '../../stores/uiStore';

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

const INLINE_IMAGE_LIMIT = 500;

// Muscle group → Unsplash fallback photo
const MUSCLE_IMAGE = {
  CHEST:     'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=120&fit=crop&auto=format&q=80',
  BACK:      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop&auto=format&q=80',
  LEGS:      'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=120&h=120&fit=crop&auto=format&q=80',
  SHOULDERS: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=120&h=120&fit=crop&auto=format&q=80',
  ARMS:      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=120&h=120&fit=crop&auto=format&q=80',
  CORE:      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&h=120&fit=crop&auto=format&q=80',
  CARDIO:    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=120&h=120&fit=crop&auto=format&q=80',
};

function getAdminExerciseImage(ex) {
  const url = resolveExerciseImageUrl(ex.imageUrl || '');
  if (url) return url;
  return MUSCLE_IMAGE[ex.muscle] || MUSCLE_IMAGE.CHEST;
}

async function readFileAsDataURL(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

async function loadImageElement(src) {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The selected file is not a valid image.'));
    image.src = src;
  });
}

async function compressExerciseImageFile(file) {
  const source = await readFileAsDataURL(file);
  const image = await loadImageElement(source);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Image compression is not available in this browser.');
  }

  let maxSide = 160;
  let quality = 0.62;
  while (maxSide >= 48) {
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let nextQuality = quality;
    while (nextQuality >= 0.18) {
      const candidate = canvas.toDataURL('image/webp', nextQuality);
      if (candidate.length <= INLINE_IMAGE_LIMIT) {
        return candidate;
      }
      nextQuality -= 0.08;
    }

    maxSide -= 24;
  }

  throw new Error(
    `This API currently stores image strings only. "${file.name}" is still too large after compression. Use a hosted image URL or a much smaller asset.`
  );
}

function splitField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function upperToken(value, fallback = 'UNKNOWN') {
  const token = normalizeToken(value);
  return token ? token.replace(/\s+/g, '_').toUpperCase() : fallback;
}

function mapBackendExercise(exercise) {
  const primaryMuscle = splitField(exercise.primary_muscles)[0] || 'chest';
  const level = normalizeToken(exercise.level || 'beginner');
  return {
    id: exercise.id,
    name: exercise.name,
    muscle: upperToken(primaryMuscle, 'CHEST'),
    cat: upperToken(exercise.category, 'STRENGTH'),
    equipment: exercise.equipment || 'Bodyweight',
    diff: upperToken(level === 'advanced' ? 'expert' : level, 'BEGINNER'),
    imageUrl: exercise.image_url || exercise.alt_image_url || '',
    altImageUrl: exercise.alt_image_url || '',
    addedOn: exercise.created_at
      ? new Date(exercise.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
      : 'RECENT',
    raw: exercise,
  };
}

const PAGE_SIZE = 10;

function ModalPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}

// Custom pill-styled select
function PillSelect({ value, onChange, options }) {
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
function FormSelect({ value, onChange, options, disabled = false }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: disabled ? '#f4f1ea' : '#fff',
          border: '2px solid #dad4c8',
          borderRadius: 9999,
          padding: '12px 42px 12px 18px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 14,
          color: '#2e2f2e',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
          opacity: disabled ? 0.72 : 1,
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#38671a'; }}
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

function ExerciseFilterModal({ initialFilters, muscleOptions, diffOptions, onApply, onClose }) {
  const [local, setLocal] = useState(initialFilters);

  function setField(key, value) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    onApply(local);
    onClose();
  }

  function clearAndApply() {
    const cleared = { search: '', muscle: 'ALL', diff: 'ALL' };
    onApply(cleared);
    onClose();
  }

  return (
    <ModalPortal>
      <div className="adm-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="adm-modal" style={{ maxWidth: 620 }}>
          <button className="adm-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
          <h2 className="adm-modal-title">Filter Exercises</h2>

          <div className="adm-form-field">
            <label className="adm-form-label">Search</label>
            <div className="adm-search-wrap">
              <span className="material-symbols-outlined adm-search-icon">search</span>
              <input
                className="adm-search"
                value={local.search}
                onChange={(event) => setField('search', event.target.value)}
                placeholder="Search exercises..."
                autoFocus
              />
            </div>
          </div>

          <div className="adm-grid-2">
            <div className="adm-form-field">
              <label className="adm-form-label">Muscle Group</label>
              <FormSelect
                value={local.muscle}
                onChange={(value) => setField('muscle', value)}
                options={muscleOptions.map((value) => ({ value, label: value === 'ALL' ? 'ALL MUSCLES' : value }))}
              />
            </div>
            <div className="adm-form-field">
              <label className="adm-form-label">Difficulty</label>
              <FormSelect
                value={local.diff}
                onChange={(value) => setField('diff', value)}
                options={diffOptions.map((value) => ({ value, label: value === 'ALL' ? 'ALL LEVELS' : value }))}
              />
            </div>
          </div>

          <div className="adm-form-actions">
            <button className="adm-btn-ghost" onClick={clearAndApply}>Clear All</button>
            <button className="adm-btn-primary" onClick={applyFilters}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>tune</span>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
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

function AdminExerciseImageFallback({ exercise }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <img
        src={getAdminExerciseImage(exercise)}
        alt={exercise.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(46,47,46,0.08), rgba(46,47,46,0.34))',
          color: '#fffdf9',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>image</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {exercise.muscle || 'Exercise'}
          </span>
        </div>
      </div>
    </div>
  );
}

function getExerciseDescription(exercise) {
  const raw = exercise?.raw?.instructions || '';
  if (!raw) return 'No exercise description available yet.';
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).slice(0, 3).join(' ');
  }
  const text = String(raw).trim();
  if (!text) return 'No exercise description available yet.';
  return text;
}

function ExerciseInfoModal({ exercise, onClose }) {
  if (!exercise) return null;

  return (
    <div className="adm-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 640 }}>
        <button className="adm-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 84, height: 84, borderRadius: 14, overflow: 'hidden', border: '2px solid #dad4c8', position: 'relative', flexShrink: 0 }}>
            <ExerciseImagePreview
              key={`detail-${exercise.id}-${exercise.imageUrl}-${exercise.altImageUrl || ''}`}
              exercise={exercise}
              alt={exercise.name}
              style={{ position: 'absolute', inset: 0 }}
              imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              animate
              fallback={<AdminExerciseImageFallback exercise={exercise} />}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 className="adm-modal-title" style={{ margin: 0 }}>{exercise.name}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#5b5c5a' }}>
              {(CAT_LABEL[exercise.cat] || exercise.cat.replace(/_/g, ' ')).toUpperCase()}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
          <div style={{ border: '2px solid #dad4c8', borderRadius: 12, padding: 10 }}>
            <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775' }}>MUSCLE</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>{exercise.muscle}</p>
          </div>
          <div style={{ border: '2px solid #dad4c8', borderRadius: 12, padding: 10 }}>
            <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775' }}>EQUIPMENT</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>{exercise.equipment || 'Bodyweight'}</p>
          </div>
          <div style={{ border: '2px solid #dad4c8', borderRadius: 12, padding: 10 }}>
            <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775' }}>DIFFICULTY</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>{exercise.diff}</p>
          </div>
          <div style={{ border: '2px solid #dad4c8', borderRadius: 12, padding: 10 }}>
            <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#767775' }}>ADDED</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700 }}>{exercise.addedOn}</p>
          </div>
        </div>

        <div style={{ border: '2px solid #dad4c8', borderRadius: 14, background: '#faf9f7', padding: 12 }}>
          <p style={{ margin: '0 0 6px', fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.8px', color: '#767775' }}>DESCRIPTION</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#2e2f2e' }}>{getExerciseDescription(exercise)}</p>
        </div>
      </div>
    </div>
  );
}

function ExerciseModal({ exercise, onClose, onSave }) {
  const [form, setForm] = useState(
    exercise
      ? {
          name: exercise.name,
          muscle: exercise.muscle,
          cat: exercise.cat,
          equipment: exercise.equipment,
          diff: exercise.diff,
          imageUrl: exercise.imageUrl || '',
          altImageUrl: exercise.altImageUrl || '',
          instructions: exercise.raw?.instructions || '',
        }
      : {
          name: '',
          muscle: 'CHEST',
          cat: 'COMPOUND',
          equipment: 'Barbell',
          diff: 'BEGINNER',
          imageUrl: '',
          altImageUrl: '',
          instructions: '',
        }
  );
  const [fileState, setFileState] = useState({ primary: '', alternate: '', error: '' });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleImageImport(kind, file) {
    if (!file) return;

    try {
      const compactImage = await compressExerciseImageFile(file);
      set(kind, compactImage);
      setFileState((prev) => ({
        ...prev,
        [kind === 'imageUrl' ? 'primary' : 'alternate']: file.name,
        error: '',
      }));
      uiStore.getState().addToast(`${file.name} imported`, 'success');
    } catch (error) {
      const message = error?.message || 'Could not import that image file.';
      setFileState((prev) => ({ ...prev, error: message }));
      uiStore.getState().addToast(message, 'error');
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal" style={{ maxWidth: 620 }}>
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

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
            <div style={{ border: '2px solid #dad4c8', borderRadius: 18, overflow: 'hidden', background: '#f1f1ef', minHeight: 180, position: 'relative' }}>
              <ExerciseImagePreview
                key={`${form.imageUrl}-${form.altImageUrl}-${form.muscle}-${form.name}`}
                exercise={{ imageUrl: form.imageUrl, altImageUrl: form.altImageUrl, muscle: form.muscle, name: form.name || 'Exercise' }}
                alt="preview"
                style={{ position: 'absolute', inset: 0 }}
                imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                animate={Boolean(form.altImageUrl)}
                fallback={<AdminExerciseImageFallback exercise={{ imageUrl: '', muscle: form.muscle, name: form.name || 'Exercise' }} />}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ border: '2px dashed #dad4c8', borderRadius: 18, background: '#faf9f7', padding: 14 }}>
                <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#2e2f2e' }}>
                  Primary image
                </p>
                <p style={{ margin: '6px 0 10px', fontSize: 13, lineHeight: 1.5, color: '#5b5c5a' }}>
                  Pick a file from your computer or paste a hosted image URL.
                </p>
                <label className="adm-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => handleImageImport('imageUrl', event.target.files?.[0])}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                  Import File
                </label>
                <input
                  className="adm-form-input"
                  value={form.imageUrl}
                  onChange={e => set('imageUrl', e.target.value)}
                  placeholder="https://... or /exercise-images/..."
                />
                {fileState.primary ? (
                  <p style={{ margin: '8px 0 0', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.5px', color: '#38671a' }}>
                    Imported: {fileState.primary}
                  </p>
                ) : null}
              </div>

              <div style={{ border: '2px dashed #dad4c8', borderRadius: 18, background: '#faf9f7', padding: 14 }}>
                <p style={{ margin: 0, fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', color: '#2e2f2e' }}>
                  Alternate frame
                </p>
                <p style={{ margin: '6px 0 10px', fontSize: 13, lineHeight: 1.5, color: '#5b5c5a' }}>
                  Optional second image for motion-style preview.
                </p>
                <label className="adm-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => handleImageImport('altImageUrl', event.target.files?.[0])}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>imagesmode</span>
                  Import Alt File
                </label>
                <input
                  className="adm-form-input"
                  value={form.altImageUrl}
                  onChange={e => set('altImageUrl', e.target.value)}
                  placeholder="https://... or /exercise-images/..."
                />
                {fileState.alternate ? (
                  <p style={{ margin: '8px 0 0', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.5px', color: '#38671a' }}>
                    Imported: {fileState.alternate}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: '#fff8ea', border: '2px solid #f4d28a' }}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: '#7c5507' }}>
              Imported files are compacted into image strings because the current backend only stores image URLs/paths. If a file is too large, use a hosted image URL or a tiny asset.
            </p>
          </div>
          {fileState.error ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#b02500' }}>{fileState.error}</p>
          ) : null}
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
              options={CATEGORIES.filter((item) => item !== 'ALL')}
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
        </div>

        <div className="adm-form-field">
          <label className="adm-form-label">Instructions</label>
          <textarea
            className="adm-form-input"
            value={form.instructions}
            onChange={e => set('instructions', e.target.value)}
            placeholder="Short coaching cues or execution notes..."
            rows={4}
            style={{ borderRadius: 18, minHeight: 108, resize: 'vertical', paddingTop: 14 }}
          />
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
  const [filters,   setFilters]   = useState({ search: '', muscle: 'ALL', diff: 'ALL' });
  const [showFilters, setShowFilters] = useState(false);
  const [modal,     setModal]     = useState(null);
  const [detailExercise, setDetailExercise] = useState(null);
  const [toDelete,  setToDelete]  = useState(null);
  const [page,      setPage]      = useState(1);
  const { data: metaData } = useExerciseMeta();
  const createExerciseMutation = useCreateExercise();
  const updateExerciseMutation = useUpdateExerciseMutation();
  const deleteExerciseMutation = useDeleteExerciseMutation();

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(filters.search ? { q: filters.search } : {}),
    ...(filters.muscle !== 'ALL' ? { muscle: normalizeToken(filters.muscle) } : {}),
    ...(filters.diff !== 'ALL' ? { level: normalizeToken(filters.diff === 'EXPERT' ? 'advanced' : filters.diff) } : {}),
  };

  const {
    data: exercisesData,
    isLoading,
    isError,
    errorMeta,
  } = useExercises(params, { keepPreviousData: true });

  const exercises = useMemo(() => {
    const items = exercisesData?.exercises || exercisesData?.data || exercisesData || [];
    return items.map(mapBackendExercise);
  }, [exercisesData]);
  const metadata = exercisesData?.metadata || {};
  const totalEntries = Number(metadata.total_count) || exercises.length;
  const totalPages = Math.max(1, Number(metadata.total_pages) || 1);
  const currentPage = Math.min(page, totalPages);
  const canPrevPage = currentPage > 1;
  const canNextPage = Boolean(metadata.has_next) || currentPage < totalPages;
  const visiblePages = useMemo(() => {
    const windowSize = 5;
    const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [currentPage, totalPages]);

  const availableMuscles = useMemo(() => {
    const fromMeta = (metaData?.muscles || []).map((item) => upperToken(item)).filter(Boolean);
    return ['ALL', ...new Set([...MUSCLE_GROUPS.slice(1), ...fromMeta])];
  }, [metaData]);

  const availableDiffs = useMemo(() => {
    const fromMeta = (metaData?.levels || []).map((item) => {
      const normalized = upperToken(item);
      return normalized === 'ADVANCED' ? 'EXPERT' : normalized;
    }).filter(Boolean);
    return ['ALL', ...new Set([...DIFFICULTIES.slice(1), ...fromMeta])];
  }, [metaData]);
  const activeFilterCount = Number(Boolean(filters.search)) + Number(filters.muscle !== 'ALL') + Number(filters.diff !== 'ALL');

  function handleSave(form) {
    const payload = {
      name: form.name.trim(),
      level: normalizeToken(form.diff === 'EXPERT' ? 'advanced' : form.diff),
      equipment: form.equipment.trim(),
      category: normalizeToken(form.cat),
      primary_muscles: normalizeToken(form.muscle),
      image_url: form.imageUrl.trim(),
      alt_image_url: form.altImageUrl.trim(),
      instructions: form.instructions.trim(),
    };

    if (!payload.name) return;

    if (modal?.id) {
      updateExerciseMutation.mutate(
        { exercise_id: modal.id, data: payload },
        { onSuccess: () => setModal(null) }
      );
      return;
    }
    createExerciseMutation.mutate(payload, { onSuccess: () => setModal(null) });
  }

  function handleDelete() {
    if (!toDelete?.id) return;
    deleteExerciseMutation.mutate(
      { exercise_id: toDelete.id },
      { onSettled: () => setToDelete(null) }
    );
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
      <div className="adm-bento-grid">
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {filters.search && <span className="adm-chip adm-chip--oat">Search: {filters.search}</span>}
              {filters.muscle !== 'ALL' && <span className="adm-chip adm-chip--green">{filters.muscle}</span>}
              {filters.diff !== 'ALL' && <span className="adm-chip adm-chip--purple">{filters.diff}</span>}
              {activeFilterCount === 0 && <span className="adm-chip adm-chip--oat">No active filters</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="adm-btn-ghost" onClick={() => setShowFilters(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>tune</span>
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
              {activeFilterCount > 0 && (
                <button
                  className="adm-btn-ghost"
                  onClick={() => {
                    setFilters({ search: '', muscle: 'ALL', diff: 'ALL' });
                    setPage(1);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stat: Total */}
        <div className="adm-bento-stat" style={{
          background: '#c3fb9c',
          border: '2px solid #dad4c8',
          boxShadow: '-4px 4px 0 #2e2f2e',
        }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#214f01' }}>
            Total Exercises
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: '#214f01', lineHeight: 1 }}>
            {totalEntries}
          </p>
        </div>

        {/* Stat: Compound */}
        <div className="adm-bento-stat" style={{
          background: '#b4a5ff',
          border: '2px solid #dad4c8',
          boxShadow: '-4px 4px 0 #2e2f2e',
        }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: '#180058' }}>
            Compound Moves
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-2px', color: '#180058', lineHeight: 1 }}>
            {exercises.filter(e => e.cat === 'STRENGTH').length}
          </p>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {isError && (
        <div className="adm-chip adm-chip--red" style={{ marginBottom: 12 }}>
          {errorMeta?.message || 'Exercise library is unavailable right now.'}
        </div>
      )}

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
            {isLoading ? (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">
                    <span className="material-symbols-outlined adm-empty-icon">sync</span>
                    <p className="adm-empty-text">Loading exercise library...</p>
                  </div>
                </td>
              </tr>
            ) : exercises.map(ex => {
              const mc = MUSCLE_COLOR[ex.muscle] ?? { bg: '#e8e2d6', color: '#555148' };
              return (
                <tr key={ex.id}>
                  {/* Preview thumbnail */}
                  <td>
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', border: '2px solid #dad4c8', background: '#f1f1ef', position: 'relative' }}>
                      <ExerciseImagePreview
                        key={`${ex.id}-${ex.imageUrl}-${ex.altImageUrl || ''}`}
                        exercise={ex}
                        alt={ex.name}
                        style={{ position: 'absolute', inset: 0 }}
                        imgStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        animate={false}
                        fallback={<AdminExerciseImageFallback exercise={ex} />}
                      />
                    </div>
                  </td>

                  {/* Name + category */}
                  <td>
                    <button
                      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                      onClick={() => setDetailExercise(ex)}
                    >
                      <p style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.2, marginBottom: 2 }}>
                        {ex.name}
                      </p>
                    </button>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#767775' }}>
                      {CAT_LABEL[ex.cat] || ex.cat.replace(/_/g, ' ')}
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

            {!isLoading && exercises.length === 0 && (
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
          Showing {totalEntries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min((currentPage - 1) * PAGE_SIZE + exercises.length, totalEntries)} of {totalEntries} entries
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={!canPrevPage}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid #dad4c8', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !canPrevPage ? 'not-allowed' : 'pointer',
              opacity: !canPrevPage ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>

          {visiblePages.map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: p === currentPage ? 'none' : '2px solid #dad4c8',
                background: p === currentPage ? '#38671a' : 'transparent',
                color: p === currentPage ? '#d6ffb7' : '#2e2f2e',
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
            onClick={() => setPage(currentPage + 1)}
            disabled={!canNextPage}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid #dad4c8', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !canNextPage ? 'not-allowed' : 'pointer',
              opacity: !canNextPage ? 0.4 : 1,
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
      {detailExercise && (
        <ExerciseInfoModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
      {toDelete && (
        <div className="adm-modal-overlay" onClick={e => e.target === e.currentTarget && setToDelete(null)}>
          <div className="adm-modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 12px', borderRadius: '50%', background: '#fff4f1', border: '2px solid #f1c2b4', display: 'grid', placeItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#b02500' }}>delete_forever</span>
            </div>
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
      {showFilters && (
        <ExerciseFilterModal
          initialFilters={filters}
          muscleOptions={availableMuscles}
          diffOptions={availableDiffs}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
