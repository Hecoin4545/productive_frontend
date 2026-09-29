const pathColors = {
  'Data Structures & Algorithms': '#6C63FF',
  'Machine Learning': '#22C55E',
  'Web Development': '#F59E0B',
  'System Design': '#EF4444',
  'Competitive Programming': '#8B5CF6',
  'Mathematics': '#06B6D4',
};

export default function LearningProgress({ paths }) {
  const defaultData = [
    { title: 'Data Structures & Algorithms', progress: 78 },
    { title: 'Machine Learning', progress: 52 },
    { title: 'Web Development', progress: 64 },
    { title: 'System Design', progress: 31 },
  ];

  // Ensure paths is always an array
  const data = Array.isArray(paths) && paths.length > 0 ? paths : defaultData;

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Learning Progress</h3>
      </div>
      <div className="progress-list">
        {data.map((path, i) => (
          <div key={path._id || i} className="progress-item">
            <div className="progress-item-header">
              <span className="progress-item-name">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: pathColors[path.title] || path.color || '#6C63FF',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                {path.title}
              </span>
              <span className="progress-item-value">{path.progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${path.progress}%`,
                  backgroundColor: pathColors[path.title] || path.color || '#6C63FF',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
