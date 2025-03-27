import React from 'react';

interface Platform {
  name: string;
}

interface PlatformCardProps {
  platform: Platform;
  onClick: () => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({ platform, onClick }) => {
  return (
    <div
      className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold mb-2 text-white">{platform.name}</h3>
    </div>
  );
}; 