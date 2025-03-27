import React from 'react';

interface ArchitectureCardProps {
  archName: string;
  onClick: () => void;
}

export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  archName,
  onClick,
}) => {
  return (
    <div
      className='bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors'
      onClick={onClick}>
      <h2 className='text-xl font-semibold mb-2 text-white'>{archName}</h2>
    </div>
  );
};
