import React from 'react';
import { Updater } from '../../hooks/use-query/usePlatformQuery';

interface UpdatersSelectorProps {
  updaters: Updater[];
  onChange: (updaters: Updater[]) => void;
}

const AVAILABLE_UPDATERS = [
  { type: 'manual', label: 'Manual' },
  { type: 'squirrel_darwin', label: 'Squirrel (Darwin)' },
  { type: 'sparkle', label: 'Sparkle' },
  { type: 'electron-builder', label: 'Electron Builder' }
];

export const UpdatersSelector: React.FC<UpdatersSelectorProps> = ({ updaters, onChange }) => {
  const handleUpdaterToggle = (updaterType: string, checked: boolean) => {
    if (checked) {
      // Add updater if not already present
      if (!updaters.find(u => u.type === updaterType)) {
        const newUpdaters = [...updaters, { type: updaterType }];
        
        // If this is the first updater, set it as default
        if (newUpdaters.length === 1) {
          newUpdaters[0].default = true;
        }
        
        onChange(newUpdaters);
      }
    } else {
      // Remove updater
      const newUpdaters = updaters.filter(u => u.type !== updaterType);
      
      // If we're removing the default updater and there are other updaters, set the first one as default
      const removedUpdater = updaters.find(u => u.type === updaterType);
      if (removedUpdater?.default && newUpdaters.length > 0) {
        newUpdaters[0].default = true;
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
      // If we're unchecking the only default updater, set the first one as default
      if (newUpdaters.length > 0) {
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
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-theme-primary font-roboto">Updaters</h3>
      <div className="space-y-2">
        {AVAILABLE_UPDATERS.map(({ type, label }) => (
          <div key={type} className="flex items-center space-x-3 p-3 bg-theme-input rounded-lg border border-theme">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`updater-${type}`}
                checked={isUpdaterSelected(type)}
                onChange={(e) => handleUpdaterToggle(type, e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-theme-input border-theme rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor={`updater-${type}`} className="text-theme-primary font-roboto">
                {label}
              </label>
            </div>
            {isUpdaterSelected(type) && (
              <div className="flex items-center space-x-2 ml-auto">
                <input
                  type="radio"
                  name="default-updater"
                  id={`default-${type}`}
                  checked={isUpdaterDefault(type)}
                  onChange={(e) => handleDefaultToggle(type, e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-theme-input border-theme focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor={`default-${type}`} className="text-sm text-theme-secondary font-roboto">
                  Default
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
      {updaters.length === 0 && (
        <p className="text-sm text-theme-secondary font-roboto italic">
          No updaters selected. At least one updater should be selected.
        </p>
      )}
    </div>
  );
}; 