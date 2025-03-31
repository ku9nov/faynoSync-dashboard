import React from 'react';
import { SettingsMenu } from './SettingsMenu';

interface HeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonText: string;
  additionalButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onCreateClick,
  createButtonText,
  additionalButton
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
        {additionalButton}

        <button
          onClick={onCreateClick}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-700 transition-colors duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {/* <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg> */}
          {createButtonText}
        </button>

        <div className="relative ml-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg transition-colors text-white h-10"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
          {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </div>
  );
}; 