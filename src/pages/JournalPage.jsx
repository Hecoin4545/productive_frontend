import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Clock, Target, TrendingUp, CheckSquare, Plus, Activity, BookOpen, History, Code, Hash, Link as LinkIcon, Lock, Paperclip, MoreVertical, Search, FileText, Circle } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { getJournals, getJournalByDate, createJournal, patchJournal, getTodos, getStudySessions, getGoals, updateTodo, updateGoal, createTodo } from '../services/api.js';
import '../index.css';

export default function JournalPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingStatus, setSavingStatus] = useState('Saved'); // 'Saved', 'Saving...', 'Unsaved changes'
  
  // Data State
  const [journal, setJournal] = useState({
    _id: null,
    title: `Journal for ${date}`,
    whatIDid: '',
    whatILearned: '',
    whatWentWell: '',
    difficulties: '',
    notes: '',
    tomorrow: '',
    technicalNotes: '',
    tags: []
  });

  const [todos, setTodos] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentJournals, setRecentJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyJournals, setHistoryJournals] = useState([]);

  // Debounce ref
  const saveTimeoutRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchDataForDate(date);
    fetchRecentJournals();
  }, [date]);

  useEffect(() => {
    if (showHistory) {
      const fetchHistory = async () => {
        try {
          const res = await getJournals(searchQuery ? { search: searchQuery } : {});
          setHistoryJournals(res.data.data || []);
        } catch (err) {
          console.error('Failed to fetch history', err);
        }
      };
      // Debounce history search slightly
      const timer = setTimeout(() => {
        fetchHistory();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showHistory, searchQuery]);

  // Handle autosave
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Don't trigger autosave if we are currently fetching data
    if (loading) return;

    setSavingStatus('Unsaved changes');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveJournal();
    }, 1500);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [journal.whatIDid, journal.whatILearned, journal.whatWentWell, journal.difficulties, journal.notes, journal.tomorrow, journal.technicalNotes, journal.tags]);

  const fetchDataForDate = async (targetDate) => {
    try {
      setLoading(true);
      
      const [journalRes, todosRes, sessionsRes, goalsRes] = await Promise.all([
        getJournalByDate(targetDate),
        getTodos({ date: targetDate }),
        getStudySessions({ date: targetDate }),
        getGoals({ date: targetDate })
      ]);

      if (journalRes.data.data) {
        setJournal(journalRes.data.data);
      } else {
        setJournal({
          _id: null,
          title: `Journal for ${targetDate}`,
          whatIDid: '',
          whatILearned: '',
          whatWentWell: '',
          difficulties: '',
          notes: '',
          tomorrow: '',
          technicalNotes: '',
          tags: []
        });
        isFirstRender.current = true; // prevent immediate autosave on empty journal mount
      }

      setTodos(todosRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
      setGoals(goalsRes.data.data || []);
      
      setSavingStatus('Saved');
    } catch (err) {
      console.error('Failed to fetch journal data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJournals = async () => {
    try {
      const res = await getJournals();
      setRecentJournals((res.data.data || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch recent journals', err);
    }
  };

  const saveJournal = async () => {
    if (!journal.whatIDid && !journal.whatILearned && !journal.notes) {
      setSavingStatus('Saved');
      return; // Don't save completely empty journals
    }

    try {
      setSavingStatus('Saving...');
      const payload = { ...journal, date: new Date(date).toISOString() };
      
      if (journal._id) {
        await patchJournal(journal._id, payload);
      } else {
        const res = await createJournal(payload);
        if (res.data.data) {
          setJournal(prev => ({ ...prev, _id: res.data.data._id }));
        }
      }
      setSavingStatus('Saved');
      fetchRecentJournals();
    } catch (err) {
      console.error('Failed to save journal', err);
      setSavingStatus('Unsaved changes');
    }
  };

  const updateJournalField = (field, value) => {
    setJournal(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleTodo = async (todo) => {
    try {
      const updated = { ...todo, completed: !todo.completed };
      setTodos(todos.map(t => t._id === todo._id ? updated : t));
      await updateTodo(todo._id, { completed: !todo.completed });
    } catch (err) {
      console.error('Failed to toggle todo', err);
    }
  };

  const handleToggleGoal = async (goal) => {
    try {
      const updated = { ...goal, progress: goal.progress < goal.target ? goal.target : 0 };
      setGoals(goals.map(g => g._id === goal._id ? updated : g));
      await updateGoal(goal._id, { progress: updated.progress });
    } catch (err) {
      console.error('Failed to toggle goal', err);
    }
  };

  const handleConvertToTodo = async () => {
    if (!journal.tomorrow) return;
    try {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      await createTodo({
        title: journal.tomorrow,
        dueDate: nextDay.toISOString(),
        priority: 'medium',
        status: 'pending'
      });
      
      alert('Converted to TODO for tomorrow!');
      updateJournalField('tomorrow', '');
    } catch (err) {
      console.error('Failed to convert to todo', err);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (!journal.tags.includes(tag)) {
        updateJournalField('tags', [...journal.tags, tag]);
      }
      e.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    updateJournalField('tags', journal.tags.filter(t => t !== tagToRemove));
  };

  const changeDate = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  // Stats calculation
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const completedTodos = todos.filter(t => t.completed).length;
  const completedGoals = goals.filter(g => g.progress >= g.target).length;

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', letterSpacing: '1px', margin: '0 0 12px 0' }}>
            DAILY REFLECTION
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>Daily Journal</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 16px 0', fontSize: '15px' }}>Capture what you learned, what you accomplished, and what comes next.</p>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={20} style={{ color: 'var(--color-primary)' }} />
            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} onClick={() => changeDate(-1)}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', outline: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              />
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '8px' }} onClick={() => changeDate(1)}>
              <ChevronRight size={16} />
            </button>
            <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, marginLeft: '4px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }} onClick={() => setDate(new Date().toISOString().split('T')[0])}>
              Today
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: savingStatus === 'Saved' ? 'var(--color-success)' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {savingStatus === 'Saved' && <CheckSquare size={14} />}
              {savingStatus}
            </span>
            <button className="btn btn-primary" onClick={saveJournal} disabled={savingStatus === 'Saving...'}>
              <Save size={16} /> Save
            </button>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-secondary" onClick={() => {
                const el = document.getElementById('journal-actions-menu');
                el.style.display = el.style.display === 'block' ? 'none' : 'block';
              }} style={{ padding: '8px 12px' }}>
                <MoreVertical size={16} />
              </button>
              <div id="journal-actions-menu" style={{ display: 'none', position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10, width: '160px', overflow: 'hidden' }}>
                <button className="btn" style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', borderRadius: 0, backgroundColor: 'transparent' }}>Duplicate entry</button>
                <button className="btn" style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', borderRadius: 0, backgroundColor: 'transparent' }}>Export entry</button>
                <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '4px 0' }} />
                <button className="btn" style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', borderRadius: 0, backgroundColor: 'transparent', color: 'var(--color-danger)' }}>Delete entry</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '12px', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Focus Time</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{Math.floor(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</div>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Tasks</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{completedTodos} / {todos.length}</div>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '12px', borderRadius: '12px' }}>
            <Target size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Goals</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{completedGoals} / {goals.length}</div>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '12px', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Progress</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>Active</div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="journal-grid">
        
        {/* === LEFT COLUMN: CONTEXT === */}
        <div className="journal-col-left">
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's Plan</h2>
            </div>
            <div className="card-body">
              {todos.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No tasks planned for today.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {completedTodos} / {todos.length} COMPLETED
                  </div>
                  {todos.map(todo => (
                    <div key={todo._id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', opacity: todo.completed ? 0.6 : 1 }} onClick={() => handleToggleTodo(todo)}>
                      <div style={{ marginTop: '2px', color: todo.completed ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {todo.completed ? <CheckSquare size={18} /> : <Circle size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</div>
                        {(todo.learningPathId || todo.estimatedDuration) && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            {todo.learningPathId?.title} {todo.learningPathId && todo.estimatedDuration ? '•' : ''} {todo.estimatedDuration ? `${todo.estimatedDuration}m` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Learning Today</h2>
            </div>
            <div className="card-body">
              {sessions.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No study sessions recorded today.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sessions.map(session => (
                    <div key={session._id} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '4px', borderRadius: '4px', backgroundColor: session.learningPathId?.color || 'var(--color-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: session.learningPathId?.color || 'var(--color-text-secondary)' }}>
                          {session.learningPathId?.title || 'General Study'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{session.topic || 'Focus Session'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={12} /> {session.duration}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* === CENTER COLUMN: EDITOR === */}
        <div className="journal-col-center">
          
          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* SECTION 1 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>What did I do today?</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>Capture the work you actually completed today.</p>
                <RichTextEditor 
                  value={journal.whatIDid} 
                  onChange={(v) => updateJournalField('whatIDid', v)}
                  placeholder="Write about what you worked on today..."
                  minHeight="120px"
                />
              </div>

              {/* SECTION 2 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>What did I learn?</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>Capture concepts, ideas, or discoveries worth remembering.</p>
                <RichTextEditor 
                  value={journal.whatILearned} 
                  onChange={(v) => updateJournalField('whatILearned', v)}
                  placeholder="Today I learned how memoization reduces repeated recursive computations..."
                  minHeight="160px"
                />
              </div>

              {/* SECTION 3 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>What goals did I achieve?</h3>
                {goals.length === 0 ? (
                  <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    No goals set for today.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {completedGoals} / {goals.length} COMPLETED
                    </div>
                    {goals.map(goal => {
                      const isComplete = goal.progress >= goal.target;
                      return (
                        <div key={goal._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }} onClick={() => handleToggleGoal(goal)}>
                          <div style={{ color: isComplete ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                            {isComplete ? <CheckSquare size={18} /> : <Circle size={18} />}
                          </div>
                          <div style={{ flex: 1, fontSize: '14px', textDecoration: isComplete ? 'line-through' : 'none' }}>
                            {goal.title}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 4 & 5 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>What went well?</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>What are you proud of today?</p>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    value={journal.whatWentWell}
                    onChange={(e) => updateJournalField('whatWentWell', e.target.value)}
                    placeholder="E.g., Focused for 2 hours straight without distraction."
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>What was difficult?</h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>What confused you or needs another attempt?</p>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    value={journal.difficulties}
                    onChange={(e) => updateJournalField('difficulties', e.target.value)}
                    placeholder="E.g., Couldn't figure out the state transition for DP problem."
                  />
                </div>
              </div>

              {/* SECTION 6 */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Notes</h3>
                <RichTextEditor 
                  value={journal.notes} 
                  onChange={(v) => updateJournalField('notes', v)}
                  placeholder="Ideas, reminders, random thoughts..."
                  minHeight="100px"
                />
              </div>

              {/* SECTION 7 */}
              <details style={{ backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                <summary style={{ fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={18} /> Technical Notes (Code & Snippets)
                </summary>
                <div style={{ marginTop: '16px' }}>
                  <RichTextEditor 
                    value={journal.technicalNotes} 
                    onChange={(v) => updateJournalField('technicalNotes', v)}
                    placeholder="Write or paste code snippets here..."
                    minHeight="150px"
                  />
                </div>
              </details>

              {/* SECTION 8 */}
              <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>Tomorrow</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>What should you continue, start, or improve tomorrow?</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text"
                    className="form-input" 
                    style={{ flex: 1 }}
                    value={journal.tomorrow}
                    onChange={(e) => updateJournalField('tomorrow', e.target.value)}
                    placeholder="E.g., Finish DP problem set"
                  />
                  <button className="btn btn-secondary" onClick={handleConvertToTodo} disabled={!journal.tomorrow}>
                    Convert to TODO
                  </button>
                </div>
              </div>

              {/* TAGS AND ATTACHMENTS */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={16} /> Tags
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {journal.tags?.map(tag => (
                      <span key={tag} style={{ padding: '6px 12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '100px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        #{tag}
                        <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 2px' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ width: '100%', padding: '8px 12px' }} 
                    placeholder="Add a tag and press Enter..." 
                    onKeyDown={handleAddTag}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Paperclip size={16} /> Attachments
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {journal.attachments?.map((att, i) => (
                      <div key={i} style={{ padding: '6px 12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '100%' }}>
                        <LinkIcon size={12} style={{ flexShrink: 0 }} /> 
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att}</span>
                        <button onClick={() => updateJournalField('attachments', journal.attachments.filter(a => a !== att))} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0 2px' }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => {
                    const url = prompt('Enter attachment URL (e.g. image link, file url):');
                    if (url) updateJournalField('attachments', [...(journal.attachments || []), url]);
                  }}>
                    <Plus size={14} /> Add Attachment
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: ACTIVITY === */}
        <div className="journal-col-right">
          
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Today's Activity</h2>
            </div>
            <div className="card-body">
              {sessions.length === 0 && todos.filter(t => t.completed).length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  Nothing recorded yet.<br/>Your study sessions and tasks will appear here.
                </div>
              ) : (
                <div className="journal-history-timeline">
                  {sessions.map(s => (
                    <div key={s._id} className="timeline-item" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div className="timeline-date" style={{ minWidth: '50px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {new Date(s.createdAt || s.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="timeline-content" style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Started Study Session</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{s.topic || s.learningPathId?.title} ({s.duration}m)</div>
                      </div>
                    </div>
                  ))}
                  {todos.filter(t => t.completed).map(t => (
                    <div key={t._id} className="timeline-item" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <div className="timeline-date" style={{ minWidth: '50px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="timeline-content" style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Completed TODO</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{t.title}</div>
                      </div>
                    </div>
                  ))}
                  {journal._id && (
                    <div className="timeline-item" style={{ display: 'flex', gap: '16px' }}>
                      <div className="timeline-date" style={{ minWidth: '50px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {new Date(journal.updatedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="timeline-content" style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Updated Journal</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Added reflection</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Learning Progress</h2>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Simulate learning progress from unique paths studied today */}
              {Array.from(new Set(sessions.map(s => s.learningPathId?._id))).filter(Boolean).map(pathId => {
                const path = sessions.find(s => s.learningPathId?._id === pathId).learningPathId;
                return (
                  <div key={path._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: path.color }}>{path.title}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>+{(Math.random() * 5).toFixed(1)}% today</div>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '45%', height: '100%', backgroundColor: path.color || 'var(--color-primary)' }} />
                    </div>
                  </div>
                )
              })}
              {sessions.length === 0 && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '10px 0' }}>
                  No paths interacted with today.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Recent Entries</h2>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setShowHistory(true)}>History</button>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentJournals.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', padding: '10px 0' }}>
                  Your journal history is empty.
                </div>
              ) : (
                recentJournals.map(entry => (
                  <div key={entry._id} style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setDate(new Date(entry.date).toISOString().split('T')[0])}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.title}
                    </div>
                    {(entry.whatILearned || entry.whatIDid) && (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        “{entry.whatILearned || entry.whatIDid}”
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {showHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ fontSize: '20px' }}>Journal History</h2>
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', position: 'relative', marginBottom: '24px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1, paddingLeft: '40px' }} 
                placeholder="Search journals by title, tags, or content..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyJournals.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '40px 20px' }}>
                  <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                  <p>No journal entries found.</p>
                </div>
              ) : (
                historyJournals.map(entry => (
                  <div key={entry._id} style={{ padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => { setDate(new Date(entry.date).toISOString().split('T')[0]); setShowHistory(false); }} onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'} onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                      {entry.title}
                    </div>
                    {(entry.whatILearned || entry.whatIDid || entry.notes) && (
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {entry.whatILearned || entry.whatIDid || entry.notes}
                      </div>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {entry.tags.map(tag => (
                          <span key={tag} style={{ padding: '4px 10px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
