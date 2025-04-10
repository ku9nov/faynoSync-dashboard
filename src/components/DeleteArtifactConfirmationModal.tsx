import React, { useState } from 'react';

interface DeleteArtifactConfirmationModalProps {
  platform: string;
  arch: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteArtifactConfirmationModal: React.FC<DeleteArtifactConfirmationModalProps> = ({
  platform,
  arch,
  onClose,
  onConfirm,
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationText === `${platform}/${arch}`) {
      onConfirm();
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
          Delete Confirmation
        </h2>
        <p className='text-theme-primary mb-4'>
          To delete artifact please enter this {platform}/{arch}:
        </p>
        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <input
              type='text'
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className='w-full p-2 rounded-lg font-roboto'
              placeholder='Enter platform/arch'
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
              disabled={confirmationText !== `${platform}/${arch}`}
              className='bg-red-600 text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'>
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 