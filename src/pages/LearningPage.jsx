import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Filter, ArrowUpDown, Clock, CheckCircle,
  Target, Layers, Calendar, ChevronRight, X, Sparkles, Route, Trophy
} from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import { getLearningPaths, createLearningPath, getProfile } from '../services/api';
import '../index.css';

const PALETTE = ['#141413', '#E03E2D', '#2B7A78', '#5C5B56', '#D97706'];
const getSubjectColor = (name) => {
  if (!name) return '#141413';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function LearningPage() {
  const navigate = useNavigate();

  const [paths, setPaths] = useState([]);
  const [userSubjects, setUserSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    subject: '',
    difficulty: 'Intermediate',
    targetDate: '',
    color: '#141413'
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
    getProfile()
      .then(res => {
        if (res.data?.success && res.data.user?.customSubjects) {
          setUserSubjects(res.data.user.customSubjects);
        }
      })
      .catch(() => {});
  }, []);

  const allAvailableSubjects = [...new Set([
    ...userSubjects,
    ...paths.map(p => p.subject).filter(Boolean)
  ])];

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
          color: '#141413'
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
    <div className="page-container" style={{ paddingBottom: '60px' }}>
      <PageHeader 
        marker="■ TECHNICAL JOURNALS & BLOG ARCHIVE"
        title="Learning Tracks & Technical Blogs"
        subtitle="Write and maintain in-depth blogs, study journals, and engineering notes organized by track."
        actions={
          <button
            className="btn btn-primary"
            style={{ fontSize: '11px', padding: '7px 16px' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} /> NEW TRACK
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="mx-card" style={{ padding: '12px 18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search tracks, specs, algorithms..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
            <Filter size={12} />
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="form-input"
              style={{ height: '32px', padding: '0 8px', fontSize: '11px' }}
            >
              <option value="all">All Disciplines</option>
              {allAvailableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
            <ArrowUpDown size={12} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="form-input"
              style={{ height: '32px', padding: '0 8px', fontSize: '11px' }}
            >
              <option value="updated">Recently Active</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Path Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton-box" style={{ height: '220px', borderRadius: '2px' }} />
          ))}
        </div>
      ) : filteredPaths.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredPaths.map((path, idx) => {
            const blogsCount = path.totalBlogs ?? (path.blogs ? path.blogs.length : 0);
            return (
              <div
                key={path._id}
                className="mx-card"
                style={{ 
                  padding: '20px', 
                  cursor: 'pointer', 
                  borderTop: '3px solid var(--color-text-primary, #141413)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.2s, transform 0.2s'
                }}
                onClick={() => navigate(`/learning/${path._id}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="telemetry-tag" style={{ textTransform: 'uppercase' }}>
                      TRACK // 0{idx + 1} · {path.subject || 'GENERAL'}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent, #E03E2D)', fontWeight: 600 }}>
                      {path.difficulty || 'INTERMEDIATE'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text-primary, #141413)' }}>
                    {path.title}
                  </h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {path.description || 'Dedicated technical learning journal and knowledge repository.'}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary, #141413)' }}>
                        {blogsCount}
                      </span>
                      <span> {blogsCount === 1 ? 'blog article' : 'blog articles'}</span>
                    </div>
                    <span style={{ color: 'var(--color-accent, #E03E2D)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      OPEN BLOGS <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mx-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <BookOpen size={36} color="var(--color-text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #141413)' }}>No Learning Tracks Created</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '400px', margin: '4px auto 16px auto' }}>
            Create a learning track to write technical blogs, markdown notes, code snippets, and study documentation.
          </p>
          <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Create Learning Track
          </button>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 20, 19, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(2px)' }} onClick={() => setShowCreateModal(false)}>
          <div className="mx-card" style={{ width: '450px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em' }}>
                  ■ NEW TRACK INITIALIZATION
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0' }}>Dispatch Learning Track</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePath} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TRACK NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus & Raft Protocols"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>PRIMARY SUBJECT / DOMAIN</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Systems, Algorithms, Memory Models..."
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>DIFFICULTY TIER</label>
                  <select
                    className="form-input"
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{ fontSize: '12px' }}
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>TARGET HORIZON</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>SYLLABUS DESCRIPTION</label>
                <textarea
                  rows={2}
                  placeholder="Core themes, papers to read, and problem sets..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ fontSize: '12px' }}>
                  {creating ? 'Initializing...' : 'Initialize Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
