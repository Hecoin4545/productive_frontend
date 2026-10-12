import { useState, useEffect, useMemo } from 'react';
import { Clock, CheckSquare, TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardData } from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import HeroCard from '../components/HeroCard.jsx';
import StatCard from '../components/StatCard.jsx';
import TodoOverview from '../components/TodoOverview.jsx';
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
  const [todayKey, setTodayKey] = useState(() => new Date().toISOString().slice(0, 10));

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

  useEffect(() => {
    const compute = () => setTodayKey(new Date().toISOString().slice(0, 10));
    compute();
    const onVisible = () => compute();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
        eyebrow="Daily Focus"
        metricTag="LIVE"
        title={user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
        subtitle="Here is your study routine and focus goals for today."
        date={formatDate()}
      />

      {loadError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
          Could not load your dashboard. Is the server running?
        </div>
      )}

      {/* Hero - Current Learning Path */}
      {currentPath && <HeroCard learningPath={currentPath} />}

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <StatCard
          metricCode="01"
          tag="TIME"
          icon={Clock}
          value={formatStudyTime(stats.studyTime)}
          label="Study time today"
          targetInfo="Daily target: 4 hours"
        />
        <StatCard
          metricCode="02"
          tag="TASKS"
          icon={CheckSquare}
          value={stats.totalTasks > 0 ? `${stats.tasksCompleted} / ${stats.totalTasks}` : '0'}
          label="Tasks completed"
          targetInfo="Active tasks"
        />
        <StatCard
          metricCode="03"
          tag="PROGRESS"
          icon={TrendingUp}
          value={hasPaths ? `${stats.overallProgress}%` : '—'}
          label="Course progress"
          targetInfo="Overall completion"
        />
        <StatCard
          metricCode="04"
          tag="STREAK"
          icon={Flame}
          value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
          label="Current streak"
          targetInfo="Daily study habit"
        />
      </div>

      {/* Main Dashboard Todos */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <TodoOverview key={todayKey} todos={d.todos} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Study Activity */}
        <StudyActivity key={todayKey} sessions={d.studySessions} />
        {/* Right column: Weekly Chart */}
        <StudyChart weeklyData={d.weeklyStudy} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Learning Progress */}
        <LearningProgress key={todayKey} paths={learningPaths} />
        {/* Right column: Goals */}
        <GoalsOverview key={todayKey} goals={d.goals} />
      </div>
    </div>
  );
}
