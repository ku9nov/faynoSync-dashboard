import React from 'react';
import { SettingsMenu } from './SettingsMenu';
import useMediaQuery from '../hooks/useMediaQuery';

interface HeaderProps {
  title: string;
  onCreateClick: () => void;
  createButtonText: string;
  additionalButton?: React.ReactNode;
  onSearchChange?: (searchTerm: string) => void;
  hideSearch?: boolean;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onCreateClick,
  createButtonText,
  additionalButton,
  onSearchChange,
  hideSearch = false,
  onMenuClick
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const isMobile = useMediaQuery('(max-width: 767px)');
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    );
  };

  // Icon-only button for mobile
  const MobileCreateButton = () => (
    <button
      onClick={onCreateClick}
      className="md:hidden bg-theme-button-primary text-theme-primary p-2.5 rounded-lg hover:bg-theme-button-primary-hover transition-colors duration-200 flex items-center justify-center ml-2"
      aria-label={createButtonText}
    >
      {renderIcon()}
    </button>
  );

  // Full button for desktop
  const DesktopCreateButton = () => (
    <button
      onClick={onCreateClick}
      className="hidden md:flex bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200 items-center"
    >
      {renderIcon()}
      <span className="ml-2">{createButtonText}</span>
    </button>
  );

  return (
    <div className="mb-8">
      {/* Desktop: all in one row; Mobile: stacked */}
      {!isMobile ? (
      <div className="hidden md:flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-6 flex-1 min-w-0 justify-between">
          {title && (
            <h2 className="text-3xl font-bold text-theme-primary whitespace-nowrap">{title}</h2>
          )}
          {!hideSearch && (
            <div className="relative w-full max-w-xs ml-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="bg-theme-card text-theme-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary w-full"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-primary hover:text-theme-primary-hover"
                  aria-label="Clear search"
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
        </div>
        <div className="flex items-center gap-4">
          {additionalButton}
          <DesktopCreateButton />
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-theme-button-primary hover:bg-theme-button-primary-hover p-2 rounded-lg transition-colors text-theme-primary h-10 w-10 flex items-center justify-center"
              aria-label="Settings"
            >
              <i className="fas fa-cog text-xl"></i>
            </button>
            {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
          </div>
        </div>
      </div>
      ) : ( 
      <div className="flex flex-col md:hidden gap-2 mt-0">
        <div className="flex justify-between items-center">
          <button
            className="p-2 rounded-lg bg-theme-card shadow-lg focus:outline-none"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <svg className="w-7 h-7 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center ml-auto">
            {additionalButton}
            <MobileCreateButton />
            <div className="relative ml-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-theme-button-primary hover:bg-theme-button-primary-hover p-2 rounded-lg transition-colors text-theme-primary h-10 w-10 flex items-center justify-center"
                aria-label="Settings"
              >
                <i className="fas fa-cog text-xl"></i>
              </button>
              {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
            </div>
          </div>
        </div>
        {title && (
          <h2 className="text-2xl font-bold text-theme-primary mb-2">{title}</h2>
        )}
        {!hideSearch && (
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-theme-card text-theme-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary w-full"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-primary hover:text-theme-primary-hover"
                aria-label="Clear search"
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
      </div> 
      )}
    </div>
  );
}; 