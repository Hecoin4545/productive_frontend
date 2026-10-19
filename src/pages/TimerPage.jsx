import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTimer } from '../context/TimerContext.jsx';
import {
  Timer, Play, Pause, Square, RotateCcw, Clock,
  BookOpen, Target, Flame, TrendingUp, ChevronDown,
  X, CheckCircle2, AlertCircle, Coffee, Plus, Volume2, VolumeX,
  FileText, ExternalLink, Sparkles, Check
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import {
  createStudySession, getStudySessions, getStudySessionStats, getLearningPaths,
  getProfile, updateProfile, createTodo
} from '../services/api.js';
import '../index.css';

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
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const PALETTE = ['#141413', '#E03E2D', '#2B7A78', '#5C5B56', '#D97706'];
const getSubjectColor = (name) => {
  if (!name) return '#141413';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

export default function TimerPage() {
  const location = useLocation();
  const timer = useTimer();
  const {
    timerState, mode, displaySeconds, isActive, isRunning, isPaused,
    isTimerComplete, isBreak, sessionConfig, pomodoroConfig, elapsed, targetDuration,
    startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer,
    setMode, setTargetDuration, setSessionConfig, setPomodoroConfig,
    summaryOpen, setSummaryOpen,
    TIMER_MODES, TIMER_STATES, POMODORO_PRESETS
  } = timer;

  // Setup state
  const [subject, setSubject] = useState('');
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

  // Scratchpad state
  const [scratchpad, setScratchpad] = useState(() => localStorage.getItem('arcstep_scratchpad') || '');
  const handleScratchpadChange = (e) => {
    setScratchpad(e.target.value);
    localStorage.setItem('arcstep_scratchpad', e.target.value);
  };

  // Acoustic Engine (Web Audio API Binaural/Pink Tone Generator)
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  const toggleAudio = () => {
    if (audioPlaying) {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.5);
        setTimeout(() => {
          oscRef.current?.stop();
          setAudioPlaying(false);
        }, 500);
      } else {
        setAudioPlaying(false);
      }
    } else {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime); // 432 Hz alpha/gamma harmonic
        
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1); // gentle soothing volume

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setAudioPlaying(true);
      } catch (err) {
        console.error('Web audio failed:', err);
      }
    }
  };

  // Completion modal
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [accomplishments, setAccomplishments] = useState('');
  const [learned, setLearned] = useState('');
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Plan Dispatch & Manual entry modal
  const [showManual, setShowManual] = useState(false);
  const [dispatchTab, setDispatchTab] = useState('plan'); // 'plan' | 'offline'
  const [planDispatchSaving, setPlanDispatchSaving] = useState(false);
  const [planDispatchError, setPlanDispatchError] = useState('');
  const [dispatchNotice, setDispatchNotice] = useState('');
  const [planDispatchForm, setPlanDispatchForm] = useState({
    title: '',
    subject: '',
    hours: 0,
    minutes: 25,
    priority: 'medium',
    time: new Date().toTimeString().slice(0, 5),
    loadIntoDial: true
  });

  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manual, setManual] = useState(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      subject: '',
      learningPathId: '',
      moduleName: '',
      topicName: '',
      task: '',
      hours: 1,
      minutes: 0,
      date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      startTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      notes: ''
    };
  });

  const setManualField = (key, value) =>
    setManual(prev => ({ ...prev, [key]: value }));

  const manualDurationSeconds =
    (Number(manual.hours) || 0) * 3600 + (Number(manual.minutes) || 0) * 60;

  const handleSavePlanDispatch = async (e) => {
    e.preventDefault();
    if (!planDispatchForm.title.trim()) {
      setPlanDispatchError('Please enter a task or sprint title.');
      return;
    }

    setPlanDispatchSaving(true);
    setPlanDispatchError('');
    try {
      const now = new Date();
      const [hour, minute] = (planDispatchForm.time || '09:00').split(':').map(Number);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      const totalMins = (Number(planDispatchForm.hours) || 0) * 60 + (Number(planDispatchForm.minutes) || 0) || 25;
      const targetSubj = planDispatchForm.subject || subject || allSubjects[0];

      await createTodo({
        title: planDispatchForm.title.trim(),
        description: `Subject: ${targetSubj}`,
        dueDate: dueDate.toISOString(),
        estimatedDuration: String(totalMins),
        priority: planDispatchForm.priority || 'medium',
        completed: false
      });

      if (planDispatchForm.loadIntoDial) {
        setSubject(targetSubj);
        setTask(planDispatchForm.title.trim());
        setCustomHours(Number(planDispatchForm.hours) || 0);
        setCustomMinutes(Number(planDispatchForm.minutes) || 25);
        setCustomPomoFocus(totalMins);
        if (totalMins === 25) {
          setSetupMode(TIMER_MODES.POMODORO);
          setSelectedPreset(0);
        } else {
          setSetupMode(TIMER_MODES.CUSTOM);
        }
      }

      setDispatchNotice('Block dispatched to task ledger!');
      setTimeout(() => setDispatchNotice(''), 3500);
      setShowManual(false);
      setPlanDispatchForm({
        title: '',
        subject: '',
        hours: 0,
        minutes: 25,
        priority: 'medium',
        time: new Date().toTimeString().slice(0, 5),
        loadIntoDial: true
      });
    } catch (err) {
      console.error('Failed to plan dispatch:', err);
      setPlanDispatchError('Could not dispatch session. Please try again.');
    } finally {
      setPlanDispatchSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (manualDurationSeconds <= 0) {
      setManualError('Enter how long you studied.');
      return;
    }
    if (!manual.date || !manual.startTime) {
      setManualError('Pick the date and time you studied.');
      return;
    }

    setManualSaving(true);
    setManualError('');
    try {
      const start = new Date(`${manual.date}T${manual.startTime}`);
      if (Number.isNaN(start.getTime())) throw new Error('Invalid date');
      const end = new Date(start.getTime() + manualDurationSeconds * 1000);
      const path = learningPaths.find(p => p._id === manual.learningPathId);

      await createStudySession({
        subject: manual.subject || subject || allSubjects[0],
        learningPathId: path?._id || null,
        moduleName: manual.moduleName,
        topicName: manual.topicName,
        topic: manual.topicName || manual.moduleName,
        task: manual.task,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: manualDurationSeconds,
        mode: 'custom',
        notes: manual.notes,
        date: start.toISOString()
      });

      setShowManual(false);
      loadData();
    } catch (err) {
      console.error('Failed to log manual session:', err);
      setManualError('Could not save that session. Check the date and time.');
    } finally {
      setManualSaving(false);
    }
  };

  // History & stats
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('today');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  // Load learning paths and profile
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

  // Check navigation state for pre-selected task
  useEffect(() => {
    if (location.state?.title && !isActive) {
      setTask(location.state.title);
    }
  }, [location.state, isActive]);

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
      setSubject(sessionConfig.subject || '');
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

  const allSubjects = customSubjects.length > 0 ? customSubjects : ['DSA & Algorithms', 'Distributed Systems', 'System Design', 'General Deep Work'];

  // ─── Actions ──────────────────────
  const handleStart = () => {
    const config = {
      subject: subject || allSubjects[0],
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
    setSummaryOpen(true);
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
      setSummaryOpen(false);
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
    setSummaryOpen(false);
    setCompletionData(null);
  };

  // ─── Progress ring calculations ──────────────────────
  const progressPercent = (() => {
    if (mode === TIMER_MODES.STOPWATCH) {
      return (elapsed % 3600) / 3600;
    }
    if (targetDuration > 0) return Math.min(1, elapsed / targetDuration);
    return 0;
  })();

  const ringRadius = 130;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPercent);

  // ─── Distraction-Free Fullscreen View when Timer is Active ──────────────────
  if (isActive) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-bg, #FAF9F5)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflow: 'hidden'
        }}
      >
        {/* Top Minimalist Tag */}
        <div style={{ position: 'absolute', top: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '8px', height: '8px', background: isRunning ? 'var(--color-accent, #E03E2D)' : '#D97706', borderRadius: '50%', display: 'inline-block' }}></span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>
            {isPaused ? 'PAUSED' : isBreak ? 'BREAK TIME' : 'DEEP FOCUS SESSION'}
          </span>
        </div>

        {/* Task & Subject Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '640px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {sessionConfig?.subject || subject || 'Deep Work'}
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
            {sessionConfig?.task || task || 'Focused Execution'}
          </h1>
        </div>

        {/* Huge Precision Circular Dial */}
        <div style={{ position: 'relative', width: '320px', height: '320px', margin: '0 auto 40px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="320" height="320" viewBox="0 0 320 320" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
            <circle 
              cx="160" 
              cy="160" 
              r="145" 
              fill="none" 
              stroke="var(--color-border, #E5E2DA)" 
              strokeWidth="4" 
            />
            <circle 
              cx="160" 
              cy="160" 
              r="145" 
              fill="none" 
              stroke={isRunning ? 'var(--color-accent, #E03E2D)' : 'var(--color-text-primary)'} 
              strokeWidth="6" 
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 145}
              strokeDashoffset={(2 * Math.PI * 145) * (1 - progressPercent)}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Time Readout */}
          <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
              {isBreak ? 'RESTITUTION' : 'TIME ELAPSED'}
            </span>
            <div style={{ fontSize: '54px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {formatTime(displaySeconds)}
            </div>
            {targetDuration > 0 && (
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', marginTop: '8px', display: 'block' }}>
                TARGET: {formatDuration(targetDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Minimal Controls */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {isRunning ? (
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px 28px', fontSize: '13px' }}
              onClick={pauseTimer}
            >
              <Pause size={15} /> Pause [Space]
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              style={{ padding: '12px 28px', fontSize: '13px' }}
              onClick={resumeTimer}
            >
              <Play size={15} /> Resume [Space]
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: '13px' }}
            onClick={handleStop}
          >
            ■ Finish & Log Session
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '12px 18px', fontSize: '13px', color: 'var(--color-accent)' }}
            onClick={resetTimer}
          >
            <RotateCcw size={15} /> Discard
          </button>
        </div>

        {/* Completion Modal */}
        {showCompletion && completionData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(2px)' }} onClick={handleDiscard}>
            <div className="mx-card" style={{ width: '450px', padding: '26px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>■ SESSION DEBRIEF</span>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '2px 0 0 0' }}>Log Completed Sprint</h3>
                </div>
                <span className="telemetry-tag">{formatDuration(completionData.duration)}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>WHAT DID YOU ACCOMPLISH?</label>
                  <textarea 
                    value={accomplishments} 
                    onChange={e => setAccomplishments(e.target.value)}
                    placeholder="Summary of problems solved, chapters read, or implementations completed..."
                    rows={3}
                    className="form-input"
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button className="btn btn-secondary" onClick={handleDiscard}>Discard</button>
                  <button className="btn btn-primary" onClick={handleSaveSession} disabled={saving}>
                    {saving ? 'Saving...' : 'Save & Exit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      
      {/* Top Header */}
      <PageHeader 
        marker="■ ENGINE ACTIVE // PROTOCOL: STOIC DEEP WORK // SYNCHRONIZED WITH REPO"
        title="Focus Engine — Deep Work Session"
        subtitle="Full deterministic immersion window. Distraction suppression active, zero contextual bleed."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button 
                onClick={() => { setSetupMode(TIMER_MODES.POMODORO); setSelectedPreset(0); }}
                style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', border: 'none', borderRight: '1px solid var(--color-border)', background: setupMode === TIMER_MODES.POMODORO ? 'var(--color-text-primary)' : 'transparent', color: setupMode === TIMER_MODES.POMODORO ? '#FFFFFF' : 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                Pomodoro [25/5]
              </button>
              <button 
                onClick={() => { setSetupMode(TIMER_MODES.STOPWATCH); }}
                style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', border: 'none', borderRight: '1px solid var(--color-border)', background: setupMode === TIMER_MODES.STOPWATCH ? 'var(--color-text-primary)' : 'transparent', color: setupMode === TIMER_MODES.STOPWATCH ? '#FFFFFF' : 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                Stopwatch
              </button>
              <button 
                onClick={() => setShowManual(true)}
                style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', border: 'none', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                + Plan Dispatch
              </button>
            </div>
          </div>
        }
      />

      {/* Main Dual-Pane Engine Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Minimalist Precision Circular Dial Card & Acoustic Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="mx-card timer-dial-card" style={{ padding: '32px 28px', textAlign: 'center', position: 'relative' }}>
            
            {/* Dial Card Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '12px' }}>
              <span className="telemetry-tag">
                {isActive ? (isPaused ? 'STATUS: PAUSED' : 'SESSION IN FLIGHT') : 'STATUS: IDLE READY'}
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                ■ DETACHED FOCUS ENGINE
              </span>
            </div>

            {/* Circular Dial Visual */}
            <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle 
                  cx="140" 
                  cy="140" 
                  r={ringRadius} 
                  fill="none" 
                  stroke="var(--color-border)" 
                  strokeWidth="3" 
                />
                {/* Active Red / Black Progress Stroke */}
                <circle 
                  cx="140" 
                  cy="140" 
                  r={ringRadius} 
                  fill="none" 
                  stroke={isRunning ? 'var(--color-accent)' : 'var(--color-text-primary)'} 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>

              {/* Inner Dial Digital Readout */}
              <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
                  {isBreak ? 'RESTITUTION WINDOW' : 'ELAPSED CONCENTRATION'}
                </span>
                <div style={{ fontSize: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  {formatTime(displaySeconds)}
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', marginTop: '4px', display: 'block' }}>
                  TARGET: {setupMode === TIMER_MODES.POMODORO ? `${POMODORO_PRESETS[selectedPreset]?.focus || 25}M` : 'CONTINUOUS'}
                </span>
              </div>

            </div>

            {/* Dial Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {!isActive ? (
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '12px 28px', fontSize: '13px' }}
                  onClick={handleStart}
                >
                  <span style={{ color: 'var(--color-accent)', marginRight: '6px' }}>■</span> START DEEP FOCUS [SPACE]
                </button>
              ) : isRunning ? (
                <>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '10px 24px', fontSize: '12px' }}
                    onClick={pauseTimer}
                  >
                    <Pause size={14} /> PAUSE FOCUS [SPACE]
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '10px 20px', fontSize: '12px' }}
                    onClick={handleStop}
                  >
                    ■ COMPLETE & LOG [⌘S]
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '10px 24px', fontSize: '12px' }}
                    onClick={resumeTimer}
                  >
                    <Play size={14} /> RESUME FOCUS
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '10px 20px', fontSize: '12px' }}
                    onClick={handleStop}
                  >
                    ■ COMPLETE & LOG
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--color-accent)' }}
                    onClick={resetTimer}
                  >
                    <RotateCcw size={14} /> Discard
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Recent Study Logs Card */}
          <div className="mx-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
                RECENT STUDY LOGS
              </span>
              <span className="telemetry-tag">
                {recentSessions.length} SESSIONS
              </span>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                Loading session logs...
              </div>
            ) : recentSessions.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                No recent study sessions logged today. Start a timer to create your first log!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {recentSessions.slice(0, 5).map((s, idx) => (
                  <div 
                    key={s._id || idx} 
                    style={{ 
                      padding: '8px 10px', 
                      background: 'var(--color-bg-subtle)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {s.task || s.topic || s.subject || 'Focus Session'}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                        {s.subject || 'General'} · {s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {formatDuration(s.duration)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Active Task, Cluster Metrics, and Quick Scratchpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Active Task & Focus Config Card */}
          <div className="mx-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}>
                ACTIVE TASK & FOCUS TARGET
              </span>
              <span className="telemetry-tag" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-bg-subtle)' }}>
                {setupMode.toUpperCase()}
              </span>
            </div>

            {/* Subject Selector & Add Subject */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  SUBJECT / TRACK
                </label>
                {!isAddingSubject && (
                  <button
                    type="button"
                    onClick={() => setIsAddingSubject(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Plus size={12} /> Add Subject
                  </button>
                )}
              </div>

              {isAddingSubject ? (
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="New subject (e.g. Operating Systems)"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    style={{ fontSize: '12px', flex: 1 }}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCustomSubject();
                      if (e.key === 'Escape') setIsAddingSubject(false);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAddCustomSubject}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsAddingSubject(false)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select 
                  className="form-input" 
                  value={subject || allSubjects[0]} 
                  onChange={e => setSubject(e.target.value)}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                  disabled={isActive}
                >
                  {allSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Task Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                TASK DESCRIPTION
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={task} 
                onChange={e => setTask(e.target.value)} 
                placeholder="What are you working on? (e.g. Tree Traversal Problems)"
                style={{ fontSize: '12px' }}
                disabled={isActive}
              />
            </div>

            {/* Custom Timing Section */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  SESSION DURATION
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                  {setupMode === TIMER_MODES.CUSTOM ? `${customHours}h ${customMinutes}m Target` : setupMode === TIMER_MODES.POMODORO ? `${customPomoFocus}m Focus / ${customPomoBreak}m Break` : 'Open Stopwatch'}
                </span>
              </div>

              {!isActive && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={customHours}
                      onChange={e => {
                        const h = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setCustomHours(h);
                        setSetupMode(TIMER_MODES.CUSTOM);
                      }}
                      className="form-input"
                      style={{ width: '56px', padding: '4px 6px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>hrs</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      min="1"
                      max="59"
                      value={customMinutes}
                      onChange={e => {
                        const m = Math.max(1, parseInt(e.target.value, 10) || 0);
                        setCustomMinutes(m);
                        setCustomPomoFocus(m);
                        setSetupMode(TIMER_MODES.CUSTOM);
                      }}
                      className="form-input"
                      style={{ width: '56px', padding: '4px 6px', fontSize: '12px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>mins</span>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                    {[15, 25, 45, 60].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => {
                          setCustomHours(0);
                          setCustomMinutes(mins);
                          setCustomPomoFocus(mins);
                          setSetupMode(TIMER_MODES.CUSTOM);
                        }}
                        style={{
                          padding: '3px 7px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          background: (customHours === 0 && customMinutes === mins && setupMode === TIMER_MODES.CUSTOM) ? 'var(--color-text-primary)' : 'var(--color-bg-subtle)',
                          color: (customHours === 0 && customMinutes === mins && setupMode === TIMER_MODES.CUSTOM) ? '#FFFFFF' : 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily Cluster Metrics Card */}
          <div className="mx-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                DAILY CLUSTER METRICS
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'center' }}>
              <div style={{ padding: '8px 4px', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                <span style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block' }}>
                  {formatDuration(stats?.totalSeconds || 0)}
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>Cumulative</span>
              </div>
              <div style={{ padding: '8px 4px', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                <span style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'block' }}>
                  {stats?.totalSessions || 0}
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>Sprints</span>
              </div>
              <div style={{ padding: '8px 4px', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                <span style={{ fontSize: '15px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', display: 'block' }}>
                  {stats?.streak || 0}d
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>Streak</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>High-Concentration Index:</span>
              <strong style={{ color: 'var(--color-accent)' }}>94.2% Flow State</strong>
            </div>
          </div>

          {/* Quick Scratchpad Card */}
          <div className="mx-card" style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                QUICK SCRATCHPAD
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>AUTO-SAVED</span>
            </div>
            <textarea 
              value={scratchpad}
              onChange={handleScratchpadChange}
              placeholder="Capture fleeting thoughts, edge case hypotheses, or memory cache notes without breaking flow..."
              className="form-input"
              style={{ flex: 1, minHeight: '90px', fontSize: '11px', fontFamily: 'var(--font-mono)', lineHeight: 1.5, resize: 'none' }}
            />
          </div>

        </div>

      </div>

      {/* Completion Modal */}
      {showCompletion && completionData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }} onClick={handleDiscard}>
          <div className="mx-card" style={{ width: '450px', padding: '26px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>■ SESSION DEBRIEF</span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '2px 0 0 0' }}>Log Completed Sprint</h3>
              </div>
              <span className="telemetry-tag">{formatDuration(completionData.duration)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>WHAT DID YOU ACCOMPLISH?</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={accomplishments} 
                  onChange={e => setAccomplishments(e.target.value)} 
                  placeholder="Key problems solved or components built..."
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>QUALITATIVE POST-MORTEM / NOTES</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={sessionNotes} 
                  onChange={e => setSessionNotes(e.target.value)} 
                  placeholder="Any friction points or architectural insights..."
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={handleDiscard} style={{ fontSize: '12px' }}>Discard</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveSession} disabled={saving} style={{ fontSize: '12px' }}>
                  {saving ? 'Recording...' : 'Commit to Audit Ledger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notice */}
      {dispatchNotice && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-text-primary)', color: '#FFFFFF', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', zIndex: 1100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {dispatchNotice}
        </div>
      )}

      {/* Plan Dispatch / Offline Modal */}
      {showManual && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }} onClick={() => setShowManual(false)}>
          <div className="mx-card" style={{ width: '440px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>■ DISPATCH CONTROL</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0' }}>
                  {dispatchTab === 'plan' ? 'Plan Focus Dispatch' : 'Log Offline Session'}
                </h3>
              </div>
              <button onClick={() => setShowManual(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: 'var(--color-bg-subtle)', padding: '3px', borderRadius: '4px', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setDispatchTab('plan')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: dispatchTab === 'plan' ? 'var(--color-text-primary)' : 'transparent',
                  color: dispatchTab === 'plan' ? '#FFFFFF' : 'var(--color-text-secondary)'
                }}
              >
                Plan Dispatch
              </button>
              <button
                type="button"
                onClick={() => setDispatchTab('offline')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  background: dispatchTab === 'offline' ? 'var(--color-text-primary)' : 'transparent',
                  color: dispatchTab === 'offline' ? '#FFFFFF' : 'var(--color-text-secondary)'
                }}
              >
                Log Offline
              </button>
            </div>

            {/* Tab 1: Plan Dispatch */}
            {dispatchTab === 'plan' ? (
              <form onSubmit={handleSavePlanDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Block Title / Mission</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={planDispatchForm.title} 
                    onChange={e => setPlanDispatchForm({ ...planDispatchForm, title: e.target.value })} 
                    placeholder="e.g. Red-Black Tree Balancing & Audit" 
                    autoFocus
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Subject / Domain Tag</label>
                  <select 
                    className="form-input" 
                    value={planDispatchForm.subject || subject || allSubjects[0]} 
                    onChange={e => setPlanDispatchForm({ ...planDispatchForm, subject: e.target.value })}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Priority Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlanDispatchForm({ ...planDispatchForm, priority: p })}
                        style={{
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          border: planDispatchForm.priority === p ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                          background: planDispatchForm.priority === p 
                            ? (p === 'high' ? '#FEECE9' : p === 'medium' ? '#FFFBEB' : '#ECFDF5') 
                            : 'var(--color-bg-subtle)',
                          color: p === 'high' ? 'var(--color-accent-red, #DC2626)' : p === 'medium' ? '#B45309' : '#047857'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Target Duration</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="12" 
                        className="form-input" 
                        value={planDispatchForm.hours} 
                        onChange={e => setPlanDispatchForm({ ...planDispatchForm, hours: Number(e.target.value) || 0 })} 
                        style={{ fontSize: '12px', width: '50px', textAlign: 'center' }} 
                      />
                      <span style={{ alignSelf: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>h</span>
                      <input 
                        type="number" 
                        min="5" 
                        max="59" 
                        className="form-input" 
                        value={planDispatchForm.minutes} 
                        onChange={e => setPlanDispatchForm({ ...planDispatchForm, minutes: Number(e.target.value) || 0 })} 
                        style={{ fontSize: '12px', width: '56px', textAlign: 'center' }} 
                      />
                      <span style={{ alignSelf: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>m</span>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Start Time</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={planDispatchForm.time} 
                      onChange={e => setPlanDispatchForm({ ...planDispatchForm, time: e.target.value })} 
                      style={{ fontSize: '12px' }} 
                    />
                  </div>
                </div>

                {/* Option to load into active timer */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', marginTop: '2px' }}>
                  <input 
                    type="checkbox" 
                    checked={planDispatchForm.loadIntoDial} 
                    onChange={e => setPlanDispatchForm({ ...planDispatchForm, loadIntoDial: e.target.checked })} 
                  />
                  <span>Load directly into focus dial now</span>
                </label>

                {planDispatchError && (
                  <div style={{ color: 'var(--color-accent)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{planDispatchError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)} style={{ fontSize: '12px' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={planDispatchSaving} style={{ fontSize: '12px' }}>
                    {planDispatchSaving ? 'Dispatching...' : 'Dispatch Block'}
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Offline Session Log */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>HOURS</label>
                    <input type="number" min="0" max="23" className="form-input" value={manual.hours} onChange={e => setManualField('hours', Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>MINUTES</label>
                    <input type="number" min="0" max="59" className="form-input" value={manual.minutes} onChange={e => setManualField('minutes', Number(e.target.value) || 0)} />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>SUBJECT</label>
                  <select className="form-input" value={manual.subject || subject || allSubjects[0]} onChange={e => setManualField('subject', e.target.value)}>
                    {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TASK DESCRIPTION</label>
                  <input type="text" className="form-input" value={manual.task} onChange={e => setManualField('task', e.target.value)} placeholder="e.g. Distributed Consensus Paper Review" />
                </div>

                {manualError && (
                  <div style={{ color: 'var(--color-accent)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{manualError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)} style={{ fontSize: '12px' }}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveManual} disabled={manualSaving} style={{ fontSize: '12px' }}>
                    {manualSaving ? 'Saving...' : 'Commit Session'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
