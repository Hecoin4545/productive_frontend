import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getTodos, createTodo } from '../services/api.js';
import '../index.css';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [view, setView] = useState('week'); // month, week, day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick form for tasks
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', subject: '', time: '09:00', duration: '60' });

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const d = currentDate.toISOString().split('T')[0];
      const payload = {
        title: taskForm.title,
        description: `Subject: ${taskForm.subject}`,
        dueDate: `${d}T${taskForm.time}:00`,
        estimatedMinutes: parseInt(taskForm.duration),
        priority: 'medium',
        status: 'pending'
      };
      await createTodo(payload);
      setShowTaskForm(false);
      setTaskForm({ title: '', subject: '', time: '09:00', duration: '60' });
      fetchTodos();
    } catch (err) {
      console.error(err);
    }
  };

  const weekDays = getWeekDays(currentDate);
  
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
              {view === 'week' ? 
                `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
            <button className="btn btn-primary" onClick={() => setShowTaskForm(true)}>
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
                      {h}:00
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
                        const hour = Math.floor(y / 60) + HOURS[0];
                        setTaskForm({ ...taskForm, time: `${hour.toString().padStart(2, '0')}:00` });
                        setShowTaskForm(true);
                      }}
                    >
                      {dayTodos.map((todo) => {
                        const dueDate = new Date(todo.dueDate);
                        const startHour = dueDate.getHours() + dueDate.getMinutes() / 60;
                        if (startHour < HOURS[0] || startHour > HOURS[HOURS.length - 1]) return null;
                        
                        const topOffset = (startHour - HOURS[0]) * 60;
                        const height = (todo.estimatedMinutes || 60);
                        const bgColor = getSubjectColor(todo.description);
                        
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
                            title={todo.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              // In the future this would open an edit modal
                              // setTaskForm({ title: todo.title, subject: ... })
                            }}
                          >
                            <div style={{ fontWeight: 600, color: bgColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{todo.title}</div>
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Clock size={10} /> 
                              {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                              ({todo.estimatedMinutes}m)
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

          {view !== 'week' && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {view.charAt(0).toUpperCase() + view.slice(1)} view is currently under development. Please use Week view.
            </div>
          )}
        </div>
      </div>

      {showTaskForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px' }}>
            <div className="card-header">
              <h2 className="card-title">Schedule Session</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Task Name</label>
                  <input type="text" className="form-input" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="DSA - Dynamic Programming" />
                </div>
                <div>
                  <label className="form-label">Subject</label>
                  <input type="text" className="form-input" value={taskForm.subject} onChange={e => setTaskForm({...taskForm, subject: e.target.value})} placeholder="DSA, System Design, etc." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Time</label>
                    <input type="time" className="form-input" required value={taskForm.time} onChange={e => setTaskForm({...taskForm, time: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Duration (mins)</label>
                    <input type="number" className="form-input" required value={taskForm.duration} onChange={e => setTaskForm({...taskForm, duration: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Schedule</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
