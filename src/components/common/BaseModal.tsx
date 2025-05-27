import React, { useState } from 'react';

interface BaseModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  isLoading?: boolean;
  isSuccess?: boolean;
  successMessage?: string;
  error?: { error: string; details?: string } | null;
  setError?: (error: { error: string; details?: string } | null) => void;
  className?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  title,
  onClose,
  children,
  isLoading = false,
  isSuccess = false,
  successMessage = 'Operation completed successfully!',
  error = null,
  setError,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-theme-modal-gradient p-8 rounded-lg ${className}`}>
        {isLoading && (
          <div className="fixed top-4 right-4 bg-theme-button-primary text-theme-primary px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-theme-primary"></div>
            <span className="font-roboto">Processing...</span>
          </div>
        )}
        {isSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-roboto">{successMessage}</span>
          </div>
        )}
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
              {setError && (
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-theme-primary hover:text-theme-primary-hover"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">
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
        {children}
      </div>
    </div>
  );
}; 