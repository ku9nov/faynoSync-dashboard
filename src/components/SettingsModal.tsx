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

  const isMobile = window.innerWidth < 768;
  const modalStyle = isMobile
    ? {
        width: '100vw',
        height: '100vh',
        minWidth: 0,
        minHeight: 0,
        maxWidth: '100vw',
        maxHeight: '100vh',
        borderRadius: '0.5rem',
      }
    : {
        width: '95vw',
        height: '90vh',
        minWidth: '800px',
        minHeight: '600px',
        maxWidth: 'calc(100vw - 288px)', // 256px sidebar + 32px запас
        maxHeight: '90vh',
        borderRadius: '1rem',
      };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 grid place-items-center modal-overlay-high"
      style={{ zIndex: 11000 }}
    >
      <div 
        ref={modalRef}
        className="bg-theme-gradient flex overflow-auto"
        style={modalStyle}
      >
        {/* Sidebar */}
        <div className="w-48 bg-theme-gradient p-4">
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

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto bg-theme-gradient">
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