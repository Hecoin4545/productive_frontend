import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
