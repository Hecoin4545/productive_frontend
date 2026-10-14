import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, 
  Trash2, CheckCircle2, XCircle, ArrowRight, Play, 
  Check, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../services/api.js';
import '../index.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 - 23:00
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LAST_HOUR = HOURS[HOURS.length - 1];

const formatHour = (h) => `${`${h}`.padStart(2, '0')}:00`;

const toDateKey = (date) => {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const toMinutes = (time) => {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getDurationMinutes = (todo) => {
  const raw = todo.estimatedDuration ?? todo.estimatedMinutes;
  const mins = parseInt(raw, 10);
  return Number.isFinite(mins) && mins > 0 ? mins : 60;
};

const getSessionStatus = (todo) => {
  if (todo.completed) return 'done';
  if (!todo.dueDate) return 'pending';
  const d = new Date(todo.dueDate);
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return Date.now() > endOfDay.getTime() ? 'missed' : 'pending';
};

const getSubjectTag = (desc) => {
  if (!desc) return 'GENERAL FOCUS';
  const clean = desc.replace(/^Subject:\s*/i, '').trim();
  return clean || 'DEEP WORK';
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('week'); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [selectedTodo, setSelectedTodo] = useState(null);

  // Quick form for tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', subject: '', time: '09:00', duration: '60', date: toDateKey(new Date()) });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    fetchTodos();
  }, [currentDate]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await getTodos();
      const list = res.data.data || [];
      setTodos(list);
      if (list.length > 0 && !selectedTodo) {
        setSelectedTodo(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch calendar tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (view === 'day') newDate.setDate(newDate.getDate() + 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (view === 'day') newDate.setDate(newDate.getDate() - 1);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const getWeekDays = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const sunday = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      return dd;
    });
  };

  const getMonthCells = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const cell = new Date(start);
      cell.setDate(start.getDate() + i);
      return { date: cell, inMonth: cell.getMonth() === month };
    });
  };

  const resetForm = () => {
    setShowTaskForm(false);
    setFormError('');
    setEditingId(null);
    setTaskForm({ title: '', subject: '', time: '09:00', duration: '60', date: toDateKey(currentDate) });
  };

  const handleToggleTaskCompletion = async (todo, e) => {
    e?.stopPropagation();
    if (!todo) return;
    const nextCompleted = !todo.completed;
    // Optimistic update
    setTodos(prev => prev.map(t => t._id === todo._id ? { ...t, completed: nextCompleted } : t));
    if (selectedTodo?._id === todo._id) {
      setSelectedTodo(prev => prev ? { ...prev, completed: nextCompleted } : null);
    }
    try {
      await updateTodo(todo._id, { completed: nextCompleted });
      setNotice(nextCompleted ? 'Task marked as completed!' : 'Task marked as active.');
      fetchTodos();
    } catch (err) {
      console.error('Error toggling todo completion:', err);
      fetchTodos();
    }
  };

  const handleQuickDelete = async (todo, e) => {
    e?.stopPropagation();
    if (!todo) return;
    if (!window.confirm(`Remove "${todo.title}"?`)) return;
    try {
      await deleteTodo(todo._id);
      if (selectedTodo && selectedTodo._id === todo._id) setSelectedTodo(null);
      if (editingId === todo._id) resetForm();
      fetchTodos();
      setNotice('Session removed.');
    } catch (err) {
      console.error('Error deleting todo:', err);
      setNotice('Could not delete session.');
    }
  };

  const openTaskForm = (dateKey, time) => {
    setFormError('');
    setEditingId(null);
    setTaskForm({ title: '', subject: '', time, duration: '60', date: dateKey });
    setShowTaskForm(true);
  };

  const openEditForm = (todo) => {
    const due = new Date(todo.dueDate);
    const subject = (todo.description || '').replace(/^Subject:\s*/i, '');
    setFormError('');
    setEditingId(todo._id);
    setTaskForm({
      title: todo.title || '',
      subject,
      time: `${`${due.getHours()}`.padStart(2, '0')}:${`${due.getMinutes()}`.padStart(2, '0')}`,
      duration: `${getDurationMinutes(todo)}`,
      date: toDateKey(due)
    });
    setShowTaskForm(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (saving) return;

    const duration = parseInt(taskForm.duration, 10);
    if (!Number.isFinite(duration) || duration < 5 || duration > 720) {
      setFormError('Duration must be between 5 and 720 minutes.');
      return;
    }

    // Build dueDate as a local Date object to avoid UTC/local timezone mismatch
    const [year, month, day] = taskForm.date.split('-').map(Number);
    const [hour, minute] = taskForm.time.split(':').map(Number);
    const localDueDate = new Date(year, month - 1, day, hour, minute, 0);

    const payload = {
      title: taskForm.title,
      description: `Subject: ${taskForm.subject || 'Deep Work'}`,
      dueDate: localDueDate.toISOString(),
      estimatedDuration: `${duration}`,
      priority: 'medium',
      completed: false
    };

    setSaving(true);
    try {
      if (editingId) {
        delete payload.priority;
        delete payload.completed;
        await updateTodo(editingId, payload);
        setNotice('Session block updated.');
        if (selectedTodo && selectedTodo._id === editingId) {
          setSelectedTodo({ ...selectedTodo, ...payload });
        }
      } else {
        const created = await createTodo(payload);
        if (created?.data?.data) {
          setSelectedTodo(created.data.data);
        }
        setNotice('New session block dispatched.');
      }
      resetForm();
      fetchTodos();
    } catch (err) {
      console.error(err);
      setFormError(editingId ? 'Could not update session.' : 'Could not schedule session.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (todo) => {
    if (!todo) return;
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    try {
      await deleteTodo(todo._id);
      if (selectedTodo && selectedTodo._id === todo._id) {
        setSelectedTodo(null);
      }
      if (editingId === todo._id) resetForm();
      fetchTodos();
      setNotice('Session removed.');
    } catch (err) {
      console.error(err);
      setNotice('Could not delete session.');
    }
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthCells = useMemo(() => getMonthCells(currentDate), [currentDate]);
  const dayKey = toDateKey(currentDate);
  const dayTodos = todos.filter(t => t.dueDate && toDateKey(t.dueDate) === dayKey);

  // Filter tasks if filter applied
  const filteredTodos = useMemo(() => {
    if (filterType === 'ALL') return todos;
    return todos.filter(t => {
      const subj = (t.description || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      if (filterType === 'DEEP WORK') return !subj.includes('review') && !subj.includes('meeting');
      if (filterType === 'CODE AUDIT') return subj.includes('code') || subj.includes('review') || title.includes('audit');
      if (filterType === 'RETRIEVAL') return subj.includes('dsa') || subj.includes('system') || subj.includes('study');
      return true;
    });
  }, [todos, filterType]);

  // Weekly scheduled hours calculation
  const weeklyHours = useMemo(() => {
    const weekKeys = new Set(weekDays.map(d => toDateKey(d)));
    const weekTasks = todos.filter(t => t.dueDate && weekKeys.has(toDateKey(t.dueDate)));
    const totalMins = weekTasks.reduce((acc, t) => acc + getDurationMinutes(t), 0);
    return (totalMins / 60).toFixed(1);
  }, [todos, weekDays]);

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <PageHeader 
        marker="■ TELEMETRY STREAM // 2024-OCT-21 // SYNCHED TO CLOUD TIME // RESET: 04:00Z"
        title="TIME ALLOCATION & RHYTHM" 
        subtitle="Plan deterministic deep work blocks. Fully synchronized with Google Calendar, LeetCode submission streams, and local Git commits."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '12px', padding: '7px 14px', fontFamily: 'var(--font-mono)' }}
              onClick={fetchTodos}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> SYNC CALENDAR
            </button>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '12px', padding: '7px 14px' }}
              onClick={() => openTaskForm(toDateKey(currentDate), '09:00')}
            >
              <Plus size={14} /> NEW BLOCK ⌘N
            </button>
          </div>
        }
      />

      {/* Date Navigation and Controls Bar */}
      <div className="mx-card" style={{ marginBottom: '16px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <button 
              className="btn" 
              style={{ padding: '6px 10px', background: 'transparent', borderRadius: 0, borderRight: '1px solid var(--color-border)' }}
              onClick={prevPeriod}
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="btn" 
              style={{ padding: '6px 14px', background: 'transparent', borderRadius: 0, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
              onClick={() => setCurrentDate(new Date())}
            >
              TODAY
            </button>
            <button 
              className="btn" 
              style={{ padding: '6px 10px', background: 'transparent', borderRadius: 0 }}
              onClick={nextPeriod}
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {view === 'week' && (
              <>
                {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span style={{ color: 'var(--color-text-tertiary)', marginLeft: '8px', fontSize: '11px' }}>[W{Math.ceil(currentDate.getDate() / 7)}]</span>
              </>
            )}
            {view === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            {view === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* View Switcher and Filter Pills */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode */}
          <div style={{ display: 'inline-flex', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            {['day', 'week', 'month'].map(m => (
              <button 
                key={m}
                onClick={() => setView(m)}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRight: m !== 'month' ? '1px solid var(--color-border)' : 'none',
                  background: view === m ? 'var(--color-text-primary)' : 'transparent',
                  color: view === m ? '#FFFFFF' : 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Layout (Grid + Inspector) */}
      <div className="calendar-layout-container">
        
        {/* Left Pane: Calendar Grid */}
        <div className="calendar-main-pane">
          <div className="mx-card" style={{ padding: 0, overflow: 'hidden' }}>
            
            {/* WEEK VIEW */}
            {view === 'week' && (
              <div style={{ minWidth: '760px', overflowX: 'auto' }}>
                {/* Day Columns Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                  <div style={{ width: '60px', borderRight: '1px solid var(--color-border)', padding: '10px 4px', textAlign: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                    UTC // H
                  </div>
                  {weekDays.map((d, i) => {
                    const isToday = isSameDay(d, new Date());
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          padding: '10px 4px', 
                          borderRight: i < 6 ? '1px solid var(--color-border)' : 'none',
                          background: isToday ? 'rgba(224, 62, 45, 0.04)' : 'transparent'
                        }}
                      >
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isToday ? 'var(--color-accent)' : 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {DAYS[d.getDay()]}
                        </div>
                        <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                          {d.getDate()}{isToday ? ' ●' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grid Canvas */}
                <div style={{ display: 'flex', position: 'relative', height: '1440px' }}>
                  {/* Hour labels column */}
                  <div style={{ width: '60px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', userSelect: 'none' }}>
                    {HOURS.map(h => (
                      <div key={h} style={{ height: '60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6px 0', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', borderBottom: '1px dashed var(--color-border-subtle)' }}>
                        {formatHour(h)}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((d, colIndex) => {
                    const dayTasks = filteredTodos.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString());
                    const isToday = isSameDay(d, new Date());

                    return (
                      <div 
                        key={colIndex} 
                        style={{ 
                          flex: 1, 
                          position: 'relative', 
                          borderRight: colIndex < 6 ? '1px solid var(--color-border)' : 'none',
                          backgroundImage: 'repeating-linear-gradient(transparent, transparent 59px, var(--color-border-subtle) 59px, var(--color-border-subtle) 60px)',
                          backgroundSize: '100% 60px',
                          cursor: 'crosshair',
                          background: isToday ? 'rgba(224, 62, 45, 0.015)' : 'transparent'
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const y = e.clientY - rect.top;
                          const hour = Math.min(Math.floor(y / 60) + HOURS[0], LAST_HOUR);
                          openTaskForm(toDateKey(d), formatHour(hour));
                        }}
                      >
                        {(() => {
                          // Sort tasks by start time then duration
                          const sortedTasks = [...dayTasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                          // Calculate overlapping columns
                          return sortedTasks.map((todo, taskIndex) => {
                            const dueDate = new Date(todo.dueDate);
                            const startMins = dueDate.getHours() * 60 + dueDate.getMinutes();
                            const durationMins = getDurationMinutes(todo);
                            const endMins = startMins + durationMins;
                            const topOffset = startMins; // 1 min = 1 px
                            const height = Math.max(durationMins, 36);
                            const isSelected = editingId === todo._id;

                            // Check collision with other tasks in same day
                            const overlapping = sortedTasks.filter(other => {
                              const oDue = new Date(other.dueDate);
                              const oStart = oDue.getHours() * 60 + oDue.getMinutes();
                              const oEnd = oStart + getDurationMinutes(other);
                              return (startMins < oEnd && endMins > oStart);
                            });

                            const overlapCount = overlapping.length;
                            const colIndexInOverlap = overlapping.findIndex(o => o._id === todo._id);
                            const widthPct = overlapCount > 1 ? (100 / overlapCount) : 100;
                            const leftPct = overlapCount > 1 ? (colIndexInOverlap * widthPct) : 0;

                            return (
                              <div 
                                key={todo._id}
                                className={`calendar-block ${isSelected ? 'selected' : ''} ${todo.completed ? 'is-completed' : ''}`}
                                style={{
                                  top: `${topOffset}px`,
                                  height: `${height}px`,
                                  left: overlapCount > 1 ? `calc(${leftPct}% + 2px)` : '3px',
                                  width: overlapCount > 1 ? `calc(${widthPct}% - 4px)` : 'calc(100% - 6px)',
                                  zIndex: isSelected ? 25 : (10 + colIndexInOverlap),
                                  borderLeftColor: todo.completed ? 'var(--color-success, #16A34A)' : 'var(--color-text-primary)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(todo);
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                  <span className="calendar-block-subject" style={{ margin: 0 }}>
                                    {getSubjectTag(todo.description)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => todo.completed ? handleToggleTaskCompletion(todo, e) : handleQuickDelete(todo, e)}
                                    title={todo.completed ? 'Completed (click to unmark)' : 'Remove this block'}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      color: todo.completed ? 'var(--color-success, #16A34A)' : '#DC2626'
                                    }}
                                  >
                                    {todo.completed ? '✓' : '✕'}
                                  </button>
                                </div>
                                <div 
                                  className={`calendar-block-title ${todo.completed ? 'completed' : ''}`}
                                  style={{ textDecoration: todo.completed ? 'line-through' : 'none', opacity: todo.completed ? 0.65 : 1 }}
                                  title={todo.title}
                                >
                                  {todo.title}
                                </div>
                                <div className="calendar-block-meta">
                                  <span>{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                  <span>{getDurationMinutes(todo)}m</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {view === 'day' && (
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                  <div style={{ width: '70px', borderRight: '1px solid var(--color-border)', padding: '12px 6px', textAlign: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                    TIME (UTC)
                  </div>
                  <div style={{ flex: 1, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                      {DAYS[currentDate.getDay()]} // {toDateKey(currentDate)}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                      ■ ACTIVE SPRINT WINDOW
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', position: 'relative', height: '1440px' }}>
                  <div style={{ width: '70px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', userSelect: 'none' }}>
                    {HOURS.map(h => (
                      <div key={h} style={{ height: '60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6px 0', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', borderBottom: '1px dashed var(--color-border-subtle)' }}>
                        {formatHour(h)}
                      </div>
                    ))}
                  </div>

                  <div 
                    style={{ 
                      flex: 1, 
                      position: 'relative', 
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 59px, var(--color-border-subtle) 59px, var(--color-border-subtle) 60px)',
                      backgroundSize: '100% 60px',
                      cursor: 'crosshair'
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hour = Math.min(Math.floor(y / 60) + HOURS[0], LAST_HOUR);
                      openTaskForm(toDateKey(currentDate), formatHour(hour));
                    }}
                  >
                    {dayTodos.map(todo => {
                      const dueDate = new Date(todo.dueDate);
                      const startHour = dueDate.getHours() + dueDate.getMinutes() / 60;
                      const topOffset = (startHour - HOURS[0]) * 60;
                      const height = Math.max(getDurationMinutes(todo), 36);
                      const isSelected = editingId === todo._id;

                      return (
                        <div
                          key={todo._id}
                          className={`calendar-block ${isSelected ? 'selected' : ''}`}
                          style={{
                            top: `${topOffset}px`,
                            height: `${height}px`,
                            left: '12px',
                            right: '12px',
                            zIndex: isSelected ? 20 : 10
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(todo);
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="calendar-block-subject">{getSubjectTag(todo.description)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                                {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} ({getDurationMinutes(todo)}m)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => todo.completed ? handleToggleTaskCompletion(todo, e) : handleQuickDelete(todo, e)}
                                title={todo.completed ? 'Completed (click to unmark)' : 'Remove this block'}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0 4px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  color: todo.completed ? 'var(--color-success, #16A34A)' : '#DC2626'
                                }}
                              >
                                {todo.completed ? '✓' : '✕'}
                              </button>
                            </div>
                          </div>
                          <div className={`calendar-block-title ${todo.completed ? 'completed' : ''}`} style={{ fontSize: '13px', marginTop: '2px', textDecoration: todo.completed ? 'line-through' : 'none', opacity: todo.completed ? 0.65 : 1 }}>
                            {todo.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MONTH VIEW */}
            {view === 'month' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '10px 4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: '120px' }}>
                  {monthCells.map(({ date: cellDate, inMonth }, cellIndex) => {
                    const cellKey = toDateKey(cellDate);
                    const cellTodos = todos.filter(t => t.dueDate && toDateKey(t.dueDate) === cellKey);
                    const isToday = isSameDay(cellDate, new Date());
                    const visible = cellTodos.slice(0, 2);
                    const overflow = cellTodos.length - visible.length;

                    return (
                      <div
                        key={`${cellKey}-${cellIndex}`}
                        style={{
                          height: '120px',
                          padding: '6px',
                          borderRight: cellDate.getDay() === 6 ? 'none' : '1px solid var(--color-border)',
                          borderBottom: cellIndex < 35 ? '1px solid var(--color-border)' : 'none',
                          background: inMonth ? (isToday ? 'rgba(224, 62, 45, 0.03)' : '#FFFFFF') : 'var(--color-bg-subtle)',
                          cursor: 'pointer'
                        }}
                        onClick={() => { setCurrentDate(cellDate); setView('day'); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: isToday ? 700 : 500,
                            color: isToday ? 'var(--color-accent)' : (inMonth ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)')
                          }}>
                            {cellDate.getDate()}{isToday ? ' ●' : ''}
                          </span>
                          {cellTodos.length > 0 && (
                            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                              {cellTodos.length} blocks
                            </span>
                          )}
                        </div>

                        {visible.map(t => (
                          <div 
                            key={t._id}
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              background: 'var(--color-bg-subtle)',
                              borderLeft: t.completed ? '2px solid var(--color-success, #16A34A)' : '2px solid var(--color-text-primary)',
                              padding: '2px 4px',
                              marginBottom: '3px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(t);
                            }}
                          >
                            <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.65 : 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.title}
                            </span>
                            <span 
                              style={{ 
                                marginLeft: '4px', 
                                fontWeight: 800, 
                                fontSize: '10px', 
                                color: t.completed ? 'var(--color-success, #16A34A)' : '#DC2626',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => t.completed ? handleToggleTaskCompletion(t, e) : handleQuickDelete(t, e)}
                            >
                              {t.completed ? '✓' : '✕'}
                            </span>
                          </div>
                        ))}

                        {overflow > 0 && (
                          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', paddingLeft: '4px' }}>
                            +{overflow} more
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid Footer Legend */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--color-text-primary)', display: 'inline-block' }}></span>
                  Deep Execution Block
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--color-accent)', display: 'inline-block' }}></span>
                  Critical Focus
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', background: 'var(--color-border)', display: 'inline-block' }}></span>
                  Review / Sprint
                </span>
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Total Scheduled: <strong>{weeklyHours}h</strong> / Target: <strong>30.0h</strong>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Notice */}
      {notice && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-text-primary)', color: '#FFFFFF', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', zIndex: 1100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {notice}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {showTaskForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div className="mx-card" style={{ width: '420px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
                  ■ CALENDAR DISPATCH
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
                  {editingId ? 'Edit Session Block' : 'Schedule Deep Work Block'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Block Title / Mission</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={taskForm.title} 
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} 
                  placeholder="e.g. Distributed Caching & Sharding" 
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Subject / Domain Tag</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={taskForm.subject} 
                  onChange={e => setTaskForm({...taskForm, subject: e.target.value})} 
                  placeholder="System Design, LeetCode, ML..." 
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required 
                  value={taskForm.date} 
                  onChange={e => { setFormError(''); setTaskForm({...taskForm, date: e.target.value}); }} 
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Start Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required 
                    value={taskForm.time} 
                    onChange={e => { setFormError(''); setTaskForm({...taskForm, time: e.target.value}); }} 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Duration (Mins)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="5" 
                    step="5" 
                    required 
                    value={taskForm.duration} 
                    onChange={e => setTaskForm({...taskForm, duration: e.target.value.replace(/[^0-9]/g, '')})} 
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  />
                </div>
              </div>

              {formError && (
                <div style={{ background: 'rgba(224,62,45,0.08)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', borderRadius: '3px', padding: '8px 10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {editingId && (
                  <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--color-accent)', fontSize: '12px', padding: '6px 12px' }} 
                      onClick={() => handleDeleteTask(todos.find(t => t._id === editingId))}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => {
                        const currentT = todos.find(t => t._id === editingId);
                        if (currentT) {
                          navigate('/timer', { state: { selectedTaskId: currentT._id, title: currentT.title } });
                        }
                      }}
                    >
                      <Play size={12} fill="currentColor" /> Launch Focus
                    </button>
                  </div>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '12px', padding: '6px 14px' }} 
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ fontSize: '12px', padding: '6px 16px', opacity: saving ? 0.6 : 1 }}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : (editingId ? 'Save Block' : 'Dispatch Block')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
