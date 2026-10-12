import { useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Target, Clock, Zap } from 'lucide-react';

export default function HeroCard({ learningPath }) {
  const navigate = useNavigate();
  const path = learningPath;
  if (!path) return null;

  const topicStat = path.totalTopics > 0
    ? `${path.completedTopics}/${path.totalTopics}`
    : null;

  return (
    <div className="hero-card fade-in">
      <div className="hero-card-header-bar">
        <div className="hero-eyebrow-tag">
          <span>Active Learning Goal</span>
        </div>
        <span className="hero-status-pill">IN PROGRESS</span>
      </div>

      <div className="hero-card-content">
        <h2 className="hero-title">{path.title}</h2>
        {path.description && (
          <p className="hero-description">{path.description}</p>
        )}

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{path.progress}%</span>
            <span className="hero-stat-label">Progress</span>
          </div>

          {topicStat && (
            <div className="hero-stat">
              <span className="hero-stat-value">{topicStat}</span>
              <span className="hero-stat-label">Topics completed</span>
            </div>
          )}

          {path.currentModule && (
            <div className="hero-stat">
              <span className="hero-stat-value hero-stat-module-name">{path.currentModule}</span>
              <span className="hero-stat-label">Current Module</span>
            </div>
          )}
        </div>

        <div className="hero-progress-container">
          <div className="hero-progress-bar">
            <div
              className="hero-progress-fill"
              style={{ width: `${Math.min(100, Math.max(4, path.progress || 0))}%` }}
            />
          </div>
          {path.nextMilestone && (
            <div className="hero-milestone-row">
              <span className="hero-milestone-marker">NEXT OBJECTIVE:</span>
              <span className="hero-progress-text">{path.nextMilestone}</span>
            </div>
          )}
        </div>

        <div className="hero-actions">
          <button
            className="hero-btn hero-btn-primary"
            onClick={() => navigate(path._id ? `/learning/${path._id}` : '/learning')}
          >
            <span>■ ENTER FOCUS PROTOCOL</span>
            <ArrowRight size={14} />
          </button>
          <button
            className="hero-btn hero-btn-secondary"
            onClick={() => navigate('/learning')}
          >
            CALIBRATE TARGET
          </button>
        </div>
      </div>
    </div>
  );
}
