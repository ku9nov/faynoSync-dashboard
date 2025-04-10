import React from 'react';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';

interface EditChannelModalProps {
  channelName: string;
  channelId: string;
  onClose: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  channelName,
  channelId,
  onClose,
}) => {
  const { updateChannel } = useChannelQuery();
  const [newName, setNewName] = React.useState(channelName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateChannel(channelId, newName);
      onClose();
    } catch (error) {
      console.error('Error updating channel:', error);
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
          Edit Channel
        </h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='rename'
              className='block text-theme-primary mb-2 font-roboto'>
              Rename Channel
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