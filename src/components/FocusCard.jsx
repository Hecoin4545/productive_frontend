import { useNavigate } from 'react-router-dom';
import { ArrowRight, Timer, Play, Calendar, Clock } from 'lucide-react';

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
    <div className="card focus-card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <span className="card-eyebrow">COGNITIVE SPRINT // TODAY'S FOCUS</span>
        </div>
        <span className="card-badge-status">DISPATCH READY</span>
      </div>

      {currentModule ? (
        <div className="focus-current">
          <div className="focus-current-label">CURRENT CURRICULUM MODULE</div>
          <div className="focus-current-topic">{currentModule}</div>
        </div>
      ) : (
        <div className="focus-current">
          <div className="focus-current-label">CURRENT CURRICULUM MODULE</div>
          <div className="focus-current-topic" style={{ color: 'var(--color-text-tertiary)' }}>
            No active module designated
          </div>
        </div>
      )}

      {moduleProgress && (
        <div className="focus-progress-wrapper">
          <div className="focus-progress-meta">
            <span className="focus-progress-name">Module Completion</span>
            <span className="focus-progress-val">
              {moduleProgress.done} / {moduleProgress.total} modules
            </span>
          </div>
          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${(moduleProgress.done / moduleProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {topicStat && (
        <div className="focus-progress-wrapper">
          <div className="focus-progress-meta">
            <span className="focus-progress-name">Indexed Syllabus Topics</span>
            <span className="focus-progress-val">
              {topicStat.done} / {topicStat.total} topics
            </span>
          </div>
          <div className="focus-progress-bar">
            <div
              className="focus-progress-fill"
              style={{ width: `${(topicStat.done / topicStat.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {nextSession ? (
        <div className="focus-next-box">
          <div className="focus-next-header">
            <Clock size={12} className="focus-next-icon" />
            <span className="focus-next-label">UPCOMING CALENDAR BLOCK</span>
          </div>
          <div className="focus-next-title">{nextSession.time} — {nextSession.title}</div>
          {nextSession.duration && (
            <div className="focus-next-duration">Target allocation: {nextSession.duration}</div>
          )}
        </div>
      ) : (
        <div className="focus-next-box">
          <div className="focus-next-header">
            <Clock size={12} className="focus-next-icon" />
            <span className="focus-next-label">UPCOMING CALENDAR BLOCK</span>
          </div>
          <div className="focus-next-title" style={{ color: 'var(--color-text-tertiary)' }}>
            Schedule clear — Ready for unscheduled block
          </div>
        </div>
      )}

      <button
        type="button"
        className="focus-action-btn"
        onClick={() => navigate('/timer')}
      >
        <span>■ LAUNCH DEEP FOCUS SESSION</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}