import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const TimerContext = createContext(null);

const STORAGE_KEY = 'arcstep_active_timer';

const TIMER_MODES = {
  POMODORO: 'pomodoro',
  CUSTOM: 'custom',
  STOPWATCH: 'stopwatch'
};

const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  BREAK: 'break'
};

const POMODORO_PRESETS = [
  { focus: 25, break: 5, label: '25 / 5' },
  { focus: 50, break: 10, label: '50 / 10' },
  { focus: 90, break: 15, label: '90 / 15' }
];

function loadTimerState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load timer state:', e);
  }
  return null;
}

function saveTimerState(state) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save timer state:', e);
  }
}

export function TimerProvider({ children }) {
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE);
  const [mode, setMode] = useState(TIMER_MODES.STOPWATCH);
  const [elapsed, setElapsed] = useState(0); // seconds elapsed (for display)
  const [targetDuration, setTargetDuration] = useState(0); // seconds for custom/pomodoro
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [pauseTimestamp, setPauseTimestamp] = useState(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0); // ms
  const [pauseIntervals, setPauseIntervals] = useState([]);
  const [sessionConfig, setSessionConfig] = useState({
    subject: '',
    learningPathId: null,
    learningPathName: '',
    moduleId: null,
    moduleName: '',
    topicId: null,
    topicName: '',
    task: ''
  });
  const [pomodoroConfig, setPomodoroConfig] = useState({
    focusMinutes: 25,
    breakMinutes: 5,
    completedBlocks: 0
  });
  const [isBreak, setIsBreak] = useState(false);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);

  const intervalRef = useRef(null);

  // Restore timer state on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (saved && saved.timerState !== TIMER_STATES.IDLE) {
      setTimerState(saved.timerState);
      setMode(saved.mode);
      setTargetDuration(saved.targetDuration || 0);
      setStartTimestamp(saved.startTimestamp);
      setPauseTimestamp(saved.pauseTimestamp);
      setTotalPausedDuration(saved.totalPausedDuration || 0);
      setPauseIntervals(saved.pauseIntervals || []);
      setSessionConfig(saved.sessionConfig || {});
      setPomodoroConfig(saved.pomodoroConfig || { focusMinutes: 25, breakMinutes: 5, completedBlocks: 0 });
      setIsBreak(saved.isBreak || false);
      setAccumulatedFocusSeconds(saved.accumulatedFocusSeconds || 0);
    }
  }, []);

  // Persist timer state on change
  useEffect(() => {
    if (timerState === TIMER_STATES.IDLE) {
      saveTimerState(null);
    } else {
      saveTimerState({
        timerState,
        mode,
        targetDuration,
        startTimestamp,
        pauseTimestamp,
        totalPausedDuration,
        pauseIntervals,
        sessionConfig,
        pomodoroConfig,
        isBreak,
        accumulatedFocusSeconds
      });
    }
  }, [
    timerState,
    mode,
    targetDuration,
    startTimestamp,
    pauseTimestamp,
    totalPausedDuration,
    pauseIntervals,
    sessionConfig,
    pomodoroConfig,
    isBreak,
    accumulatedFocusSeconds
  ]);

  // Calculate elapsed from timestamps (accurate even after tab sleep)
  const calculateElapsed = useCallback(() => {
    if (!startTimestamp) return 0;
    const now = Date.now();
    let pausedMs = totalPausedDuration;

    // If currently paused, add time from current pause
    if (timerState === TIMER_STATES.PAUSED && pauseTimestamp) {
      pausedMs += (now - pauseTimestamp);
    }

    const elapsedMs = now - startTimestamp - pausedMs;
    return Math.max(0, Math.floor(elapsedMs / 1000));
  }, [startTimestamp, totalPausedDuration, timerState, pauseTimestamp]);


  const handlePomodoroBreak = useCallback(() => {
    setAccumulatedFocusSeconds(prev => prev + (Number(pomodoroConfig.focusMinutes) * 60));
    setPomodoroConfig(prev => ({
      ...prev,
      completedBlocks: prev.completedBlocks + 1
    }));
    setIsBreak(true);
    // Reset for break period
    setStartTimestamp(Date.now());
    setTotalPausedDuration(0);
    setPauseIntervals([]);
    setTargetDuration(Number(pomodoroConfig.breakMinutes) * 60);
  }, [pomodoroConfig.focusMinutes, pomodoroConfig.breakMinutes]);

  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      const tick = () => {
        const currentElapsed = calculateElapsed();
        setElapsed(currentElapsed);

        // Check if countdown timer has completed
        if ((mode === TIMER_MODES.CUSTOM || mode === TIMER_MODES.POMODORO) && targetDuration > 0) {
          if (currentElapsed >= targetDuration) {
            setElapsed(targetDuration);
            // Timer completed
            if (mode === TIMER_MODES.POMODORO && !isBreak) {
              // Switch to break
              handlePomodoroBreak();
            }
            // For custom timer, we don't auto-stop — user should notice
          }
        }
      };

      tick(); // immediate
      intervalRef.current = setInterval(tick, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [timerState, calculateElapsed, mode, targetDuration, isBreak, handlePomodoroBreak]);

  const startTimer = useCallback((config = {}) => {
    const now = Date.now();
    setStartTimestamp(now);
    setPauseTimestamp(null);
    setTotalPausedDuration(0);
    setPauseIntervals([]);
    setElapsed(0);
    setIsBreak(false);
    setAccumulatedFocusSeconds(0);

    if (config.subject !== undefined) {
      setSessionConfig({
        subject: config.subject || '',
        learningPathId: config.learningPathId || null,
        learningPathName: config.learningPathName || '',
        moduleId: config.moduleId || null,
        moduleName: config.moduleName || '',
        topicId: config.topicId || null,
        topicName: config.topicName || '',
        task: config.task || ''
      });
    }

    if (config.mode) setMode(config.mode);

    if (config.mode === TIMER_MODES.POMODORO) {
      const focusMin = config.pomodoroFocus || 25;
      const breakMin = config.pomodoroBreak || 5;
      setPomodoroConfig({ focusMinutes: focusMin, breakMinutes: breakMin, completedBlocks: 0 });
      setTargetDuration(focusMin * 60);
    } else if (config.mode === TIMER_MODES.CUSTOM) {
      setTargetDuration(config.targetDuration || 0);
    } else {
      setTargetDuration(0);
    }

    setTimerState(TIMER_STATES.RUNNING);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING) return;
    const now = Date.now();
    setPauseTimestamp(now);
    setPauseIntervals(prev => [...prev, { pausedAt: new Date(now).toISOString(), resumedAt: null }]);
    setTimerState(TIMER_STATES.PAUSED);
    setElapsed(calculateElapsed());
  }, [timerState, calculateElapsed]);

  const resumeTimer = useCallback(() => {
    if (timerState !== TIMER_STATES.PAUSED || !pauseTimestamp) return;
    const now = Date.now();
    const pausedFor = now - pauseTimestamp;
    setTotalPausedDuration(prev => prev + pausedFor);
    setPauseIntervals(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].resumedAt = new Date(now).toISOString();
      }
      return updated;
    });
    setPauseTimestamp(null);
    setTimerState(TIMER_STATES.RUNNING);
  }, [timerState, pauseTimestamp]);

  const stopTimer = useCallback(() => {
    // Calculate final elapsed
    const finalElapsed = calculateElapsed();
    setElapsed(finalElapsed);
    setTimerState(TIMER_STATES.IDLE);

    const safeAccumulated = Number(accumulatedFocusSeconds) || 0;
    const safeElapsed = Number(finalElapsed) || 0;
    const totalFocusDuration = safeAccumulated + (isBreak ? 0 : safeElapsed);

    const result = {
      ...sessionConfig,
      startTime: startTimestamp ? new Date(startTimestamp).toISOString() : null,
      endTime: new Date().toISOString(),
      duration: totalFocusDuration,
      mode,
      pomodoroConfig: mode === TIMER_MODES.POMODORO ? pomodoroConfig : undefined,
      pauseIntervals
    };

    // Clear state
    setStartTimestamp(null);
    setPauseTimestamp(null);
    setTotalPausedDuration(0);
    setPauseIntervals([]);
    setElapsed(0);
    setTargetDuration(0);
    setIsBreak(false);
    setAccumulatedFocusSeconds(0);
    saveTimerState(null);

    return result;
  }, [calculateElapsed, sessionConfig, startTimestamp, mode, pomodoroConfig, pauseIntervals, accumulatedFocusSeconds, isBreak]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState(TIMER_STATES.IDLE);
    setStartTimestamp(null);
    setPauseTimestamp(null);
    setTotalPausedDuration(0);
    setPauseIntervals([]);
    setElapsed(0);
    setTargetDuration(0);
    setIsBreak(false);
    setAccumulatedFocusSeconds(0);
    saveTimerState(null);
  }, []);

  // Display value: for countdown, show remaining; for stopwatch, show elapsed
  const displaySeconds = (() => {
    if (mode === TIMER_MODES.STOPWATCH) return elapsed;
    if (targetDuration > 0) return Math.max(0, targetDuration - elapsed);
    return elapsed;
  })();

  const isActive = timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED;
  const isRunning = timerState === TIMER_STATES.RUNNING;
  const isPaused = timerState === TIMER_STATES.PAUSED;
  const isTimerComplete = (mode !== TIMER_MODES.STOPWATCH) && targetDuration > 0 && elapsed >= targetDuration;

  // True while the post-session write-up is open. Kept here (not in TimerPage)
  // so the layout can stay in fullscreen focus mode after the timer stops.
  const [summaryOpen, setSummaryOpen] = useState(false);

  const value = {
    // State
    timerState,
    mode,
    elapsed,
    displaySeconds,
    targetDuration,
    sessionConfig,
    pomodoroConfig,
    isBreak,
    pauseIntervals,

    // Computed
    isActive,
    isRunning,
    isPaused,
    isTimerComplete,
    summaryOpen,
    setSummaryOpen,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setMode,
    setTargetDuration,
    setSessionConfig,
    setPomodoroConfig,

    // Constants
    TIMER_MODES,
    TIMER_STATES,
    POMODORO_PRESETS
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) throw new Error('useTimer must be used within a TimerProvider');
  return context;
};

export { TIMER_MODES, TIMER_STATES, POMODORO_PRESETS };
export default TimerContext;
