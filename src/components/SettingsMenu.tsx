import React, { useState } from 'react';
import { useAuth } from '../providers/authProvider';
import { useTheme } from '../providers/themeProvider';
import { useUsersQuery } from '../hooks/use-query/useUsersQuery';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';

interface SettingsMenuProps {
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: userData } = useUsersQuery();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileModal || showSettingsModal) {
        return;
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showProfileModal, showSettingsModal]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
  };

  const handleSettingsClick = () => {
    setShowSettingsModal(true);
  };

  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-0 top-12 w-48 bg-theme-modal rounded-lg shadow-lg py-2 animate-fade-in z-50 border border-theme-modal"
      >
        {userData && (
          <>
            <div className="px-4 py-2 text-theme-modal-text flex items-center">
              <span className="font-medium">{userData.username}</span>
              <i className={`fas ${userData.is_admin ? 'fa-crown text-yellow-500' : 'fa-user text-blue-500'} ml-2`}></i>
            </div>
            <div className="border-t border-theme-modal my-2"></div>
          </>
        )}
        <button 
          onClick={handleProfileClick}
          className="w-full text-left px-4 py-2 hover-bg-theme-modal text-theme-modal-text"
        >
          <i className="fas fa-user mr-2"></i>
          Profile
        </button>
        {userData?.is_admin && (
          <button 
            onClick={handleSettingsClick}
            className="w-full text-left px-4 py-2 hover-bg-theme-modal text-theme-modal-text"
          >
            <i className="fas fa-cog mr-2"></i>
            Settings
          </button>
        )}
        <button 
          onClick={toggleTheme}
          className="w-full text-left px-4 py-2 hover-bg-theme-modal text-theme-modal-text flex items-center justify-between"
        >
          <span>
            <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} mr-2`}></i>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        <div className="border-t border-theme-modal my-2"></div>
        <button 
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover-bg-theme-modal text-theme-danger"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Logout
        </button>
      </div>
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </>
  );
}; 