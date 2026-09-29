import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TodayPage from './pages/TodayPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';

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
            <Route path="learning" element={
              <PlaceholderPage
                title="Learning"
                description="Manage your learning paths, track progress through modules, and build consistent study habits."
                icon="BookOpen"
              />
            } />
            <Route path="journal" element={<JournalPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="resources" element={
              <PlaceholderPage
                title="Resources"
                description="Save and organize articles, videos, courses, and study materials across all your learning paths."
                icon="FolderOpen"
              />
            } />
            <Route path="timer" element={
              <PlaceholderPage
                title="Study Timer"
                description="Focus with a Pomodoro-style timer. Track study sessions and build deep work habits."
                icon="Timer"
              />
            } />
            <Route path="analytics" element={
              <PlaceholderPage
                title="Analytics"
                description="Visualize your study patterns, track progress trends, and understand your learning habits."
                icon="BarChart3"
              />
            } />
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
      </AuthProvider>
    </Router>
  );
}
