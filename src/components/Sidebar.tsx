import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'applications';

  const getButtonClass = (page: string) => {
    const baseClass = "w-full text-left px-6 py-3 text-white flex items-center rounded-lg mb-2";
    return page === currentPath
      ? `${baseClass} bg-purple-600 bg-opacity-50 shadow-md`
      : `${baseClass} hover:bg-purple-700 hover:bg-opacity-50 transition-colors duration-200`;
  };

  const handleNavigation = (path: string) => {
    navigate(`/${path}`);
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-purple-800 to-orange-500">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-8">faynosync</h1>
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