import React, { useState } from 'react';
import { AxiosError } from 'axios';

interface EditModalProps {
  title: string;
  label: string;
  initialName: string;
  onClose: () => void;
  onUpdate: (newName: string) => Promise<void>;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export const EditModal: React.FC<EditModalProps> = ({
  title,
  label,
  initialName,
  onClose,
  onUpdate,
}) => {
  const [newName, setNewName] = React.useState(initialName);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdate(newName);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.data) {
        setError({
          error: axiosError.response.data.error || 'Failed to update',
          details: axiosError.response.data.details
        });
      } else {
        setError({
          error: 'Failed to update',
          details: axiosError.message
        });
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {error.error}</span>
            {error.details && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showDetails && error.details && (
            <div className="mt-2 text-sm bg-red-600 p-2 rounded">
              {error.details}
            </div>
          )}
        </div>
      )}
      <div 
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50'
        onClick={handleBackdropClick}
      >
        <div className='bg-theme-modal-gradient p-8 rounded-lg w-96'>
          <div className="flex justify-between items-center mb-4">
            <h2 className='text-2xl font-bold text-theme-primary font-roboto'>
              {title}
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
            <div className='mb-4'>
              <label
                htmlFor='rename'
                className='block text-theme-primary mb-2 font-roboto'>
                {label}
              </label>
              <input
                type='text'
                id='rename'
                name='rename'
                className='w-full p-2 rounded-lg font-roboto'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className='flex justify-end'>
              <button
                type='button'
                onClick={onClose}
                className='bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200'>
                Cancel
              </button>
              <button
                type='submit'
                className='bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-input transition-colors duration-200'>
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}; 