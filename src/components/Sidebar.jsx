import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, BookOpen, BookText, CalendarDays,
  FolderOpen, Timer, BarChart3, Settings, LogOut
} from 'lucide-react';

const navItems = [
  { to: '/today', label: 'Today', icon: LayoutDashboard },
  { to: '/learning', label: 'Learning', icon: BookOpen },
  { to: '/journal', label: 'Journal', icon: BookText },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: FolderOpen },
  { to: '/timer', label: 'Study Timer', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const learningPaths = [
  { id: '1', title: 'Data Structures & Algorithms', color: '#6C63FF', progress: 78 },
  { id: '2', title: 'Machine Learning', color: '#22C55E', progress: 52 },
  { id: '3', title: 'Web Development', color: '#F59E0B', progress: 64 },
  { id: '4', title: 'System Design', color: '#EF4444', progress: 31 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">A</div>
        <span className="sidebar-brand">ARCSTEP</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="icon" size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-section-title">Your Paths</div>
        {learningPaths.map((path) => (
          <div key={path.id} className="sidebar-path-item">
            <span
              className="sidebar-path-dot"
              style={{ backgroundColor: path.color }}
            />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {path.title}
            </span>
            <span className="sidebar-path-progress">{path.progress}%</span>
          </div>
        ))}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Settings className="icon" size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Click to log out">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
          <LogOut size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
