import React from 'react';

interface Platform {
  name: string;
}

interface PlatformCardProps {
  platform: Platform;
  onClick: () => void;
  onDelete?: () => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ 
  platform, 
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
        className='bg-theme-card backdrop-blur-lg rounded-lg p-6 text-theme-primary hover:bg-theme-card-hover transition-colors'
        onClick={onClick}>
        <h3 
          className='text-xl font-semibold mb-2 text-theme-primary truncate max-w-[200px] overflow-hidden' 
          title={platform.name}
        >
          {platform.name}
        </h3>
      </div>
      <button
        onClick={handleDeleteClick}
        className='absolute top-2 right-2 p-2 text-theme-danger hover:text-theme-primary-hover transition-colors duration-200'>
        <i className='fas fa-trash'></i>
      </button>
    </div>
  );
}; 