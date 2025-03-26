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
      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-purple-900">{platform.name}</h3>
    </div>
  );
}; 