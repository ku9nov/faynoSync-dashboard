import React from 'react';

interface CreateChannelModalProps {
  onClose: () => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ onClose }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here will be the channel creation logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-purple-800 to-purple-600 p-8 rounded-lg w-[400px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Create Channel</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-white">Channel Name</label>
            <input
              type="text"
              name="channelName"
              className="w-full px-3 py-2 bg-purple-700 rounded-lg text-white placeholder-purple-300"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-white">Description</label>
            <textarea
              name="description"
              className="w-full px-3 py-2 bg-purple-700 rounded-lg text-white placeholder-purple-300"
              rows={3}
            ></textarea>
          </div>
          <div className="mb-4 flex items-center">
            <input type="checkbox" name="active" id="active" className="mr-2" />
            <label htmlFor="active" className="text-white">Active</label>
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-white">Version</label>
            <input
              type="text"
              name="version"
              className="w-full px-3 py-2 bg-purple-700 rounded-lg text-white placeholder-purple-300"
              placeholder="e.g. 1.0.0"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg mr-4 transition-colors text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 