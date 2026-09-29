const subjectColors = {
  'Data Structures & Algorithms': '#6C63FF',
  'Machine Learning': '#22C55E',
  'Competitive Programming': '#8B5CF6',
  'Web Development': '#F59E0B',
  'System Design': '#EF4444',
  'Mathematics': '#06B6D4',
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function StudyActivity({ sessions }) {
  // Ensure sessions is always an array
  const data = Array.isArray(sessions) ? sessions : [];

  const totalMinutes = data.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Today's study</h3>
      </div>

      <div className="study-timeline">
        {data.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)', padding: 'var(--space-4) 0' }}>
            No study sessions recorded today.
          </p>
        ) : (
          data.map((session, i) => (
            <div key={session._id || i} className="study-session">
              <span className="study-session-time">
                {formatTime(session.startTime)} – {formatTime(session.endTime)}
              </span>
              <div
                className="study-session-indicator"
                style={{ backgroundColor: subjectColors[session.subject] || '#6C63FF' }}
              />
              <div className="study-session-info">
                <div className="study-session-subject">{session.subject}</div>
                <div className="study-session-topic">{session.topic}</div>
              </div>
              <span className="study-session-duration">
                {formatDuration(session.duration)}
              </span>
            </div>
          ))
        )}
      </div>

      {data.length > 0 && (
        <div className="study-total">
          <span className="study-total-label">Total today</span>
          <span className="study-total-value">{formatDuration(totalMinutes)}</span>
        </div>
      )}
    </div>
  );
}
