import React, { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Heading2, Sparkles, CheckSquare, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function RichTextEditor({ value = '', onChange, placeholder = 'Write freely...', minHeight = '140px' }) {
  const textareaRef = useRef(null);

  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

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
    const selectedText = value.substring(start, end);
    
    const lines = selectedText ? selectedText.split('\n') : [''];
    const prefixed = lines.map(line => `${prefix}${line}`).join('\n');
    
    const newValue = value.substring(0, start) + prefixed + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefixed.length, start + prefixed.length);
    }, 0);
  };

  return (
    <div className="rich-editor-container">
      <div className="rich-editor-toolbar">
        <button
          type="button"
          className="rich-editor-btn"
          title="Bold (**text**)"
          onClick={() => applyFormat('**', '**')}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Italic (*text*)"
          onClick={() => applyFormat('*', '*')}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Heading"
          onClick={() => addLinePrefix('## ')}
        >
          <Heading2 size={15} />
        </button>
        <div className="rich-editor-divider" />
        <button
          type="button"
          className="rich-editor-btn"
          title="Bullet list"
          onClick={() => addLinePrefix('• ')}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Numbered list"
          onClick={() => addLinePrefix('1. ')}
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Task item"
          onClick={() => addLinePrefix('☐ ')}
        >
          <CheckSquare size={15} />
        </button>
        <div className="rich-editor-divider" />
        <button
          type="button"
          className="rich-editor-btn"
          title="Code snippet (`code`)"
          onClick={() => applyFormat('`', '`')}
        >
          <Code size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Link ([text](url))"
          onClick={() => applyFormat('[', '](url)')}
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          className="rich-editor-btn"
          title="Image (![alt](url))"
          onClick={() => applyFormat('![', '](url)')}
        >
          <ImageIcon size={15} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="rich-editor-textarea"
        style={{ minHeight }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="rich-editor-footer">
        <span className="rich-editor-wordcount">
          {value ? value.trim().split(/\s+/).filter(Boolean).length : 0} words
        </span>
        <span className="rich-editor-hint">Supports Markdown formatting</span>
      </div>
    </div>
  );
}
