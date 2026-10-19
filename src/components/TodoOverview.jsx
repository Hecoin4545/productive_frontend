import { useEffect, useState } from 'react';
import { Check, ChevronRight, ChevronDown, Clock, Plus, X } from 'lucide-react';
import { updateTodo, createTodo } from '../services/api.js';

const COLLAPSED_LIMIT = 6;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const formatDayLabel = (dueDate) => {
  const today = startOfDay(new Date());
  const target = startOfDay(dueDate);
  if (target === today) return 'Today';
  if (target === today + 86400000) return 'Tomorrow';
  if (target === today - 86400000) return 'Yesterday';
  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimeLabel = (todo) => {
  if (todo.dueTime) return todo.dueTime;
  if (todo.dueDate) {
    return new Date(todo.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return null;
};

const getDuration = (todo) => {
  const mins = parseInt(todo.estimatedDuration ?? todo.estimatedMinutes, 10);
  return Number.isFinite(mins) && mins > 0 ? mins : null;
};

export default function TodoOverview({ todos: initialTodos }) {
  const safeTodos = Array.isArray(initialTodos) ? initialTodos : [];
  const [todos, setTodos] = useState(safeTodos);
  const [showAll, setShowAll] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    subject: 'General Deep Work',
    duration: '45',
    priority: 'medium',
    time: new Date().toTimeString().slice(0, 5)
  });
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    setTodos(Array.isArray(initialTodos) ? initialTodos : []);
  }, [initialTodos]);

  const toggleTodo = async (index) => {
    const updated = [...todos];
    const todo = updated[index];
    const newCompleted = !todo.completed;
    updated[index] = {
      ...todo,
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null
    };
    setTodos(updated);

    if (todo._id) {
      try {
        await updateTodo(todo._id, {
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : null
        });
      } catch (err) {
        updated[index] = todo;
        setTodos([...updated]);
      }
    }
  };

  const handlePriorityCycle = async (index, e) => {
    e.stopPropagation();
    const todo = todos[index];
    if (!todo) return;

    const nextPriorityMap = { low: 'medium', medium: 'high', high: 'low' };
    const currentPriority = (todo.priority || 'medium').toLowerCase();
    const nextPriority = nextPriorityMap[currentPriority] || 'high';

    const updated = [...todos];
    updated[index] = { ...todo, priority: nextPriority };
    setTodos(updated);

    if (todo._id) {
      try {
        await updateTodo(todo._id, { priority: nextPriority });
      } catch (err) {
        console.error('Failed to cycle priority:', err);
        updated[index] = todo;
        setTodos([...updated]);
      }
    }
  };

  const handleSavePlanDispatch = async (e) => {
    e.preventDefault();
    if (!planForm.title.trim()) {
      setPlanError('Please enter a task title.');
      return;
    }

    setPlanSaving(true);
    setPlanError('');

    try {
      const now = new Date();
      const [hour, minute] = (planForm.time || '09:00').split(':').map(Number);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);

      const payload = {
        title: planForm.title.trim(),
        description: `Subject: ${planForm.subject || 'Deep Work'}`,
        dueDate: dueDate.toISOString(),
        estimatedDuration: String(planForm.duration || '45'),
        priority: planForm.priority || 'medium',
        completed: false
      };

      const res = await createTodo(payload);
      const newTodo = res?.data?.data || {
        ...payload,
        _id: `temp-${Date.now()}`,
        category: planForm.subject
      };

      setTodos(prev => [newTodo, ...prev]);
      setShowPlanModal(false);
      setPlanForm({
        title: '',
        subject: 'General Deep Work',
        duration: '45',
        priority: 'medium',
        time: new Date().toTimeString().slice(0, 5)
      });
    } catch (err) {
      console.error('Failed to plan dispatch:', err);
      setPlanError('Failed to dispatch task. Please try again.');
    } finally {
      setPlanSaving(false);
    }
  };

  const today = new Date();
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const todayTodos = Array.isArray(todos) ? todos.filter(t => isToday(t.dueDate)) : [];
  const pendingTodos = todayTodos.filter(t => !t.completed);
  const completedTodos = todayTodos.filter(t => t.completed);

  const bySchedule = (a, b) => {
    const at = a.dueDate ? new Date(a.dueDate).getTime() : null;
    const bt = b.dueDate ? new Date(b.dueDate).getTime() : null;
    if (at === null && bt === null) return 0;
    if (at === null) return 1;
    if (bt === null) return -1;
    return at - bt;
  };

  const orderedTodos = [...pendingTodos].sort(bySchedule).concat(completedTodos);
  const hasHidden = orderedTodos.length > COLLAPSED_LIMIT;
  const displayTodos = showAll ? orderedTodos : orderedTodos.slice(0, COLLAPSED_LIMIT);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <h3 className="card-title">CHRONOLOGICAL FLOW // TASK DISPATCH</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPlanModal(true)}
            style={{ fontSize: '11px', padding: '3px 8px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={12} /> Plan Dispatch
          </button>
          {hasHidden && (
            <button
              type="button"
              className="card-link-btn"
              onClick={() => setShowAll(prev => !prev)}
            >
              <span>{showAll ? 'Collapse ledger' : `Audit all (${orderedTodos.length})`}</span>
              {showAll ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          )}
        </div>
      </div>

      <div className="todo-list">
        {displayTodos.map((todo) => {
          const rawPriority = (todo.priority || 'medium').toLowerCase();
          const priority = ['low', 'medium', 'high'].includes(rawPriority) ? rawPriority : 'medium';
          const originalIndex = todos.indexOf(todo);

          return (
            <div
              key={todo._id || todo.title}
              className={`todo-item ${todo.completed ? 'completed' : ''}`}
            >
              <button
                type="button"
                className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                onClick={() => toggleTodo(originalIndex)}
                aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
              >
                {todo.completed && <Check size={12} />}
              </button>

              <div className="todo-info">
                <div className="todo-title">{todo.title}</div>
                <div className="todo-meta">
                  {todo.dueDate && (
                    <span
                      className="todo-when"
                      title={`Scheduled ${new Date(todo.dueDate).toLocaleString()}`}
                    >
                      <Clock size={11} />
                      <span>{formatDayLabel(new Date(todo.dueDate))}</span>
                      {formatTimeLabel(todo) && (
                        <span className="todo-time-badge">{formatTimeLabel(todo)}</span>
                      )}
                    </span>
                  )}
                  <span className="todo-tag">{todo.category || todo.learningPathName || 'Sprint Block'}</span>
                  {getDuration(todo) !== null && (
                    <span className="todo-duration">{getDuration(todo)} min</span>
                  )}
                </div>
              </div>

              <span 
                className={`todo-priority-badge ${priority}`}
                onClick={(e) => handlePriorityCycle(originalIndex, e)}
                title={`Priority: ${priority.toUpperCase()} — Click to cycle (Low → Medium → High)`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePriorityCycle(originalIndex, e); }}
              >
                {priority.toUpperCase()}
              </span>
            </div>
          );
        })}

        {orderedTodos.length === 0 && (
          <div className="todo-empty-state">
            <span className="todo-empty-icon">✓</span>
            <span>Task ledger is clear. No scheduled blocks remain for today.</span>
          </div>
        )}
      </div>

      {/* Plan Dispatch Modal */}
      {showPlanModal && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }}
          onClick={() => setShowPlanModal(false)}
        >
          <div className="mx-card" style={{ width: '420px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>■ DISPATCH LEDGER</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0' }}>Plan Task Dispatch</h3>
              </div>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleSavePlanDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Task / Mission Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={planForm.title} 
                  onChange={e => setPlanForm({ ...planForm, title: e.target.value })} 
                  placeholder="e.g. Graph BFS & Topological Sort" 
                  autoFocus
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Subject / Domain Tag</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={planForm.subject} 
                  onChange={e => setPlanForm({ ...planForm, subject: e.target.value })} 
                  placeholder="DSA, System Design, Backend..." 
                  style={{ fontSize: '12px' }}
                />
              </div>

              {/* Priority Selector */}
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Priority Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {['low', 'medium', 'high'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlanForm({ ...planForm, priority: p })}
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        border: planForm.priority === p ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                        background: planForm.priority === p 
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
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Time</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={planForm.time} 
                    onChange={e => setPlanForm({ ...planForm, time: e.target.value })} 
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Duration (Mins)</label>
                  <input 
                    type="number" 
                    min="5" 
                    step="5" 
                    className="form-input" 
                    value={planForm.duration} 
                    onChange={e => setPlanForm({ ...planForm, duration: e.target.value })} 
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              {planError && (
                <div style={{ color: 'var(--color-accent)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{planError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)} style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={planSaving} style={{ fontSize: '12px' }}>
                  {planSaving ? 'Dispatching...' : 'Dispatch Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
