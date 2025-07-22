import React, { useState } from 'react';
import axiosInstance from '../config/axios';
import { AxiosError } from 'axios';
import { AdvancedModal } from './common/AdvancedModal';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface CreateAppModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    app: '',
    description: '',
    private: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [files, setFiles] = useState<{ file: File; id: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      const data = {
        app: formData.app,
        description: formData.description,
        ...(formData.private && { private: "true" }),
      };
      
      formDataToSend.append('data', JSON.stringify(data));
      
      if (files.length > 0) {
        formDataToSend.append('file', files[0].file);
      }

      await axiosInstance.post('/app/create', formDataToSend, {
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
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.data) {
        setError({
          error: axiosError.response.data.error || 'Failed to create',
          details: axiosError.response.data.details
        });
      } else {
        setError({
          error: 'Failed to create',
          details: axiosError.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdvancedModal
      onClose={onClose}
      title="Create Application"
      onSubmit={handleSubmit}
      submitButtonText="Create"
      onSuccess={onSuccess}
      isLoading={isLoading}
      isSuccess={isSuccess}
      successMessage="Application created successfully!"
      error={error}
      fileUploadConfig={{
        accept: "image/*",
        multiple: false,
        label: "Logo",
        required: false
      }}
      onFilesChange={setFiles}
      files={files}
    >
      <div className="mb-4">
        <label className="block text-theme-primary mb-2 font-roboto font-semibold">App Name</label>
        <input
          type="text"
          value={formData.app}
          onChange={(e) => setFormData(prev => ({ ...prev, app: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
          required
          placeholder="Enter app name"
        />
      </div>

      <div className="mb-4">
        <label className="block text-theme-primary mb-2 font-roboto font-semibold">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
          rows={4}
          placeholder="Enter app description"
        />
      </div>

      <div className="mb-6 flex items-start">
        <input
          type="checkbox"
          id="private"
          checked={formData.private}
          onChange={(e) => setFormData(prev => ({ ...prev, private: e.target.checked }))}
          className="mt-1 mr-3 accent-purple-500 w-5 h-5 border border-theme rounded transition-all duration-150 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-theme-input shadow-sm"
        />
        <label htmlFor="private" className="text-theme-primary font-roboto cursor-pointer select-none">
          <div className="font-semibold">Private app</div>
          <div className="text-sm text-purple-200">If selected, the app will be stored in a private bucket</div>
        </label>
      </div>
    </AdvancedModal>
  );
}; 