import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen, Edit3, Trash2, Plus, ArrowLeft, Clock, Calendar,
  Share2, Eye, Tag, Search, Check, Copy, Sparkles, BookMarked,
  Bold, Italic, Heading1, Heading2, Quote, Code, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Minus
} from 'lucide-react';
import {
  getPathBlogs, createPathBlog, updatePathBlog, deletePathBlog
} from '../services/api';
import { useAuth } from '../context/AuthContext';

// Helper to format date
const formatBlogDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Simple Markdown Renderer
function MarkdownViewer({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard?.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) {
    return <p className="medium-empty-text">No content written yet.</p>;
  }

  // Parse lines into blocks
  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let keyIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code Block: ```lang
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3);
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const fullCode = codeLines.join('\n');
      const blockId = keyIndex++;
      elements.push(
        <div key={blockId} className="medium-code-block">
          <div className="medium-code-header">
            <span>{lang || 'code'}</span>
            <button
              type="button"
              className="medium-code-copy"
              onClick={() => handleCopyCode(fullCode, blockId)}
            >
              {copiedIndex === blockId ? (
                <>
                  <Check size={13} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy code
                </>
              )}
            </button>
          </div>
          <pre><code>{fullCode}</code></pre>
        </div>
      );
      continue;
    }

    // Heading 1: # Title
    if (line.startsWith('# ')) {
      elements.push(<h2 key={keyIndex++} className="medium-h1">{line.slice(2)}</h2>);
      i++;
      continue;
    }

    // Heading 2: ## Title
    if (line.startsWith('## ')) {
      elements.push(<h3 key={keyIndex++} className="medium-h2">{line.slice(3)}</h3>);
      i++;
      continue;
    }

    // Heading 3: ### Title
    if (line.startsWith('### ')) {
      elements.push(<h4 key={keyIndex++} className="medium-h3">{line.slice(4)}</h4>);
      i++;
      continue;
    }

    // Blockquote: > Quote
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={keyIndex++} className="medium-blockquote">
          {quoteLines.join(' ')}
        </blockquote>
      );
      continue;
    }

    // Divider: --- or ***
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={keyIndex++} className="medium-divider" />);
      i++;
      continue;
    }

    // Bullet List: - item or * item
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || lines[i].startsWith('• '))) {
        items.push(lines[i].replace(/^[-*•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={keyIndex++} className="medium-ul">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List: 1. item
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={keyIndex++} className="medium-ol">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={keyIndex++} className="medium-paragraph">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="medium-article-content">{elements}</div>;
}

// Inline formatting parser (bold, italic, inline code, link)
function renderInline(text) {
  if (!text) return '';
  // Basic split regex for **bold**, *italic*, `code`, [text](url)
  const parts = [];
  let remaining = text;
  let idx = 0;

  // Replace links, code, bold, italic
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/;

  while (remaining) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      parts.push(<span key={idx++}>{remaining}</span>);
      break;
    }

    const start = match.index;
    if (start > 0) {
      parts.push(<span key={idx++}>{remaining.slice(0, start)}</span>);
    }

    const raw = match[0];
    if (raw.startsWith('**') && raw.endsWith('**')) {
      parts.push(<strong key={idx++}>{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      parts.push(<em key={idx++}>{raw.slice(1, -1)}</em>);
    } else if (raw.startsWith('`') && raw.endsWith('`')) {
      parts.push(<code key={idx++} className="medium-inline-code">{raw.slice(1, -1)}</code>);
    } else if (raw.startsWith('[') && raw.includes('](') && raw.endsWith(')')) {
      const closeBracket = raw.indexOf('](');
      const label = raw.slice(1, closeBracket);
      const url = raw.slice(closeBracket + 2, -1);
      parts.push(
        <a key={idx++} href={url} target="_blank" rel="noopener noreferrer" className="medium-inline-link">
          {label}
        </a>
      );
    } else {
      parts.push(<span key={idx++}>{raw}</span>);
    }

    remaining = remaining.slice(start + raw.length);
  }

  return parts;
}

export default function LearningPathBlogs({
  learningPathId,
  learningPathTitle,
  initialBlogs = [],
  onBlogCountChange
}) {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'write' | 'read'
  const [activeBlog, setActiveBlog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  // Editor form state
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const textareaRef = useRef(null);

  // Sync initialBlogs if provided
  useEffect(() => {
    if (initialBlogs && initialBlogs.length > 0) {
      setBlogs(initialBlogs);
    } else if (learningPathId) {
      loadBlogs();
    }
  }, [learningPathId]);

  const loadBlogs = async () => {
    if (!learningPathId) return;
    setLoading(true);
    try {
      const res = await getPathBlogs(learningPathId);
      if (res.data?.success) {
        const list = res.data.data || [];
        setBlogs(list);
        if (onBlogCountChange) onBlogCountChange(list.length);
      }
    } catch (err) {
      console.error('Failed to load blogs for learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  // Switch to Create Mode
  const handleStartNewBlog = () => {
    setEditId(null);
    setTitle('');
    setSubtitle('');
    setContent(
      `## Overview\nExplain what you learned in this topic or algorithm breakdown in your own words.\n\n### Key Concepts\n- Concept 1\n- Concept 2\n\n### Code Implementation\n\`\`\`javascript\nfunction solveProblem() {\n  // Implementation here\n}\n\`\`\`\n\n### Complexity & Takeaways\n> Summary reflection on efficiency and key patterns.`
    );
    setTags([learningPathTitle || 'Notes']);
    setTagInput('');
    setCoverImage('');
    setIsPreview(false);
    setErrorMsg('');
    setView('write');
  };

  // Switch to Edit Mode
  const handleEditBlog = (blog) => {
    setEditId(blog._id);
    setTitle(blog.title || '');
    setSubtitle(blog.subtitle || '');
    setContent(blog.content || '');
    setTags(blog.tags || []);
    setTagInput('');
    setCoverImage(blog.coverImage || '');
    setIsPreview(false);
    setErrorMsg('');
    setView('write');
  };

  // Switch to Read Mode
  const handleOpenBlog = (blog) => {
    setActiveBlog(blog);
    setView('read');
  };

  // Handle Save (Create or Update)
  const handleSaveBlog = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a title for your story.');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content,
        tags,
        coverImage,
        published: true
      };

      if (editId) {
        const res = await updatePathBlog(learningPathId, editId, payload);
        if (res.data?.success) {
          const updated = res.data.data;
          setBlogs(prev => prev.map(b => (b._id === editId ? updated : b)));
          setActiveBlog(updated);
          setView('read');
        }
      } else {
        const res = await createPathBlog(learningPathId, payload);
        if (res.data?.success) {
          const created = res.data.data;
          const updatedList = [created, ...blogs];
          setBlogs(updatedList);
          if (onBlogCountChange) onBlogCountChange(updatedList.length);
          setActiveBlog(created);
          setView('read');
        }
      }
    } catch (err) {
      console.error('Failed to save blog:', err);
      setErrorMsg('Error saving story. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      const res = await deletePathBlog(learningPathId, blogId);
      if (res.data?.success) {
        const remaining = blogs.filter(b => b._id !== blogId);
        setBlogs(remaining);
        if (onBlogCountChange) onBlogCountChange(remaining.length);
        if (activeBlog?._id === blogId) {
          setActiveBlog(null);
          setView('list');
        }
      }
    } catch (err) {
      console.error('Failed to delete blog:', err);
    }
  };

  // Add tag
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^,|,$/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Formatting buttons for Editor
  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const addLinePrefix = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const lines = selectedText ? selectedText.split('\n') : [''];
    const prefixed = lines.map(line => `${prefix}${line}`).join('\n');
    const newContent = content.substring(0, start) + prefixed + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefixed.length, start + prefixed.length);
    }, 0);
  };

  // Word count & read time in editor
  const wordCount = useMemo(() => {
    return (content || '').trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readTimeMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // Tag filter options in list view
  const allUniqueTags = useMemo(() => {
    const set = new Set();
    blogs.forEach(b => (b.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [blogs]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter(b => {
      const matchSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.content && b.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchTag = selectedTag === 'all' || (b.tags && b.tags.includes(selectedTag));
      return matchSearch && matchTag;
    });
  }, [blogs, searchQuery, selectedTag]);

  // ─────────────────────────────────────────────────────────────
  // 1. WRITE / EDIT VIEW (MEDIUM STYLE)
  // ─────────────────────────────────────────────────────────────
  if (view === 'write') {
    return (
      <div className="medium-editor-container fade-in">
        {/* Editor Top Navigation Bar */}
        <div className="medium-editor-navbar">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (activeBlog) setView('read');
              else setView('list');
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="medium-editor-nav-info">
            <span className="medium-editor-stats">
              {wordCount} words • ~{readTimeMinutes} min read
            </span>
            <button
              type="button"
              className={`btn btn-sm ${isPreview ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye size={14} />
              <span>{isPreview ? 'Back to Editor' : 'Live Preview'}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm medium-publish-btn"
              onClick={handleSaveBlog}
              disabled={isSaving}
            >
              <Sparkles size={14} />
              <span>{isSaving ? 'Publishing...' : editId ? 'Save Changes' : 'Publish Story'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="medium-error-banner">
            {errorMsg}
          </div>
        )}

        {/* Live Preview Mode */}
        {isPreview ? (
          <div className="medium-preview-wrapper">
            <div className="medium-preview-badge">Article Preview</div>
            <h1 className="medium-read-title">{title || 'Untitled Story'}</h1>
            {subtitle && <p className="medium-read-subtitle">{subtitle}</p>}
            <div className="medium-author-header">
              <div className="medium-author-avatar">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="medium-author-name">{user?.name || 'You'}</div>
                <div className="medium-author-meta">
                  <span>{readTimeMinutes} min read</span> • <span>Today</span>
                </div>
              </div>
            </div>
            <MarkdownViewer content={content} />
            {tags.length > 0 && (
              <div className="medium-tags-list">
                {tags.map(t => (
                  <span key={t} className="medium-tag-pill">#{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Distraction-Free Medium Writing Experience */
          <div className="medium-write-paper">
            {/* Title Input */}
            <input
              type="text"
              className="medium-title-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />

            {/* Subtitle Input */}
            <input
              type="text"
              className="medium-subtitle-input"
              placeholder="Tell your story / summary..."
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
            />

            {/* Tags Input */}
            <div className="medium-tags-editor">
              <div className="medium-tags-chips">
                {tags.map(t => (
                  <span key={t} className="medium-tag-chip">
                    {t}
                    <button type="button" onClick={() => handleRemoveTag(t)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="medium-tag-input"
                placeholder="Add a tag (press Enter)..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>

            {/* Medium Format Toolbar */}
            <div className="medium-floating-toolbar">
              <button
                type="button"
                className="toolbar-btn"
                title="Bold"
                onClick={() => applyFormat('**', '**')}
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Italic"
                onClick={() => applyFormat('*', '*')}
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Heading 1"
                onClick={() => addLinePrefix('# ')}
              >
                <Heading1 size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Heading 2"
                onClick={() => addLinePrefix('## ')}
              >
                <Heading2 size={15} />
              </button>
              <span className="toolbar-divider" />
              <button
                type="button"
                className="toolbar-btn"
                title="Quote"
                onClick={() => addLinePrefix('> ')}
              >
                <Quote size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Code block"
                onClick={() => applyFormat('```javascript\n', '\n```')}
              >
                <Code size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Bullet list"
                onClick={() => addLinePrefix('- ')}
              >
                <List size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Numbered list"
                onClick={() => addLinePrefix('1. ')}
              >
                <ListOrdered size={15} />
              </button>
              <span className="toolbar-divider" />
              <button
                type="button"
                className="toolbar-btn"
                title="Divider"
                onClick={() => applyFormat('\n---\n')}
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                title="Link"
                onClick={() => applyFormat('[', '](https://)')}
              >
                <LinkIcon size={15} />
              </button>
            </div>

            {/* Main Content Textarea */}
            <textarea
              ref={textareaRef}
              className="medium-content-textarea"
              placeholder="Write your story here... Markdown is supported (# for headings, ``` for code, > for quotes)"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={18}
            />
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. READ ARTICLE VIEW (MEDIUM STYLE)
  // ─────────────────────────────────────────────────────────────
  if (view === 'read' && activeBlog) {
    return (
      <div className="medium-reader-container fade-in">
        {/* Top Action Nav */}
        <div className="medium-reader-navbar">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setView('list')}
          >
            <ArrowLeft size={16} /> All Stories
          </button>

          <div className="medium-reader-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleEditBlog(activeBlog)}
            >
              <Edit3 size={14} /> Edit Story
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={() => handleDeleteBlog(activeBlog._id)}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Article Container */}
        <article className="medium-article-wrapper">
          <header className="medium-article-header">
            <h1 className="medium-read-title">{activeBlog.title}</h1>
            {activeBlog.subtitle && (
              <p className="medium-read-subtitle">{activeBlog.subtitle}</p>
            )}

            <div className="medium-author-header">
              <div className="medium-author-avatar">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="medium-author-name">{user?.name || 'You'}</div>
                <div className="medium-author-meta">
                  <span className="meta-item">
                    <Calendar size={12} /> {formatBlogDate(activeBlog.createdAt)}
                  </span>
                  <span className="meta-sep">•</span>
                  <span className="meta-item">
                    <Clock size={12} /> {activeBlog.readTime || 1} min read
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Render Markdown Content */}
          <div className="medium-body">
            <MarkdownViewer content={activeBlog.content} />
          </div>

          {/* Tags Footer */}
          {activeBlog.tags?.length > 0 && (
            <footer className="medium-article-footer">
              <div className="medium-tags-list">
                {activeBlog.tags.map(t => (
                  <span key={t} className="medium-tag-pill">#{t}</span>
                ))}
              </div>
            </footer>
          )}
        </article>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. BLOGS LIST VIEW (MEDIUM HOME FEED STYLE)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="medium-feed-container fade-in">
      {/* Top Banner & Action */}
      <div className="medium-feed-header">
        <div>
          <h2 className="medium-feed-heading">Stories & Learning Blogs</h2>
          <p className="medium-feed-subheading">
            Document your deep dives, explain algorithms, and write tutorials for {learningPathTitle || 'this learning path'}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary medium-new-story-btn"
          onClick={handleStartNewBlog}
        >
          <Edit3 size={16} />
          <span>Write a Story</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="medium-feed-filter-bar">
        <div className="search-input-wrapper medium-search">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search stories, topics, keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {allUniqueTags.length > 0 && (
          <div className="medium-feed-tags-scroll">
            <button
              type="button"
              className={`medium-filter-tag ${selectedTag === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTag('all')}
            >
              All Topics
            </button>
            {allUniqueTags.map(t => (
              <button
                type="button"
                key={t}
                className={`medium-filter-tag ${selectedTag === t ? 'active' : ''}`}
                onClick={() => setSelectedTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stories List */}
      {loading ? (
        <div className="medium-stories-list">
          {[1, 2].map(n => (
            <div key={n} className="skeleton-box" style={{ height: '140px', borderRadius: '12px', marginBottom: '16px' }} />
          ))}
        </div>
      ) : filteredBlogs.length > 0 ? (
        <div className="medium-stories-list">
          {filteredBlogs.map(blog => {
            // Generate clean excerpt if no subtitle
            const excerpt =
              blog.subtitle ||
              (blog.content
                ? blog.content.replace(/[#*`_>\[\]]/g, '').slice(0, 150) + '...'
                : 'No preview available.');

            return (
              <div
                key={blog._id}
                className="medium-story-card"
                onClick={() => handleOpenBlog(blog)}
              >
                <div className="medium-story-card-body">
                  <div className="medium-card-author-row">
                    <div className="medium-small-avatar">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="medium-card-author-name">{user?.name || 'You'}</span>
                    <span className="meta-sep">•</span>
                    <span className="medium-card-date">{formatBlogDate(blog.createdAt)}</span>
                  </div>

                  <h3 className="medium-story-card-title">{blog.title}</h3>
                  <p className="medium-story-card-excerpt">{excerpt}</p>

                  <div className="medium-story-card-meta">
                    <div className="medium-story-tags">
                      {(blog.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="medium-mini-tag">{t}</span>
                      ))}
                      <span className="medium-read-time">
                        <Clock size={11} /> {blog.readTime || 1} min read
                      </span>
                    </div>

                    <div className="medium-card-actions" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="medium-icon-btn"
                        title="Edit Story"
                        onClick={() => handleEditBlog(blog)}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="medium-icon-btn delete"
                        title="Delete Story"
                        onClick={() => handleDeleteBlog(blog._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="medium-empty-state">
          <div className="medium-empty-icon-circle">
            <BookMarked size={36} />
          </div>
          <h3 className="medium-empty-title">
            {searchQuery ? 'No stories match your search' : 'No stories written yet'}
          </h3>
          <p className="medium-empty-subtitle">
            {searchQuery
              ? 'Try searching with different keywords or clear the filter.'
              : `Share what you learn in ${learningPathTitle || 'this path'}! Write algorithm breakdowns, study notes, or tutorials just like on Medium.`}
          </p>
          {!searchQuery && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartNewBlog}
            >
              <Edit3 size={15} /> Write Your First Story
            </button>
          )}
        </div>
      )}
    </div>
  );
}
