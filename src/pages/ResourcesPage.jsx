import { useState, useEffect } from 'react';
import {
  FolderOpen, Plus, Search, Filter, Star, Link, Video, FileText,
  BookOpen, GitBranch, Code, ExternalLink, Bookmark, Tag, Grid, List,
  FolderPlus, Trash2, Edit, ChevronRight, Layers, Sparkles, Check,
  RefreshCw, HardDrive, CheckCircle2, X
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import {
  getResources, getResourceFolders, createResource, updateResource,
  deleteResource, markResourceOpen, createResourceFolder, getLearningPaths
} from '../services/api';
import '../index.css';

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
    if (!window.confirm('Delete this resource artifact permanently?')) return;
    try {
      await deleteResource(id);
      setResources(prev => prev.filter(r => r._id !== id));
      if (selectedResourceDetail?._id === id) setSelectedResourceDetail(null);
    } catch (err) {
      console.error('Delete resource error:', err);
    }
  };

  // Save Notes inside Drawer
  const handleSaveNotes = async () => {
    if (!selectedResourceDetail) return;
    setSavingNotes(true);
    try {
      await updateResource(selectedResourceDetail._id, { notes: drawerNotes });
      setSelectedResourceDetail(prev => ({ ...prev, notes: drawerNotes }));
      setResources(prev => prev.map(r => r._id === selectedResourceDetail._id ? { ...r, notes: drawerNotes } : r));
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Totals
  const totalResourcesCount = resources.length;
  const bookmarksCount = resources.filter(r => r.type === 'link' || r.type === 'video' || r.type === 'article').length;
  const notesCount = resources.filter(r => r.type === 'note' || r.notes).length;
  const starredCount = resources.filter(r => r.isFavorite || r.isPinned).length;

  return (
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <PageHeader 
        marker="■ ARCHIVAL BANK // REV 4 // SYNCHRONIZED WITH REPO"
        title="Knowledge Vault & Artifacts"
        subtitle="Curated research papers, canonical documentation, distributed systems schematics, and production-tested algorithms indexed for rapid cognitive retrieval."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: '11px', padding: '6px 14px', fontFamily: 'var(--font-mono)' }}
              onClick={fetchAll}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> PULL & FILTER
            </button>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '11px', padding: '6px 16px' }}
              onClick={() => setShowAddResourceModal(true)}
            >
              <Plus size={14} /> ADD RESOURCE
            </button>
          </div>
        }
      />

      {/* 4 Telemetry Cards Row matching Screenshot 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          metricCode="ARCHIVE // 01"
          title="Indexed Nodes"
          value={`${totalResourcesCount} Indexed`}
          tag="TOTAL NODES"
          targetInfo={`Across ${folders.length || 5} directories`}
        />
        <StatCard
          metricCode="SYNC // 02"
          title="Live & Synced"
          value={`${bookmarksCount} Bookmarks`}
          tag="CLOUD VERIFIED"
          tagColor="var(--color-text-secondary)"
          targetInfo="Canonical sources alive"
        />
        <StatCard
          metricCode="SYNTHESIS // 03"
          title="Revision Sets"
          value={`${notesCount} Notes`}
          tag="DOCUMENTED"
          targetInfo="Active notes & docs"
        />
        <StatCard
          metricCode="PRIORITY // 04"
          title="High-Yield Sets"
          value={`${starredCount} Starred`}
          tag="FAVORITES"
          tagColor="var(--color-accent)"
          targetInfo="Fast cognitive recall"
        />
      </div>

      {/* Search and Category Filters Bar */}
      <div className="mx-card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input 
              type="text"
              placeholder="Search [⌘K] papers, nodes, concepts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', paddingRight: '12px', height: '34px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `ALL (${resources.length})` },
            { id: 'link', label: 'PAPERS & PDF' },
            { id: 'article', label: 'WHITE PAPERS' },
            { id: 'documentation', label: 'OFFICIAL DOCS' },
            { id: 'video', label: 'LECTURES' },
            { id: 'note', label: 'CODEBASE' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              style={{
                padding: '4px 10px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                borderRadius: '3px',
                border: selectedType === t.id ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)',
                background: selectedType === t.id ? 'var(--color-text-primary)' : 'transparent',
                color: selectedType === t.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-Pane Vault Layout matching Screenshot 4 */}
      <div className="vault-layout-container">
        
        {/* Left Directory & Tag Tree Sidebar */}
        <div className="vault-sidebar-pane">
          <div className="vault-tree-card">
            
            {/* Directories Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.02em' }}>
                Folders & Folders
              </span>
              <button 
                onClick={() => setShowAddFolderModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 8px', fontSize: '11px' }}
                title="Add Directory"
              >
                <Plus size={12} /> New Folder
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              <div 
                className={`vault-folder-item ${selectedFolderId === 'all' && !showOnlyFavorites ? 'active' : ''}`}
                onClick={() => { setSelectedFolderId('all'); setShowOnlyFavorites(false); }}
              >
                <FolderOpen size={14} />
                <span className="folder-label">All Resources</span>
                <span className="folder-badge">{resources.length}</span>
              </div>

              <div 
                className={`vault-folder-item ${showOnlyFavorites ? 'active' : ''}`}
                onClick={() => { setShowOnlyFavorites(true); setSelectedFolderId('all'); }}
              >
                <Star size={14} style={{ color: 'var(--color-accent)' }} />
                <span className="folder-label">Favorites & Starred</span>
                <span className="folder-badge">{starredCount}</span>
              </div>

              {folders.map(f => (
                <div 
                  key={f._id}
                  className={`vault-folder-item ${selectedFolderId === f._id ? 'active' : ''}`}
                  onClick={() => { setSelectedFolderId(f._id); setShowOnlyFavorites(false); }}
                >
                  <FolderOpen size={14} />
                  <span className="folder-label">{f.name}</span>
                  <span className="folder-badge">{f.resourceCount || 0}</span>
                </div>
              ))}
            </div>

            {/* Storage Quota */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                <span>STORAGE ALLOCATION</span>
                <span>56.8% USED</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '1px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: '56.8%', height: '100%', background: 'var(--color-text-primary)' }}></div>
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                14.2 GB / 25.0 GB Cloud Sync
              </div>
            </div>

          </div>
        </div>

        {/* Right Artifacts Grid */}
        <div className="vault-canvas-pane">
          {loading ? (
            <div className="vault-cards-grid">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="skeleton-box" style={{ height: '220px', borderRadius: '2px' }} />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="mx-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <HardDrive size={36} color="var(--color-text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>No Archival Artifacts Found</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '4px auto 16px auto' }}>
                Index research papers, technical monographs, API specs, and deep work cheatsheets.
              </p>
              <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => setShowAddResourceModal(true)}>
                <Plus size={14} /> Add First Resource
              </button>
            </div>
          ) : (
            <div className="vault-cards-grid">
              {resources.map((r, idx) => {
                const domainLabel = r.type === 'note' ? 'INTERNAL NOTE' : (r.domain || r.type || 'RESEARCH SPEC').toUpperCase();
                return (
                  <div 
                    key={r._id} 
                    className="vault-artifact-card"
                    onClick={() => { setSelectedResourceDetail(r); setDrawerNotes(r.notes || ''); }}
                  >
                    <div className="artifact-top-meta">
                      <span className="artifact-eyebrow">
                        ■ {domainLabel}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                          REV {idx + 1}
                        </span>
                        <button 
                          onClick={(e) => handleToggleFavorite(r, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.isFavorite ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}
                          title="Bookmark / Star"
                        >
                          <Star size={13} fill={r.isFavorite ? 'var(--color-accent)' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <h4 className="artifact-title">
                      {r.title}
                    </h4>

                    <p className="artifact-desc">
                      {r.description || 'Deep technical specification indexed for rapid cognitive retrieval in high-focus mode.'}
                    </p>

                    {/* Tag or Code Spec Snippet */}
                    <div className="artifact-tag-box">
                      <span className="artifact-tag-pill">
                        {r.tags?.[0] ? `INDEX // ${r.tags[0].toUpperCase()}` : 'TXID_CANONICAL == TRUE'}
                      </span>
                    </div>

                    <div className="artifact-footer">
                      <div style={{ display: 'flex', gap: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                        <span>{r.notes ? 'HAS NOTES' : 'VERIFIED'}</span>
                        <span>·</span>
                        <span>{r.type.toUpperCase()}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {r.url && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '3px 8px', fontSize: '10px' }}
                            onClick={(e) => handleOpenResource(r, e)}
                            title="Open external source"
                          >
                            <ExternalLink size={11} /> Open
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '3px 6px', fontSize: '10px', color: 'var(--color-accent)' }}
                          onClick={(e) => handleDeleteResource(r._id, e)}
                          title="Delete artifact"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Resource Detail Drawer */}
      {selectedResourceDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', justifyContent: 'flex-end', zIndex: 1100, backdropFilter: 'blur(2px)' }} onClick={() => setSelectedResourceDetail(null)}>
          <div style={{ width: '480px', height: '100%', background: '#FFFFFF', borderLeft: '1px solid var(--color-border)', padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
                  ■ ARTIFACT INSPECTOR // {selectedResourceDetail.type.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
                  {selectedResourceDetail.title}
                </h3>
              </div>
              <button onClick={() => setSelectedResourceDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              {selectedResourceDetail.description || 'No description provided.'}
            </p>

            {selectedResourceDetail.url && (
              <div style={{ marginBottom: '20px' }}>
                <a 
                  href={selectedResourceDetail.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <ExternalLink size={13} /> Open Canonical Link
                </a>
              </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                SYNTHESIS & RETRIEVAL NOTES
              </label>
              <textarea 
                className="form-input" 
                style={{ flex: 1, minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, resize: 'vertical' }}
                value={drawerNotes}
                onChange={e => setDrawerNotes(e.target.value)}
                placeholder="Write markdown notes, code snippets, or key takeaways from this artifact..."
              />
              <button 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', fontSize: '12px', padding: '7px 18px' }}
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }}>
          <div className="mx-card" style={{ width: '450px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
                  ■ NEW ARTIFACT REGISTRATION
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
                  Register Resource Artifact
                </h3>
              </div>
              <button onClick={() => setShowAddResourceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TITLE</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={resForm.title} 
                  onChange={e => setResForm({...resForm, title: e.target.value})} 
                  placeholder="e.g. Designing Data-Intensive Applications" 
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>CANONICAL URL</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={resForm.url} 
                  onChange={e => setResForm({...resForm, url: e.target.value})} 
                  placeholder="https://..." 
                  style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TYPE</label>
                  <select 
                    className="form-input" 
                    value={resForm.type} 
                    onChange={e => setResForm({...resForm, type: e.target.value})}
                    style={{ fontSize: '12px' }}
                  >
                    <option value="link">Link / Paper</option>
                    <option value="article">Article / Spec</option>
                    <option value="documentation">Official Docs</option>
                    <option value="video">Lecture / Media</option>
                    <option value="note">Internal Note</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>DIRECTORY</label>
                  <select 
                    className="form-input" 
                    value={resForm.folderId} 
                    onChange={e => setResForm({...resForm, folderId: e.target.value})}
                    style={{ fontSize: '12px' }}
                  >
                    <option value="">Root Vault</option>
                    {folders.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>ABSTRACT / DESCRIPTION</label>
                <textarea 
                  className="form-input" 
                  rows={2} 
                  value={resForm.description} 
                  onChange={e => setResForm({...resForm, description: e.target.value})} 
                  placeholder="Brief synopsis for quick retrieval..."
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddResourceModal(false)} style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingRes} style={{ fontSize: '12px' }}>
                  {creatingRes ? 'Registering...' : 'Register Artifact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }}>
          <div className="mx-card" style={{ width: '380px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>■ NEW DIRECTORY</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '2px 0 0 0' }}>Create Folder</h3>
              </div>
              <button onClick={() => setShowAddFolderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>DIRECTORY NAME</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={folderName} 
                  onChange={e => setFolderName(e.target.value)} 
                  placeholder="e.g. Distributed Systems" 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFolderModal(false)} style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingFolder} style={{ fontSize: '12px' }}>
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
