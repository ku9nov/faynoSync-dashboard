import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface FileInfo {
  file: File;
  id: string;
}

interface AdvancedModalProps {
  onClose: () => void;
  title: string;
  onSubmit: (formData: any) => Promise<void>;
  children: React.ReactNode;
  submitButtonText?: string;
  onSuccess?: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  successMessage?: string;
  error?: { error: string; details?: string } | null;
  showChangelogPreview?: boolean;
  changelogValue?: string;
  onChangelogChange?: (value: string) => void;
  onChangelogPreviewToggle?: () => void;
  fileUploadConfig?: {
    accept?: string;
    multiple?: boolean;
    label?: string;
    required?: boolean;
  };
  onFilesChange?: (files: FileInfo[]) => void;
  files?: FileInfo[];
}

export const AdvancedModal: React.FC<AdvancedModalProps> = ({
  onClose,
  title,
  onSubmit,
  children,
  submitButtonText = 'Submit',
  onSuccess,
  isLoading = false,
  isSuccess = false,
  successMessage = 'Operation completed successfully!',
  error,
  showChangelogPreview = false,
  changelogValue = '',
  onChangelogChange,
  onChangelogPreviewToggle,
  fileUploadConfig,
  onFilesChange,
  files = [],
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onFilesChange) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(2, 9)
      }));
      onFilesChange([...files, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (idToRemove: string) => {
    if (onFilesChange) {
      onFilesChange(files.filter(file => file.id !== idToRemove));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-theme-modal-gradient rounded-lg p-8 w-[500px] max-h-[80vh] overflow-y-auto relative">
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
            </div>
            {showDetails && error.details && (
              <div className="mt-2 text-sm bg-red-600 p-2 rounded">
                {error.details}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">{title}</h2>
          <button
            onClick={onClose}
            className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
          if (onSuccess) {
            onSuccess();
          }
        }}>
          {children}
          
          {fileUploadConfig && (
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">{fileUploadConfig.label || 'Files'}</label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={fileUploadConfig.multiple}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept={fileUploadConfig.accept}
                  required={fileUploadConfig.required && files.length === 0}
                />
                <label
                  htmlFor="file-upload"
                  className="w-full px-4 py-2 bg-theme-button-primary text-theme-primary rounded-lg cursor-pointer hover:bg-theme-input transition-colors duration-200 flex items-center justify-center font-roboto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Choose Files
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((fileInfo) => (
                    <div
                      key={fileInfo.id}
                      className="flex items-center justify-between bg-theme-input bg-opacity-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="text-theme-primary font-roboto">{fileInfo.file.name}</div>
                          <div className="text-purple-200 text-sm font-roboto">{formatFileSize(fileInfo.file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(fileInfo.id)}
                        className="text-theme-primary hover:text-red-300 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showChangelogPreview !== undefined && onChangelogChange && (
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto">Changelog</label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={onChangelogPreviewToggle}
                  className="text-theme-primary text-sm hover:text-theme-primary-hover"
                >
                  {showChangelogPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {showChangelogPreview ? (
                <div className="bg-theme-modal p-4 rounded prose prose-sm max-w-none">
                  <ReactMarkdown>{changelogValue}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={changelogValue}
                  onChange={(e) => onChangelogChange(e.target.value)}
                  className="w-full px-3 py-2 rounded font-roboto"
                  rows={4}
                  placeholder="# Changes in this version&#10;- Added new feature&#10;- Fixed bug"
                />
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-theme-button-submit text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-submit-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-theme-primary mr-2"></div>
                  Processing...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 