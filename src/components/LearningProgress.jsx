export default function LearningProgress({ paths }) {
  const data = Array.isArray(paths) ? paths : [];

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Learning Progress</h3>
      </div>
      {data.length === 0 ? (
        <div className="progress-list">
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)', padding: 'var(--space-4) 0' }}>
            No learning paths yet. Create one to start tracking progress.
          </p>
        </div>
      ) : (
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
                      backgroundColor: path.color || '#6C63FF',
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
                    backgroundColor: path.color || '#6C63FF',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
