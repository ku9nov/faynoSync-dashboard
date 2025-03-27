import React from 'react';

interface ChannelCardProps {
  name: string;
  // description: string;
  onClick: () => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  name,
  // description,
  onClick,
}) => {
  return (
    <div
      className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold mb-2 text-white">{name}</h3>
      {/* <p className="text-purple-300">{description}</p> */}
    </div>
  );
}; 