import React from 'react';
import { SettingsMenu } from './SettingsMenu';

interface HeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonText: string;
  additionalButton?: React.ReactNode;
  onSearchChange?: (searchTerm: string) => void;
  hideSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onCreateClick,
  createButtonText,
  additionalButton,
  onSearchChange,
  hideSearch = false
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onSearchChange?.("");
  };

  const renderIcon = () => {
    if (createButtonText === "Upload the app") {
      return (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    );
  };

  return (
    <div className="flex justify-between items-center mb-8">
      {title && <h2 className="text-3xl font-bold text-theme-primary">{title}</h2>}
      <div className="flex items-center">
        {!hideSearch && (
          <div className="relative mr-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-theme-card text-theme-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary w-64"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {additionalButton}
        <button
          onClick={onCreateClick}
          className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200 flex items-center"
        >
          {renderIcon()}
          {createButtonText}
        </button>
        <div className="relative ml-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-theme-button-primary hover:bg-theme-button-primary-hover p-2 rounded-lg transition-colors text-theme-primary h-10"
          >
            <i className="fas fa-cog text-xl"></i>
          </button>
          {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
      </div>
    </div>
  );
}; 