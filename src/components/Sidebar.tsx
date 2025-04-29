import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'applications';

  const getButtonClass = (page: string) => {
    const baseClass = "w-full text-left px-6 py-3 text-theme-primary flex items-center rounded-lg mb-2";
    return page === currentPath
      ? `${baseClass} bg-theme-button-primary bg-opacity-50 shadow-md`
      : `${baseClass} hover:bg-theme-button-primary-hover hover:bg-opacity-50 transition-colors duration-200`;
  };

  const handleNavigation = (path: string) => {
    navigate(`/${path}`);
  };

  return (
    <aside className="w-64 min-h-screen bg-theme-gradient">
      <div className="p-6 pt-3">
        <div className="mb-3 flex items-center justify-center w-full">
          <div 
            onClick={() => navigate('/applications')}
            className="w-full cursor-pointer"
          >
            <img
              src="/banner-small.png"
              alt="FaynoSync Logo"
              className="w-full h-[80px] object-contain rounded-lg "
            />
          </div>
        </div>
        <nav>
          <button 
            className={getButtonClass('applications')}
            onClick={() => handleNavigation('applications')}
          >
            <i className="fas fa-th-large mr-3"></i>
            Applications
          </button>
          <button 
            className={getButtonClass('channels')}
            onClick={() => handleNavigation('channels')}
          >
            <i className="fas fa-broadcast-tower mr-3"></i>
            Channels
          </button>
          <button 
            className={getButtonClass('platforms')}
            onClick={() => handleNavigation('platforms')}
          >
            <i className="fas fa-desktop mr-3"></i>
            Platforms
          </button>
          <button 
            className={getButtonClass('architectures')}
            onClick={() => handleNavigation('architectures')}
          >
            <i className="fas fa-microchip mr-3"></i>
            Architectures
          </button>
        </nav>
      </div>
    </aside>
  );
}; 