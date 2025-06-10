import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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
    onClose?.(); // close drawer on mobile after navigation
  };

  // Drawer for mobile
  const Drawer = () => (
    <div className={`fixed inset-0 z-50 flex md:hidden transition-all duration-300 ${isOpen ? '' : 'pointer-events-none'}`}> 
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label="Close menu overlay"
      />
      {/* Drawer panel */}
      <aside className={`relative w-64 max-w-[80vw] h-full bg-theme-gradient shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 pt-3">
          <div className="mb-3 flex items-center justify-between w-full">
            <div 
              onClick={() => { navigate('/applications'); onClose?.(); }}
              className="w-full cursor-pointer"
            >
              <img
                src="/banner-small.png"
                alt="FaynoSync Logo"
                className="w-full h-[80px] object-contain rounded-lg "
              />
            </div>
            <button
              className="ml-2 p-2 rounded-lg text-theme-primary hover:bg-theme-card"
              aria-label="Close menu"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
    </div>
  );

  return (
    <>
      {/* Drawer only on mobile */}
      <Drawer />
      {/* Sidebar only on desktop */}
      <aside className="hidden md:block w-64 min-h-screen bg-theme-gradient">
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
    </>
  );
}; 