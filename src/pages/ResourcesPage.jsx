import { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, Search, Filter, Star, Link, Video, FileText,
  BookOpen, GitBranch, Code, ExternalLink, Bookmark, Tag, Grid, List,
  FolderPlus, Trash2, Edit, ChevronRight, Layers, Sparkles, Check
} from 'lucide-react';
import {
  getResources, getResourceFolders, createResource, updateResource,
  deleteResource, markResourceOpen, createResourceFolder, getLearningPaths
} from '../services/api';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // Modals state
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [selectedResourceDetail, setSelectedResourceDetail] = useState(null);

  // Resource Form Data
  const [resForm, setResForm] = useState({
    title: '',
    url: '',
    type: 'link',
    folderId: '',
    learningPathId: '',
    tags: '',
    description: '',
    notes: '',
    isFavorite: false,
    isPinned: false
  });
  const [creatingRes, setCreatingRes] = useState(false);

  // Folder Form Data
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Notes editing state inside detail drawer
  const [drawerNotes, setDrawerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      getResources({ folderId: selectedFolderId, type: selectedType, favorite: showOnlyFavorites, learningPathId: selectedPathId, search: searchQuery }),
      getResourceFolders(),
      getLearningPaths()
    ])
      .then(([resData, folderData, pathData]) => {
        if (resData.data?.success) setResources(resData.data.data || []);
        if (folderData.data?.success) setFolders(folderData.data.data || []);
        if (pathData.data?.success) setLearningPaths(pathData.data.data || []);
      })
      .catch(err => console.error('Error fetching resources data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, [selectedFolderId, selectedType, showOnlyFavorites, selectedPathId, searchQuery]);

  // Create Resource
  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!resForm.title.trim()) return;
    setCreatingRes(true);

    try {
      const res = await createResource({
        ...resForm,
        folderId: resForm.folderId || null,
        learningPathId: resForm.learningPathId || null
      });

      if (res.data?.success) {
        setShowAddResourceModal(false);
        setResForm({
          title: '',
          url: '',
          type: 'link',
          folderId: '',
          learningPathId: '',
          tags: '',
          description: '',
          notes: '',
          isFavorite: false,
          isPinned: false
        });
        fetchAll();
      }
    } catch (err) {
      console.error('Error creating resource:', err);
    } finally {
      setCreatingRes(false);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setCreatingFolder(true);

    try {
      const res = await createResourceFolder({
        name: folderName,
        parentFolderId: parentFolderId || null
      });

      if (res.data?.success) {
        setShowAddFolderModal(false);
        setFolderName('');
        setParentFolderId('');
        fetchAll();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (resource, e) => {
    e?.stopPropagation();
    try {
      const updated = !resource.isFavorite;
      await updateResource(resource._id, { isFavorite: updated });
      setResources(prev => prev.map(r => r._id === resource._id ? { ...r, isFavorite: updated } : r));
      if (selectedResourceDetail?._id === resource._id) {
        setSelectedResourceDetail({ ...selectedResourceDetail, isFavorite: updated });
      }
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  // Open Resource URL and mark last opened
  const handleOpenResource = async (resource, e) => {
    e?.stopPropagation();
    if (resource.url) {
      window.open(resource.url, '_blank');
      try {
        await markResourceOpen(resource._id);
      } catch (err) {
        console.error('Mark resource open error:', err);
      }
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(id);
      if (selectedResourceDetail?._id === id) setSelectedResourceDetail(null);
      fetchAll();
    } catch (err) {
      console.error('Delete resource error:', err);
    }
  };

  // Save Personal Notes in Detail Drawer
  const handleSaveNotes = async () => {
    if (!selectedResourceDetail) return;
    setSavingNotes(true);
    try {
      await updateResource(selectedResourceDetail._id, { notes: drawerNotes });
      setSelectedResourceDetail({ ...selectedResourceDetail, notes: drawerNotes });
      fetchAll();
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Type Icon Helper
  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video size={16} className="type-icon video" />;
      case 'github': return <GitBranch size={16} className="type-icon github" />;
      case 'documentation': return <Code size={16} className="type-icon docs" />;
      case 'article': return <FileText size={16} className="type-icon article" />;
      case 'book': return <BookOpen size={16} className="type-icon book" />;
      case 'note': return <Bookmark size={16} className="type-icon note" />;
      default: return <Link size={16} className="type-icon link" />;
    }
  };

  // Filtered Pinned Resources
  const pinnedResources = resources.filter(r => r.isPinned || r.isFavorite);

  // Totals for Dashboard
  const totalResourcesCount = resources.length;
  const bookmarksCount = resources.filter(r => r.type === 'link' || r.type === 'video' || r.type === 'article').length;
  const notesCount = resources.filter(r => r.type === 'note' || r.notes).length;
  const starredCount = resources.filter(r => r.isFavorite || r.isPinned).length;

  return (
    <div className="resources-page">
      {/* Page Header */}
      <div className="resources-header">
        <div>
          <div className="page-header-eyebrow">PERSONAL OS / KNOWLEDGE VAULT</div>
          <h1 className="page-header-title">Resources</h1>
          <p className="page-header-subtitle">
            Everything you need, curated and structured your way.
          </p>
        </div>

        <div className="resources-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddFolderModal(true)}>
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddResourceModal(true)}>
            <Plus size={16} />
            <span>New Resource</span>
          </button>
        </div>
      </div>

      {/* Top 4 Dashboard Cards (Matching Screenshot!) */}
      <div className="resources-dash-grid">
        <div className="res-dash-card">
          <div className="res-dash-header">
            <span className="res-dash-title">TOTAL RESOURCES</span>
            <FolderOpen size={16} className="res-dash-icon" />
          </div>
          <div className="res-dash-val">{totalResourcesCount} <span className="sub">Saved</span></div>
          <span className="res-dash-footer">Across {folders.length} directories</span>
        </div>

        <div className="res-dash-card">
          <div className="res-dash-header">
            <span className="res-dash-title">BOOKMARKS & URLS</span>
            <Link size={16} className="res-dash-icon" />
          </div>
          <div className="res-dash-val">{bookmarksCount} <span className="sub">User Links</span></div>
          <span className="res-dash-footer">● All healthy</span>
        </div>

        <div className="res-dash-card">
          <div className="res-dash-header">
            <span className="res-dash-title">RICH NOTES & DOCS</span>
            <FileText size={16} className="res-dash-icon" />
          </div>
          <div className="res-dash-val">{notesCount} <span className="sub">Written Topics</span></div>
          <span className="res-dash-footer">3 created this week</span>
        </div>

        <div className="res-dash-card">
          <div className="res-dash-header">
            <span className="res-dash-title">STARRED HIGHLIGHTS</span>
            <Star size={16} className="res-dash-icon starred" />
          </div>
          <div className="res-dash-val">{starredCount} <span className="sub">Pinned</span></div>
          <span className="res-dash-footer">Quick access enabled</span>
        </div>
      </div>

      {/* Main Layout: Sidebar Directories + Resource Canvas */}
      <div className="resources-main-layout">
        {/* Left Directories & Type Filters Sidebar */}
        <div className="resources-sidebar">
          {/* Folders List */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>DIRECTORIES</span>
              <button className="icon-btn-sm" onClick={() => setShowAddFolderModal(true)} title="Add Folder">
                <Plus size={14} />
              </button>
            </div>

            <div className="folder-tree-list">
              <div
                className={`folder-item ${selectedFolderId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFolderId('all')}
              >
                <FolderOpen size={14} />
                <span className="folder-name">All Resources</span>
                <span className="folder-count">{resources.length}</span>
              </div>

              <div
                className={`folder-item ${showOnlyFavorites ? 'active' : ''}`}
                onClick={() => { setShowOnlyFavorites(!showOnlyFavorites); setSelectedFolderId('all'); }}
              >
                <Star size={14} className="star-icon" />
                <span className="folder-name">Starred & Favorites</span>
                <span className="folder-count">{starredCount}</span>
              </div>

              {folders.map(f => (
                <div
                  key={f._id}
                  className={`folder-item ${selectedFolderId === f._id ? 'active' : ''}`}
                  onClick={() => { setSelectedFolderId(f._id); setShowOnlyFavorites(false); }}
                >
                  <FolderOpen size={14} style={{ color: f.color }} />
                  <span className="folder-name">{f.name}</span>
                  <span className="folder-count">{f.resourceCount || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Types List */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>RESOURCE TYPE</span>
            </div>

            <div className="type-filter-list">
              {[
                { id: 'all', label: 'All Types' },
                { id: 'link', label: 'Links' },
                { id: 'video', label: 'Videos' },
                { id: 'article', label: 'Articles' },
                { id: 'documentation', label: 'Docs' },
                { id: 'github', label: 'GitHub' },
                { id: 'note', label: 'Notes' },
                { id: 'file', label: 'Files' }
              ].map(t => (
                <button
                  key={t.id}
                  className={`type-pill ${selectedType === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curriculum Binding Info Box */}
          <div className="curriculum-binding-box">
            <div className="binding-header">
              <Layers size={14} />
              <span>Curriculum Binding</span>
            </div>
            <p>Attach resources to your learning paths and daily study focus.</p>
            <div className="progress-bar mini">
              <div className="progress-fill" style={{ width: '72%' }} />
            </div>
          </div>
        </div>

        {/* Right Canvas: Search Bar + Pinned Access + Resources List */}
        <div className="resources-canvas">
          {/* Top Search & Display Controls Bar */}
          <div className="canvas-controls-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search resources by title, notes, papers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="view-mode-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Pinned & Frequent Access Section */}
          {pinnedResources.length > 0 && selectedFolderId === 'all' && !searchQuery && (
            <div className="pinned-resources-section">
              <div className="section-title-row">
                <span className="section-title">⭐ Pinned & Frequent Access</span>
                <span className="section-subtitle">{pinnedResources.length} highlights</span>
              </div>

              <div className="pinned-grid">
                {pinnedResources.slice(0, 3).map(r => (
                  <div
                    key={r._id}
                    className="pinned-card"
                    onClick={() => { setSelectedResourceDetail(r); setDrawerNotes(r.notes || ''); }}
                  >
                    <div className="pinned-card-header">
                      <div className="pinned-type">
                        {getTypeIcon(r.type)}
                        <span>{r.domain || r.type}</span>
                      </div>
                      <Star
                        size={14}
                        className={`star-btn ${r.isFavorite ? 'active' : ''}`}
                        onClick={e => handleToggleFavorite(r, e)}
                      />
                    </div>
                    <h4 className="pinned-title">{r.title}</h4>
                    <p className="pinned-desc">{r.description || 'Quick reference material.'}</p>
                    <div className="pinned-tags">
                      {r.tags?.map((t, idx) => (
                        <span key={idx} className="tag">#{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Resources List */}
          <div className="resources-list-section">
            <div className="section-title-row">
              <span className="section-title">Resource Library</span>
              <span className="section-subtitle">Showing {resources.length} items</span>
            </div>

            {loading ? (
              <div className="resources-grid">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="skeleton-box" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : resources.length > 0 ? (
              <div className={`resources-${viewMode}-layout`}>
                {resources.map(r => (
                  <div
                    key={r._id}
                    className="resource-item-card"
                    onClick={() => { setSelectedResourceDetail(r); setDrawerNotes(r.notes || ''); }}
                  >
                    <div className="res-card-top">
                      <div className="res-type-badge">
                        {getTypeIcon(r.type)}
                        <span>{r.domain || r.type}</span>
                      </div>
                      <div className="res-card-actions">
                        <Star
                          size={16}
                          className={`star-btn ${r.isFavorite ? 'active' : ''}`}
                          onClick={e => handleToggleFavorite(r, e)}
                        />
                        <Trash2
                          size={14}
                          className="delete-btn"
                          onClick={e => handleDeleteResource(r._id, e)}
                        />
                      </div>
                    </div>

                    <h3 className="res-card-title">{r.title}</h3>
                    <p className="res-card-desc">{r.description || 'Saved resource item.'}</p>

                    {r.tags?.length > 0 && (
                      <div className="res-card-tags">
                        {r.tags.map((t, idx) => (
                          <span key={idx} className="tag">#{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="res-card-footer">
                      {r.learningPathId && (
                        <span className="linked-path-badge">
                          Linked to {r.learningPathId.title || 'Learning'}
                        </span>
                      )}
                      {r.url && (
                        <button
                          className="btn btn-secondary btn-sm open-url-btn"
                          onClick={e => handleOpenResource(r, e)}
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart-box">
                <Bookmark size={36} />
                <p>Build your resource library by saving courses, articles, videos, and notes.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddResourceModal(true)}>
                  <Plus size={16} /> Add Resource
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Resource Detail Drawer / Reader */}
      {selectedResourceDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedResourceDetail(null)}>
          <div className="topic-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-group">
                <div className="res-type-badge">
                  {getTypeIcon(selectedResourceDetail.type)}
                  <span>{selectedResourceDetail.type}</span>
                </div>
                <h2>{selectedResourceDetail.title}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedResourceDetail(null)}>×</button>
            </div>

            <div className="drawer-body">
              {selectedResourceDetail.url && (
                <div className="resource-url-box">
                  <span>Source URL:</span>
                  <a href={selectedResourceDetail.url} target="_blank" rel="noreferrer">
                    {selectedResourceDetail.url} <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedResourceDetail.description && (
                <div className="drawer-desc">
                  <p>{selectedResourceDetail.description}</p>
                </div>
              )}

              {/* Linked Curriculum Context */}
              {selectedResourceDetail.learningPathId && (
                <div className="linked-topic-box">
                  <Layers size={14} />
                  <span>Linked to: {selectedResourceDetail.learningPathId.title} {selectedResourceDetail.topicId?.title ? `→ ${selectedResourceDetail.topicId.title}` : ''}</span>
                </div>
              )}

              {/* Personal Notes Field */}
              <div className="topic-notes-section">
                <div className="notes-header">
                  <FileText size={16} />
                  <span>Personal Resource Notes</span>
                </div>
                <textarea
                  rows="6"
                  placeholder="Add your personal notes or timestamps for this resource..."
                  value={drawerNotes}
                  onChange={e => setDrawerNotes(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="modal-backdrop" onClick={() => setShowAddResourceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Resource</h2>
              <button className="modal-close-btn" onClick={() => setShowAddResourceModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateResource} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming Patterns"
                  value={resForm.title}
                  onChange={e => setResForm({ ...resForm, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={resForm.type}
                    onChange={e => setResForm({ ...resForm, type: e.target.value })}
                  >
                    <option value="link">Link</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="documentation">Documentation</option>
                    <option value="github">GitHub</option>
                    <option value="book">Book</option>
                    <option value="note">Personal Note</option>
                    <option value="file">File</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Folder</label>
                  <select
                    value={resForm.folderId}
                    onChange={e => setResForm({ ...resForm, folderId: e.target.value })}
                  >
                    <option value="">Unorganized</option>
                    {folders.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={resForm.url}
                  onChange={e => setResForm({ ...resForm, url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Learning Path (Optional)</label>
                <select
                  value={resForm.learningPathId}
                  onChange={e => setResForm({ ...resForm, learningPathId: e.target.value })}
                >
                  <option value="">None</option>
                  {learningPaths.map(lp => (
                    <option key={lp._id} value={lp._id}>{lp.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. DSA, DP, Interview"
                  value={resForm.tags}
                  onChange={e => setResForm({ ...resForm, tags: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of resource content..."
                  value={resForm.description}
                  onChange={e => setResForm({ ...resForm, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddResourceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingRes}>
                  {creatingRes ? 'Saving...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div className="modal-backdrop" onClick={() => setShowAddFolderModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Folder</h2>
              <button className="modal-close-btn" onClick={() => setShowAddFolderModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateFolder} className="modal-form">
              <div className="form-group">
                <label>Folder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DSA / Dynamic Programming"
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddFolderModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingFolder}>
                  {creatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
