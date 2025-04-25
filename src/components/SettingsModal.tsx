import React, { useState, useRef, useEffect } from 'react';
import { UsersSettings } from './settings/UsersSettings';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsPage = 'users';

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('users');
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      // Only close if clicking on the overlay (background), not on the modal itself
      if (event.target === overlayRef.current) {
        onClose();
      }
    };

    // Add event listener to the overlay div
    if (overlayRef.current) {
      overlayRef.current.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      if (overlayRef.current) {
        overlayRef.current.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [onClose]);

  const menuItems = [
    { id: 'users', label: 'Users', icon: 'fa-users' },
  ];

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div 
        ref={modalRef}
        className="bg-theme-gradient rounded-lg w-[98%] h-[85%] flex overflow-hidden"
      >
        {/* Sidebar - reduced width from w-64 to w-48 */}
        <div className="w-48 bg-theme-gradient p-3">
          <h2 className="text-lg font-bold text-theme-primary mb-4">Settings</h2>
          <nav>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as SettingsPage)}
                className={`w-full text-left px-3 py-1.5 rounded-lg mb-1.5 flex items-center text-sm ${
                  currentPage === item.id
                    ? 'bg-theme-button-primary bg-opacity-50 text-theme-primary'
                    : 'text-theme-primary hover:bg-theme-button-primary-hover hover:bg-opacity-50'
                }`}
              >
                <i className={`fas ${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content - adjusted padding and spacing */}
        <div className="flex-1 p-4 overflow-auto bg-theme-gradient">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-theme-primary">
              {menuItems.find(item => item.id === currentPage)?.label}
            </h1>
            <button
              onClick={onClose}
              className="text-theme-primary hover:text-theme-danger"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {currentPage === 'users' && <UsersSettings />}
          
          {/* <div className="flex justify-end mt-4 space-x-2">
            <button 
              onClick={onClose}
              className="px-3 py-1.5 bg-theme-button-primary text-theme-primary rounded-lg text-sm hover:bg-opacity-80"
            >
              Cancel
            </button>
            <button 
              className="px-3 py-1.5 bg-theme-button-primary text-theme-primary rounded-lg text-sm hover:bg-opacity-80"
            >
              Save
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}; 