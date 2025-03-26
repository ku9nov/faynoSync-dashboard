import React from 'react';

interface EditChannelModalProps {
  channelName: string;
  onClose: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channelName,
  onClose,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тут буде логіка оновлення каналу
    onClose();
  };

  const handleDelete = () => {
    // Тут буде логіка видалення каналу
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-purple-800 to-purple-600 p-8 rounded-lg w-[400px]">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Edit Channel: {channelName}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-white">Rename Channel</label>
            <input
              type="text"
              name="channelName"
              className="w-full px-3 py-2 bg-purple-700 rounded-lg text-white"
              defaultValue={channelName}
            />
          </div>
          <div className="flex justify-between mb-6">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Delete Channel
            </button>
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