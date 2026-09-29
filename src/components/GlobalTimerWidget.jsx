import { useNavigate } from 'react-router-dom';
import { useTimer } from '../context/TimerContext.jsx';
import { Pause, Play, Timer } from 'lucide-react';

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

  const topicDisplay = sessionConfig.moduleName || sessionConfig.topicName || sessionConfig.subject || '';

  return (
    <div
      className="global-timer-widget"
      onClick={() => navigate('/timer')}
      title="Go to timer"
    >
      <div className={`global-timer-pulse ${isRunning ? 'active' : ''}`} />
      <div className="global-timer-content">
        <div className="global-timer-status">
          <Timer size={12} />
          <span>{isPaused ? 'PAUSED' : 'FOCUS'}</span>
        </div>
        <div className="global-timer-time">{formatTime(displaySeconds)}</div>
        {topicDisplay && (
          <div className="global-timer-topic">{topicDisplay}</div>
        )}
      </div>
      <button
        className="global-timer-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (isRunning) pauseTimer();
          else if (isPaused) resumeTimer();
        }}
        title={isRunning ? 'Pause' : 'Resume'}
      >
        {isRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
    </div>
  );
}
