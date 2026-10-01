import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { TimerProvider } from './context/TimerContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TodayPage from './pages/TodayPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import TimerPage from './pages/TimerPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import LearningPage from './pages/LearningPage.jsx';
import LearningPathDetailPage from './pages/LearningPathDetailPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div className="auth-logo">A</div>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/today" /> : children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <Routes>
            <Route path="/login" element={
              <PublicRoute><LoginPage /></PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute><RegisterPage /></PublicRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute><AppLayout /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="/today" replace />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="learning" element={<LearningPage />} />
              <Route path="learning/:id" element={<LearningPathDetailPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="timer" element={<TimerPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={
                <PlaceholderPage
                  title="Settings"
                  description="Customize your Arcstep experience. Manage your profile, preferences, and application settings."
                  icon="Settings"
                />
              } />
            </Route>
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </TimerProvider>
      </AuthProvider>
    </Router>
  );
}
