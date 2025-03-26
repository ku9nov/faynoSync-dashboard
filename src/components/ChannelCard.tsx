import React from 'react';

interface ChannelCardProps {
  name: string;
  description: string;
  onClick: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  description,
  onClick,
}) => {
  return (
    <div
      className="bg-purple-700 p-6 rounded-lg shadow-md cursor-pointer hover:bg-purple-600 transition-colors"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold mb-2 text-white">{name}</h3>
      <p className="text-purple-300">{description}</p>
    </div>
  );
}; 