import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, ArrowUpDown, Clock, CheckCircle,
  Target, Layers, Calendar, ChevronRight, X, Sparkles, Route, Trophy
} from 'lucide-react';
import { getLearningPaths, createLearningPath } from '../services/api';

const SUBJECTS = [
  { name: 'DSA', color: '#6C63FF' },
  { name: 'Machine Learning', color: '#22C55E' },
  { name: 'Web Development', color: '#F59E0B' },
  { name: 'Mathematics', color: '#06B6D4' },
  { name: 'System Design', color: '#EF4444' },
  { name: 'Other', color: '#8B5CF6' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function LearningPage() {
  const navigate = useNavigate();

  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // updated, title, progress

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    subject: 'DSA',
    difficulty: 'Intermediate',
    targetDate: '',
    color: '#6C63FF'
  });
  const [creating, setCreating] = useState(false);

  const fetchPaths = () => {
    setLoading(true);
    getLearningPaths()
      .then(res => {
        if (res.data?.success) {
          setPaths(res.data.data || []);
        }
      })
      .catch(err => console.error('Error loading paths:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  const handleCreatePath = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setCreating(true);

    try {
      const res = await createLearningPath(formData);
      if (res.data?.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          goal: '',
          subject: 'DSA',
          difficulty: 'Intermediate',
          targetDate: '',
          color: '#6C63FF'
        });
        navigate(`/learning/${res.data.data._id}`);
      }
    } catch (err) {
      console.error('Error creating learning path:', err);
    } finally {
      setCreating(false);
    }
  };

  // Filter & Sort
  const filteredPaths = paths.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || p.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
    return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
  });

  return (
    <div className="learning-page">
      {/* Header */}
      <div className="learning-header">
        <div>
          <div className="page-header-eyebrow">WORKSPACE → LEARNING MANAGEMENT</div>
          <h1 className="page-header-title">My Learning</h1>
          <p className="page-header-subtitle">
            Plan what you want to learn and track your progress over time.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          <span>New Learning Path</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="learning-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search learning paths..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-select-item">
            <Filter size={14} />
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {SUBJECTS.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-item">
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="updated">Recently Updated</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress">Highest Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Path Cards Grid */}
      {loading ? (
        <div className="learning-cards-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton-box" style={{ height: '220px', borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : filteredPaths.length > 0 ? (
        <div className="learning-cards-grid">
          {filteredPaths.map(path => (
            <div
              key={path._id}
              className="learning-path-card"
              style={{ '--path-accent': path.color || '#6C63FF' }}
              onClick={() => navigate(`/learning/${path._id}`)}
            >
              <div className="path-card-header">
                <div className="path-subject-badge" style={{ backgroundColor: path.color || '#6C63FF' }}>
                  {path.subject || 'General'}
                </div>
                <div className="path-difficulty-badge">
                  {path.difficulty || 'Intermediate'}
                </div>
              </div>

              <h2 className="path-card-title">{path.title}</h2>
              <p className="path-card-desc">
                {path.description || 'Structured learning path with modules and topics.'}
              </p>

              <div className="path-progress-container">
                <div className="path-progress-meta">
                  <span>Progress</span>
                  <span className="pct-val">{path.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${path.progress || 0}%`, backgroundColor: path.color || '#6C63FF' }}
                  />
                </div>
              </div>

              <div className="path-stats-row">
                <div className="path-stat">
                  <CheckCircle size={14} />
                  <span>{path.completedTopics || 0} / {path.totalTopics || 0} topics</span>
                </div>
                <div className="path-stat">
                  <Clock size={14} />
                  <span>{path.formattedStudyTime || '0h'}</span>
                </div>
              </div>

              <div className="path-card-footer">
                <div className="current-topic-info">
                  <span className="lbl">CURRENT TOPIC:</span>
                  <span className="val">{path.currentTopic || 'Dynamic Programming'}</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm continue-btn"
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/learning/${path._id}`);
                  }}
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="learning-empty-card">
          <div className="empty-icon-wrap">
            <BookOpen size={36} className="empty-icon" strokeWidth={1.75} />
          </div>
          <h3>Start your learning journey</h3>
          <p>Create a learning path and break it into modules and topics.</p>
          <div className="empty-features">
            <span className="empty-feature-chip">
              <Layers size={12} /> Modules & topics
            </span>
            <span className="empty-feature-chip">
              <Target size={12} /> Track goals
            </span>
            <span className="empty-feature-chip">
              <Trophy size={12} /> Measure progress
            </span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Learning Path</span>
          </button>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <Route size={22} strokeWidth={2} />
              </div>
              <div className="modal-header-text">
                <h2>Create Learning Path</h2>
                <p className="modal-subtitle">Design a structured roadmap to master your subject</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePath} className="modal-form">
              <div className="form-group">
                <label>Path Name <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <div className="subject-chip-grid">
                  {SUBJECTS.map(s => (
                    <button
                      type="button"
                      key={s.name}
                      className={`subject-chip ${formData.subject === s.name ? 'active' : ''}`}
                      style={{ '--chip-color': s.color }}
                      onClick={() => setFormData({ ...formData, subject: s.name, color: s.color })}
                    >
                      <span className="chip-dot" />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <div className="difficulty-segment">
                  {DIFFICULTIES.map(d => (
                    <button
                      type="button"
                      key={d}
                      className={`segment-btn ${formData.difficulty === d ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, difficulty: d })}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="What do you want to learn in this path?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Goal</label>
                <input
                  type="text"
                  placeholder="What do you want to achieve?"
                  value={formData.goal}
                  onChange={e => setFormData({ ...formData, goal: e.target.value })}
                />
                <span className="field-hint">Your main outcome for completing this path</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? (
                    <>
                      <Sparkles size={14} className="spin-once" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Create Path
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
