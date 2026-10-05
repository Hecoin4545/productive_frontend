import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import GlobalTimerWidget from './GlobalTimerWidget.jsx';
import { useTimer } from '../context/TimerContext.jsx';

export default function AppLayout() {
  const { isActive, summaryOpen } = useTimer();
  const { pathname } = useLocation();

  const onTimerPage = pathname === '/timer';
  const focusMode = onTimerPage && (isActive || summaryOpen);

  // Keep the page behind the timer from scrolling while focusing
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
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <GlobalTimerWidget />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}