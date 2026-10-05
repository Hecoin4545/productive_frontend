import { useState, useEffect } from 'react';
import {
  Clock, CheckCircle, Zap, Download, ChevronDown,
  PieChart, Activity, Filter, ArrowUpRight, ArrowDownRight,
  Layers, Brain
} from 'lucide-react';
import {
  getAnalyticsOverview, getAnalyticsStudyTime,
  getAnalyticsSubjects, getAnalyticsLearningPaths, getAnalyticsTopics,
  getAnalyticsTodos, getAnalyticsHeatmap,
  getAnalyticsHabits, getAnalyticsRecentActivity,
  getLearningPaths, exportAnalytics
} from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function AnalyticsPage() {
  const navigate = useNavigate();

  // Filters
  const [dateRange, setDateRange] = useState('30d'); // 7d, 30d, month, year, custom
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPathId, setSelectedPathId] = useState('all');
  const [heatmapMetric, setHeatmapMetric] = useState('studyTime'); // studyTime, tasks

  // State
  const [loading, setLoading] = useState(true);
  const [learningPathsList, setLearningPathsList] = useState([]);

  const [overview, setOverview] = useState(null);
  const [studyTimeData, setStudyTimeData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [pathData, setPathData] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [todoData, setTodoData] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [habitData, setHabitData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [hoveredTile, setHoveredTile] = useState(null);

  // Load Learning Paths for Filter Dropdown
  useEffect(() => {
    getLearningPaths()
      .then(res => {
        if (res.data?.success) setLearningPathsList(res.data.data || []);
      })
      .catch(err => console.error('Error loading paths for filter:', err));
  }, []);

  // Fetch all analytics data when filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = {
      period: dateRange,
      subject: selectedSubject,
      learningPathId: selectedPathId
    };

    if (dateRange === 'custom') {
      if (customFrom) params.from = customFrom;
      if (customTo) params.to = customTo;
    }

    Promise.all([
      getAnalyticsOverview(params),
      getAnalyticsStudyTime(params),
      getAnalyticsSubjects(params),
      getAnalyticsLearningPaths(params),
      getAnalyticsTopics(params),
      getAnalyticsTodos(params),
      getAnalyticsHeatmap({ ...params, metric: heatmapMetric }),
      getAnalyticsHabits(params),
      getAnalyticsRecentActivity()
    ])
      .then(([
        overviewRes, studyTimeRes, subjectRes, pathRes,
        topicRes, todoRes, heatmapRes, habitRes, recentRes
      ]) => {
        if (!isMounted) return;
        if (overviewRes.data?.success) setOverview(overviewRes.data.data);
        if (studyTimeRes.data?.success) setStudyTimeData(studyTimeRes.data.data);
        if (subjectRes.data?.success) setSubjectData(subjectRes.data.data);
        if (pathRes.data?.success) setPathData(pathRes.data.data);
        if (topicRes.data?.success) setTopicData(topicRes.data.data);
        if (todoRes.data?.success) setTodoData(todoRes.data.data);
        if (heatmapRes.data?.success) setHeatmapData(heatmapRes.data.data);
        if (habitRes.data?.success) setHabitData(habitRes.data.data);
        if (recentRes.data?.success) setRecentActivities(recentRes.data.data);
      })
      .catch(err => console.error('Analytics load error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [dateRange, customFrom, customTo, selectedSubject, selectedPathId, heatmapMetric]);

  // Handle CSV/JSON export
  const handleExport = async (format) => {
    setShowExportMenu(false);
    setExportLoading(true);
    try {
      const res = await exportAnalytics({ period: dateRange, format });
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `arcstep-analytics-${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const url = window.URL.createObjectURL(new Blob([jsonStr], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `arcstep-analytics-${dateRange}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Format Helper
  const rangeLabel = dateRange === 'custom'
    ? (customFrom && customTo ? `${customFrom} to ${customTo}` : 'Custom range')
    : ({ '7d': 'Last 7 days', '30d': 'Last 30 days', month: 'This month', year: 'This year' }[dateRange] || 'Last 30 days');

  return (
    <div className="analytics-page">
      {/* ─── Header Section ──────────────────────────────── */}
      <div className="analytics-header">
        <div className="analytics-header-content">
          <div className="page-header-eyebrow">WORKSPACE → PRODUCTIVITY ANALYTICS</div>
          <h1 className="page-header-title">Your Progress</h1>
          <p className="page-header-subtitle">
            {rangeLabel} · {selectedSubject === 'all' ? 'all subjects' : selectedSubject}
          </p>
        </div>

        {/* Global Controls & Filters */}
        <div className="analytics-controls">
          <div className="range-pills">
            <button
              className={`range-pill ${dateRange === '7d' ? 'active' : ''}`}
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </button>
            <button
              className={`range-pill ${dateRange === '30d' ? 'active' : ''}`}
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </button>
            <button
              className={`range-pill ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              This Month
            </button>
            <button
              className={`range-pill ${dateRange === 'year' ? 'active' : ''}`}
              onClick={() => setDateRange('year')}
            >
              This Year
            </button>
            <button
              className={`range-pill ${dateRange === 'custom' ? 'active' : ''}`}
              onClick={() => setShowCustomPicker(!showCustomPicker)}
            >
              Custom
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="export-dropdown-wrapper" style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportLoading}
            >
              <Download size={14} />
              {exportLoading ? 'Exporting...' : 'Export'}
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="export-menu">
                <button onClick={() => handleExport('csv')}>Download CSV</button>
                <button onClick={() => handleExport('json')}>Download JSON</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown */}
      {showCustomPicker && (
        <div className="custom-range-card">
          <div className="custom-range-row">
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDateRange('custom');
                setShowCustomPicker(false);
              }}
            >
              Apply Range
            </button>
          </div>
        </div>
      )}

      {/* Subject & Path Filter Row */}
      <div className="analytics-filter-bar">
        <div className="filter-item">
          <Filter size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span>Subject:</span>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Subjects</option>
            {subjectData?.subjects?.map(s => (
              <option key={s.subject} value={s.subject}>{s.subject}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <Layers size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span>Learning Path:</span>
          <select
            value={selectedPathId}
            onChange={e => setSelectedPathId(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Learning Paths</option>
            {learningPathsList.map(lp => (
              <option key={lp._id} value={lp._id}>{lp.title}</option>
            ))}
          </select>
        </div>

        {(selectedSubject !== 'all' || selectedPathId !== 'all') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSelectedSubject('all'); setSelectedPathId('all'); }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ─── 3. Top Summary Cards ─────────────────────────── */}
      <div className="analytics-summary-grid">
        {/* Card 1: Total Study Time */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-title">TOTAL STUDY TIME</span>
            <div className="summary-card-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="summary-card-value">
            {loading ? <span className="skeleton-pulse">...</span> : (overview?.totalStudyFormatted || '0m')}
          </div>
          <div className="summary-card-footer">
            {overview?.diffFormatted ? (
              <span className={`diff-badge ${overview.diffSeconds >= 0 ? 'positive' : 'negative'}`}>
                {overview.diffSeconds >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {overview.diffFormatted} vs prev period
              </span>
            ) : (
              <span className="summary-card-subtext">For selected range</span>
            )}
          </div>
        </div>

        {/* Card 2: Study Sessions */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-title">STUDY SESSIONS</span>
            <div className="summary-card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="summary-card-value">
            {loading ? <span className="skeleton-pulse">...</span> : (overview?.totalSessions || 0)}
          </div>
          <div className="summary-card-footer">
            <span className="summary-card-subtext">Completed sessions</span>
          </div>
        </div>

        {/* Card 3: Tasks Completed */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-title">TASKS COMPLETED</span>
            <div className="summary-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="summary-card-value">
            {loading ? <span className="skeleton-pulse">...</span> : (overview?.tasksCompleted || 0)}
          </div>
          <div className="summary-card-footer">
            <span className="summary-card-subtext">Finished TODO items</span>
          </div>
        </div>

        {/* Card 4: Current Streak */}
        <div className="summary-card">
          <div className="summary-card-header">
            <span className="summary-card-title">CURRENT STREAK</span>
            <div className="summary-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
              <Zap size={16} />
            </div>
          </div>
          <div className="summary-card-value">
            {loading ? <span className="skeleton-pulse">...</span> : `${overview?.currentStreak || 0} days`}
          </div>
          <div className="summary-card-footer">
            <span className="summary-card-subtext">Best: {overview?.longestStreak || 0} days</span>
          </div>
        </div>
      </div>

      {/* ─── Consistency Heatmap ──────────────────────────── */}
      <div className="analytics-card heatmap-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Consistency</h3>
            <p className="card-subtitle">Every day in the selected range</p>
          </div>

          <div className="heatmap-metric-selector">
            <button
              className={`metric-btn ${heatmapMetric === 'studyTime' ? 'active' : ''}`}
              onClick={() => setHeatmapMetric('studyTime')}
            >
              Study Time
            </button>
            <button
              className={`metric-btn ${heatmapMetric === 'tasks' ? 'active' : ''}`}
              onClick={() => setHeatmapMetric('tasks')}
            >
              Tasks
            </button>
          </div>
        </div>

        <div className="heatmap-grid-container">
          {loading ? (
            <div className="skeleton-box" style={{ height: '140px', width: '100%' }} />
          ) : (
            <div className="heatmap-grid">
              {heatmapData?.matrix?.map((tile, idx) => (
                <div
                  key={tile.dateKey || idx}
                  className={`heatmap-cell level-${tile.level}`}
                  onMouseEnter={() => setHoveredTile(tile)}
                  onMouseLeave={() => setHoveredTile(null)}
                >
                  {hoveredTile?.dateKey === tile.dateKey && (
                    <div className="heatmap-tooltip">
                      <div className="tooltip-date">{tile.formattedDate}</div>
                      <div className="tooltip-val">{tile.formattedValue}</div>
                      <div className="tooltip-sub">
                        {heatmapMetric === 'tasks' ? 'Tasks' : 'Study Time'}: {tile.value}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="heatmap-footer-row">
          <div className="heatmap-stat">
            <span className="stat-value">
              {heatmapData?.activeDays || 0} / {heatmapData?.totalDays || 0} Days ({heatmapData?.activeRatio || 0}%)
            </span>
            <span className="stat-label">ACTIVE DAYS</span>
          </div>

          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-cell level-0"></div>
            <div className="legend-cell level-1"></div>
            <div className="legend-cell level-2"></div>
            <div className="legend-cell level-3"></div>
            <div className="legend-cell level-4"></div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* ─── 4. & 6. Study Time Overview & Time by Subject ──── */}
      <div className="analytics-two-col">
        {/* Left: Study Time Bar Chart */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Study Time Overview</h3>
              <p className="card-subtitle">Daily breakdown for selected date range</p>
            </div>
            <div className="card-badge">{studyTimeData?.totalFormatted || '0h'}</div>
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: '220px' }} />
          ) : (
            <div className="bar-chart-container">
              {studyTimeData?.chartData?.length > 0 ? (
                <div className="bar-chart">
                  {studyTimeData.chartData.map((d, i) => {
                    const maxHours = Math.max(...studyTimeData.chartData.map(c => c.hours), 4);
                    const heightPct = Math.max(8, Math.min(100, (d.hours / maxHours) * 100));
                    return (
                      <div key={i} className="bar-column">
                        <div className="bar-fill-wrapper">
                          <div
                            className="bar-fill"
                            style={{ height: `${heightPct}%` }}
                            title={`${d.fullDate}: ${d.formatted}`}
                          >
                            <span className="bar-tooltip-hover">{d.formatted}</span>
                          </div>
                        </div>
                        <span className="bar-label">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-chart-box">
                  <Clock size={28} />
                  <p>No study sessions recorded for this period.</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/timer')}>Start Timer</button>
                </div>
              )}
            </div>
          )}

          {/* Sub-stats below chart */}
          <div className="chart-substats-row">
            <div className="substat-item">
              <span className="substat-label">Average per day</span>
              <span className="substat-val">{studyTimeData?.averagePerDayFormatted || '0m'}</span>
            </div>
            <div className="substat-item">
              <span className="substat-label">Longest study day</span>
              <span className="substat-val">{studyTimeData?.longestStudyDay || 'None'}</span>
            </div>
            <div className="substat-item">
              <span className="substat-label">Longest session</span>
              <span className="substat-val">{studyTimeData?.longestSessionFormatted || '0m'}</span>
            </div>
          </div>
        </div>

        {/* Right: Time by Subject Donut Chart */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Where your time goes</h3>
              <p className="card-subtitle">Subject distribution breakdown</p>
            </div>
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: '220px' }} />
          ) : (
            <div className="donut-section">
              {subjectData?.subjects?.length > 0 ? (
                <div className="donut-layout">
                  <div className="donut-graphic">
                    <svg viewBox="0 0 100 100" className="donut-svg">
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--color-surface-hover)" strokeWidth="12" />
                      {(() => {
                        let accumulatedPct = 0;
                        return subjectData.subjects.map((s, idx) => {
                          const strokeDasharray = `${s.percentage * 2.388} 238.8`;
                          const strokeDashoffset = -accumulatedPct * 2.388;
                          accumulatedPct += s.percentage;
                          return (
                            <circle
                              key={idx}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={s.color}
                              strokeWidth="12"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform="rotate(-90 50 50)"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="donut-center-text">
                      <span className="donut-center-val">{subjectData.totalFormatted}</span>
                      <span className="donut-center-lbl">TOTAL TIME</span>
                    </div>
                  </div>

                  <div className="subject-legend-list">
                    {subjectData.subjects.map((s, idx) => (
                      <div
                        key={idx}
                        className={`subject-legend-item ${selectedSubject === s.subject ? 'selected' : ''}`}
                        onClick={() => setSelectedSubject(selectedSubject === s.subject ? 'all' : s.subject)}
                      >
                        <div className="legend-dot" style={{ backgroundColor: s.color }} />
                        <div className="legend-info">
                          <span className="legend-name">{s.subject}</span>
                          <span className="legend-detail">{s.formattedTime} ({s.sessionsCount} sessions)</span>
                        </div>
                        <span className="legend-pct">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-chart-box">
                  <PieChart size={28} />
                  <p>No subject distribution available yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* ─── 7. & 9. Learning Path Activity & Progress ───── */}
      <div className="analytics-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Learning Path Progression & Activity</h3>
            <p className="card-subtitle">Curriculum module advancement and time allocation</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: '200px' }} />
        ) : (
          <div className="learning-path-analytics-list">
            {pathData.length > 0 ? (
              pathData.map((lp) => (
                <div key={lp._id} className="lp-analytics-row">
                  <div className="lp-info">
                    <div className="lp-title-row">
                      <div className="lp-color-badge" style={{ backgroundColor: lp.color }} />
                      <span className="lp-title">{lp.title}</span>
                      <span className="lp-time-badge">{lp.formattedTime} logged</span>
                    </div>
                    <div className="lp-sub-details">
                      <span>
                        {lp.sessionsCount || 0} sessions · {lp.topicsStudiedCount || 0} topics
                        {lp.topicsStudied?.length ? ` (${lp.topicsStudied.slice(0, 3).join(', ')}${lp.topicsStudied.length > 3 ? '…' : ''})` : ''}
                      </span>
                      <span>{lp.tasksCompleted || 0}/{lp.totalTasks || 0} tasks done</span>
                    </div>
                  </div>

                  <div className="lp-progress-section">
                    <div className="lp-progress-meta">
                      <span>Progress</span>
                      <span className="lp-pct-value">{lp.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${lp.progress}%`, backgroundColor: lp.color }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-chart-box">
                <Layers size={28} />
                <p>No learning path activity found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 8. & 12. Most Studied Topics & Task Velocity ───── */}
      <div className="analytics-two-col">
        {/* Left: Most Studied Topics */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Most Studied Topics</h3>
              <p className="card-subtitle">Topics ranked by actual logged study duration</p>
            </div>
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: '200px' }} />
          ) : (
            <div className="topics-ranking-list">
              {topicData.length > 0 ? (
                topicData.map((t, idx) => (
                  <div key={idx} className="topic-rank-item">
                    <div className="topic-rank-number">#{idx + 1}</div>
                    <div className="topic-rank-info">
                      <div className="topic-rank-header">
                        <span className="topic-name">{t.topic}</span>
                        <span className="topic-time">{t.formattedTime}</span>
                      </div>
                      <div className="progress-bar mini">
                        <div className="progress-fill" style={{ width: `${Math.max(10, t.percentage)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-chart-box">
                  <Brain size={28} />
                  <p>No topic session data available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Task breakdown */}
        <div className="analytics-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Tasks</h3>
              <p className="card-subtitle">All your todo items right now</p>
            </div>
            <div className="card-badge">{todoData?.completionRate || 0}% Completed</div>
          </div>

          {loading ? (
            <div className="skeleton-box" style={{ height: '200px' }} />
          ) : (
            <div className="task-velocity-content">
              <div className="task-stats-three">
                <div className="task-stat-box done">
                  <span className="num">{todoData?.completed || 0}</span>
                  <span className="lbl">Done</span>
                </div>
                <div className="task-stat-box pending">
                  <span className="num">{todoData?.pending || 0}</span>
                  <span className="lbl">Pending</span>
                </div>
                <div className="task-stat-box overdue">
                  <span className="num">{todoData?.overdue || 0}</span>
                  <span className="lbl">Overdue</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Study Habits ──────────────────────────────────── */}
      <div className="analytics-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Study Habits</h3>
            <p className="card-subtitle">When your focus sessions actually happen</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: '180px' }} />
        ) : (
          <div className="habits-container">
            <div className="habits-stats-row">
              <div className="habit-card">
                <span className="habit-title">Most Active Day</span>
                <span className="habit-val">{habitData?.mostActiveDay || 'None'}</span>
              </div>
              <div className="habit-card">
                <span className="habit-title">Most Active Time</span>
                <span className="habit-val">{habitData?.mostActiveTime || 'None'}</span>
              </div>
              <div className="habit-card">
                <span className="habit-title">Average Session</span>
                <span className="habit-val">{habitData?.averageSessionFormatted || '0m'}</span>
              </div>
              <div className="habit-card">
                <span className="habit-title">Longest Session</span>
                <span className="habit-val">{habitData?.longestSessionFormatted || '0m'}</span>
              </div>
            </div>

            {/* Time by Hour Distribution */}
            <div className="hour-distribution-section">
              <span className="hour-dist-title">Study Activity by Hour of Day (6 AM – 10 PM):</span>
              <div className="hour-bars-row">
                {habitData?.hourDistribution?.map((hd, i) => (
                  <div key={i} className="hour-col">
                    <div className="hour-bar-fill" style={{ height: `${Math.min(100, Math.max(10, hd.hours * 25))}%` }} title={`${hd.hour}: ${hd.hours}h`} />
                    <span className="hour-lbl">{hd.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

        {/* ─── Recent Activity ──────────────────────────────── */}
      <div className="analytics-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-subtitle">Latest completed sessions and tasks</p>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: '160px' }} />
        ) : (
          <div className="recent-activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className="activity-icon">
                    {act.type === 'session' && <Clock size={14} />}
                    {act.type === 'todo' && <CheckCircle size={14} />}
                  </div>
                  <div className="activity-info">
                    <span className="activity-title">{act.title}</span>
                    <span className="activity-sub">{act.subtitle}</span>
                  </div>
                  <span className="activity-time">
                    {new Date(act.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-chart-box">
                <Activity size={24} />
                <p>No recent activity recorded.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
