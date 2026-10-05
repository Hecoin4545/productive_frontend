function formatHours(hours) {
  const h = Number(hours) || 0;
  if (h === 0) return '0m';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
}

export default function StudyChart({ weeklyData }) {
  // No invented bars - render the week exactly as the server reported it
  const data = Array.isArray(weeklyData) ? weeklyData : [];

  if (data.length === 0) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <h3 className="card-title">Weekly study</h3>
          <span className="card-eyebrow">This week</span>
        </div>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)', padding: 'var(--space-4) 0' }}>
          No study data for this week yet.
        </p>
      </div>
    );
  }

  const maxHours = Math.max(...data.map(d => Number(d.hours) || 0), 1);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Weekly study</h3>
        <span className="card-eyebrow">This week</span>
      </div>
      <div className="weekly-chart">
        {data.map((item, i) => {
          const hours = Number(item.hours) || 0;
          return (
            <div key={item.date || item.day || i} className="weekly-bar-wrapper">
              <span className="weekly-bar-value">{formatHours(hours)}</span>
              <div className="weekly-bar-container">
                <div
                  className={`weekly-bar ${item.isToday ? 'today' : ''}`}
                  style={{ height: `${(hours / maxHours) * 100}%` }}
                />
              </div>
              <span className="weekly-bar-label">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}