import React from 'react';

interface CreateArchitectureModalProps {
  onClose: () => void;
}

export const CreateArchitectureModal: React.FC<CreateArchitectureModalProps> = ({
  onClose,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Тут буде логіка створення архітектури
    onClose();
  };

  return (
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
              className="w-full p-2 rounded-lg font-roboto"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-white mb-2 font-roboto"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full p-2 rounded-lg font-roboto"
            ></textarea>
          </div>
          <div className="mb-4 flex items-center">
            <input type="checkbox" id="active" name="active" className="mr-2" />
            <label htmlFor="active" className="text-white font-roboto">
              Active
            </label>
          </div>
          <div className="mb-4">
            <label htmlFor="version" className="block text-white mb-2 font-roboto">
              Version
            </label>
            <input
              type="text"
              id="version"
              name="version"
              className="w-full p-2 rounded-lg font-roboto"
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 