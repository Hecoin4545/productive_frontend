import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, BookOpen, CalendarDays,
  FolderOpen, Timer, BarChart3, LogOut
} from 'lucide-react';
import { getLearningPaths } from '../services/api';

const navItems = [
  { to: '/today', label: 'Today', icon: LayoutDashboard },
  { to: '/learning', label: 'Learning', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/resources', label: 'Resources', icon: FolderOpen },
  { to: '/timer', label: 'Study Timer', icon: Timer },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [paths, setPaths] = useState([]);

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

        {paths.length > 0 && (
          <>
            <div className="sidebar-section-title">Your Paths</div>
            {paths.map((path) => (
              <div key={path._id} className="sidebar-path-item">
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
          </>
        )}
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
