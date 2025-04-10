import React from 'react';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';

interface Platform {
  name: string;
}

interface EditPlatformModalProps {
  platform: Platform;
  platformId: string;
  onClose: () => void;
}

export const EditPlatformModal: React.FC<EditPlatformModalProps> = ({
  platform,
  platformId,
  onClose,
}) => {
  const { updatePlatform } = usePlatformQuery();
  const [newName, setNewName] = React.useState(platform.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePlatform(platformId, newName);
      onClose();
    } catch (error) {
      console.error('Error updating platform:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50'
      onClick={handleBackdropClick}
    >
      <div className='bg-theme-modal-gradient p-8 rounded-lg w-96'>
        <h2 className='text-2xl font-bold mb-4 text-theme-primary font-roboto'>
          Edit Platform
        </h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='rename'
              className='block text-theme-primary mb-2 font-roboto'>
              Rename Platform
            </label>
            <input
              type='text'
              id='rename'
              name='rename'
              className='w-full p-2 rounded-lg font-roboto'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200'>
              Cancel
            </button>
            <button
              type='submit'
              className='bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-input transition-colors duration-200'>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 