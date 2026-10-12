import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, Download, ArrowUpRight, Award, Zap, Activity, Calendar, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
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
import '../index.css';

const RANGES = [
  { value: '7d', label: 'Last 7 Days' }
];

const RANGE_LABELS = { '7d': 'Last 7 days' };

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('7d');
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

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <PageHeader 
        marker="■ REAL-TIME SENSOR // 2024-OCT-21 // SYNCHRONIZED ARCHIVE"
        title="Focus Telemetry & Insights"
        subtitle="Continuous metrics on cognitive velocity, topic retention, and historical study consistency."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <span>● LAST 7 DAYS</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '6px 14px', fontFamily: 'var(--font-mono)' }}
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <Download size={13} />
              {exporting ? 'EXPORTING...' : 'EXPORT CSV'}
            </button>
          </div>
        }
      />

      {/* 4 Stat Cards Row matching Screenshot 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          metricCode="METRIC // 01"
          title="Cumulative Focus"
          value={loading ? '—' : (overview?.totalStudyFormatted || '0h 00m')}
          tag="HOURS"
          targetInfo="Target: 80h / Rem: 15h 40m"
          trend={overview?.diffFormatted ? `${overview.diffFormatted} vs previous` : "+4.2% vs avg"}
          isPositive={true}
        />
        <StatCard
          metricCode="METRIC // 02"
          title="Dispatched Deep Work"
          value={loading ? '—' : `${overview?.totalSessions ?? 0} sessions`}
          tag="COMPLETED"
          targetInfo="Avg Duration: 1.4h / Session"
        />
        <StatCard
          metricCode="METRIC // 03"
          title="Learning Objectives"
          value={loading ? '—' : `${overview?.tasksCompleted ?? 0} goals`}
          tag="RESOLVED"
          targetInfo="Velocity: 89% On-Schedule"
        />
        <StatCard
          metricCode="METRIC // 04"
          title="Momentum Continuum"
          value={loading ? '—' : `${overview?.currentStreak ?? 0} Days`}
          tag="ACTIVE STREAK"
          tagColor="var(--color-accent)"
          targetInfo={`Peak Streak: ${overview?.longestStreak ?? 0} days`}
        />
      </div>

      {/* Main Chart Section: FIG 3.01 // DAILY STUDY VOLUME DISTRIBUTION */}
      <section className="mx-card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
                FIG 3.01 // DAILY STUDY VOLUME DISTRIBUTION
              </span>
              <span className="telemetry-tag">
                {RANGE_LABELS[period].toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
              Historical session volumes split between deep focus execution and conceptual review.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--color-text-primary, #141413)', display: 'inline-block', borderRadius: '1px' }}></span>
              DEEP FOCUS BLOCKS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--color-accent, #E03E2D)', display: 'inline-block', borderRadius: '1px' }}></span>
              PEAK SPIKES
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              Total: <strong style={{ color: 'var(--color-text-primary, #141413)' }}>{studyTime?.totalFormatted || '0m'}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: 220 }} />
        ) : chartData.length === 0 ? (
          <div className="mx-empty" style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No telemetry recorded for this time horizon.</p>
            <button className="btn btn-primary" style={{ marginTop: '12px', fontSize: '12px' }} onClick={() => navigate('/timer')}>
              Start Focus Session
            </button>
          </div>
        ) : (
          <>
            <div 
              className="mx-chart" 
              style={{ 
                height: '220px', 
                display: 'flex', 
                alignItems: 'stretch', 
                gap: '8px', 
                borderBottom: '1px solid var(--color-border)', 
                paddingBottom: '8px',
                paddingTop: '12px'
              }}
            >
              {chartData.map((d, idx) => {
                const isPeak = d.seconds === maxSeconds && d.seconds > 0;
                const hasTime = (d.seconds || 0) > 0;
                const heightPct = Math.max(hasTime ? 8 : 0, Math.round(((d.seconds || 0) / maxSeconds) * 100));
                
                return (
                  <div 
                    key={d.dateKey || idx} 
                    className="mx-chart-col" 
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      height: '100%',
                      justifyContent: 'flex-end',
                      position: 'relative'
                    }} 
                    title={`${d.fullDate || d.dateKey} · ${d.formatted || '0m'} (${d.sessionsCount || 0} sessions)`}
                  >
                    {/* Bar Track Area */}
                    <div 
                      style={{ 
                        flex: 1, 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center',
                        position: 'relative',
                        paddingBottom: '4px'
                      }}
                    >
                      {hasTime && (
                        <span 
                          style={{ 
                            fontSize: '9px', 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: 700,
                            color: isPeak ? 'var(--color-accent, #E03E2D)' : 'var(--color-text-secondary)',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {d.formatted}
                        </span>
                      )}
                      
                      <div 
                        style={{ 
                          width: '100%', 
                          maxWidth: '32px',
                          height: hasTime ? `${heightPct}%` : '3px', 
                          background: isPeak 
                            ? 'var(--color-accent, #E03E2D)' 
                            : (hasTime ? 'var(--color-text-primary, #141413)' : 'var(--color-border, #E5E2DA)'), 
                          borderRadius: '2px 2px 0 0', 
                          transition: 'height 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s',
                          boxShadow: isPeak ? '0 2px 8px rgba(224, 62, 45, 0.25)' : 'none'
                        }}
                      />
                    </div>

                    {/* X-Axis Day Label */}
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: isPeak ? 800 : (hasTime ? 600 : 500), 
                        color: isPeak 
                          ? 'var(--color-accent, #E03E2D)' 
                          : (hasTime ? 'var(--color-text-primary, #141413)' : 'var(--color-text-tertiary, #8C8A82)'), 
                        marginTop: '6px',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        background: isPeak ? 'rgba(224, 62, 45, 0.08)' : 'transparent'
                      }}
                    >
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Sub-Stats Telemetry Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed var(--color-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '10px' }}>AVERAGE VELOCITY</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{studyTime?.averagePerDayFormatted || '0m'} / day</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '10px' }}>LONGEST ACTIVE DAY</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{studyTime?.longestStudyDay || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '10px' }}>MAX CONTINUOUS SESSION</span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{studyTime?.longestSessionFormatted || '0m'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-tertiary)', display: 'block', fontSize: '10px' }}>COMPLETION EFFICIENCY</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{todos?.completionRate ?? 92}% On-Schedule</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Dual Column: FIG 3.02 Subject Allocation & FIG 3.03 Cognitive Intensity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Left: FIG 3.02 // SUBJECT ALLOCATION */}
        <section className="mx-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
              FIG 3.02 // SUBJECT ALLOCATION
            </span>
            <span className="telemetry-tag">100.0% TOTAL</span>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Proportionate cognitive investment across canonical domains.
          </p>

          {loading ? (
            <div className="skeleton-box" style={{ height: 160 }} />
          ) : !subjects?.subjects?.length ? (
            <div className="mx-empty"><p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>No subject distributions logged.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {subjects.subjects.map((s, idx) => {
                const pct = (s.seconds / maxSubjectSeconds) * 100;
                return (
                  <div key={s.subject} style={{ padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: '2px', background: subject === s.subject ? 'var(--color-bg-secondary)' : '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', background: s.color || 'var(--color-text-primary)', display: 'inline-block' }}></span>
                        {s.subject}
                      </span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {s.formattedTime}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--color-border-subtle)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color || 'var(--color-text-primary)' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                      <span>{s.sessionsCount} sessions</span>
                      <span>{s.percentage}% share</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: FIG 3.03 // COGNITIVE DEPTH PATROL & HABITS */}
        <section className="mx-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
              FIG 3.03 // COGNITIVE DEPTH PATROL
            </span>
            <span className="telemetry-tag" style={{ color: 'var(--color-accent)' }}>PEAK WINDOW</span>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Hourly intensity map tracking continuous deep focus windows.
          </p>

          <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: '2px', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }}>
              OPTIMAL FLOW WINDOW // {habits?.mostActiveTime || '10:00 – 13:00'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Highest cognitive favorability observed with minimal context-switching during this diurnal block.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '2px', textAlign: 'center' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', display: 'block' }}>MOST ACTIVE DAY</span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{habits?.mostActiveDay || 'Tue / Wed'}</span>
            </div>
            <div style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '2px', textAlign: 'center' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', display: 'block' }}>AVG SESSION</span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{habits?.averageSessionFormatted || '45m'}</span>
            </div>
            <div style={{ padding: '10px', border: '1px solid var(--color-border)', borderRadius: '2px', textAlign: 'center' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', display: 'block' }}>TASK RESOLUTION</span>
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>{todos?.completionRate ?? 90}%</span>
            </div>
          </div>
        </section>

      </div>

      {/* Bottom Section: TABLE 3.01 // RECENT DEEP WORK AUDIT LEDGER */}
      <section className="mx-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Recent Deep Work Sessions
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Audit trail of completed focus sessions and study milestones.
            </p>
          </div>
          <span className="telemetry-tag" style={{ fontSize: '11px', padding: '4px 10px' }}>
            {activity.length} Sessions Logged
          </span>
        </div>

        {loading ? (
          <div className="skeleton-box" style={{ height: 160 }} />
        ) : activity.length === 0 ? (
          <div className="mx-empty" style={{ padding: '30px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No sessions recorded in this 7-day period.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="telemetry-table" style={{ width: '100%', minWidth: '650px' }}>
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>DATE & TIME</th>
                  <th style={{ width: '140px' }}>SUBJECT</th>
                  <th>SESSION / TOPIC</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>DURATION</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                    <td>
                      <span className="telemetry-tag" style={{ fontSize: '10px' }}>
                        {a.type === 'session' ? 'Deep Work' : 'Task'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary, #141413)', lineHeight: 1.3 }}>
                        {a.title}
                      </div>
                      {a.subtitle && (
                        <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--color-text-tertiary, #8C8A82)', marginTop: '2px', lineHeight: 1.2 }}>
                          {a.subtitle}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {a.durationFormatted || '45m'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-success, #16A34A)', background: '#ECFDF5', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                        ✓ Logged
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}