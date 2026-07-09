import React, { useState } from 'react';
import { useBackdropClose } from '../../hooks/useBackdropClose';
import { ReportGroup } from '@/hooks/use-query/useReportsQuery';

interface EditReportGroupModalProps {
  group: ReportGroup;
  onClose: () => void;
  onConfirm: (data: { tags: string[]; note: string }) => Promise<void>;
}

const formatLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const INPUT_CLASS =
  'w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm';

export const EditReportGroupModal: React.FC<EditReportGroupModalProps> = ({ group, onClose, onConfirm }) => {
  const [tags, setTags] = useState<string[]>(group.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState(group.note ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const backdropProps = useBackdropClose(onClose);

  const addTag = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim().toLowerCase()] : tags;
    setIsSaving(true);
    try {
      await onConfirm({ tags: Array.from(new Set(finalTags)), note: note.trim() });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high"
      {...backdropProps}
    >
      <div className="bg-theme-modal-gradient p-8 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">Edit Report Group</h2>
          <button
            onClick={onClose}
            className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-theme-secondary mb-4">
          {group.application.name} v{group.application.version} · {formatLabel(group.event.type)} / {formatLabel(group.event.reason)}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-theme-primary mb-2 text-sm font-roboto">Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-purple-500/20 text-purple-300 border-purple-400/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-theme-primary"
                      title="Remove tag"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput.trim() && addTag(tagInput)}
              placeholder="Type a tag and press Enter"
              className={INPUT_CLASS}
            />
          </div>

          <div className="mb-6">
            <label className="block text-theme-primary mb-2 text-sm font-roboto">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. tracked in JIRA-123"
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-300 transition-all duration-150 mr-2 border border-gray-300 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
