import { Trash2 } from 'lucide-react';
import { deleteStudySession } from '../services/api.js';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function StudyActivity({ sessions, onSessionDeleted }) {
  const data = Array.isArray(sessions) ? sessions : [];
  const totalMinutes = data.reduce((sum, s) => sum + (s.duration || 0), 0);

  const handleDelete = async (sessionId, topicName) => {
    if (!sessionId) return;
    const confirmMsg = `Remove this study session${topicName ? ` ("${topicName}")` : ''}? This will remove the recorded time from your daily study hours everywhere.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteStudySession(sessionId);
      window.dispatchEvent(new CustomEvent('study-session-updated', { detail: { action: 'deleted', id: sessionId } }));
      if (onSessionDeleted) onSessionDeleted(sessionId);
    } catch (err) {
      console.error('Failed to remove study session:', err);
      alert('Could not remove session. Please try again.');
    }
  };

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <h3 className="card-title">Recent Deep Work Audit Ledger</h3>
        </div>
        <span className="card-eyebrow">ACTIVITY STREAM</span>
      </div>

      <div className="study-ledger-wrapper">
        {data.length === 0 ? (
          <div className="todo-empty-state">
            <span className="todo-empty-icon">■</span>
            <span>No deep work ledger entries registered today.</span>
          </div>
        ) : (
          <div className="audit-ledger-table-container">
            <table className="audit-ledger-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>SUBJECT DOMAIN</th>
                  <th>FOCUS TOPIC</th>
                  <th>DURATION</th>
                  <th>STATUS</th>
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {data.map((session, i) => (
                  <tr key={session._id || i}>
                    <td className="ledger-cell-time">
                      {formatTime(session.startTime)}
                      {session.endTime && ` – ${formatTime(session.endTime)}`}
                    </td>
                    <td className="ledger-cell-subject">
                      <span
                        className="ledger-subject-dot"
                        style={{ backgroundColor: session.learningPathColor || '#E03E2D' }}
                      />
                      <span>{session.subject || 'Core Engineering'}</span>
                    </td>
                    <td className="ledger-cell-topic">
                      {session.topic || 'General Deep Work'}
                    </td>
                    <td className="ledger-cell-duration">
                      {formatDuration(session.duration)}
                    </td>
                    <td className="ledger-cell-status">
                      <span className="ledger-status-pill done">LOGGED</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>
                      {session._id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(session._id, session.topic || session.subject)}
                          title="Remove session (e.g. if turned on by mistake)"
                          aria-label="Remove study session"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-tertiary)',
                            cursor: 'pointer',
                            padding: '4px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            borderRadius: '3px',
                            transition: 'color 0.15s, background 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.background = '#FEE2E2'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.background = 'none'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="study-total-bar">
          <span className="study-total-label">CUMULATIVE AUDITED RUN TIME</span>
          <span className="study-total-value">{formatDuration(totalMinutes)}</span>
        </div>
      )}
    </div>
  );
}
