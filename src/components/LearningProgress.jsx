import { useNavigate } from 'react-router-dom';

export default function LearningProgress({ paths }) {
  const navigate = useNavigate();
  const data = Array.isArray(paths) ? paths : [];

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <h3 className="card-title">FIG 2.02 // SUBJECT ALLOCATION & PROGRESS</h3>
        </div>
        <span className="card-eyebrow">COGNITIVE TRACK</span>
      </div>

      {data.length === 0 ? (
        <div className="todo-empty-state">
          <span className="todo-empty-icon">■</span>
          <span>No learning paths defined. Create one to begin tracking.</span>
        </div>
      ) : (
        <div className="progress-list">
          {data.map((path, i) => (
            <div
              key={path._id || i}
              className="progress-item"
              onClick={() => path._id && navigate(`/learning/${path._id}`)}
              style={{ cursor: path._id ? 'pointer' : 'default' }}
            >
              <div className="progress-item-header">
                <span className="progress-item-name">
                  <span
                    className="progress-item-dot"
                    style={{ backgroundColor: path.color || '#E03E2D' }}
                  />
                  <span>{path.title}</span>
                </span>
                <span className="progress-item-value">{path.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(5, path.progress || 0))}%`,
                    backgroundColor: i === 0 ? '#E03E2D' : '#141413',
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
