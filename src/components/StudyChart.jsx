export default function StudyChart({ weeklyData }) {
  const data = weeklyData || [
    { day: 'Mon', hours: 2 },
    { day: 'Tue', hours: 4 },
    { day: 'Wed', hours: 3 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 4 },
    { day: 'Sat', hours: 6 },
    { day: 'Sun', hours: 3 },
  ];

  const maxHours = Math.max(...data.map(d => d.hours), 1);
  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayMapped = todayIndex === 0 ? 6 : todayIndex - 1; // Map to Mon=0

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Weekly study</h3>
        <span className="card-eyebrow">This week</span>
      </div>
      <div className="weekly-chart">
        {data.map((item, i) => (
          <div key={item.day} className="weekly-bar-wrapper">
            <span className="weekly-bar-value">{item.hours}h</span>
            <div className="weekly-bar-container">
              <div
                className={`weekly-bar ${i === todayMapped ? 'today' : ''}`}
                style={{ height: `${(item.hours / maxHours) * 100}%` }}
              />
            </div>
            <span className="weekly-bar-label">{item.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
