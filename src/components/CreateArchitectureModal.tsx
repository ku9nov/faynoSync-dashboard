import React, { useState } from 'react';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';

interface CreateArchitectureModalProps {
  onClose: () => void;
}

export const CreateArchitectureModal: React.FC<CreateArchitectureModalProps> = ({
  onClose,
}) => {
  const [name, setName] = useState('');
  const { createArchitecture } = useArchitectureQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await createArchitecture(name.trim());
      setName('');
      onClose();
    }
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
  );
}; 