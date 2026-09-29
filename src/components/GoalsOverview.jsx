import { useState } from 'react';
import { Check } from 'lucide-react';
import { updateGoal } from '../services/api.js';

export default function GoalsOverview({ goals: initialGoals }) {
  // Ensure goals is always an array
  const safeGoals = Array.isArray(initialGoals) ? initialGoals : [];
  const [goals, setGoals] = useState(safeGoals);

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

    // Persist to backend
    if (goal._id) {
      try {
        await updateGoal(goal._id, {
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : null
        });
      } catch (err) {
        // Revert on error
        updated[index] = goal;
        setGoals([...updated]);
      }
    }
  };

  // Safely filter goals
  const completedCount = Array.isArray(goals) ? goals.filter(g => g.completed).length : 0;

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">Today's goals</h3>
      </div>
      <div className="goals-list">
        {goals.map((goal, i) => (
          <div
            key={goal._id || i}
            className={`goal-item ${goal.completed ? 'completed' : ''}`}
          >
            <div
              className={`goal-check ${goal.completed ? 'completed' : ''}`}
              onClick={() => toggleGoal(i)}
            >
              {goal.completed && <Check size={12} />}
            </div>
            <span className="goal-title">{goal.title}</span>
          </div>
        ))}
      </div>
      {goals.length > 0 && (
        <div className="goals-summary">
          {completedCount} / {goals.length} goals completed
        </div>
      )}
    </div>
  );
}
