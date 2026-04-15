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
      if (data && data.id) {
        setExportId(data.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to request export. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-modal-overlay">
      <div className="st-modal-panel">
        <button className="st-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        
        <h3 className="st-modal-title">Export My Data</h3>
        
        {!success ? (
          <>
            <p className="st-modal-desc">
              Request a complete export of your personal data, including your body metrics, workout history, and nutrition logs. 
              The export process may take a few minutes. We will prepare a JSON file for you to download.
            </p>

            {error && <p style={{color: '#b02500', marginBottom: '16px', fontSize: '14px'}}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="st-modal-btn st-modal-btn--primary" 
                onClick={handleExport}
                disabled={loading}
              >
                {loading ? 'Requesting...' : 'Request Data Export'}
              </button>
              <button className="st-modal-btn st-modal-btn--outline" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="st-modal-desc" style={{ color: '#38671a', fontWeight: '600' }}>
              Your export request has been received. 
            </p>
            <p className="st-modal-desc">
              {exportId ? `Export ID: ${exportId}. ` : ''}
              An email will be sent to you when the data is ready to download, or you can check back later.
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
