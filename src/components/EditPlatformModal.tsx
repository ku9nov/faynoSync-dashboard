import React from 'react';

interface Platform {
  name: string;
}

interface EditPlatformModalProps {
  platform: Platform;
  onClose: () => void;
}

export const EditPlatformModal: React.FC<EditPlatformModalProps> = ({
  platform,
  onClose,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тут буде логіка оновлення платформи
    onClose();
  };

  const handleDelete = () => {
    // Тут буде логіка видалення платформи
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-[500px]">
        <h2 className="text-2xl font-bold text-white mb-4">
          Edit Platform: {platform.name}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Rename Platform"
            name="renamePlatform"
            className="w-full p-2 mb-4 rounded"
            defaultValue={platform.name}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded mr-2 hover:bg-red-600 transition-colors"
              onClick={handleDelete}
            >
              Delete Platform
            </button>
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