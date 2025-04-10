import React from 'react';

interface ChannelCardProps {
  name: string;
  // description: string;
  onClick: () => void;
  onDelete?: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  // description,
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
        className="bg-theme-card backdrop-blur-lg rounded-lg p-6 text-theme-primary hover:bg-theme-card-hover transition-colors"
        onClick={onClick}
      >
        <h3 className="text-xl font-semibold mb-2 text-theme-primary">{name}</h3>
        {/* <p className="text-theme-primary">{description}</p> */}
      </div>
      <button
        onClick={handleDeleteClick}
        className='absolute top-2 right-2 p-2 text-theme-danger hover:text-theme-primary-hover transition-colors duration-200'>
        <i className='fas fa-trash'></i>
      </button>
    </div>
  );
}; 