import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Clock, CheckCircle, Target, Layers, Calendar,
  ChevronRight, Play, FileText, CheckSquare, Bookmark, ArrowLeft,
  Edit, Trash2, ChevronDown, Check, AlertCircle, ExternalLink
} from 'lucide-react';
import {
  getFullLearningPath, createModule, updateModule, deleteModule,
  createTopic, updateTopic, deleteTopic, createTodo, createResource
} from '../services/api';
import { useTimer } from '../context/TimerContext';

export default function LearningPathDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startTimer } = useTimer();

  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModule, setShowAddModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  const [showAddTopic, setShowAddTopic] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');

  // Selected Topic Workspace Modal / Drawer
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicNotes, setTopicNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Quick Add Modal state (Resource or Todo attached to Topic)
  const [showAttachTodo, setShowAttachTodo] = useState(false);
  const [todoTitle, setTodoTitle] = useState('');

  const [showAttachResource, setShowAttachResource] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resType, setResType] = useState('link');

  const fetchFull = () => {
    setLoading(true);
    getFullLearningPath(id)
      .then(res => {
        if (res.data?.success) setPathData(res.data.data);
      })
      .catch(err => console.error('Error fetching full path:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFull();
  }, [id]);

  // Handle Add Module
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      const res = await createModule({
        learningPathId: id,
        title: moduleTitle,
        description: moduleDesc
      });
      if (res.data?.success) {
        setShowAddModule(false);
        setModuleTitle('');
        setModuleDesc('');
        fetchFull();
      }
    } catch (err) {
      console.error('Add module error:', err);
    }
  };

  // Handle Add Topic
  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!topicTitle.trim() || !targetModuleId) return;
    try {
      const res = await createTopic({
        learningPathId: id,
        moduleId: targetModuleId,
        title: topicTitle,
        description: topicDesc
      });
      if (res.data?.success) {
        setShowAddTopic(false);
        setTopicTitle('');
        setTopicDesc('');
        fetchFull();
      }
    } catch (err) {
      console.error('Add topic error:', err);
    }
  };

  // Toggle Topic Status (Not Started -> In Progress -> Completed)
  const handleToggleTopicStatus = async (topic, newStatus) => {
    try {
      const res = await updateTopic(topic._id, { status: newStatus });
      if (res.data?.success) {
        if (selectedTopic?._id === topic._id) {
          setSelectedTopic({ ...selectedTopic, status: newStatus });
        }
        fetchFull();
      }
    } catch (err) {
      console.error('Update topic status error:', err);
    }
  };

  // Start Study Session for Topic
  const handleStartStudySession = (topic, moduleItem) => {
    startTimer({
      subject: pathData?.title || 'General',
      learningPathId: pathData?._id,
      learningPathName: pathData?.title,
      moduleId: moduleItem?._id,
      moduleName: moduleItem?.title,
      topicId: topic?._id,
      topicName: topic?.title,
      mode: 'stopwatch'
    });
    navigate('/timer');
  };

  // Save Topic Notes
  const handleSaveTopicNotes = async () => {
    if (!selectedTopic) return;
    setSavingNotes(true);
    try {
      await updateTopic(selectedTopic._id, { notes: topicNotes });
      setSelectedTopic({ ...selectedTopic, notes: topicNotes });
      fetchFull();
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Attach TODO to Topic
  const handleAttachTodo = async (e) => {
    e.preventDefault();
    if (!todoTitle.trim() || !selectedTopic) return;
    try {
      await createTodo({
        title: todoTitle,
        learningPathId: pathData._id,
        topicId: selectedTopic._id,
        type: 'todo'
      });
      setShowAttachTodo(false);
      setTodoTitle('');
      fetchFull();
    } catch (err) {
      console.error('Attach todo error:', err);
    }
  };

  // Attach Resource to Topic
  const handleAttachResource = async (e) => {
    e.preventDefault();
    if (!resTitle.trim() || !selectedTopic) return;
    try {
      await createResource({
        title: resTitle,
        url: resUrl,
        type: resType,
        learningPathId: pathData._id,
        moduleId: selectedTopic.moduleId,
        topicId: selectedTopic._id
      });
      setShowAttachResource(false);
      setResTitle('');
      setResUrl('');
      fetchFull();
    } catch (err) {
      console.error('Attach resource error:', err);
    }
  };

  if (loading) {
    return (
      <div className="learning-detail-page">
        <div className="skeleton-box" style={{ height: '300px', borderRadius: 'var(--radius-xl)' }} />
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="learning-detail-page">
        <button className="btn btn-ghost" onClick={() => navigate('/learning')}>
          <ArrowLeft size={16} /> Back to Learning
        </button>
        <div className="empty-chart-box">
          <h3>Learning path not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-detail-page">
      {/* Top Back Navigation */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/learning')}>
        <ArrowLeft size={16} /> Back to Learning Paths
      </button>

      {/* Hero Path Banner */}
      <div className="path-detail-hero">
        <div className="path-hero-content">
          <div className="path-hero-eyebrow">
            <span className="badge" style={{ backgroundColor: pathData.color }}>{pathData.subject || 'DSA'}</span>
            <span className="badge-outline">{pathData.difficulty || 'Intermediate'}</span>
          </div>
          <h1 className="path-hero-title">{pathData.title}</h1>
          <p className="path-hero-desc">{pathData.description || 'Comprehensive learning path curriculum.'}</p>
          {pathData.goal && <div className="path-hero-goal"><Target size={14} /> Goal: {pathData.goal}</div>}
        </div>

        <div className="path-hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => handleStartStudySession(pathData.modules?.[0]?.topics?.[0], pathData.modules?.[0])}
          >
            <Play size={16} />
            <span>Continue Learning</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddModule(true)}>
            <Plus size={16} />
            <span>Add Module</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Row (6 Cards) */}
      <div className="path-summary-grid">
        <div className="summary-card">
          <span className="summary-card-title">PROGRESS</span>
          <span className="summary-card-value">{pathData.progress || 0}%</span>
          <div className="progress-bar mini">
            <div className="progress-fill" style={{ width: `${pathData.progress || 0}%`, backgroundColor: pathData.color }} />
          </div>
        </div>

        <div className="summary-card">
          <span className="summary-card-title">TOPICS</span>
          <span className="summary-card-value">{pathData.completedTopics || 0} / {pathData.totalTopics || 0}</span>
          <span className="summary-card-footer">Completed</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-title">STUDY TIME</span>
          <span className="summary-card-value">{pathData.formattedStudyTime || '0h'}</span>
          <span className="summary-card-footer">Total duration</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-title">TODOS</span>
          <span className="summary-card-value">{pathData.completedTodos || 0}</span>
          <span className="summary-card-footer">Completed tasks</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-title">RESOURCES</span>
          <span className="summary-card-value">{pathData.totalResources || 0}</span>
          <span className="summary-card-footer">Attached items</span>
        </div>

        <div className="summary-card">
          <span className="summary-card-title">CURRENT TOPIC</span>
          <span className="summary-card-value topic-highlight">{pathData.currentTopicName || 'None'}</span>
          <span className="summary-card-footer">Next focus</span>
        </div>
      </div>

      {/* Roadmap Section */}
      <div className="roadmap-section">
        <div className="section-header">
          <div>
            <h2>Learning Roadmap</h2>
            <p>Modules and topics structured sequentially</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModule(true)}>
            <Plus size={14} /> Add Module
          </button>
        </div>

        <div className="modules-roadmap-list">
          {pathData.modules?.length > 0 ? (
            pathData.modules.map((mod, modIdx) => (
              <div key={mod._id} className="module-card">
                <div className="module-header">
                  <div className="module-title-group">
                    <span className="module-order-num">{String(modIdx + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="module-title">{mod.title}</h3>
                      {mod.description && <p className="module-desc">{mod.description}</p>}
                    </div>
                  </div>

                  <div className="module-meta">
                    <span className="module-progress-badge">{mod.progress || 0}% Complete</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setTargetModuleId(mod._id);
                        setShowAddTopic(true);
                      }}
                    >
                      <Plus size={14} /> Topic
                    </button>
                  </div>
                </div>

                {/* Topics List */}
                <div className="topics-list">
                  {mod.topics?.length > 0 ? (
                    mod.topics.map((tp) => (
                      <div
                        key={tp._id}
                        className={`topic-row-item status-${tp.status}`}
                        onClick={() => {
                          setSelectedTopic(tp);
                          setTopicNotes(tp.notes || '');
                        }}
                      >
                        <div className="topic-status-icon">
                          {tp.status === 'completed' ? (
                            <CheckCircle size={18} className="icon-completed" />
                          ) : tp.status === 'in_progress' ? (
                            <div className="dot-in-progress" />
                          ) : (
                            <div className="dot-not-started" />
                          )}
                        </div>

                        <div className="topic-info-col">
                          <span className="topic-title">{tp.title}</span>
                          {tp.description && <span className="topic-desc">{tp.description}</span>}
                        </div>

                        <div className="topic-badges-col">
                          <span className="topic-meta-badge"><Clock size={12} /> {tp.formattedStudyTime}</span>
                          <span className="topic-meta-badge"><Bookmark size={12} /> {tp.resourceCount}</span>
                          <span className="topic-meta-badge"><CheckSquare size={12} /> {tp.todoCount}</span>
                        </div>

                        <button
                          className="btn btn-primary btn-sm topic-study-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartStudySession(tp, mod);
                          }}
                        >
                          <Play size={12} /> Study
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-topic-placeholder">
                      <span>No topics added yet.</span>
                      <button
                        className="btn btn-link btn-sm"
                        onClick={() => {
                          setTargetModuleId(mod._id);
                          setShowAddTopic(true);
                        }}
                      >
                        + Add first topic
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-chart-box">
              <Layers size={36} />
              <p>No modules created yet. Add your first module to build the roadmap.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModule(true)}>
                <Plus size={16} /> Add Module
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Topic Workspace Drawer / Modal */}
      {selectedTopic && (
        <div className="modal-backdrop" onClick={() => setSelectedTopic(null)}>
          <div className="topic-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-eyebrow">TOPIC WORKSPACE</span>
                <h2>{selectedTopic.title}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTopic(null)}>×</button>
            </div>

            <div className="drawer-body">
              {/* Status Actions */}
              <div className="status-selector-row">
                <span>Status:</span>
                <button
                  className={`status-btn ${selectedTopic.status === 'not_started' ? 'active' : ''}`}
                  onClick={() => handleToggleTopicStatus(selectedTopic, 'not_started')}
                >
                  Not Started
                </button>
                <button
                  className={`status-btn ${selectedTopic.status === 'in_progress' ? 'active' : ''}`}
                  onClick={() => handleToggleTopicStatus(selectedTopic, 'in_progress')}
                >
                  In Progress
                </button>
                <button
                  className={`status-btn ${selectedTopic.status === 'completed' ? 'active' : ''}`}
                  onClick={() => handleToggleTopicStatus(selectedTopic, 'completed')}
                >
                  Completed ✓
                </button>
              </div>

              {/* Main Quick Action Buttons */}
              <div className="topic-action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => handleStartStudySession(selectedTopic, pathData.modules?.find(m => String(m._id) === String(selectedTopic.moduleId)))}
                >
                  <Play size={16} /> Start Studying
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAttachResource(true)}>
                  <Bookmark size={16} /> Add Resource
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAttachTodo(true)}>
                  <CheckSquare size={16} /> Add TODO
                </button>
              </div>

              {/* Stats overview */}
              <div className="topic-stats-row">
                <div className="topic-stat-box">
                  <span className="val">{selectedTopic.formattedStudyTime}</span>
                  <span className="lbl">Study Time</span>
                </div>
                <div className="topic-stat-box">
                  <span className="val">{selectedTopic.resourceCount}</span>
                  <span className="lbl">Resources</span>
                </div>
                <div className="topic-stat-box">
                  <span className="val">{selectedTopic.todoCount}</span>
                  <span className="lbl">TODOs</span>
                </div>
              </div>

              {/* Notes Editor */}
              <div className="topic-notes-section">
                <div className="notes-header">
                  <FileText size={16} />
                  <span>Topic Notes & Key Concepts</span>
                </div>
                <textarea
                  rows="6"
                  placeholder="Write your study notes, formulas, or key insights here..."
                  value={topicNotes}
                  onChange={e => setTopicNotes(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveTopicNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModule && (
        <div className="modal-backdrop" onClick={() => setShowAddModule(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Module</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModule(false)}>×</button>
            </div>
            <form onSubmit={handleAddModule} className="modal-form">
              <div className="form-group">
                <label>Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming"
                  value={moduleTitle}
                  onChange={e => setModuleTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of this module..."
                  value={moduleDesc}
                  onChange={e => setModuleDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModule(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Module</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="modal-backdrop" onClick={() => setShowAddTopic(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Topic</h2>
              <button className="modal-close-btn" onClick={() => setShowAddTopic(false)}>×</button>
            </div>
            <form onSubmit={handleAddTopic} className="modal-form">
              <div className="form-group">
                <label>Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Memoization Patterns"
                  value={topicTitle}
                  onChange={e => setTopicTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="What is covered in this topic?"
                  value={topicDesc}
                  onChange={e => setTopicDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddTopic(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach TODO Modal */}
      {showAttachTodo && (
        <div className="modal-backdrop" onClick={() => setShowAttachTodo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add TODO to Topic</h2>
              <button className="modal-close-btn" onClick={() => setShowAttachTodo(false)}>×</button>
            </div>
            <form onSubmit={handleAttachTodo} className="modal-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve 5 DP problems on Codeforces"
                  value={todoTitle}
                  onChange={e => setTodoTitle(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAttachTodo(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add TODO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Resource Modal */}
      {showAttachResource && (
        <div className="modal-backdrop" onClick={() => setShowAttachResource(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Resource to Topic</h2>
              <button className="modal-close-btn" onClick={() => setShowAttachResource(false)}>×</button>
            </div>
            <form onSubmit={handleAttachResource} className="modal-form">
              <div className="form-group">
                <label>Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NeetCode 150 DP Course"
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={resUrl}
                  onChange={e => setResUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={resType} onChange={e => setResType(e.target.value)}>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="documentation">Documentation</option>
                  <option value="github">GitHub</option>
                  <option value="note">Personal Note</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAttachResource(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
