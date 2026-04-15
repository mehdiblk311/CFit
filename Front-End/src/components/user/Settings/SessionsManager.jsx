import { useState, useEffect } from 'react';
import { authAPI } from '../../../api/auth';

const SESSION_PAGE_SIZE = 100;

export default function SessionsManager({ onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleDateString();
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      let page = 1;
      let hasNext = true;
      const allSessions = [];

      while (hasNext) {
        const response = await authAPI.getSessions({
          page,
          limit: SESSION_PAGE_SIZE,
        });

        const pageSessions = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        allSessions.push(...pageSessions);

        if (!Array.isArray(response?.data)) {
          hasNext = false;
          continue;
        }

        const nextFromMetadata = Boolean(response?.metadata?.has_next);
        hasNext = nextFromMetadata && pageSessions.length > 0;
        page += 1;
      }

      const dedupedSessions = Array.from(
        new Map(allSessions.map((session) => [session.id, session])).values()
      );
      setSessions(dedupedSessions);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await authAPI.revokeSession(id);
      setSessions(prev => prev.filter((session) => session.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    const confirmed = window.confirm('This will log you out on this device and every other device. Continue?');
    if (!confirmed) return;

    try {
      await authAPI.logout(true);
      window.location.href = '/login';
    } catch (err) {
      alert(err.message || 'Failed to revoke sessions');
    }
  };

  return (
    <div className="st-modal-overlay">
      <div className="st-modal-panel">
        <button className="st-modal-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
        
        <h3 className="st-modal-title">Active Sessions</h3>
        <p className="st-modal-desc">Manage the devices that are currently logged into your account.</p>

        {loading ? (
          <p style={{textAlign: 'center', color: '#5b5c5a'}}>Loading...</p>
        ) : error ? (
          <p style={{color: '#b02500'}}>{error}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {sessions.map(session => (
                <div key={session.id} className="st-session-item">
                  <div className="st-session-info">
                    <div className="st-session-device">
                      {session.user_agent || 'Unknown Device'}
                    </div>
                    <div className="st-session-meta">
                      IP: {session.last_ip || 'Unknown'} • Expires: {formatDate(session.expires_at)}
                    </div>
                  </div>
                  <button className="st-session-revoke" onClick={() => handleRevoke(session.id)} title="Revoke Session">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                  </button>
                </div>
              ))}
            {sessions.length === 0 && <p>No active sessions found.</p>}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="st-modal-btn st-modal-btn--outline" onClick={handleRevokeAll}>
            Log Out of All Devices
          </button>
          <button className="st-modal-btn st-modal-btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
