import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, BookOpen, CalendarDays,
  FolderOpen, Timer, BarChart3, LogOut,
  PanelLeftClose, PanelLeft, Search, Check, Sparkles
} from 'lucide-react';
import { getLearningPaths } from '../services/api';

const navItems = [
  { to: '/today', label: 'Today', icon: LayoutDashboard, tag: 'LIVE' },
  { to: '/learning', label: 'Learning Paths', icon: BookOpen, badgeKey: 'pathsCount' },
  { to: '/calendar', label: 'Calendar & Schedule', icon: CalendarDays },
  { to: '/resources', label: 'Resources Vault', icon: FolderOpen },
  { to: '/timer', label: 'Study Timer', icon: Timer },
  { to: '/analytics', label: 'Telemetry & Analytics', icon: BarChart3 },
];

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);
  const [focusProtocol, setFocusProtocol] = useState(() => {
    return localStorage.getItem('arcstep_focus_protocol') === 'true';
  });
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    let active = true;
    getLearningPaths()
      .then(res => {
        if (!active) return;
        const list = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
        setPaths(list.filter(p => p.status === 'active'));
      })
      .catch(err => console.error('Error loading sidebar paths:', err));
    return () => { active = false; };
  }, []);

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    navigate('/login');
  };

  const toggleFocusProtocol = () => {
    const nextVal = !focusProtocol;
    setFocusProtocol(nextVal);
    localStorage.setItem('arcstep_focus_protocol', String(nextVal));
    document.body.classList.toggle('arcstep-focus-protocol-active', nextVal);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand-group">
            <span className="sidebar-brand-logo">ARCSTEP</span>
            <span className="sidebar-version-badge">v2.4</span>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label="Toggle vertical navigation"
        >
          {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Quick Search */}
      {!isCollapsed && (
        <div className="sidebar-search-box">
          <Search size={14} className="sidebar-search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Jump to note..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchVal.trim()) {
                navigate(`/resources?search=${encodeURIComponent(searchVal.trim())}`);
              }
            }}
          />
          <kbd className="sidebar-search-kbd">⌘K</kbd>
        </div>
      )}

      {/* Main Nav Section */}
      <nav className="sidebar-nav">
        {!isCollapsed && (
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">NAVIGATION</span>
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="icon" size={17} />
            {!isCollapsed && (
              <>
                <span className="sidebar-nav-title">{item.label}</span>
                {item.tag && <span className="sidebar-item-tag">{item.tag}</span>}
                {item.badgeKey === 'pathsCount' && paths.length > 0 && (
                  <span className="sidebar-item-counter">{paths.length} active</span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Cognitive Focus / Subject meters */}
        {!isCollapsed && (
          <>
            <div className="sidebar-section-header" style={{ marginTop: '20px' }}>
              <span className="sidebar-section-label">COGNITIVE FOCUS</span>
            </div>
            <div className="sidebar-focus-list">
              {paths.length > 0 ? (
                paths.slice(0, 4).map((path, idx) => (
                  <div
                    key={path._id}
                    className={`sidebar-focus-item ${idx === 0 ? 'highlighted' : ''}`}
                    onClick={() => navigate(`/learning/${path._id}`)}
                    title={`View ${path.title}`}
                  >
                    <div className="sidebar-focus-meta">
                      <span className="sidebar-focus-title">{path.title}</span>
                      <span className="sidebar-focus-pct">{path.progress || 0}%</span>
                    </div>
                    <div className="sidebar-focus-bar">
                      <div
                        className="sidebar-focus-fill"
                        style={{
                          width: `${Math.min(100, Math.max(8, path.progress || 0))}%`,
                          backgroundColor: idx === 0 ? '#E03E2D' : '#141413'
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="sidebar-focus-item"
                  onClick={() => navigate('/learning')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sidebar-focus-meta">
                    <span className="sidebar-focus-title">Engineering Core</span>
                    <span className="sidebar-focus-pct">84%</span>
                  </div>
                  <div className="sidebar-focus-bar">
                    <div className="sidebar-focus-fill" style={{ width: '84%', backgroundColor: '#E03E2D' }} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-protocol-toggle-row">
            <span className="sidebar-protocol-label">FOCUS PROTOCOL</span>
            <button
              type="button"
              className={`sidebar-switch ${focusProtocol ? 'checked' : ''}`}
              onClick={toggleFocusProtocol}
              aria-label="Toggle focus protocol"
            >
              <span className="sidebar-switch-handle" />
            </button>
          </div>
        )}

        <div
          className="sidebar-user"
          onClick={() => navigate('/today')}
          title="Account profile"
        >
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'H'}
          </div>
          {!isCollapsed && (
            <>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'Het Shah'}</div>
                <div className="sidebar-user-email">{user?.email || 'het@workspace.com'}</div>
              </div>
              <button
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
