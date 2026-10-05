import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckSquare, TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardData } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import HeroCard from '../components/HeroCard.jsx';
import StatCard from '../components/StatCard.jsx';
import TodoOverview from '../components/TodoOverview.jsx';
import FocusCard from '../components/FocusCard.jsx';
import StudyActivity from '../components/StudyActivity.jsx';
import StudyChart from '../components/StudyChart.jsx';
import LearningProgress from '../components/LearningProgress.jsx';
import GoalsOverview from '../components/GoalsOverview.jsx';

function formatStudyTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const EMPTY_DATA = {
  todos: [],
  goals: [],
  studySessions: [],
  learningPaths: [],
  stats: {
    studyTime: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    goalsCompleted: 0,
    totalGoals: 0,
    streak: 0,
    overallProgress: 0,
  },
  weeklyStudy: [],
};

export default function TodayPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboardData();
      if (!res.data?.success) throw new Error('Dashboard request failed');
      const apiData = res.data.data || {};
      setData({
        todos: Array.isArray(apiData.todos) ? apiData.todos : [],
        goals: Array.isArray(apiData.goals) ? apiData.goals : [],
        studySessions: Array.isArray(apiData.studySessions) ? apiData.studySessions : [],
        learningPaths: Array.isArray(apiData.learningPaths) ? apiData.learningPaths : [],
        stats: { ...EMPTY_DATA.stats, ...(apiData.stats || {}) },
        weeklyStudy: Array.isArray(apiData.weeklyStudy) ? apiData.weeklyStudy : []
      });
      setLoadError(false);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setData(EMPTY_DATA);
      setLoadError(true);
    }
    setLoading(false);
  };

  const todos = data?.todos || EMPTY_DATA.todos;

  // Next upcoming calendar session; nothing invented when the day is clear
  const nextSession = useMemo(() => {
    const now = Date.now();
    const upcoming = todos
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate).getTime() >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    if (!upcoming) return null;
    const due = new Date(upcoming.dueDate);
    const mins = parseInt(upcoming.estimatedDuration, 10);
    return {
      time: due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: upcoming.title,
      duration: Number.isFinite(mins) && mins > 0 ? `${mins} min` : ''
    };
  }, [todos]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading your workspace...</p>
      </div>
    );
  }

  const d = data || EMPTY_DATA;
  const stats = d.stats;
  const learningPaths = d.learningPaths;
  const currentPath = learningPaths.find(p => p.status === 'active') || learningPaths[0] || null;
  const hasPaths = learningPaths.length > 0;

  return (
    <div className="stagger">
      <PageHeader
        eyebrow="One step at a time"
        title={user?.name ? `Make today count, ${user.name}.` : 'Make today count.'}
        subtitle="A place for the work you do today and the person you're becoming."
        date={formatDate()}
      />

      {loadError && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: 'var(--space-4)' }}>
          Could not load your dashboard. Is the server running?
        </div>
      )}

      {/* Hero - Current Learning Path */}
      {currentPath && <HeroCard learningPath={currentPath} />}

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <StatCard
          icon={Clock}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          value={formatStudyTime(stats.studyTime)}
          label="Study time today"
        />
        <StatCard
          icon={CheckSquare}
          iconBg="var(--color-success-light)"
          iconColor="var(--color-success-text)"
          value={`${stats.tasksCompleted} / ${stats.totalTasks}`}
          label="Tasks completed"
        />
        <StatCard
          icon={TrendingUp}
          iconBg="var(--color-warning-light)"
          iconColor="var(--color-warning-text)"
          value={hasPaths ? `${stats.overallProgress}%` : '—'}
          label="Learning progress"
        />
        <StatCard
          icon={Flame}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
          label="Current streak"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left column: Todos */}
        <TodoOverview todos={d.todos} />
        {/* Right column: Focus */}
        <FocusCard learningPath={currentPath} nextSession={nextSession} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Study Activity */}
        <StudyActivity sessions={d.studySessions} />
        {/* Right column: Weekly Chart */}
        <StudyChart weeklyData={d.weeklyStudy} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Learning Progress */}
        <LearningProgress paths={learningPaths} />
        {/* Right column: Goals */}
        <GoalsOverview goals={d.goals} />
      </div>
    </div>
  );
}
