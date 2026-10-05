import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function HeroCard({ learningPath }) {
  const navigate = useNavigate();
  const path = learningPath;
  if (!path) return null;

  const topicStat = path.totalTopics > 0
    ? `${path.completedTopics}/${path.totalTopics}`
    : null;

  return (
    <div className="hero-card fade-in">
      <div className="hero-card-content">
        <div className="hero-eyebrow">Current Path</div>
        <h2 className="hero-title">{path.title}</h2>
        {path.description && <p className="hero-description">{path.description}</p>}

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{path.progress}%</span>
            <span className="hero-stat-label">Complete</span>
          </div>
          {topicStat && (
            <div className="hero-stat">
              <span className="hero-stat-value">{topicStat}</span>
              <span className="hero-stat-label">Topics</span>
            </div>
          )}
          {path.currentModule && (
            <div className="hero-stat">
              <span className="hero-stat-value">{path.currentModule}</span>
              <span className="hero-stat-label">Current Module</span>
            </div>
          )}
        </div>

        <div className="hero-progress-container">
          <div className="hero-progress-bar">
            <div className="hero-progress-fill" style={{ width: `${path.progress}%` }} />
          </div>
          {path.nextMilestone && (
            <span className="hero-progress-text">{path.nextMilestone}</span>
          )}
        </div>

        <div className="hero-actions">
          <button className="hero-btn hero-btn-primary" onClick={() => navigate('/learning')}>
            Continue Learning
            <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </button>
          <button className="hero-btn hero-btn-secondary" onClick={() => navigate('/learning')}>
            View Path
          </button>
        </div>
      </div>
    </div>
  );
}
