import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, Calendar, Tag, FileText, Sparkles, CheckCircle2
} from 'lucide-react';
import { getFullLearningPath } from '../services/api';
import LearningPathBlogs from '../components/LearningPathBlogs';
import '../index.css';

export default function LearningPathDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blogCount, setBlogCount] = useState(0);

  const fetchFull = () => {
    setLoading(true);
    getFullLearningPath(id)
      .then(res => {
        if (res.data?.success) {
          setPathData(res.data.data);
          setBlogCount(res.data.data.totalBlogs || res.data.data.blogs?.length || 0);
        }
      })
      .catch(err => console.error('Error fetching full path:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFull();
  }, [id]);

  if (loading) {
    return (
      <div className="learning-detail-page page-container" style={{ paddingBottom: '60px' }}>
        <div className="skeleton-box" style={{ height: '220px', borderRadius: '4px', marginBottom: '24px' }} />
        <div className="skeleton-box" style={{ height: '400px', borderRadius: '4px' }} />
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="learning-detail-page page-container" style={{ paddingBottom: '60px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/learning')}
          style={{ marginBottom: '20px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
        >
          <ArrowLeft size={14} /> BACK TO LEARNING PATHS
        </button>
        <div className="mx-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #141413)' }}>Learning path not found</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>The requested learning path does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-detail-page page-container" style={{ paddingBottom: '60px' }}>
      {/* Top Back Navigation Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/learning')}
          style={{ fontSize: '11px', padding: '6px 14px', fontFamily: 'var(--font-mono)' }}
        >
          <ArrowLeft size={13} /> BACK TO LEARNING TRACKS
        </button>

        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
          TRACK ID // {pathData._id?.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Path Header Banner */}
      <div 
        className="mx-card" 
        style={{ 
          marginBottom: '24px', 
          padding: '24px 28px',
          borderLeft: `4px solid ${pathData.color || 'var(--color-text-primary, #141413)'}`,
          background: 'var(--color-surface, #FFFFFF)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span 
              className="telemetry-tag"
              style={{ 
                background: pathData.color ? `${pathData.color}15` : 'rgba(20,20,19,0.06)',
                color: pathData.color || 'var(--color-text-primary, #141413)',
                borderColor: pathData.color || 'var(--color-border)',
                fontWeight: 700
              }}
            >
              ● {pathData.subject || 'GENERAL'}
            </span>
            <span className="telemetry-tag">
              {pathData.difficulty || 'INTERMEDIATE'}
            </span>
            {pathData.targetDate && (
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Target: {new Date(pathData.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-subtle, #F4F2EB)', padding: '4px 10px', borderRadius: '3px', border: '1px solid var(--color-border)' }}>
              <strong>{blogCount}</strong> {blogCount === 1 ? 'ARTICLE' : 'ARTICLES'} PUBLISHED
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--color-text-primary, #141413)', letterSpacing: '-0.02em' }}>
          {pathData.title}
        </h1>

        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: '850px' }}>
          {pathData.description || 'Dedicated technical learning journal and knowledge repository. Document algorithms, concepts, code snippets, and research insights.'}
        </p>
      </div>

      {/* Dedicated Blogs & Technical Writing Section */}
      <LearningPathBlogs
        learningPathId={pathData._id}
        learningPathTitle={pathData.title}
        initialBlogs={pathData.blogs || []}
        onBlogCountChange={setBlogCount}
      />
    </div>
  );
}
