import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Download } from 'lucide-react';
import {
  getAnalyticsOverview,
  getAnalyticsStudyTime,
  getAnalyticsSubjects,
  getAnalyticsLearningPaths,
  getAnalyticsTopics,
  getAnalyticsTodos,
  getAnalyticsHabits,
  getAnalyticsRecentActivity,
  exportAnalytics
} from '../services/api';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }
];

const RANGE_LABELS = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' };

const cx = (...parts) => parts.filter(Boolean).join(' ');

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('30d');
  const [subject, setSubject] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [overview, setOverview] = useState(null);
  const [studyTime, setStudyTime] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [paths, setPaths] = useState([]);
  const [topics, setTopics] = useState([]);
  const [todos, setTodos] = useState(null);
  const [habits, setHabits] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = { period, subject };
    Promise.all([
      getAnalyticsOverview(params),
      getAnalyticsStudyTime(params),
      getAnalyticsSubjects(params),
      getAnalyticsLearningPaths(params),
      getAnalyticsTopics(params),
      getAnalyticsTodos(params),
      getAnalyticsHabits(params),
      getAnalyticsRecentActivity()
    ])
      .then(([o, st, sub, lp, tp, td, hb, ac]) => {
        if (!active) return;
        if (o.data?.success) setOverview(o.data.data);
        if (st.data?.success) setStudyTime(st.data.data);
        if (sub.data?.success) setSubjects(sub.data.data);
        if (lp.data?.success) setPaths(Array.isArray(lp.data.data) ? lp.data.data : []);
        if (tp.data?.success) setTopics(Array.isArray(tp.data.data) ? tp.data.data : []);
        if (td.data?.success) setTodos(td.data.data);
        if (hb.data?.success) setHabits(hb.data.data);
        if (ac.data?.success) setActivity(Array.isArray(ac.data.data) ? ac.data.data : []);
      })
      .catch(err => console.error('Analytics load error:', err))
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [period, subject]);

  const handleExport = useCallback(async (format) => {
    setExporting(true);
    try {
      const res = await exportAnalytics({ period, format });
      const body = format === 'csv'
        ? res.data
        : JSON.stringify(res.data, null, 2);
      const type = format === 'csv' ? 'text/csv' : 'application/json';
      const url = URL.createObjectURL(new Blob([body], { type }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `arcstep-analytics-${period}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [period]);

  const chartData = studyTime?.chartData || [];
  const maxSeconds = Math.max(...chartData.map(d => d.seconds || 0), 1);
  const maxSubjectSeconds = Math.max(...(subjects?.subjects || []).map(s => s.seconds || 0), 1);
  const maxTopicSeconds = Math.max(...topics.map(t => t.seconds || 0), 1);
  const activeSubject = subject !== 'all' ? subject : null;

  const stat = (label, value, sub) => (
    <div className="mx-stat">
      <div className="mx-stat-label">{label}</div>
      <div className="mx-stat-value">{loading ? '—' : value}</div>
      <div className="mx-stat-sub">{sub}</div>
    </div>
  );

  return (
    <div className="mx-page">
      <header className="mx-head">
        <div>
          <h1 className="mx-title">Analytics</h1>
          <p className="mx-sub">
            {RANGE_LABELS[period]}
            {activeSubject && ` · ${activeSubject}`}
          </p>
        </div>

        <div className="mx-head-actions">
          <div className="mx-segments">
            {RANGES.map(r => (
              <button
                key={r.value}
                className={cx('mx-segment', period === r.value && 'is-active')}
                onClick={() => setPeriod(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download size={14} />
            {exporting ? 'Exporting' : 'Export'}
          </button>
        </div>
      </header>

      <section className="mx-stats">
        {stat('Study time', overview?.totalStudyFormatted || '0m',
          overview?.diffFormatted ? `${overview.diffFormatted} vs previous` : RANGE_LABELS[period])}
        {stat('Sessions', overview?.totalSessions ?? 0, 'Completed sessions')}
        {stat('Tasks done', overview?.tasksCompleted ?? 0, 'Marked complete')}
        {stat('Streak', `${overview?.currentStreak ?? 0}d`, `Best ${overview?.longestStreak ?? 0}d`)}
      </section>

      <section className="mx-card">
        <div className="mx-card-head">
          <h2 className="mx-card-title">Daily study</h2>
          <span className="mx-card-note">{studyTime?.totalFormatted || '0m'} total</span>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: 180 }} />
        ) : chartData.length === 0 ? (
          <div className="mx-empty">
            <p>No study sessions in this period.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/timer')}>
              Start a session
            </button>
          </div>
        ) : (
          <>
            <div className="mx-chart">
              {chartData.map(d => (
                <div key={d.dateKey} className="mx-chart-col" title={`${d.fullDate} · ${d.formatted}`}>
                  <div className="mx-chart-track">
                    <div
                      className={cx('mx-chart-bar', d.seconds === 0 && 'is-empty')}
                      style={{ height: `${Math.max(d.seconds > 0 ? 2 : 0, (d.seconds / maxSeconds) * 100)}%` }}
                    />
                  </div>
                  <span className="mx-chart-label">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="mx-card-foot">
              <span>Average {studyTime?.averagePerDayFormatted || '0m'} / day</span>
              <span>Longest day {studyTime?.longestStudyDay || '—'}</span>
              <span>Longest session {studyTime?.longestSessionFormatted || '0m'}</span>
            </div>
          </>
        )}
      </section>

      <div className="mx-two-col">
        <section className="mx-card">
          <div className="mx-card-head">
            <h2 className="mx-card-title">By subject</h2>
            {activeSubject && (
              <button className="mx-link" onClick={() => setSubject('all')}>Clear</button>
            )}
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: 140 }} />
          ) : !subjects?.subjects?.length ? (
            <div className="mx-empty"><p>Nothing logged yet.</p></div>
          ) : (
            <div className="mx-rows">
              {subjects.subjects.map(s => (
                <button
                  key={s.subject}
                  className={cx('mx-row', activeSubject === s.subject && 'is-active')}
                  onClick={() => setSubject(activeSubject === s.subject ? 'all' : s.subject)}
                >
                  <span className="mx-row-top">
                    <span className="mx-row-name">
                      <i className="mx-dot" style={{ background: s.color }} />
                      {s.subject}
                    </span>
                    <span className="mx-row-val">{s.formattedTime}</span>
                  </span>
                  <span className="mx-track">
                    <span className="mx-track-fill" style={{ width: `${(s.seconds / maxSubjectSeconds) * 100}%`, background: s.color }} />
                  </span>
                  <span className="mx-row-sub">{s.sessionsCount} sessions · {s.percentage}%</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mx-card">
          <div className="mx-card-head">
            <h2 className="mx-card-title">Top topics</h2>
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: 140 }} />
          ) : topics.length === 0 ? (
            <div className="mx-empty"><p>No topic data in this period.</p></div>
          ) : (
            <div className="mx-rows">
              {topics.slice(0, 8).map(t => (
                <div key={t.topic} className="mx-row is-static">
                  <span className="mx-row-top">
                    <span className="mx-row-name">{t.topic}</span>
                    <span className="mx-row-val">{t.formattedTime}</span>
                  </span>
                  <span className="mx-track">
                    <span className="mx-track-fill" style={{ width: `${(t.seconds / maxTopicSeconds) * 100}%` }} />
                  </span>
                  <span className="mx-row-sub">{t.sessionsCount} sessions</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {paths.length > 0 && (
        <section className="mx-card">
          <div className="mx-card-head">
            <h2 className="mx-card-title">Learning paths</h2>
          </div>
          <div className="mx-rows">
            {paths.map(lp => (
              <div key={lp._id} className="mx-row is-static">
                <span className="mx-row-top">
                  <span className="mx-row-name">
                    <i className="mx-dot" style={{ background: lp.color }} />
                    {lp.title}
                  </span>
                  <span className="mx-row-val">{lp.progress}%</span>
                </span>
                <span className="mx-track">
                  <span className="mx-track-fill" style={{ width: `${lp.progress}%`, background: lp.color }} />
                </span>
                <span className="mx-row-sub">
                  {lp.formattedTime} logged · {lp.sessionsCount} sessions · {lp.tasksCompleted}/{lp.totalTasks} tasks
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-two-col">
        <section className="mx-card">
          <div className="mx-card-head">
            <h2 className="mx-card-title">Tasks</h2>
            <span className="mx-card-note">{todos?.completionRate ?? 0}% done</span>
          </div>
          <div className="mx-mini-grid">
            <div className="mx-mini">
              <span className="mx-mini-val">{todos?.completed ?? 0}</span>
              <span className="mx-mini-lbl">Done</span>
            </div>
            <div className="mx-mini">
              <span className="mx-mini-val">{todos?.pending ?? 0}</span>
              <span className="mx-mini-lbl">Pending</span>
            </div>
            <div className="mx-mini">
              <span className="mx-mini-val">{todos?.overdue ?? 0}</span>
              <span className="mx-mini-lbl">Overdue</span>
            </div>
          </div>
        </section>

        <section className="mx-card">
          <div className="mx-card-head">
            <h2 className="mx-card-title">Habits</h2>
          </div>
          <div className="mx-mini-grid">
            <div className="mx-mini">
              <span className="mx-mini-val">{habits?.mostActiveDay || '—'}</span>
              <span className="mx-mini-lbl">Active day</span>
            </div>
            <div className="mx-mini">
              <span className="mx-mini-val">{habits?.mostActiveTime || '—'}</span>
              <span className="mx-mini-lbl">Peak window</span>
            </div>
            <div className="mx-mini">
              <span className="mx-mini-val">{habits?.averageSessionFormatted || '0m'}</span>
              <span className="mx-mini-lbl">Avg session</span>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-card">
        <div className="mx-card-head">
          <h2 className="mx-card-title">Recent activity</h2>
        </div>
        {loading ? (
          <div className="skeleton-box" style={{ height: 120 }} />
        ) : activity.length === 0 ? (
          <div className="mx-empty"><p>No recent activity.</p></div>
        ) : (
          <div className="mx-rows">
            {activity.map(a => (
              <div key={a.id} className="mx-row is-static">
                <span className="mx-row-top">
                  <span className="mx-row-name">
                    {a.type === 'session'
                      ? <Clock size={13} className="mx-row-icon" />
                      : <CheckCircle size={13} className="mx-row-icon" />}
                    {a.title}
                  </span>
                  <span className="mx-row-val">{a.subtitle}</span>
                </span>
                <span className="mx-row-sub">
                  {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}