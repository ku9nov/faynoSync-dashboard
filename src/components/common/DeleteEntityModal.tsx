import React, { useState } from 'react';
import { AxiosError } from 'axios';

interface DeleteEntityModalProps {
  entityName: string;
  entityType: 'platform' | 'channel' | 'architecture' | 'app' | 'version' | 'artifact';
  onClose: () => void;
  onConfirm: () => Promise<void>;
  confirmationValue?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export const DeleteEntityModal: React.FC<DeleteEntityModalProps> = ({
  entityName,
  entityType,
  onClose,
  onConfirm,
  confirmationValue,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getConfirmationMessage = () => {
    switch (entityType) {
      case 'platform':
        return `To delete platform "${entityName}" please enter its name:`;
      case 'channel':
        return `To delete channel "${entityName}" please enter its name:`;
      case 'architecture':
        return `To delete architecture "${entityName}" please enter its name:`;
      case 'app':
        return `To delete application "${entityName}" please enter its name:`;
      case 'version':
        return `To confirm deletion of application version "${entityName}", please enter its current version:`;
      case 'artifact':
        return `To delete artifact please enter this ${entityName}:`;
      default:
        return `To delete ${entityType} "${entityName}" please enter its name:`;
    }
  };

  const getPlaceholder = () => {
    switch (entityType) {
      case 'platform':
        return 'Enter platform name';
      case 'channel':
        return 'Enter channel name';
      case 'architecture':
        return 'Enter architecture name';
      case 'app':
        return 'Enter application name';
      case 'version':
        return 'Enter current version';
      case 'artifact':
        return 'Enter platform/arch';
      default:
        return `Enter ${entityType} name`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expectedValue = confirmationValue || entityName;
    if (confirmationText === expectedValue) {
      try {
        await onConfirm();
      } catch (err) {
        const axiosError = err as AxiosError<ErrorResponse>;
        if (axiosError.response?.data) {
          setError({
            error: axiosError.response.data.error || 'Failed to delete',
            details: axiosError.response.data.details
          });
        } else {
          setError({
            error: 'Failed to delete',
            details: axiosError.message
          });
        }
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
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high'
        onClick={handleBackdropClick}
      >
        <div className='bg-theme-modal-gradient p-8 rounded-lg w-96'>
          <div className="flex justify-between items-center mb-4">
            <h2 className='text-2xl font-bold text-theme-primary font-roboto'>
              Delete Confirmation
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
          <p className='text-theme-primary mb-4 font-semibold'>
            {getConfirmationMessage()}
          </p>
          <form onSubmit={handleSubmit}>
            <div className='mb-4'>
              <input
                type='text'
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className='w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm'
                placeholder={getPlaceholder()}
              />
            </div>
            <div className='flex justify-end'>
              <button
                type='button'
                onClick={onClose}
                className='bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-300 transition-all duration-150 mr-2 border border-gray-300 shadow-sm'>
                Cancel
              </button>
              <button
                type='submit'
                disabled={confirmationText !== (confirmationValue || entityName)}
                className='bg-red-600 text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-red-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-sm'>
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}; 