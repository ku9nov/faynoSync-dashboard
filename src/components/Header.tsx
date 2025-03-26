import React from 'react';
import { SettingsMenu } from './SettingsMenu';

interface HeaderProps {
  title: string;
  onCreateClick?: () => void;
  createButtonText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onCreateClick,
  createButtonText = 'Create',
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <div className="flex justify-between items-center mb-8">
      {title && <h2 className="text-3xl font-bold text-white">{title}</h2>}
      <div className="flex items-center">
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-2 rounded-lg bg-purple-700 text-white placeholder-purple-300 mr-4"
        />
        {onCreateClick && (
          <button
            onClick={onCreateClick}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg mr-4 transition-colors text-white"
          >
            {createButtonText}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition-colors text-white"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
          {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </div>
  );
}; 