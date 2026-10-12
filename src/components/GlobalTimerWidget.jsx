import { useNavigate } from 'react-router-dom';
import { useTimer } from '../context/TimerContext.jsx';
import { Pause, Play, Timer, ExternalLink } from 'lucide-react';

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function GlobalTimerWidget() {
  const { isActive, isRunning, isPaused, displaySeconds, sessionConfig, pauseTimer, resumeTimer } = useTimer();
  const navigate = useNavigate();

  if (!isActive) return null;

  const topicDisplay = sessionConfig.moduleName || sessionConfig.topicName || sessionConfig.subject || 'Deep Work Session';

  return (
    <div
      className="global-timer-widget"
      onClick={() => navigate('/timer')}
      title="Click to view full Focus Engine"
    >
      <div className="global-timer-status-cluster">
        <span className={`global-timer-pulse ${isRunning ? 'active' : ''}`} />
        <span className="global-timer-status-tag">
          {isPaused ? 'PAUSED' : 'FOCUS IN PROGRESS'}
        </span>
      </div>

      <div className="global-timer-time-display">
        {formatTime(displaySeconds)}
      </div>

      <div className="global-timer-topic-pill">
        <span>■</span>
        <span className="global-timer-topic-title">{topicDisplay}</span>
      </div>

      <div className="global-timer-controls">
        <button
          type="button"
          className="global-timer-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning) pauseTimer();
            else if (isPaused) resumeTimer();
          }}
          title={isRunning ? 'Pause' : 'Resume'}
          aria-label={isRunning ? 'Pause session' : 'Resume session'}
        >
          {isRunning ? <Pause size={13} /> : <Play size={13} />}
        </button>

        <span className="global-timer-open-hint">
          <ExternalLink size={12} />
        </span>
      </div>
    </div>
  );
}
