import React, { useState, useEffect } from 'react';
import { useAppsQuery } from '../../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../../hooks/use-query/useArchitectureQuery';

// Define proper types for permissions
interface Permission {
  create: boolean;
  delete: boolean;
  edit: boolean;
  download?: boolean;
  upload?: boolean;
  allowed: string[];
}

interface Permissions {
  apps: Permission;
  channels: Permission;
  platforms: Permission;
  archs: Permission;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, password: string, permissions: any) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Default permissions with proper typing
  const [permissions, setPermissions] = useState<Permissions>({
    apps: {
      create: false,
      delete: false,
      edit: false,
      download: false,
      upload: false,
      allowed: []
    },
    channels: {
      create: false,
      delete: false,
      edit: false,
      allowed: []
    },
    platforms: {
      create: false,
      delete: false,
      edit: false,
      allowed: []
    },
    archs: {
      create: false,
      delete: false,
      edit: false,
      allowed: []
    }
  });
  
  // State for allowed items dropdowns
  const [showAppsDropdown, setShowAppsDropdown] = useState(false);
  const [showChannelsDropdown, setShowChannelsDropdown] = useState(false);
  const [showPlatformsDropdown, setShowPlatformsDropdown] = useState(false);
  const [showArchsDropdown, setShowArchsDropdown] = useState(false);
  
  // Get data for dropdowns
  const { apps } = useAppsQuery();
  const { channels } = useChannelQuery();
  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setError(null);
      setPermissions({
        apps: {
          create: false,
          delete: false,
          edit: false,
          download: false,
          upload: false,
          allowed: []
        },
        channels: {
          create: false,
          delete: false,
          edit: false,
          allowed: []
        },
        platforms: {
          create: false,
          delete: false,
          edit: false,
          allowed: []
        },
        archs: {
          create: false,
          delete: false,
          edit: false,
          allowed: []
        }
      });
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside of dropdowns
      if (!target.closest('.dropdown-container')) {
        setShowAppsDropdown(false);
        setShowChannelsDropdown(false);
        setShowPlatformsDropdown(false);
        setShowArchsDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (!password.trim()) {
      setError('Password cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(username, password, permissions);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePassword = () => {
    const length = 32;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generatedPassword = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      generatedPassword += charset[randomIndex];
    }
    
    setPassword(generatedPassword);
  };

  const handlePermissionChange = (category: string, permission: string, checked: boolean) => {
    setPermissions(prev => {
      const updated = { ...prev };
      if (category === 'apps') {
        updated.apps = {
          ...updated.apps,
          [permission]: checked
        };
      } else if (category === 'channels') {
        updated.channels = {
          ...updated.channels,
          [permission]: checked
        };
      } else if (category === 'platforms') {
        updated.platforms = {
          ...updated.platforms,
          [permission]: checked
        };
      } else if (category === 'archs') {
        updated.archs = {
          ...updated.archs,
          [permission]: checked
        };
      }
      return updated;
    });
  };
  
  const handleAllowedItemSelect = (category: string, itemId: string) => {
    setPermissions(prev => {
      const updated = { ...prev };
      if (category === 'apps') {
        if (!updated.apps.allowed.includes(itemId)) {
          updated.apps.allowed = [...updated.apps.allowed, itemId];
        }
      } else if (category === 'channels') {
        if (!updated.channels.allowed.includes(itemId)) {
          updated.channels.allowed = [...updated.channels.allowed, itemId];
        }
      } else if (category === 'platforms') {
        if (!updated.platforms.allowed.includes(itemId)) {
          updated.platforms.allowed = [...updated.platforms.allowed, itemId];
        }
      } else if (category === 'archs') {
        if (!updated.archs.allowed.includes(itemId)) {
          updated.archs.allowed = [...updated.archs.allowed, itemId];
        }
      }
      return updated;
    });
  };
  
  const handleRemoveAllowedItem = (category: string, itemId: string) => {
    setPermissions(prev => {
      const updated = { ...prev };
      if (category === 'apps') {
        updated.apps.allowed = updated.apps.allowed.filter(id => id !== itemId);
      } else if (category === 'channels') {
        updated.channels.allowed = updated.channels.allowed.filter(id => id !== itemId);
      } else if (category === 'platforms') {
        updated.platforms.allowed = updated.platforms.allowed.filter(id => id !== itemId);
      } else if (category === 'archs') {
        updated.archs.allowed = updated.archs.allowed.filter(id => id !== itemId);
      }
      return updated;
    });
  };
  
  const getNameById = (id: string, type: 'app' | 'channel' | 'platform' | 'arch') => {
    let items: any[] = [];
    
    if (type === 'app' && Array.isArray(apps)) {
      items = apps;
      return items.find(item => item.ID === id)?.AppName || id;
    } else if (type === 'channel' && Array.isArray(channels)) {
      items = channels;
      return items.find(item => item.ID === id)?.ChannelName || id;
    } else if (type === 'platform' && Array.isArray(platforms)) {
      items = platforms;
      return items.find(item => item.ID === id)?.PlatformName || id;
    } else if (type === 'arch' && Array.isArray(architectures)) {
      items = architectures;
      return items.find(item => item.ID === id)?.ArchID || id;
    }
    
    return id;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {error}</span>
            {error && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showDetails && error && (
            <div className="mt-2 text-sm bg-red-600 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      )}
      <div 
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50'
        onClick={handleBackdropClick}
      >
        <div className='bg-theme-modal-gradient p-8 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto'>
          <h2 className='text-2xl font-bold mb-4 text-theme-primary font-roboto'>
            Create New User
          </h2>
          
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <div className='mb-4'>
                <label className='block text-theme-primary mb-2 font-roboto'>Username</label>
                <input
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='w-full p-2 rounded-lg font-roboto'
                  placeholder='Enter username'
                />
              </div>
              <div className='mb-4'>
                <label className='block text-theme-primary mb-2 font-roboto'>Password</label>
                <div className='flex'>
                  <input
                    type='text'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full p-2 rounded-lg font-roboto'
                    placeholder='Enter password'
                  />
                  <button
                    type='button'
                    onClick={generatePassword}
                    className='ml-2 bg-theme-button-primary text-theme-primary px-3 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200'
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className='text-lg font-bold mb-3 text-theme-primary font-roboto'>Default Permissions</h3>
              
              <div className='mb-4'>
                <h4 className='font-bold text-theme-primary mb-2'>Apps</h4>
                <div className='grid grid-cols-2 gap-2'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.apps.create}
                      onChange={(e) => handlePermissionChange('apps', 'create', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Create</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.apps.delete}
                      onChange={(e) => handlePermissionChange('apps', 'delete', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Delete</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.apps.edit}
                      onChange={(e) => handlePermissionChange('apps', 'edit', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Edit</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.apps.download}
                      onChange={(e) => handlePermissionChange('apps', 'download', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Download</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.apps.upload}
                      onChange={(e) => handlePermissionChange('apps', 'upload', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Upload</span>
                  </label>
                </div>
                
                <div className='mt-2'>
                  <div className='relative dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setShowAppsDropdown(!showAppsDropdown)}
                      className='w-full text-left p-2 border border-theme-modal rounded-lg flex justify-between items-center'
                    >
                      <span className='text-theme-primary'>
                        {permissions.apps.allowed.length > 0 
                          ? `${permissions.apps.allowed.length} items selected` 
                          : 'Select allowed apps'}
                      </span>
                      <i className={`fas fa-chevron-${showAppsDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {showAppsDropdown && (
                      <div className='absolute z-10 mt-1 w-full bg-theme-background border border-theme-modal rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        {Array.isArray(apps) && apps.map(app => {
                          const isSelected = permissions.apps.allowed.includes(app.ID);
                          return (
                            <div 
                              key={app.ID}
                              className='p-2 hover:bg-theme-button-primary-hover cursor-pointer flex items-center bg-theme-modal'
                              onClick={() => {
                                if (isSelected) {
                                  handleRemoveAllowedItem('apps', app.ID);
                                } else {
                                  handleAllowedItemSelect('apps', app.ID);
                                }
                              }}
                            >
                              <input
                                type='checkbox'
                                checked={isSelected}
                                onChange={() => {}}
                                className='mr-2'
                              />
                              <span className='text-theme-text'>{app.AppName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {permissions.apps.allowed.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {permissions.apps.allowed.map(id => (
                        <div 
                          key={id}
                          className='bg-theme-button-primary text-theme-primary px-2 py-1 rounded-lg flex items-center'
                        >
                          <span>{getNameById(id, 'app')}</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveAllowedItem('apps', id)}
                            className='ml-2 text-theme-primary hover:text-theme-danger'
                          >
                            <i className='fas fa-times'></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className='mb-4'>
                <h4 className='font-bold text-theme-primary mb-2'>Channels</h4>
                <div className='grid grid-cols-2 gap-2'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.channels.create}
                      onChange={(e) => handlePermissionChange('channels', 'create', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Create</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.channels.delete}
                      onChange={(e) => handlePermissionChange('channels', 'delete', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Delete</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.channels.edit}
                      onChange={(e) => handlePermissionChange('channels', 'edit', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Edit</span>
                  </label>
                </div>
                
                <div className='mt-2'>
                  <div className='relative dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setShowChannelsDropdown(!showChannelsDropdown)}
                      className='w-full text-left p-2 border border-theme-modal rounded-lg flex justify-between items-center'
                    >
                      <span className='text-theme-primary'>
                        {permissions.channels.allowed.length > 0 
                          ? `${permissions.channels.allowed.length} items selected` 
                          : 'Select allowed channels'}
                      </span>
                      <i className={`fas fa-chevron-${showChannelsDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {showChannelsDropdown && (
                      <div className='absolute z-10 mt-1 w-full bg-theme-background border border-theme-modal rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        {Array.isArray(channels) && channels.map(channel => (
                          <div 
                            key={channel.ID}
                            className='p-2 hover:bg-theme-button-primary-hover cursor-pointer flex items-center bg-theme-modal'
                            onClick={() => handleAllowedItemSelect('channels', channel.ID)}
                          >
                            <input
                              type='checkbox'
                              checked={permissions.channels.allowed.includes(channel.ID)}
                              onChange={() => {}}
                              className='mr-2'
                            />
                            <span className='text-theme-text'>{channel.ChannelName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {permissions.channels.allowed.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {permissions.channels.allowed.map(id => (
                        <div 
                          key={id}
                          className='bg-theme-button-primary text-theme-primary px-2 py-1 rounded-lg flex items-center'
                        >
                          <span>{getNameById(id, 'channel')}</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveAllowedItem('channels', id)}
                            className='ml-2 text-theme-primary hover:text-theme-danger'
                          >
                            <i className='fas fa-times'></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className='mb-4'>
                <h4 className='font-bold text-theme-primary mb-2'>Platforms</h4>
                <div className='grid grid-cols-2 gap-2'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.platforms.create}
                      onChange={(e) => handlePermissionChange('platforms', 'create', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Create</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.platforms.delete}
                      onChange={(e) => handlePermissionChange('platforms', 'delete', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Delete</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.platforms.edit}
                      onChange={(e) => handlePermissionChange('platforms', 'edit', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Edit</span>
                  </label>
                </div>
                
                <div className='mt-2'>
                  <div className='relative dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setShowPlatformsDropdown(!showPlatformsDropdown)}
                      className='w-full text-left p-2 border border-theme-modal rounded-lg flex justify-between items-center'
                    >
                      <span className='text-theme-primary'>
                        {permissions.platforms.allowed.length > 0 
                          ? `${permissions.platforms.allowed.length} items selected` 
                          : 'Select allowed platforms'}
                      </span>
                      <i className={`fas fa-chevron-${showPlatformsDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {showPlatformsDropdown && (
                      <div className='absolute z-10 mt-1 w-full bg-theme-background border border-theme-modal rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        {Array.isArray(platforms) && platforms.map(platform => (
                          <div 
                            key={platform.ID}
                            className='p-2 hover:bg-theme-button-primary-hover cursor-pointer flex items-center bg-theme-modal'
                            onClick={() => handleAllowedItemSelect('platforms', platform.ID)}
                          >
                            <input
                              type='checkbox'
                              checked={permissions.platforms.allowed.includes(platform.ID)}
                              onChange={() => {}}
                              className='mr-2'
                            />
                            <span className='text-theme-text'>{platform.PlatformName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {permissions.platforms.allowed.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {permissions.platforms.allowed.map(id => (
                        <div 
                          key={id}
                          className='bg-theme-button-primary text-theme-primary px-2 py-1 rounded-lg flex items-center'
                        >
                          <span>{getNameById(id, 'platform')}</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveAllowedItem('platforms', id)}
                            className='ml-2 text-theme-primary hover:text-theme-danger'
                          >
                            <i className='fas fa-times'></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className='mb-4'>
                <h4 className='font-bold text-theme-primary mb-2'>Architectures</h4>
                <div className='grid grid-cols-2 gap-2'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.archs.create}
                      onChange={(e) => handlePermissionChange('archs', 'create', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Create</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.archs.delete}
                      onChange={(e) => handlePermissionChange('archs', 'delete', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Delete</span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={permissions.archs.edit}
                      onChange={(e) => handlePermissionChange('archs', 'edit', e.target.checked)}
                      className='mr-2'
                    />
                    <span className='text-theme-primary'>Edit</span>
                  </label>
                </div>
                
                <div className='mt-2'>
                  <div className='relative dropdown-container'>
                    <button
                      type='button'
                      onClick={() => setShowArchsDropdown(!showArchsDropdown)}
                      className='w-full text-left p-2 border border-theme-modal rounded-lg flex justify-between items-center'
                    >
                      <span className='text-theme-primary'>
                        {permissions.archs.allowed.length > 0 
                          ? `${permissions.archs.allowed.length} items selected` 
                          : 'Select allowed architectures'}
                      </span>
                      <i className={`fas fa-chevron-${showArchsDropdown ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {showArchsDropdown && (
                      <div className='absolute z-10 mt-1 w-full bg-theme-background border border-theme-modal rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        {Array.isArray(architectures) && architectures.map(arch => (
                          <div 
                            key={arch.ID}
                            className='p-2 hover:bg-theme-button-primary-hover cursor-pointer flex items-center bg-theme-modal'
                            onClick={() => handleAllowedItemSelect('archs', arch.ID)}
                          >
                            <input
                              type='checkbox'
                              checked={permissions.archs.allowed.includes(arch.ID)}
                              onChange={() => {}}
                              className='mr-2'
                            />
                            <span className='text-theme-text'>{arch.ArchID}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {permissions.archs.allowed.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-2'>
                      {permissions.archs.allowed.map(id => (
                        <div 
                          key={id}
                          className='bg-theme-button-primary text-theme-primary px-2 py-1 rounded-lg flex items-center'
                        >
                          <span>{getNameById(id, 'arch')}</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveAllowedItem('archs', id)}
                            className='ml-2 text-theme-primary hover:text-theme-danger'
                          >
                            <i className='fas fa-times'></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className='flex justify-end mt-6'>
            <button
              type='button'
              onClick={onClose}
              className='bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200'>
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={isSaving || !username.trim() || !password.trim()}
              className='bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 