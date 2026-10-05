import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../services/api.js';
import '../index.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // full 24h day (00:00 - 23:00)
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

// done = ticked off in the todo list, missed = day ended without a tick, pending = still open
const getSessionStatus = (todo) => {
  if (todo.completed) return 'done';
  if (!todo.dueDate) return 'pending';
  const d = new Date(todo.dueDate);
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return Date.now() > endOfDay.getTime() ? 'missed' : 'pending';
};

const STATUS_COLOR = {
  done: '#22c55e',
  missed: '#ef4444',
  pending: null
};

export default function CalendarPage() {
  const [view, setView] = useState('week'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick form for tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', subject: '', time: '09:00', duration: '60', date: toDateKey(new Date()) });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

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
      // Only get pending/completed todos
      setTodos(res.data.data || []);
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

  // Full 6x7 grid for the month view, Sunday-first
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

  const getSlotTask = (dateKey, time, ignoreId) =>
    todos.find(t => t.dueDate && t._id !== ignoreId && toDateKey(t.dueDate) === dateKey && toMinutes(`${new Date(t.dueDate).getHours()}`.padStart(2, '0') + ':' + `${new Date(t.dueDate).getMinutes()}`.padStart(2, '0')) === toMinutes(time));

  const resetForm = () => {
    setShowTaskForm(false);
    setFormError('');
    setEditingId(null);
    setTaskForm({ title: '', subject: '', time: '09:00', duration: '60', date: toDateKey(currentDate) });
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

    const duration = parseInt(taskForm.duration, 10);
    if (!Number.isFinite(duration) || duration < 5 || duration > 720) {
      setFormError('Duration must be between 5 and 720 minutes.');
      return;
    }

    const existing = getSlotTask(taskForm.date, taskForm.time, editingId);
    if (existing) {
      setFormError(`"${existing.title}" is already scheduled at ${taskForm.time} on ${taskForm.date}. Delete that session first, then add this one.`);
      return;
    }

    const payload = {
      title: taskForm.title,
      description: `Subject: ${taskForm.subject}`,
      dueDate: `${taskForm.date}T${taskForm.time}:00`,
      estimatedDuration: `${duration}`,
      priority: 'medium',
      completed: false
    };

    try {
      if (editingId) {
        delete payload.priority;
        delete payload.completed;
        await updateTodo(editingId, payload);
        setNotice('Session updated.');
      } else {
        await createTodo(payload);
      }
      resetForm();
      fetchTodos();
    } catch (err) {
      console.error(err);
      setFormError(editingId ? 'Could not update the session. Please try again.' : 'Could not schedule the session. Please try again.');
    }
  };

  const endTimePreview = () => {
    const start = toMinutes(taskForm.time);
    if (!taskForm.time) return '--:--';
    const mins = start + (parseInt(taskForm.duration, 10) || 0);
    if (mins >= 24 * 60) return 'next day';
    return `${`${Math.floor(mins / 60)}`.padStart(2, '0')}:${`${mins % 60}`.padStart(2, '0')}`;
  };

  const handleDeleteTask = async (todo) => {
    if (!todo) return;
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    try {
      await deleteTodo(todo._id);
      if (editingId === todo._id) resetForm();
      else fetchTodos();
    } catch (err) {
      console.error(err);
      setNotice('Could not delete the session. Please try again.');
    }
  };

  const weekDays = getWeekDays(currentDate);
  const monthCells = getMonthCells(currentDate);
  const dayKey = toDateKey(currentDate);
  const dayTodos = todos.filter(t => t.dueDate && toDateKey(t.dueDate) === dayKey);
  
  // A helper function to assign random pleasant colors based on subject
  const getSubjectColor = (desc) => {
    if (!desc) return 'var(--color-primary)';
    const d = desc.toLowerCase();
    if (d.includes('dsa') || d.includes('dynamic')) return '#6366f1'; // indigo
    if (d.includes('machine') || d.includes('ml')) return '#0ea5e9'; // sky
    if (d.includes('system') || d.includes('design')) return '#f59e0b'; // amber
    if (d.includes('web') || d.includes('dev')) return '#10b981'; // emerald
    if (d.includes('competitive') || d.includes('cp')) return '#8b5cf6'; // violet
    return 'var(--color-primary)';
  };

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <PageHeader 
        title="Calendar & Schedule" 
        subtitle="Time-block your study sessions, deep work, and milestones."
      />

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={prevPeriod}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="card-title" style={{ minWidth: '200px', textAlign: 'center' }}>
              {view === 'week' && 
                `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {view === 'day' && 
                currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={nextPeriod}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="btn-group" style={{ display: 'flex', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '4px' }}>
              <button 
                className={`btn ${view === 'month' ? 'btn-primary' : ''}`} 
                style={{ padding: '4px 12px', background: view === 'month' ? 'var(--color-primary)' : 'transparent', color: view === 'month' ? '#fff' : 'var(--color-text-primary)', border: 'none' }}
                onClick={() => setView('month')}
              >
                Month
              </button>
              <button 
                className={`btn ${view === 'week' ? 'btn-primary' : ''}`} 
                style={{ padding: '4px 12px', background: view === 'week' ? 'var(--color-primary)' : 'transparent', color: view === 'week' ? '#fff' : 'var(--color-text-primary)', border: 'none' }}
                onClick={() => setView('week')}
              >
                Week
              </button>
              <button 
                className={`btn ${view === 'day' ? 'btn-primary' : ''}`} 
                style={{ padding: '4px 12px', background: view === 'day' ? 'var(--color-primary)' : 'transparent', color: view === 'day' ? '#fff' : 'var(--color-text-primary)', border: 'none' }}
                onClick={() => setView('day')}
              >
                Day
              </button>
            </div>
            <button className="btn btn-secondary" style={{ marginRight: '8px' }} onClick={() => setCurrentDate(new Date())}>
              Today
            </button>
            <button className="btn btn-primary" onClick={() => openTaskForm(toDateKey(currentDate), '09:00')}>
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {view === 'week' && (
            <div style={{ minWidth: '800px', display: 'flex', flexDirection: 'column' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingLeft: '60px' }}>
                {weekDays.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px 8px', borderRight: i < 6 ? '1px solid var(--color-border)' : 'none' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{DAYS[d.getDay()]}</div>
                    <div style={{ fontSize: '20px', fontWeight: (d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth()) ? 700 : 400, color: (d.getDate() === new Date().getDate() && d.getMonth() === new Date().getMonth()) ? 'var(--color-primary)' : 'inherit' }}>
                      {d.getDate()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div style={{ display: 'flex', position: 'relative' }}>
                {/* Time labels */}
                <div style={{ width: '60px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: '60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8px 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((d, colIndex) => {
                  const dayTodos = todos.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString());
                  
                  return (
                    <div 
                      key={colIndex} 
                      style={{ flex: 1, position: 'relative', borderRight: colIndex < 6 ? '1px solid var(--color-border)' : 'none', backgroundImage: 'repeating-linear-gradient(transparent, transparent 59px, var(--color-border) 59px, var(--color-border) 60px)', backgroundSize: '100% 60px', cursor: 'pointer' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hour = Math.min(Math.floor(y / 60) + HOURS[0], LAST_HOUR);
                        openTaskForm(toDateKey(d), formatHour(hour));
                      }}
                    >
                      {dayTodos.map((todo) => {
                        const dueDate = new Date(todo.dueDate);
                        const startHour = dueDate.getHours() + dueDate.getMinutes() / 60;
                        
                        const topOffset = (startHour - HOURS[0]) * 60;
                        const height = getDurationMinutes(todo);
                        const status = getSessionStatus(todo);
                        const bgColor = status === 'pending' ? getSubjectColor(todo.description) : STATUS_COLOR[status];
                        
                        return (
                          <div 
                            key={todo._id}
                            style={{
                              position: 'absolute',
                              top: `${topOffset}px`,
                              height: `${height}px`,
                              left: '4px',
                              right: '4px',
                              backgroundColor: `${bgColor}20`,
                              borderLeft: `4px solid ${bgColor}`,
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              transition: 'transform 0.2s'
                            }}
                            title={`${todo.title} - ${status === 'done' ? 'Completed' : status === 'missed' ? 'Missed' : 'Scheduled'} - click to edit`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(todo);
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {status === 'done' && <CheckCircle2 size={12} color={STATUS_COLOR.done} style={{ flexShrink: 0 }} />}
                              {status === 'missed' && <XCircle size={12} color={STATUS_COLOR.missed} style={{ flexShrink: 0 }} />}
                              <div style={{ fontWeight: 600, color: bgColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textDecoration: status === 'done' ? 'line-through' : 'none' }}>{todo.title}</div>
                            </div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} />
                                {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                ({getDurationMinutes(todo)}m)
                              </span>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '2px 4px', flexShrink: 0 }}
                                title="Delete session"
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(todo); }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            <div style={{ minWidth: '520px', maxWidth: '900px', margin: '0 auto' }}>
              {/* Day Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', paddingLeft: '70px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '16px 8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {DAYS[currentDate.getDay()]}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: isSameDay(currentDate, new Date()) ? 700 : 400, color: isSameDay(currentDate, new Date()) ? 'var(--color-primary)' : 'inherit' }}>
                    {currentDate.getDate()}
                  </div>
                </div>
              </div>

              {/* Grid Body */}
              <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ width: '70px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: '64px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '8px 0', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                <div
                  style={{ flex: 1, position: 'relative', backgroundImage: 'repeating-linear-gradient(transparent, transparent 63px, var(--color-border) 63px, var(--color-border) 64px)', backgroundSize: '100% 64px', cursor: 'pointer' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = Math.min(Math.floor(y / 64) + HOURS[0], LAST_HOUR);
                    openTaskForm(toDateKey(currentDate), formatHour(hour));
                  }}
                >
                  {dayTodos.map(todo => {
                    const dueDate = new Date(todo.dueDate);
                    const startHour = dueDate.getHours() + dueDate.getMinutes() / 60;

                    const topOffset = (startHour - HOURS[0]) * 64;
                    const height = Math.max(getDurationMinutes(todo), 28);
                    const status = getSessionStatus(todo);
                    const bgColor = status === 'pending' ? getSubjectColor(todo.description) : STATUS_COLOR[status];

                    return (
                      <div
                        key={todo._id}
                        style={{
                          position: 'absolute',
                          top: `${topOffset}px`,
                          height: `${height}px`,
                          left: '8px',
                          right: '8px',
                          backgroundColor: `${bgColor}20`,
                          borderLeft: `4px solid ${bgColor}`,
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '13px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                        title={`${todo.title} - ${status === 'done' ? 'Completed' : status === 'missed' ? 'Missed' : 'Scheduled'} - click to edit`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(todo);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            {status === 'done' && <CheckCircle2 size={15} color={STATUS_COLOR.done} style={{ flexShrink: 0 }} />}
                            {status === 'missed' && <XCircle size={15} color={STATUS_COLOR.missed} style={{ flexShrink: 0 }} />}
                            <div style={{ fontWeight: 600, color: bgColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textDecoration: status === 'done' ? 'line-through' : 'none' }}>{todo.title}</div>
                          </div>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '2px 4px', flexShrink: 0 }}
                            title="Delete session"
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(todo); }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={10} />
                          {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          ({getDurationMinutes(todo)}m)
                          {status === 'done' && <span style={{ color: STATUS_COLOR.done, fontWeight: 600 }}>Completed</span>}
                          {status === 'missed' && <span style={{ color: STATUS_COLOR.missed, fontWeight: 600 }}>Missed</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {dayTodos.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  No sessions scheduled. Click a time slot to add one.
                </div>
              )}
            </div>
          )}

          {view === 'month' && (
            <div style={{ minWidth: '760px', display: 'flex', flexDirection: 'column' }}>
              {/* Weekday Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid var(--color-border)' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ minWidth: 0, textAlign: 'center', padding: '10px 4px', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gridAutoRows: '128px',
                  gridAutoFlow: 'row'
                }}
              >
                {monthCells.map(({ date: cellDate, inMonth }, cellIndex) => {
                  const cellKey = toDateKey(cellDate);
                  const cellTodos = todos
                    .filter(t => t.dueDate && toDateKey(t.dueDate) === cellKey)
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                  const isToday = isSameDay(cellDate, new Date());
                  const visible = cellTodos.slice(0, 3);
                  const overflow = cellTodos.length - visible.length;
                  const totalMinutes = cellTodos.reduce((sum, t) => sum + getDurationMinutes(t), 0);

                  return (
                    <div
                      key={cellKey}
                      style={{
                        minWidth: 0,
                        height: '128px',
                        overflow: 'hidden',
                        padding: '6px',
                        borderRight: cellDate.getDay() === 6 ? 'none' : '1px solid var(--color-border)',
                        borderBottom: cellIndex < 35 ? '1px solid var(--color-border)' : 'none',
                        backgroundColor: inMonth ? 'transparent' : 'var(--color-bg-secondary)',
                        opacity: inMonth ? 1 : 0.55,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = inMonth ? 'transparent' : 'var(--color-bg-secondary)'; }}
                      onClick={() => { setCurrentDate(cellDate); setView('day'); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? '#fff' : 'var(--color-text-primary)',
                          backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                          borderRadius: '999px',
                          minWidth: '22px',
                          height: '22px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {cellDate.getDate()}
                        </span>
                        {cellTodos.length > 0 && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }} title={`${totalMinutes} minutes scheduled`}>
                            {(totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1)}h
                          </span>
                        )}
                      </div>

                      {visible.map(todo => {
                        const status = getSessionStatus(todo);
                        const bgColor = status === 'pending' ? getSubjectColor(todo.description) : STATUS_COLOR[status];
                        const due = new Date(todo.dueDate);
                        return (
                          <div
                            key={todo._id}
                            style={{
                              flexShrink: 0,
                              fontSize: '11px',
                              backgroundColor: `${bgColor}20`,
                              borderLeft: `3px solid ${bgColor}`,
                              borderRadius: '3px',
                              padding: '2px 5px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'var(--color-text-primary)',
                              cursor: 'pointer'
                            }}
                            title={`${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${todo.title} (${getDurationMinutes(todo)}m, ${status === 'done' ? 'completed' : status === 'missed' ? 'missed' : 'scheduled'}). Click to edit.`}
                            onClick={(e) => { e.stopPropagation(); openEditForm(todo); }}
                          >
                            {status === 'done' && <CheckCircle2 size={11} color={STATUS_COLOR.done} style={{ verticalAlign: '-1px', marginRight: '3px', flexShrink: 0 }} />}
                            {status === 'missed' && <XCircle size={11} color={STATUS_COLOR.missed} style={{ verticalAlign: '-1px', marginRight: '3px', flexShrink: 0 }} />}
                            <span style={{ color: 'var(--color-text-tertiary)', marginRight: '4px' }}>
                              {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span style={{ textDecoration: status === 'done' ? 'line-through' : 'none' }}>{todo.title}</span>
                          </div>
                        );
                      })}

                      {overflow > 0 && (
                        <div
                          style={{ flexShrink: 0, fontSize: '11px', color: 'var(--color-text-secondary)', paddingLeft: '4px', cursor: 'pointer' }}
                          onClick={(e) => { e.stopPropagation(); setCurrentDate(cellDate); setView('day'); }}
                        >
                          +{overflow} more
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', zIndex: 1100 }}>
          {notice}
        </div>
      )}

      {showTaskForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <div className="card-header">
              <h2 className="card-title">{editingId ? 'Edit Session' : 'Schedule Session'}</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Task Name</label>
                  <input type="text" className="form-input" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="DSA - Dynamic Programming" />
                </div>
                <div>
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-input" value={taskForm.subject} onChange={e => setTaskForm({...taskForm, subject: e.target.value})} placeholder="DSA, System Design, etc." />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required value={taskForm.date} onChange={e => { setFormError(''); setTaskForm({...taskForm, date: e.target.value}); }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Time</label>
                    <input type="time" className="form-input" required value={taskForm.time} onChange={e => { setFormError(''); setTaskForm({...taskForm, time: e.target.value}); }} />
                  </div>
                  <div>
                    <label className="form-label">Duration (mins)</label>
                    <input type="number" className="form-input" min="5" step="5" required value={taskForm.duration} onChange={e => setTaskForm({...taskForm, duration: e.target.value.replace(/[^0-9]/g, '')})} />
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Blocked slot: {taskForm.time || '--:--'} - {endTimePreview()} ({parseInt(taskForm.duration, 10) || 0}m)
                </div>
                {formError && (
                  <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', borderRadius: '6px', padding: '10px 12px', fontSize: '13px' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  {editingId && (
                    <button type="button" className="btn btn-secondary" style={{ marginRight: 'auto', color: '#ef4444' }} onClick={() => handleDeleteTask(todos.find(t => t._id === editingId))}>
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Schedule'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
