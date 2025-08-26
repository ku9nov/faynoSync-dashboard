import React from 'react';
import { Updater } from '../../hooks/use-query/usePlatformQuery';

interface UpdatersSelectorProps {
  updaters: Updater[];
  onChange: (updaters: Updater[]) => void;
}

const AVAILABLE_UPDATERS = [
  { 
    type: 'manual', 
    label: 'Manual', 
    description: 'Manual update process',
    icon: '🔧',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    type: 'squirrel_darwin', 
    label: 'Squirrel (Darwin)', 
    description: 'Squirrel updater for macOS',
    icon: '🍎',
    color: 'from-gray-500 to-gray-600'
  },
  { 
    type: 'squirrel_windows', 
    label: 'Squirrel (Windows)', 
    description: 'Squirrel updater for Windows',
    icon: '🪟',
    color: 'from-green-500 to-green-600'
  },
  { 
    type: 'sparkle', 
    label: 'Sparkle', 
    description: 'Sparkle framework for macOS updates',
    icon: '✨',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    type: 'electron-builder', 
    label: 'Electron Builder', 
    description: 'Electron Builder update mechanism',
    icon: '⚡',
    color: 'from-yellow-500 to-yellow-600'
  }
];

export const UpdatersSelector: React.FC<UpdatersSelectorProps> = ({ updaters, onChange }) => {
  const handleUpdaterToggle = (updaterType: string, checked: boolean) => {
    // Prevent disabling manual updater
    if (updaterType === 'manual' && !checked) {
      return;
    }

    if (checked) {
      // Add updater if not already present
      if (!updaters.find(u => u.type === updaterType)) {
        const newUpdaters = [...updaters, { type: updaterType }];
        
        // If this is the first updater, set it as default
        if (newUpdaters.length === 1) {
          newUpdaters[0].default = true;
        } else if (updaterType === 'manual' && !newUpdaters.some(u => u.default)) {
          // If adding manual and no default is set, set manual as default
          const manualUpdater = newUpdaters.find(u => u.type === 'manual');
          if (manualUpdater) {
            manualUpdater.default = true;
          }
        }
        
        onChange(newUpdaters);
      }
    } else {
      // Remove updater
      const newUpdaters = updaters.filter(u => u.type !== updaterType);
      
      // If we're removing the default updater and there are other updaters, set manual as default
      const removedUpdater = updaters.find(u => u.type === updaterType);
      if (removedUpdater?.default && newUpdaters.length > 0) {
        const manualUpdater = newUpdaters.find(u => u.type === 'manual');
        if (manualUpdater) {
          manualUpdater.default = true;
        } else {
          newUpdaters[0].default = true;
        }
      }
      
      onChange(newUpdaters);
    }
  };

  const handleDefaultToggle = (updaterType: string, checked: boolean) => {
    const newUpdaters = updaters.map(updater => ({
      ...updater,
      default: updater.type === updaterType ? checked : false
    }));
    
    // Ensure at least one updater is set as default
    if (!checked && newUpdaters.every(u => !u.default)) {
      // If we're unchecking the only default updater, set manual as default
      const manualUpdater = newUpdaters.find(u => u.type === 'manual');
      if (manualUpdater) {
        manualUpdater.default = true;
      } else if (newUpdaters.length > 0) {
        newUpdaters[0].default = true;
      }
    }
    
    onChange(newUpdaters);
  };

  const isUpdaterSelected = (updaterType: string) => {
    return updaters.some(u => u.type === updaterType);
  };

  const isUpdaterDefault = (updaterType: string) => {
    return updaters.find(u => u.type === updaterType)?.default || false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <h3 className="text-lg font-semibold text-theme-primary font-roboto">Updaters</h3>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-theme-secondary to-transparent opacity-30"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_UPDATERS.map(({ type, label, description, icon, color }) => {
          const isSelected = isUpdaterSelected(type);
          const isDefault = isUpdaterDefault(type);
          
          return (
                         <div
               key={type}
               className={`
                 relative group transition-all duration-300 ease-in-out
                 ${isSelected 
                   ? 'ring-2 ring-purple-500 ring-opacity-50 shadow-lg scale-[1.02]' 
                   : 'hover:shadow-md hover:scale-[1.01]'
                 }
                 ${type === 'manual' ? 'cursor-default' : 'cursor-pointer'}
                 bg-theme-input border border-theme rounded-xl p-4
               `}
               onClick={() => handleUpdaterToggle(type, !isSelected)}
             >
                             {/* Selection indicator */}
               <div className="absolute top-3 right-3">
                 {type === 'manual' && (
                   <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   </div>
                 )}
                 <div className={`
                   w-5 h-5 rounded-full border-2 transition-all duration-200
                   ${isSelected 
                     ? 'bg-purple-500 border-purple-500' 
                     : 'border-theme-secondary group-hover:border-purple-300'
                   }
                   flex items-center justify-center
                 `}>
                   {isSelected && (
                     <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   )}
                 </div>
               </div>

              {/* Icon and gradient background */}
              <div className={`
                w-12 h-12 rounded-lg bg-gradient-to-br ${color} 
                flex items-center justify-center text-white text-xl mb-3
                shadow-lg
              `}>
                {icon}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h4 className="font-semibold text-theme-primary font-roboto">
                  {label}
                </h4>
                <p className="text-sm text-theme-secondary font-roboto leading-relaxed">
                  {description}
                </p>
                
                                 {/* Default selector */}
                 {isSelected && (
                   <div 
                     className="pt-3 border-t border-theme-secondary border-opacity-30"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <label className="flex items-center space-x-2 cursor-pointer group/default">
                       <div className="relative">
                         <input
                           type="radio"
                           name="default-updater"
                           checked={isDefault}
                           onChange={(e) => {
                             e.stopPropagation();
                             handleDefaultToggle(type, e.target.checked);
                           }}
                           className="sr-only"
                         />
                         <div className={`
                           w-4 h-4 rounded-full border-2 transition-all duration-200
                           ${isDefault 
                             ? 'border-purple-500 bg-purple-500' 
                             : 'border-theme-secondary group-hover/default:border-purple-300'
                           }
                           flex items-center justify-center
                         `}>
                           {isDefault && (
                             <div className="w-2 h-2 bg-white rounded-full"></div>
                           )}
                         </div>
                       </div>
                       <span className={`
                         text-sm font-medium transition-colors duration-200
                         ${isDefault ? 'text-purple-500' : 'text-theme-secondary group-hover/default:text-theme-primary'}
                       `}>
                         Set as default
                       </span>
                     </label>
                   </div>
                 )}
              </div>

              {/* Hover effect */}
              <div className={`
                absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                pointer-events-none
              `}></div>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      {updaters.length === 0 && (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-secondary bg-opacity-20 flex items-center justify-center">
            <svg className="w-8 h-8 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-theme-secondary font-roboto">
            No updaters selected. Please select at least one updater.
          </p>
        </div>
      )}

      {/* Selected updaters summary */}
      {updaters.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-theme-primary font-roboto">
              Selected Updaters ({updaters.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {updaters.map((updater) => {
              const updaterInfo = AVAILABLE_UPDATERS.find(u => u.type === updater.type);
              return (
                <div
                  key={updater.type}
                  className={`
                    flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium
                    ${updater.default 
                      ? 'bg-purple-500 text-white shadow-lg' 
                      : 'bg-theme-input text-theme-primary border border-theme'
                    }
                  `}
                >
                  <span>{updaterInfo?.icon}</span>
                  <span>{updaterInfo?.label}</span>
                  {updater.default && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 