import { useEffect, useState } from 'react';
import { Check, Plus, X, Trash2 } from 'lucide-react';
import { createGoal, deleteGoal, updateGoal } from '../services/api.js';

const TYPE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  'long-term': 'Long-term'
};

export default function GoalsOverview({ goals: initialGoals }) {
  const safeGoals = Array.isArray(initialGoals) ? initialGoals : [];
  const [goals, setGoals] = useState(safeGoals);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('daily');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setGoals(Array.isArray(initialGoals) ? initialGoals : []);
  }, [initialGoals]);

  const toggleGoal = async (index) => {
    const updated = [...goals];
    const goal = updated[index];
    const newCompleted = !goal.completed;
    updated[index] = {
      ...goal,
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null
    };
    setGoals(updated);

    if (goal._id) {
      try {
        await updateGoal(goal._id, {
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : null
        });
      } catch (err) {
        updated[index] = goal;
        setGoals([...updated]);
      }
    }
  };

  const handleDelete = async (index) => {
    const goal = goals[index];
    if (!goal._id || !window.confirm(`Delete "${goal.title}"?`)) return;
    const snapshot = goals;
    setGoals(goals.filter((_, i) => i !== index));
    try {
      await deleteGoal(goal._id);
    } catch (err) {
      setGoals(snapshot);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');
    try {
      const res = await createGoal({ title: trimmed, type });
      const created = res.data?.data;
      if (created) {
        setGoals(prev => [{ ...created }, ...prev]);
      }
      setTitle('');
      setShowForm(false);
    } catch (err) {
      setError('Could not add that goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const open = goals.filter(g => !g.completed);
  const done = goals.filter(g => g.completed);
  const ordered = [...open, ...done];
  const completedCount = done.length;

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-header-eyebrow-group">
          <span className="card-header-red-dot">■</span>
          <h3 className="card-title">MISSION OBJECTIVES // TARGET LEDGER</h3>
        </div>
        <button
          type="button"
          className="card-link-btn"
          onClick={() => { setShowForm(prev => !prev); setError(''); }}
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          <span>{showForm ? 'Cancel' : '+ New Target'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="goal-create-form">
          <input
            type="text"
            className="form-input"
            placeholder="Objective specification..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <select
            className="form-input form-select"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? 'Registering...' : 'REGISTER'}
          </button>
          {error && (
            <div className="form-error-msg">{error}</div>
          )}
        </form>
      )}

      <div className="goals-list">
        {ordered.length === 0 && !showForm && (
          <div className="todo-empty-state">
            <span className="todo-empty-icon">■</span>
            <span>No objective targets logged. Click + New Target to add.</span>
          </div>
        )}
        {ordered.map((goal) => {
          const i = goals.indexOf(goal);
          return (
            <div
              key={goal._id || goal.title}
              className={`goal-item ${goal.completed ? 'completed' : ''}`}
            >
              <button
                type="button"
                className={`goal-check ${goal.completed ? 'completed' : ''}`}
                onClick={() => toggleGoal(i)}
                aria-label={goal.completed ? "Mark objective incomplete" : "Mark objective complete"}
              >
                {goal.completed && <Check size={12} />}
              </button>

              <span className="goal-title">{goal.title}</span>

              {goal.type && (
                <span className="goal-type-badge">
                  {TYPE_LABELS[goal.type] || goal.type}
                </span>
              )}

              <button
                type="button"
                className="goal-delete-btn"
                title="Delete goal"
                onClick={() => handleDelete(i)}
                aria-label="Delete objective"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {goals.length > 0 && (
        <div className="goals-summary-bar">
          <span className="goals-summary-count">{completedCount} of {goals.length} objectives accomplished</span>
          <span className="goals-summary-pct">{Math.round((completedCount / goals.length) * 100)}%</span>
        </div>
      )}
    </div>
  );
}