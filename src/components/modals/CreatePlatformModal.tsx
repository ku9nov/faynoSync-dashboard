import React, { useState } from 'react';
import { usePlatformQuery, Updater } from '../hooks/use-query/usePlatformQuery';
import { UpdatersSelector } from './common/UpdatersSelector';

interface CreatePlatformModalProps {
  onClose: () => void;
}

export const CreatePlatformModal: React.FC<CreatePlatformModalProps> = ({ onClose }) => {
  const { createPlatform } = usePlatformQuery();
  const [name, setName] = useState('');
  const [updaters, setUpdaters] = useState<Updater[]>([
    { type: 'manual', default: true }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && updaters.length > 0) {
      await createPlatform(name.trim(), updaters);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high"
      onClick={handleBackdropClick}
    >
      <div className="bg-theme-modal-gradient p-8 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">
            Create Platform
          </h2>
          <button
            onClick={onClose}
            className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="name" className="block text-theme-primary mb-2 font-roboto font-semibold">
              Platform Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
              required
            />
          </div>
          <div className="mb-6">
            <UpdatersSelector updaters={updaters} onChange={setUpdaters} />
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
              disabled={!name.trim() || updaters.length === 0}
              className="header-action-btn px-4 py-2 font-roboto ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 