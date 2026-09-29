import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { createJournal, updateJournal } from '../services/api.js';

export default function JournalPreview({ journal: existingJournal }) {
  const navigate = useNavigate();
  const [content, setContent] = useState(existingJournal?.content || '');
  const [journalId, setJournalId] = useState(existingJournal?._id || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      if (journalId) {
        await updateJournal(journalId, { content });
      } else {
        const res = await createJournal({
          content,
          date: new Date(),
          mood: 'neutral',
          tags: []
        });
        if (res.data?.data?._id) {
          setJournalId(res.data.data._id);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
    setSaving(false);
  };

  return (
    <div className="journal-preview fade-in">
      <div className="journal-preview-eyebrow">Leave a Trace</div>
      <h3 className="journal-preview-title">What did you accomplish today?</h3>
      <p className="journal-preview-subtitle">
        A small note now gives tomorrow a head start.
      </p>

      <textarea
        className="journal-textarea"
        placeholder="Write a quick reflection..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />

      <div className="journal-actions">
        <button
          className="journal-save-btn"
          onClick={handleSave}
          disabled={saving || !content.trim()}
          style={{ opacity: (!content.trim() || saving) ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save reflection'}
        </button>
        <span className="card-link" onClick={() => navigate('/journal')}>
          Open journal <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}
