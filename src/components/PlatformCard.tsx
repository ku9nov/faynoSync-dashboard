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
      className="bg-purple-700 p-6 rounded-lg shadow-md cursor-pointer hover:bg-purple-600 transition-colors"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold mb-2 text-white">{platform.name}</h3>
    </div>
  );
}; 