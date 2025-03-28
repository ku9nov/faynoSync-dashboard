import React from 'react';

interface CreatePlatformModalProps {
  onClose: () => void;
}

export const CreatePlatformModal: React.FC<CreatePlatformModalProps> = ({ onClose }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here will be the platform creation logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Create Platform</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Platform Name"
            name="platformName"
            className="w-full p-2 mb-4 rounded"
          />
          <textarea
            placeholder="Description"
            name="description"
            className="w-full p-2 mb-4 rounded"
          />
          <div className="mb-4">
            <label className="block text-white mb-2">
              <input type="checkbox" name="active" className="mr-2" />
              Active
            </label>
          </div>
          <input
            type="text"
            placeholder="Version"
            name="version"
            className="w-full p-2 mb-4 rounded"
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-purple-600 text-white px-4 py-2 rounded mr-2 hover:bg-purple-700 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 