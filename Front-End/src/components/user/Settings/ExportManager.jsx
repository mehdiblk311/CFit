import { useState } from 'react';
import { accountAPI } from '../../../api/account';

export default function ExportManager({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [exportId, setExportId] = useState(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountAPI.createExport();
      setSuccess(true);
      if (data?.id) setExportId(data.id);
    } catch (err) {
      setError(err.message || 'Failed to request export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="st-modal-panel">
        <button className="st-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>

        <h3 className="st-modal-title">Export My Data</h3>

        {!success ? (
          <>
            <p className="st-modal-desc">
              Request a complete export of your personal data — body metrics, workout history,
              and nutrition logs. We will prepare a JSON file for you to download.
            </p>

            {error && (
              <p style={{ color: '#b02500', marginBottom: 16, fontSize: 14, lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                className="st-modal-btn st-modal-btn--primary"
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? 'Requesting…' : 'Request Data Export'}
              </button>
              <button
                className="st-modal-btn st-modal-btn--outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="st-modal-desc" style={{ color: '#38671a', fontWeight: 700 }}>
              Export request received.
            </p>
            <p className="st-modal-desc">
              {exportId ? `Export ID: ${exportId}. ` : ''}
              You will receive an email when the data is ready to download.
            </p>
            <button className="st-modal-btn st-modal-btn--primary" onClick={onClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
