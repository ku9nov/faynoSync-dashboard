import React, { useState } from 'react';
import axiosInstance from '../config/axios';

interface EditAppModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  appData: {
    id: string;
    app: string;
    description: string;
    logo?: string;
  };
}

export const EditAppModal: React.FC<EditAppModalProps> = ({ onClose, onSuccess, appData }) => {
  const [formData, setFormData] = useState({
    app: appData.app,
    description: appData.description,
    file: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      const data = {
        id: appData.id,
        app: formData.app,
        description: formData.description,
      };
      
      formDataToSend.append('data', JSON.stringify(data));
      
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      await axiosInstance.post('/app/update', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
      onClose();

    } catch (err) {
      setError('Failed to update application. Please try again.');
      console.error('Error updating app:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
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
            <span className="font-roboto">Updating application...</span>
          </div>
        )}
        {isSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-roboto">Application updated successfully!</span>
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-50">
            <span className="font-roboto">{error}</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-theme-primary mb-4 font-roboto">Edit Application</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-theme-primary mb-2 font-roboto">App Name</label>
            <input
              type="text"
              value={formData.app}
              onChange={(e) => setFormData(prev => ({ ...prev, app: e.target.value }))}
              className="w-full px-3 py-2 rounded font-roboto"
              required
              placeholder="Enter app name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-theme-primary mb-2 font-roboto">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded font-roboto"
              rows={4}
              placeholder="Enter app description"
            />
          </div>

          <div className="mb-4">
            <label className="block text-theme-primary mb-2 font-roboto">Logo</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept="image/*"
              />
              <label
                htmlFor="file-upload"
                className="w-full px-4 py-2 bg-theme-button-primary text-theme-primary rounded-lg cursor-pointer hover:bg-theme-input transition-colors duration-200 flex items-center justify-center font-roboto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Choose Logo
              </label>
            </div>
            {formData.file && (
              <div className="mt-4 flex items-center justify-between bg-theme-input bg-opacity-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <div className="text-theme-primary font-roboto">{formData.file.name}</div>
                    <div className="text-purple-200 text-sm font-roboto">{formatFileSize(formData.file.size)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  className="text-theme-primary hover:text-red-300 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

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
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 