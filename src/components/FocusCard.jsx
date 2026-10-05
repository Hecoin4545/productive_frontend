import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FocusCard({ learningPath, nextSession }) {
  const navigate = useNavigate();
  const path = learningPath || null;
  const currentModule = path?.currentModule || '';
  const topicStat = path && path.totalTopics > 0
    ? { done: path.completedTopics, total: path.totalTopics }
    : null;

  const moduleProgress = path && path.totalModules > 0
    ? { done: path.completedModules, total: path.totalModules }
    : null;

  return (
    <div className="focus-card fade-in">
      <div className="card-header">
        <span className="card-eyebrow">Today's Focus</span>
      </div>

      {currentModule ? (
        <div className="focus-current">
          <div className="focus-current-label">Currently learning</div>
          <div className="focus-current-topic">{currentModule}</div>
        </div>
      ) : (
        <div className="focus-current">
          <div className="focus-current-label">Currently learning</div>
          <div className="focus-current-topic" style={{ color: 'var(--color-text-tertiary)' }}>
            No active module
          </div>
        </div>
      )}

      {moduleProgress && (
        <div className="focus-progress">
          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${(moduleProgress.done / moduleProgress.total) * 100}%` }}
            />
          </div>
          <span className="focus-progress-text">
            {moduleProgress.done} / {moduleProgress.total} modules
          </span>
        </div>
      )}

      {topicStat && (
        <div className="focus-progress">
          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${(topicStat.done / topicStat.total) * 100}%` }}
            />
          </div>
          <span className="focus-progress-text">
            {topicStat.done} / {topicStat.total} topics
          </span>
        </div>
      )}

      {nextSession ? (
        <div className="focus-next">
          <div className="focus-next-label">Next session</div>
          <div className="focus-next-title">{nextSession.time} — {nextSession.title}</div>
          {nextSession.duration && (
            <div className="focus-next-time">Duration: {nextSession.duration}</div>
          )}
        </div>
      ) : (
        <div className="focus-next">
          <div className="focus-next-label">Next session</div>
          <div className="focus-next-title" style={{ color: 'var(--color-text-tertiary)' }}>
            Nothing scheduled ahead
          </div>
        </div>
      )}

      <div className="focus-action" onClick={() => navigate('/timer')}>
        Start timer <ArrowRight size={14} />
      </div>
    </div>
  );
}