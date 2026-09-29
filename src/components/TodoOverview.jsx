import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateTodo } from '../services/api.js';

export default function TodoOverview({ todos: initialTodos }) {
  const navigate = useNavigate();

  // Ensure todos is always an array
  const safeTodos = Array.isArray(initialTodos) ? initialTodos : [];
  const [todos, setTodos] = useState(safeTodos);

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

    // Persist to backend
    if (todo._id) {
      try {
        await updateTodo(todo._id, {
          completed: newCompleted,
          completedAt: newCompleted ? new Date() : null
        });
      } catch (err) {
        // Revert on error
        updated[index] = todo;
        setTodos([...updated]);
      }
    }
  };

  // Safely filter todos
  const pendingTodos = Array.isArray(todos) ? todos.filter(t => !t.completed) : [];
  const completedTodos = Array.isArray(todos) ? todos.filter(t => t.completed) : [];
  const displayTodos = [...pendingTodos, ...completedTodos].slice(0, 6);

  return (
    <div className="card fade-in">
      <div className="card-header">
        <h3 className="card-title">What's next</h3>
        <span className="card-link" onClick={() => navigate('/learning')}>
          View all <ChevronRight size={14} />
        </span>
      </div>
      <div className="todo-list">
        {displayTodos.map((todo, i) => (
          <div
            key={todo._id || i}
            className={`todo-item ${todo.completed ? 'completed' : ''}`}
          >
            <div
              className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
              onClick={() => toggleTodo(todos.indexOf(todo))}
            >
              {todo.completed && <Check size={12} />}
            </div>
            <div className="todo-info">
              <div className="todo-title">{todo.title}</div>
              <div className="todo-meta">
                <span className="todo-tag">{todo.category || todo.learningPathName}</span>
                {todo.estimatedDuration && (
                  <span className="todo-duration">{todo.estimatedDuration} min</span>
                )}
              </div>
            </div>
            {todo.priority && (
              <span className={`todo-priority ${todo.priority}`} />
            )}
            <ChevronRight size={14} className="todo-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}
