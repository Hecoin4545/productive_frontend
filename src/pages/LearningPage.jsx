import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, ArrowUpDown, Clock, CheckCircle,
  Target, Layers, Calendar, ChevronRight, Play, MoreVertical, Sparkles
} from 'lucide-react';
import { getLearningPaths, createLearningPath } from '../services/api';

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
    color: '#6366F1'
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
          color: '#6366F1'
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
              <option value="DSA">DSA</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Web Development">Web Development</option>
              <option value="Mathematics">Mathematics</option>
              <option value="System Design">System Design</option>
              <option value="Other">Other</option>
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
            <div key={path._id} className="learning-path-card" onClick={() => navigate(`/learning/${path._id}`)}>
              <div className="path-card-header">
                <div className="path-subject-badge" style={{ backgroundColor: path.color || '#6366F1' }}>
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
                    style={{ width: `${path.progress || 0}%`, backgroundColor: path.color || '#6366F1' }}
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
                <button className="btn btn-secondary btn-sm continue-btn">
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="learning-empty-card">
          <BookOpen size={48} className="empty-icon" />
          <h3>Start your learning journey</h3>
          <p>Create a learning path and break it into modules and topics.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Learning Path</span>
          </button>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Learning Path</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePath} className="modal-form">
              <div className="form-group">
                <label>Path Name *</label>
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
                <select
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="DSA">DSA</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="System Design">System Design</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
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
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
