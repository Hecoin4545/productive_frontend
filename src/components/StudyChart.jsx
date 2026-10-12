function formatHours(hours) {
  const h = Number(hours) || 0;
  if (h === 0) return '0m';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(1)}h`;
}

export default function StudyChart({ weeklyData }) {
  const data = Array.isArray(weeklyData) ? weeklyData : [];

  if (data.length === 0) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <div className="card-header-eyebrow-group">
            <span className="card-header-red-dot">■</span>
            <h3 className="card-title">FIG 2.01 // DAILY STUDY VOLUME DISTRIBUTION</h3>
          </div>
          <span className="card-eyebrow">THIS WEEK</span>
        </div>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px', fontFamily: 'var(--font-mono)', padding: 'var(--space-6) 0' }}>
          No session telemetry logged for current cycle.
        </p>
      </div>
    );
  }

  const hoursList = data.map(d => Number(d.hours) || 0);
  const maxHours = Math.max(...hoursList, 2.5);
  const totalHours = hoursList.reduce((acc, v) => acc + v, 0);
  const avgHours = totalHours / (data.length || 1);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <h3 className="card-title">FIG 2.01 // DAILY STUDY VOLUME DISTRIBUTION</h3>
        </div>
        <div className="chart-legend-row">
          <span className="legend-item"><span className="legend-dot black" /> SESSIONS</span>
          <span className="legend-item"><span className="legend-dot red" /> TODAY / FOCUS</span>
        </div>
      </div>

      <div className="weekly-chart">
        {data.map((item, i) => {
          const hours = Number(item.hours) || 0;
          const heightPct = Math.min(100, Math.max(6, (hours / maxHours) * 100));
          return (
            <div key={item.date || item.day || i} className="weekly-bar-wrapper">
              <span className="weekly-bar-value">{formatHours(hours)}</span>
              <div className="weekly-bar-container">
                <div
                  className={`weekly-bar ${item.isToday ? 'today' : ''}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="weekly-bar-label">{item.day}</span>
            </div>
          );
        })}
      </div>

      <div className="chart-substats-row">
        <div className="substat-item">
          <span className="substat-label">TOTAL VOLUME</span>
          <span className="substat-val">{formatHours(totalHours)}</span>
        </div>
        <div className="substat-item">
          <span className="substat-label">DAILY RUN RATE</span>
          <span className="substat-val">{formatHours(avgHours)} / day</span>
        </div>
        <div className="substat-item">
          <span className="substat-label">TARGET CAPACITY</span>
          <span className="substat-val">3.5h / day</span>
        </div>
      </div>
    </div>
  );
}