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
      className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <h2 className="text-xl font-bold mb-2 font-roboto text-purple-900">
        {architecture.name}
      </h2>
    </div>
  );
}; 