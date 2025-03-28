import React from 'react';
import { useAuth } from '../providers/authProvider';

interface SettingsMenuProps {
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg py-2 animate-fade-in z-50"
    >
      <button className="w-full text-left px-4 py-2 hover:bg-purple-50 text-gray-700">
        <i className="fas fa-user mr-2"></i>
        Profile
      </button>
      <button className="w-full text-left px-4 py-2 hover:bg-purple-50 text-gray-700">
        <i className="fas fa-cog mr-2"></i>
        Settings
      </button>
      <div className="border-t border-gray-200 my-2"></div>
      <button 
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 hover:bg-purple-50 text-red-600"
      >
        <i className="fas fa-sign-out-alt mr-2"></i>
        Logout
      </button>
    </div>
  );
}; 