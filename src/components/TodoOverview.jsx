import { useEffect, useState } from 'react';
import { Check, ChevronRight, ChevronDown, Clock, CalendarDays } from 'lucide-react';
import { updateTodo } from '../services/api.js';

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

      <div className="todo-list">
        {displayTodos.map((todo) => (
          <div
            key={todo._id || todo.title}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
            <button
              type="button"
              className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
              onClick={() => toggleTodo(todos.indexOf(todo))}
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

            {todo.priority && (
              <span className={`todo-priority-badge ${todo.priority}`}>
                {todo.priority.toUpperCase()}
              </span>
            )}
          </div>
        ))}

        {orderedTodos.length === 0 && (
          <div className="todo-empty-state">
            <span className="todo-empty-icon">✓</span>
            <span>Task ledger is clear. No scheduled blocks remain for today.</span>
          </div>
        )}
      </div>
    </div>
  );
}
