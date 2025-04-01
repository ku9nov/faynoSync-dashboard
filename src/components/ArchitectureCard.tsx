import React from 'react';

interface ArchitectureCardProps {
  archName: string;
  onClick: () => void;
  onDelete?: () => void;
}

export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  archName,
  onClick,
  onDelete,
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className='relative'>
      <div
        className='bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors'
        onClick={onClick}>
        <h2 className='text-xl font-semibold mb-2 text-white'>{archName}</h2>
      </div>
      <button
        onClick={handleDeleteClick}
        className='absolute top-2 right-2 p-2 text-red-500 hover:text-red-600 transition-colors duration-200'>
        <i className='fas fa-trash'></i>
      </button>
    </div>
  );
};
