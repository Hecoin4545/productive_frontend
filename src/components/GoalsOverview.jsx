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
        <h3 className="card-title">Today's goals</h3>
        <span className="card-link" onClick={() => { setShowForm(prev => !prev); setError(''); }}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Close' : 'Add goal'}
        </span>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', padding: '0 var(--space-4) var(--space-3)', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: '160px' }}
            placeholder="What do you want to finish?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <select className="form-input" style={{ width: '110px' }} value={type} onChange={e => setType(e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? 'Adding...' : 'Add'}
          </button>
          {error && (
            <div style={{ width: '100%', color: '#ef4444', fontSize: '12px' }}>{error}</div>
          )}
        </form>
      )}

      <div className="goals-list">
        {ordered.length === 0 && !showForm && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-sm)', padding: 'var(--space-4) 0' }}>
            No goals yet. Add one to start tracking your day.
          </p>
        )}
        {ordered.map((goal) => {
          const i = goals.indexOf(goal);
          return (
            <div
              key={goal._id}
              className={`goal-item ${goal.completed ? 'completed' : ''}`}
            >
              <div
                className={`goal-check ${goal.completed ? 'completed' : ''}`}
                onClick={() => toggleGoal(i)}
              >
                {goal.completed && <Check size={12} />}
              </div>
              <span className="goal-title">{goal.title}</span>
              {goal.type && (
                <span className="todo-duration" style={{ flexShrink: 0 }}>
                  {TYPE_LABELS[goal.type] || goal.type}
                </span>
              )}
              <Trash2
                size={13}
                className="todo-arrow"
                style={{ cursor: 'pointer' }}
                title="Delete goal"
                onClick={() => handleDelete(i)}
              />
            </div>
          );
        })}
      </div>
      {goals.length > 0 && (
        <div className="goals-summary">
          {completedCount} / {goals.length} goals completed
        </div>
      )}
    </div>
  );
}