import React, { useState } from 'react';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { AxiosError } from 'axios';

interface CreateArchitectureModalProps {
  onClose: () => void;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export const CreateArchitectureModal: React.FC<CreateArchitectureModalProps> = ({
  onClose,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { createArchitecture } = useArchitectureQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      try {
        await createArchitecture(name.trim());
        setName('');
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
      }
    }
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {error.error}</span>
            {error.details && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-white hover:text-gray-200"
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
        <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-white font-roboto">
            Create Architecture
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-white mb-2 font-roboto">
                Architecture Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded-lg font-roboto"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-700 transition-colors duration-200"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}; 