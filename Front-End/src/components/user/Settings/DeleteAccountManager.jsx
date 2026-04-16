import { useState } from 'react';
import { accountAPI } from '../../../api/account';
import { useAuth } from '../../../hooks/useAuth';

export default function DeleteAccountManager({ onClose }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await accountAPI.deleteAccount();
      logout();
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  return (
    <div
      className="st-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="st-modal-panel" style={{ borderColor: '#fc7981' }}>
        <button className="st-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>

        <h3 className="st-modal-title" style={{ color: '#b02500' }}>Delete Account</h3>

        <p className="st-modal-desc" style={{ fontWeight: 700, color: '#2e2f2e' }}>
          This action is permanent and cannot be undone.
        </p>
        <p className="st-modal-desc">
          All your personal data, workout history, and nutrition logs will be removed immediately
          after confirmation.
        </p>

        <div style={{ marginBottom: 24 }}>
          <label className="st-field-label" style={{ marginBottom: 8 }}>
            Type <strong style={{ color: '#b02500', fontFamily: 'Space Mono, monospace' }}>DELETE</strong> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="st-input"
            style={{ borderRadius: 12, fontFamily: 'Space Mono, monospace' }}
          />
        </div>

        {error && (
          <p style={{ color: '#b02500', marginBottom: 16, fontSize: 14 }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="st-modal-btn st-modal-btn--danger"
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
          >
            {loading ? 'Processing…' : 'Permanently Delete Account'}
          </button>
          <button
            className="st-modal-btn st-modal-btn--outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
