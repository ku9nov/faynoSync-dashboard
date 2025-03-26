import React from 'react';

interface Architecture {
  name: string;
}

interface ArchitectureCardProps {
  architecture: Architecture;
  onClick: () => void;
}

export const ArchitectureCard: React.FC<ArchitectureCardProps> = ({
  architecture,
  onClick,
}) => {
  return (
    <div
      className="bg-purple-700 p-6 rounded-lg shadow-md cursor-pointer hover:bg-purple-600 transition-colors"
      onClick={onClick}
    >
      <h2 className="text-xl font-semibold mb-2 text-white">
        {architecture.name}
      </h2>
    </div>
  );
}; 