import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function FocusCard({ learningPath, nextSession }) {
  const navigate = useNavigate();

  const path = learningPath || {
    currentModule: 'Dynamic Programming',
    currentTopic: 'Memoization & Tabulation',
    progress: 40,
  };

  const session = nextSession || {
    time: '4:00 PM',
    title: 'Solve DP problems',
    duration: '45 min'
  };

  // Calculate module progress
  const moduleTopicsTotal = 5;
  const moduleTopicsDone = 2;

  return (
    <div className="focus-card fade-in">
      <div className="card-header">
        <span className="card-eyebrow">Today's Focus</span>
      </div>

      <div className="focus-current">
        <div className="focus-current-label">Currently learning</div>
        <div className="focus-current-topic">{path.currentModule || path.currentTopic}</div>
      </div>

      <div className="focus-progress">
        <div className="focus-progress-bar">
          <div
            className="focus-progress-fill"
            style={{ width: `${(moduleTopicsDone / moduleTopicsTotal) * 100}%` }}
          />
        </div>
        <span className="focus-progress-text">
          {moduleTopicsDone} / {moduleTopicsTotal} topics
        </span>
      </div>

      <div className="focus-next">
        <div className="focus-next-label">Next session</div>
        <div className="focus-next-title">{session.time} — {session.title}</div>
        <div className="focus-next-time">Duration: {session.duration}</div>
      </div>

      <div className="focus-action" onClick={() => navigate('/timer')}>
        Start timer <ArrowRight size={14} />
      </div>
    </div>
  );
}
