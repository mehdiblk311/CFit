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
      // On success, force logout
      logout();
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  return (
    <div className="st-modal-overlay">
      <div className="st-modal-panel" style={{ borderColor: '#fc7981' }}>
        <button className="st-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        
        <h3 className="st-modal-title" style={{ color: '#b02500' }}>Delete Account</h3>
        
        <p className="st-modal-desc" style={{ fontWeight: '600' }}>
          This action is permanent and cannot be undone.
        </p>
        <p className="st-modal-desc">
          All your personal data, workout history, and nutrition logs will be removed immediately after confirmation.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#5b5c5a', marginBottom: '8px' }}>
            Type <strong style={{ color: '#b02500' }}>DELETE</strong> to confirm:
          </label>
          <input 
            type="text" 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '2px solid #dad4c8', fontSize: '16px', outline: 'none',
              fontFamily: 'Space Mono, monospace'
            }}
          />
        </div>

        {error && <p style={{color: '#b02500', marginBottom: '16px', fontSize: '14px'}}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="st-modal-btn st-modal-btn--danger" 
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
          >
            {loading ? 'Processing...' : 'Permanently Delete Account'}
          </button>
          <button className="st-modal-btn st-modal-btn--outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
