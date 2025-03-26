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
      className='bg-purple-700 p-6 rounded-lg shadow-md cursor-pointer hover:bg-purple-600 transition-colors'
      onClick={onClick}>
      <h2 className='text-xl font-semibold mb-2 text-white'>{archName}</h2>
    </div>
  );
};
