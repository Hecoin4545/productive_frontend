import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import GlobalTimerWidget from './GlobalTimerWidget.jsx';

export default function AppLayout() {
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
