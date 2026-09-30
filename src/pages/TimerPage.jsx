import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '../context/TimerContext.jsx';
import {
  Timer, Play, Pause, Square, RotateCcw, Clock,
  BookOpen, Target, Flame, TrendingUp, ChevronDown,
  X, CheckCircle2, AlertCircle, Coffee, Plus
} from 'lucide-react';
import {
  createStudySession, getStudySessions, getStudySessionStats, getLearningPaths,
  getProfile, updateProfile
} from '../services/api.js';

// ─── Helpers ────────────────────────────────────────────
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDurationMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sessionDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (sessionDate.getTime() === today.getTime()) return 'Today';
  if (sessionDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeOfDay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const SUBJECTS = [
  'Data Structures & Algorithms',
  'Machine Learning',
  'Web Development',
  'Competitive Programming',
  'Mathematics',
  'System Design',
  'College',
  'Other'
];

const subjectColors = {
  'Data Structures & Algorithms': '#6C63FF',
  'Machine Learning': '#22C55E',
  'Web Development': '#F59E0B',
  'Competitive Programming': '#8B5CF6',
  'Mathematics': '#06B6D4',
  'System Design': '#EF4444',
  'College': '#EC4899',
  'Other': '#9B9B9B',
  'General': '#6B6B6B'
};

// ─── Timer Page ─────────────────────────────────────────
export default function TimerPage() {
  const timer = useTimer();
  const {
    timerState, mode, displaySeconds, isActive, isRunning, isPaused,
    isTimerComplete, isBreak, sessionConfig, pomodoroConfig, elapsed, targetDuration,
    startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer,
    setMode, setTargetDuration, setSessionConfig, setPomodoroConfig,
    TIMER_MODES, TIMER_STATES, POMODORO_PRESETS
  } = timer;

  // Setup state
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [learningPaths, setLearningPaths] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [task, setTask] = useState('');
  const [setupMode, setSetupMode] = useState(TIMER_MODES.STOPWATCH);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customPomoFocus, setCustomPomoFocus] = useState(25);
  const [customPomoBreak, setCustomPomoBreak] = useState(5);

  // Completion modal
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [accomplishments, setAccomplishments] = useState('');
  const [learned, setLearned] = useState('');
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // History & stats
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('today');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  // Load learning paths
  useEffect(() => {
    getLearningPaths()
      .then(res => {
        if (res.data?.success) setLearningPaths(res.data.data || []);
      })
      .catch(() => {});
      
    getProfile()
      .then(res => {
        if (res.data?.success && res.data.user.customSubjects) {
          setCustomSubjects(res.data.user.customSubjects);
        }
      })
      .catch(() => {});
  }, []);

  // Load recent sessions and stats
  const loadData = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        getStudySessions({ period: historyFilter, limit: 20 }),
        getStudySessionStats({ period: 'today' })
      ]);
      if (sessionsRes.data?.success) setRecentSessions(sessionsRes.data.data || []);
      if (statsRes.data?.success) setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load timer data:', err);
    }
    setLoadingHistory(false);
  }, [historyFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync setup state from active session
  useEffect(() => {
    if (isActive && sessionConfig) {
      setSubject(sessionConfig.subject || 'Data Structures & Algorithms');
      setModuleName(sessionConfig.moduleName || '');
      setTopicName(sessionConfig.topicName || '');
      setTask(sessionConfig.task || '');
    }
  }, [isActive, sessionConfig]);

  const handleAddCustomSubject = async () => {
    if (!newSubjectName.trim()) return;
    const addedSubject = newSubjectName.trim();
    const updatedSubjects = [...new Set([...customSubjects, addedSubject])];
    
    setCustomSubjects(updatedSubjects);
    setSubject(addedSubject);
    setNewSubjectName('');
    setIsAddingSubject(false);
    
    try {
      await updateProfile({ customSubjects: updatedSubjects });
    } catch (err) {
      console.error('Failed to save custom subject:', err);
    }
  };

  const allSubjects = [...new Set([...SUBJECTS, ...customSubjects])];

  // ─── Actions ──────────────────────
  const handleStart = () => {
    const config = {
      subject,
      learningPathId: selectedPath?._id || null,
      learningPathName: selectedPath?.title || '',
      moduleId: null,
      moduleName,
      topicId: null,
      topicName,
      task,
      mode: setupMode
    };

    if (setupMode === TIMER_MODES.POMODORO) {
      const preset = POMODORO_PRESETS[selectedPreset];
      config.pomodoroFocus = preset ? preset.focus : customPomoFocus;
      config.pomodoroBreak = preset ? preset.break : customPomoBreak;
    } else if (setupMode === TIMER_MODES.CUSTOM) {
      config.targetDuration = customHours * 3600 + customMinutes * 60 + customSeconds;
    }

    startTimer(config);
  };

  const handleStop = () => {
    const result = stopTimer();
    setCompletionData(result);
    setShowCompletion(true);
    setAccomplishments('');
    setLearned('');
    setProblemsCompleted(0);
    setSessionNotes('');
  };

  const handleSaveSession = async () => {
    if (!completionData) return;
    setSaving(true);
    try {
      const safeDuration = Number(completionData.duration) || 0;
      await createStudySession({
        subject: completionData.subject || subject || 'General',
        learningPathId: completionData.learningPathId || null,
        moduleName: completionData.moduleName || '',
        topicName: completionData.topicName || '',
        topic: completionData.topicName || completionData.moduleName || '',
        task: completionData.task || '',
        startTime: completionData.startTime || new Date().toISOString(),
        endTime: completionData.endTime || new Date().toISOString(),
        duration: safeDuration,
        mode: completionData.mode || 'stopwatch',
        pomodoroConfig: completionData.pomodoroConfig || undefined,
        pauseIntervals: completionData.pauseIntervals || [],
        notes: sessionNotes || '',
        accomplishments: accomplishments || '',
        learned: learned || '',
        problemsCompleted: Number(problemsCompleted) || 0,
        date: completionData.startTime || new Date().toISOString()
      });
      setShowCompletion(false);
      setCompletionData(null);
      loadData();
    } catch (err) {
      console.error('Failed to save session:', err);
      alert('Failed to save session. Please try again.');
    }
    setSaving(false);
  };

  const handleDiscard = () => {
    setShowCompletion(false);
    setCompletionData(null);
  };

  // ─── Progress ring ──────────────────────
  const progressPercent = (() => {
    if (mode === TIMER_MODES.STOPWATCH) {
      // Cycle every 60 minutes for visual
      return (elapsed % 3600) / 3600;
    }
    if (targetDuration > 0) return Math.min(1, elapsed / targetDuration);
    return 0;
  })();

  const ringRadius = 140;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPercent);

  // ─── Render ──────────────────────────
  return (
    <div className="timer-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-eyebrow">DASHBOARD → FOCUS → STUDY TIMER</div>
        <h1 className="page-header-title" style={{ color: 'var(--color-primary)' }}>Study Timer</h1>
        <p className="page-header-subtitle">
          {isActive
            ? "Stay focused. You're doing great."
            : "Choose what you're working on and start focusing."
          }
        </p>
      </div>

      {/* Stats overview cards */}
      {stats && (
        <div className="timer-stats-row">
          <div className="timer-stat-card">
            <div className="timer-stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              <Clock size={16} />
            </div>
            <div className="timer-stat-info">
              <div className="timer-stat-label">Today's Study</div>
              <div className="timer-stat-value">{formatDuration(stats.totalSeconds)}</div>
            </div>
          </div>
          <div className="timer-stat-card">
            <div className="timer-stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
              <Target size={16} />
            </div>
            <div className="timer-stat-info">
              <div className="timer-stat-label">Sessions</div>
              <div className="timer-stat-value">{stats.totalSessions}</div>
            </div>
          </div>
          <div className="timer-stat-card">
            <div className="timer-stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
              <Flame size={16} />
            </div>
            <div className="timer-stat-info">
              <div className="timer-stat-label">Current Streak</div>
              <div className="timer-stat-value">{stats.streak} days</div>
            </div>
          </div>
          <div className="timer-stat-card">
            <div className="timer-stat-icon" style={{ background: '#F3EEFF', color: '#8B5CF6' }}>
              <TrendingUp size={16} />
            </div>
            <div className="timer-stat-info">
              <div className="timer-stat-label">Most Studied</div>
              <div className="timer-stat-value">{stats.mostStudied || '—'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="timer-main-layout">
        {/* Left: Timer + Controls */}
        <div className="timer-left">
          {/* Mode selector — only when idle */}
          {!isActive && (
            <div className="timer-mode-selector">
              {[
                { key: TIMER_MODES.POMODORO, label: 'Pomodoro', icon: Coffee },
                { key: TIMER_MODES.CUSTOM, label: 'Custom', icon: Clock },
                { key: TIMER_MODES.STOPWATCH, label: 'Stopwatch', icon: Timer }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`timer-mode-btn ${setupMode === key ? 'active' : ''}`}
                  onClick={() => setSetupMode(key)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Mode configuration — only when idle */}
          {!isActive && setupMode === TIMER_MODES.POMODORO && (
            <div className="timer-mode-config">
              <div className="pomodoro-presets">
                {POMODORO_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    className={`pomodoro-preset-btn ${selectedPreset === i ? 'active' : ''}`}
                    onClick={() => setSelectedPreset(i)}
                  >
                    <span className="pomodoro-preset-focus">{preset.focus}m</span>
                    <span className="pomodoro-preset-sep">/</span>
                    <span className="pomodoro-preset-break">{preset.break}m</span>
                  </button>
                ))}
                <button
                  className={`pomodoro-preset-btn ${selectedPreset === -1 ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(-1)}
                >
                  Custom
                </button>
              </div>
              {selectedPreset === -1 && (
                <div className="custom-pomo-inputs">
                  <div className="custom-pomo-field">
                    <label>Focus (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customPomoFocus}
                      onChange={e => setCustomPomoFocus(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div className="custom-pomo-field">
                    <label>Break (min)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customPomoBreak}
                      onChange={e => setCustomPomoBreak(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isActive && setupMode === TIMER_MODES.CUSTOM && (
            <div className="timer-mode-config">
              <div className="custom-time-inputs">
                <div className="custom-time-field">
                  <label>Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customHours}
                    onChange={e => setCustomHours(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <span className="custom-time-sep">:</span>
                <div className="custom-time-field">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={e => setCustomMinutes(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <span className="custom-time-sep">:</span>
                <div className="custom-time-field">
                  <label>Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={e => setCustomSeconds(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Timer display */}
          <div className={`timer-display-container ${isActive ? 'active' : ''} ${isPaused ? 'paused' : ''}`}>
            {/* SVG progress ring */}
            <svg className="timer-ring" viewBox="0 0 320 320">
              <circle
                cx="160"
                cy="160"
                r={ringRadius}
                fill="none"
                stroke="var(--color-border-light)"
                strokeWidth="4"
              />
              <circle
                cx="160"
                cy="160"
                r={ringRadius}
                fill="none"
                stroke={isRunning ? 'var(--color-primary)' : isPaused ? 'var(--color-warning)' : 'var(--color-border)'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 160 160)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>

            <div className="timer-display-inner">
              {isActive && (
                <div className={`timer-session-status ${isRunning ? 'running' : 'paused'}`}>
                  <span className="timer-status-dot" />
                  {isPaused ? 'PAUSED' : isBreak ? 'BREAK' : 'IN FOCUS SESSION'}
                </div>
              )}
              <div className="timer-time">{formatTime(displaySeconds)}</div>
              {isActive && sessionConfig.moduleName && (
                <div className="timer-current-topic">
                  <BookOpen size={14} />
                  {sessionConfig.moduleName}
                </div>
              )}
              {isActive && sessionConfig.subject && (
                <div className="timer-current-subject">{sessionConfig.subject}</div>
              )}
              {isActive && sessionConfig.task && (
                <div className="timer-current-task">{sessionConfig.task}</div>
              )}
              {isActive && mode === TIMER_MODES.POMODORO && (
                <div className="timer-pomo-info">
                  Block {pomodoroConfig.completedBlocks + 1} · {pomodoroConfig.focusMinutes}m focus / {pomodoroConfig.breakMinutes}m break
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            {!isActive && (
              <button className="timer-btn timer-btn-start" onClick={handleStart}>
                <Play size={20} />
                Start Focus
              </button>
            )}
            {isRunning && (
              <>
                <button className="timer-btn timer-btn-pause" onClick={pauseTimer}>
                  <Pause size={20} />
                  Pause
                </button>
                <button className="timer-btn timer-btn-stop" onClick={handleStop}>
                  <Square size={20} />
                  Complete & Save
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button className="timer-btn timer-btn-resume" onClick={resumeTimer}>
                  <Play size={20} />
                  Resume
                </button>
                <button className="timer-btn timer-btn-stop" onClick={handleStop}>
                  <Square size={20} />
                  Complete & Save
                </button>
                <button className="timer-btn timer-btn-reset" onClick={resetTimer}>
                  <RotateCcw size={16} />
                  Discard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Session setup / Active info */}
        <div className="timer-right">
          {!isActive ? (
            /* Session Setup */
            <div className="timer-setup card">
              <div className="card-header">
                <h3 className="card-title">Session Setup</h3>
              </div>

              {/* Subject */}
              <div className="timer-setup-field">
                <label className="form-label">Subject</label>
                <div className="timer-subject-grid">
                  {allSubjects.map(s => (
                    <button
                      key={s}
                      className={`timer-subject-btn ${subject === s ? 'active' : ''}`}
                      onClick={() => setSubject(s)}
                      style={{
                        '--subject-color': subjectColors[s] || '#6C63FF'
                      }}
                    >
                      <span
                        className="timer-subject-dot"
                        style={{ backgroundColor: subjectColors[s] || '#6C63FF' }}
                      />
                      {s}
                    </button>
                  ))}
                  
                  {isAddingSubject ? (
                    <div className="timer-add-subject-input-wrapper">
                      <input
                        type="text"
                        className="form-input timer-add-subject-input"
                        placeholder="Subject name..."
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddCustomSubject();
                          if (e.key === 'Escape') setIsAddingSubject(false);
                        }}
                        autoFocus
                      />
                      <button className="timer-add-subject-save" onClick={handleAddCustomSubject}>
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="timer-add-subject-cancel" onClick={() => setIsAddingSubject(false)}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="timer-subject-btn timer-add-subject-btn"
                      onClick={() => setIsAddingSubject(true)}
                    >
                      <Plus size={14} /> Add Subject
                    </button>
                  )}
                </div>
              </div>

              {/* Learning Path */}
              {learningPaths.length > 0 && (
                <div className="timer-setup-field">
                  <label className="form-label">Learning Path</label>
                  <select
                    className="form-input timer-select"
                    value={selectedPath?._id || ''}
                    onChange={e => {
                      const path = learningPaths.find(p => p._id === e.target.value);
                      setSelectedPath(path || null);
                    }}
                  >
                    <option value="">None</option>
                    {learningPaths.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Module */}
              <div className="timer-setup-field">
                <label className="form-label">Module</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Dynamic Programming"
                  value={moduleName}
                  onChange={e => setModuleName(e.target.value)}
                />
              </div>

              {/* Topic */}
              <div className="timer-setup-field">
                <label className="form-label">Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 1D DP"
                  value={topicName}
                  onChange={e => setTopicName(e.target.value)}
                />
              </div>

              {/* Task */}
              <div className="timer-setup-field">
                <label className="form-label">What are you working on?</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder='e.g., "Solve 5 Dynamic Programming problems"'
                  value={task}
                  onChange={e => setTask(e.target.value)}
                />
              </div>
            </div>
          ) : (
            /* Active session info */
            <div className="timer-active-info card">
              <div className="card-header">
                <h3 className="card-title">Current Session</h3>
                <span className={`timer-status-badge ${isRunning ? 'running' : 'paused'}`}>
                  {isRunning ? 'Active' : 'Paused'}
                </span>
              </div>

              <div className="timer-active-details">
                {sessionConfig.subject && (
                  <div className="timer-detail-row">
                    <span className="timer-detail-label">Subject</span>
                    <span className="timer-detail-value">
                      <span
                        className="timer-subject-dot"
                        style={{ backgroundColor: subjectColors[sessionConfig.subject] || '#6C63FF' }}
                      />
                      {sessionConfig.subject}
                    </span>
                  </div>
                )}
                {sessionConfig.learningPathName && (
                  <div className="timer-detail-row">
                    <span className="timer-detail-label">Learning Path</span>
                    <span className="timer-detail-value">{sessionConfig.learningPathName}</span>
                  </div>
                )}
                {sessionConfig.moduleName && (
                  <div className="timer-detail-row">
                    <span className="timer-detail-label">Module</span>
                    <span className="timer-detail-value">{sessionConfig.moduleName}</span>
                  </div>
                )}
                {sessionConfig.topicName && (
                  <div className="timer-detail-row">
                    <span className="timer-detail-label">Topic</span>
                    <span className="timer-detail-value">{sessionConfig.topicName}</span>
                  </div>
                )}
                {sessionConfig.task && (
                  <div className="timer-detail-row">
                    <span className="timer-detail-label">Task</span>
                    <span className="timer-detail-value">{sessionConfig.task}</span>
                  </div>
                )}
                <div className="timer-detail-row">
                  <span className="timer-detail-label">Mode</span>
                  <span className="timer-detail-value" style={{ textTransform: 'capitalize' }}>{mode}</span>
                </div>
                <div className="timer-detail-row">
                  <span className="timer-detail-label">Elapsed</span>
                  <span className="timer-detail-value timer-detail-elapsed">{formatDuration(elapsed)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Today's logged sessions */}
          <div className="timer-today-sessions card" style={{ marginTop: 'var(--space-4)' }}>
            <div className="card-header">
              <h3 className="card-title">Today's Sessions</h3>
              <span className="card-eyebrow">{recentSessions.filter(s => {
                const d = new Date(s.date);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              }).length} sessions</span>
            </div>
            <div className="timer-session-list">
              {recentSessions.filter(s => {
                const d = new Date(s.date);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              }).length === 0 ? (
                <p className="timer-empty">No sessions today yet. Start one!</p>
              ) : (
                recentSessions
                  .filter(s => {
                    const d = new Date(s.date);
                    const now = new Date();
                    return d.toDateString() === now.toDateString();
                  })
                  .map(s => (
                    <div
                      key={s._id}
                      className="timer-session-item"
                      onClick={() => setSelectedSession(selectedSession?._id === s._id ? null : s)}
                    >
                      <div
                        className="timer-session-color"
                        style={{ backgroundColor: subjectColors[s.subject] || '#6C63FF' }}
                      />
                      <div className="timer-session-item-info">
                        <div className="timer-session-item-title">
                          {s.moduleName || s.topicName || s.topic || s.subject}
                        </div>
                        <div className="timer-session-item-meta">
                          {formatTimeOfDay(s.startTime)} · {s.subject}
                        </div>
                      </div>
                      <div className="timer-session-item-duration">
                        {formatDuration(s.duration)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions History */}
      <div className="timer-history">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sessions</h3>
            <div className="timer-history-filters">
              {['today', 'week', 'month'].map(f => (
                <button
                  key={f}
                  className={`timer-filter-btn ${historyFilter === f ? 'active' : ''}`}
                  onClick={() => setHistoryFilter(f)}
                >
                  {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="timer-loading">
              <div className="timer-loading-skeleton" />
              <div className="timer-loading-skeleton" />
              <div className="timer-loading-skeleton" />
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="timer-empty-history">
              <Timer size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
              <p>No study sessions found for this period.</p>
              <p className="timer-empty-sub">Start a focus session to begin tracking!</p>
            </div>
          ) : (
            <div className="timer-history-list">
              {(() => {
                // Group by date
                const groups = {};
                recentSessions.forEach(s => {
                  const label = formatDateLabel(s.date);
                  if (!groups[label]) groups[label] = [];
                  groups[label].push(s);
                });
                return Object.entries(groups).map(([label, sessions]) => (
                  <div key={label} className="timer-history-group">
                    <div className="timer-history-date">{label}</div>
                    {sessions.map(s => (
                      <div
                        key={s._id}
                        className={`timer-history-item ${selectedSession?._id === s._id ? 'expanded' : ''}`}
                        onClick={() => setSelectedSession(selectedSession?._id === s._id ? null : s)}
                      >
                        <div className="timer-history-item-main">
                          <div
                            className="timer-session-color"
                            style={{ backgroundColor: subjectColors[s.subject] || '#6C63FF' }}
                          />
                          <div className="timer-history-item-info">
                            <div className="timer-history-item-title">
                              {s.moduleName || s.topicName || s.topic || 'Study Session'}
                            </div>
                            <div className="timer-history-item-meta">
                              {s.subject} · {formatTimeOfDay(s.startTime)}
                              {s.endTime && ` – ${formatTimeOfDay(s.endTime)}`}
                            </div>
                          </div>
                          <div className="timer-history-item-duration">{formatDuration(s.duration)}</div>
                        </div>

                        {selectedSession?._id === s._id && (
                          <div className="timer-history-item-details">
                            {s.task && (
                              <div className="timer-detail-row">
                                <span className="timer-detail-label">Task</span>
                                <span className="timer-detail-value">{s.task}</span>
                              </div>
                            )}
                            {s.accomplishments && (
                              <div className="timer-detail-row">
                                <span className="timer-detail-label">Accomplished</span>
                                <span className="timer-detail-value">{s.accomplishments}</span>
                              </div>
                            )}
                            {s.learned && (
                              <div className="timer-detail-row">
                                <span className="timer-detail-label">Learned</span>
                                <span className="timer-detail-value">{s.learned}</span>
                              </div>
                            )}
                            {s.notes && (
                              <div className="timer-detail-row">
                                <span className="timer-detail-label">Notes</span>
                                <span className="timer-detail-value">{s.notes}</span>
                              </div>
                            )}
                            <div className="timer-detail-row">
                              <span className="timer-detail-label">Mode</span>
                              <span className="timer-detail-value" style={{ textTransform: 'capitalize' }}>{s.mode}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletion && completionData && (
        <div className="timer-modal-overlay" onClick={handleDiscard}>
          <div className="timer-modal" onClick={e => e.stopPropagation()}>
            <button className="timer-modal-close" onClick={handleDiscard}>
              <X size={18} />
            </button>

            <div className="timer-modal-header">
              <div className="timer-modal-check">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="timer-modal-title">Session Complete</h2>
              <div className="timer-modal-duration">{formatDuration(completionData.duration)}</div>
              <div className="timer-modal-subject">
                {completionData.moduleName || completionData.topicName || completionData.subject}
              </div>
            </div>

            <div className="timer-modal-body">
              <div className="timer-setup-field">
                <label className="form-label">What did you accomplish?</label>
                <textarea
                  className="form-input timer-textarea"
                  placeholder="Write a quick summary of what you worked on…"
                  value={accomplishments}
                  onChange={e => setAccomplishments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="timer-setup-field">
                <label className="form-label">What did you learn?</label>
                <textarea
                  className="form-input timer-textarea"
                  placeholder="Key concepts or insights…"
                  value={learned}
                  onChange={e => setLearned(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="timer-modal-row">
                <div className="timer-setup-field" style={{ flex: 1 }}>
                  <label className="form-label">Problems completed</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={problemsCompleted}
                    onChange={e => setProblemsCompleted(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="timer-setup-field">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input timer-textarea"
                  placeholder="Any additional notes…"
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="timer-modal-actions">
              <button
                className="timer-btn timer-btn-start"
                onClick={handleSaveSession}
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? 'Saving…' : 'Save Session'}
              </button>
              <button
                className="timer-btn timer-btn-reset"
                onClick={handleDiscard}
                style={{ flex: 0 }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      {/* (inline expansion is used instead) */}
    </div>
  );
}
