import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTimer } from '../context/TimerContext.jsx';
import {
  PanelLeft, PanelLeftClose, Plus, Bell, Clock,
  Square, Play, Sparkles
} from 'lucide-react';

const ROUTE_LABELS = {
  '/today': 'Today Protocol',
  '/learning': 'Learning Paths',
  '/calendar': 'Calendar & Schedule',
  '/resources': 'Knowledge Vault',
  '/timer': 'Study Timer & Focus',
  '/analytics': 'Telemetry & Insights'
};

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AppTopBar({ isCollapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const { isActive, isRunning, displaySeconds } = useTimer();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const currentLabel = ROUTE_LABELS[pathname] || (pathname.startsWith('/learning/') ? 'Curriculum Roadmap' : 'Workspace');

  return (
    <header className="app-topbar">
      {/* Left: Breadcrumbs */}
      <div className="app-topbar-left">

        <div className="topbar-breadcrumbs">
          <span className="breadcrumb-root">ARCSTEP</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-section">Workspace</span>
          {currentLabel && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{currentLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Timer indicator and profile */}
      <div className="app-topbar-right">
        {/* Live timer capsule */}
        {isActive ? (
          <button
            className="topbar-timer-capsule active"
            onClick={() => navigate('/timer')}
            title="Active session - click to view"
          >
            <Clock size={13} className="timer-spin-subtle" />
            <span>{formatSeconds(displaySeconds)} {isRunning ? 'Active' : 'Paused'}</span>
          </button>
        ) : (
          <button
            className="topbar-timer-capsule"
            onClick={() => navigate('/timer')}
            title="Start timer"
          >
            <Clock size={13} />
            <span>00:00 Idle</span>
          </button>
        )}

        {/* User Avatar */}
        <div
          className="topbar-user-avatar"
          onClick={() => navigate('/today')}
          title={`Signed in as ${user?.name || 'Het Shah'}`}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'H'}
        </div>
      </div>
    </header>
  );
}
