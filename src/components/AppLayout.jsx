import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar.jsx';
import AppTopBar from './AppTopBar.jsx';
import GlobalTimerWidget from './GlobalTimerWidget.jsx';
import { useTimer } from '../context/TimerContext.jsx';

export default function AppLayout() {
  const { isActive, summaryOpen } = useTimer();
  const { pathname } = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('arcstep_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('arcstep_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onTimerPage = pathname === '/timer';
  const focusMode = onTimerPage && (isActive || summaryOpen);

  // Keep the page behind the timer from scrolling while in deep focus stage
  useEffect(() => {
    document.body.style.overflow = focusMode ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [focusMode]);

  if (focusMode) {
    return (
      <main className="focus-stage">
        <Outlet />
      </main>
    );
  }

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <main className="main-content">
        <AppTopBar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
        <GlobalTimerWidget />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}