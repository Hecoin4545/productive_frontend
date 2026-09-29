import { useState, useEffect } from 'react';
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
import JournalPreview from '../components/JournalPreview.jsx';

// Mock data fallback
const mockData = {
  todos: [
    { _id: 'm1', title: 'Solve 5 Dynamic Programming problems', category: 'DSA', learningPathName: 'Data Structures & Algorithms', priority: 'high', estimatedDuration: 90, completed: false },
    { _id: 'm2', title: 'Complete Binary Trees lecture', category: 'DSA', learningPathName: 'Data Structures & Algorithms', priority: 'medium', estimatedDuration: 60, completed: false },
    { _id: 'm3', title: 'Revise regression notes', category: 'Machine Learning', learningPathName: 'Machine Learning', priority: 'medium', estimatedDuration: 45, completed: false },
    { _id: 'm4', title: 'Work on portfolio project', category: 'Web Development', learningPathName: 'Web Development', priority: 'low', estimatedDuration: 60, completed: false },
    { _id: 'm5', title: 'Read system design chapter', category: 'System Design', learningPathName: 'System Design', priority: 'medium', estimatedDuration: 40, completed: false },
    { _id: 'm6', title: 'Solve 3 Codeforces problems', category: 'DSA', learningPathName: 'Data Structures & Algorithms', priority: 'high', estimatedDuration: 75, completed: true, completedAt: new Date().toISOString() },
    { _id: 'm7', title: 'Review ML lecture slides', category: 'Machine Learning', learningPathName: 'Machine Learning', priority: 'low', estimatedDuration: 30, completed: true, completedAt: new Date().toISOString() },
    { _id: 'm8', title: 'Practice SQL queries', category: 'Web Development', learningPathName: 'Web Development', priority: 'medium', estimatedDuration: 35, completed: true, completedAt: new Date().toISOString() },
  ],
  goals: [
    { _id: 'g1', title: 'Complete DP lecture', completed: true },
    { _id: 'g2', title: 'Solve 3 problems', completed: true },
    { _id: 'g3', title: 'Finish ML notes', completed: false },
    { _id: 'g4', title: 'Read system design chapter', completed: false },
  ],
  studySessions: [
    {
      _id: 's1', subject: 'Data Structures & Algorithms', topic: 'Dynamic Programming', duration: 90,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    },
    {
      _id: 's2', subject: 'Machine Learning', topic: 'Regression', duration: 45,
      startTime: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(12, 15, 0, 0)).toISOString(),
    },
    {
      _id: 's3', subject: 'Competitive Programming', topic: 'Codeforces Practice', duration: 90,
      startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    },
  ],
  learningPaths: [
    { _id: 'lp1', title: 'Data Structures & Algorithms', description: 'Build strong problem-solving fundamentals through consistent practice.', progress: 78, completedTopics: 42, totalTopics: 54, currentModule: 'Dynamic Programming', nextMilestone: 'Complete 15 medium-level problems', color: '#6C63FF' },
    { _id: 'lp2', title: 'Machine Learning', progress: 52, color: '#22C55E' },
    { _id: 'lp3', title: 'Web Development', progress: 64, color: '#F59E0B' },
    { _id: 'lp4', title: 'System Design', progress: 31, color: '#EF4444' },
  ],
  journal: null,
  stats: {
    studyTime: 225,
    tasksCompleted: 3,
    totalTasks: 8,
    goalsCompleted: 2,
    totalGoals: 4,
    streak: 12,
    overallProgress: 56,
  },
  weeklyStudy: [
    { day: 'Mon', hours: 2 },
    { day: 'Tue', hours: 4 },
    { day: 'Wed', hours: 3 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 4 },
    { day: 'Sat', hours: 6 },
    { day: 'Sun', hours: 3 },
  ],
};

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

export default function TodayPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboardData();
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        setData(mockData);
      }
    } catch (err) {
      // Fallback to mock data if API fails
      console.log('Using mock data (API unavailable)');
      setData(mockData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading your workspace...</p>
      </div>
    );
  }

  const d = data || mockData;
  const stats = d.stats || mockData.stats;
  const currentPath = d.learningPaths?.[0] || mockData.learningPaths[0];

  return (
    <div className="stagger">
      <PageHeader
        eyebrow="One step at a time"
        title={`Make today count, ${user?.name || 'Het'}.`}
        subtitle="A place for the work you do today and the person you're becoming."
        date={formatDate()}
      />

      {/* Hero - Current Learning Path */}
      <HeroCard learningPath={currentPath} />

      {/* Stats Grid */}
      <div className="stats-grid stagger">
        <StatCard
          icon={Clock}
          iconBg="var(--color-primary-light)"
          iconColor="var(--color-primary)"
          value={formatStudyTime(stats.studyTime)}
          label="Study time"
          change="+42 min"
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
          value={`${stats.overallProgress}%`}
          label="Learning progress"
        />
        <StatCard
          icon={Flame}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          value={`${stats.streak} days`}
          label="Current streak"
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left column: Todos */}
        <TodoOverview todos={d.todos || mockData.todos} />
        {/* Right column: Focus */}
        <FocusCard learningPath={currentPath} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Study Activity */}
        <StudyActivity sessions={d.studySessions || mockData.studySessions} />
        {/* Right column: Weekly Chart */}
        <StudyChart weeklyData={d.weeklyStudy || mockData.weeklyStudy} />
      </div>

      <div className="dashboard-grid">
        {/* Left column: Learning Progress */}
        <LearningProgress paths={d.learningPaths || mockData.learningPaths} />
        {/* Right column: Goals */}
        <GoalsOverview goals={d.goals || mockData.goals} />
      </div>

      {/* Journal Preview - Full Width */}
      <JournalPreview journal={d.journal} />
    </div>
  );
}
