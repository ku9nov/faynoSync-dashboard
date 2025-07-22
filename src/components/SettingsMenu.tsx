import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../providers/authProvider';
import { useTheme } from '../providers/themeProvider';
import { useUsersQuery } from '../hooks/use-query/useUsersQuery';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';

interface SettingsMenuProps {
  onClose: () => void;
  onOpenSettingsModal: () => void;
  onOpenProfileModal: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose, onOpenSettingsModal, onOpenProfileModal }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { data: userData } = useUsersQuery();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const themeMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Calculate position for the menu
    const settingsButton = document.querySelector('[aria-label="Settings"]') as HTMLElement;
    if (settingsButton) {
      const rect = settingsButton.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsModal) {
        return;
      }
      
      // Check if click was on the settings button
      const settingsButton = document.querySelector('[aria-label="Settings"]');
      if (settingsButton?.contains(event.target as Node)) {
        return;
      }
      
      // Check if click was on theme submenu
      const themeSubmenu = document.querySelector('.theme-submenu');
      if (themeSubmenu?.contains(event.target as Node)) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (themeMenuTimeoutRef.current) {
        clearTimeout(themeMenuTimeoutRef.current);
      }
    };
  }, [onClose, showSettingsModal]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleProfileClick = () => {
    onClose();
    onOpenProfileModal();
  };

  const handleSettingsClick = () => {
    onClose();
    if (typeof onOpenSettingsModal === 'function') {
      onOpenSettingsModal();
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'dark':
        return 'fa-moon';
      case 'light':
        return 'fa-sun';
      case 'auto':
        return 'fa-clock';
      default:
        return 'fa-sun';
    }
  };

  const menuContent = (
    <div
      ref={menuRef}
      className="settings-popup animate-fade-in settings-menu-popup"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: menuPosition.top,
        right: menuPosition.right,
        minWidth: '12rem'
      }}
    >
        {userData && (
          <>
            <div className="settings-popup-user">
              <span>{userData.username}</span>
              <i className={`fas ${userData.is_admin ? 'fa-crown text-yellow-500' : 'fa-user text-blue-500'}`}></i>
            </div>
            <div className="settings-popup-divider"></div>
          </>
        )}
        <button 
          onClick={handleProfileClick}
          className="settings-popup-button"
        >
          <i className="fas fa-user"></i>
          <span>Profile</span>
        </button>
        {userData?.is_admin && (
          <button 
            onClick={handleSettingsClick}
            className="settings-popup-button"
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </button>
        )}
        <div className="relative">
          <button 
            onMouseEnter={() => {
              if (themeMenuTimeoutRef.current) {
                clearTimeout(themeMenuTimeoutRef.current);
              }
              setShowThemeMenu(true);
            }}
            onMouseLeave={() => {
              themeMenuTimeoutRef.current = setTimeout(() => {
                setShowThemeMenu(false);
              }, 150);
            }}
            className="settings-popup-button"
          >
            <i className={`fas ${getThemeIcon()}`}></i>
            <span>Theme</span>
            <i className="fas fa-chevron-right ml-auto"></i>
          </button>
          {showThemeMenu && (
            <div 
              className="theme-submenu"
              onMouseEnter={() => {
                if (themeMenuTimeoutRef.current) {
                  clearTimeout(themeMenuTimeoutRef.current);
                }
                setShowThemeMenu(true);
              }}
              onMouseLeave={() => {
                themeMenuTimeoutRef.current = setTimeout(() => {
                  setShowThemeMenu(false);
                }, 150);
              }}
            >
              <button 
                onClick={() => setThemeMode('light')}
                className="settings-popup-button"
              >
                <i className="fas fa-sun"></i>
                <span>Light</span>
              </button>
              <button 
                onClick={() => setThemeMode('dark')}
                className="settings-popup-button"
              >
                <i className="fas fa-moon"></i>
                <span>Dark</span>
              </button>
              <button 
                onClick={() => setThemeMode('auto')}
                className="settings-popup-button"
              >
                <i className="fas fa-clock"></i>
                <span>Auto</span>
              </button>
            </div>
          )}
        </div>
        <div className="settings-popup-divider"></div>
        <button 
          onClick={handleLogout}
          className="settings-popup-button danger"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    );

  return (
    <>
      {createPortal(menuContent, document.body)}
    </>
  );
}; 