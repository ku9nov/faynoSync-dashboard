import React from 'react';

interface Architecture {
  name: string;
}

interface EditArchitectureModalProps {
  architecture: Architecture;
  onClose: () => void;
}

export const EditArchitectureModal: React.FC<EditArchitectureModalProps> = ({
  architecture,
  onClose,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тут буде логіка оновлення архітектури
    onClose();
  };

  const handleDelete = () => {
    // Тут буде логіка видалення архітектури
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in">
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-white font-roboto">
          Edit Architecture
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rename" className="block text-white mb-2 font-roboto">
              Rename Architecture
            </label>
            <input
              type="text"
              id="rename"
              name="rename"
              className="w-full p-2 rounded-lg font-roboto"
              defaultValue={architecture.name}
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
              className="bg-purple-600 text-white px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-purple-700 transition-colors duration-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-roboto hover:bg-red-700 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 