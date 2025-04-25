import React, { useState, useEffect } from 'react';
import { useUsersQuery } from '../hooks/use-query/useUsersQuery';
import { useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { useAdminUpdateQuery } from '../hooks/use-query/useAdminUpdateQuery';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useUsersQuery();
  const { apps, refetch: refetchApps } = useAppsQuery();
  const { channels, refetch: refetchChannels } = useChannelQuery();
  const { platforms, refetch: refetchPlatforms } = usePlatformQuery();
  const { architectures, refetch: refetchArchitectures } = useArchitectureQuery();
  const { updateAdmin, isLoading: isUpdatingAdmin } = useAdminUpdateQuery();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Refresh data when modal is opened
  useEffect(() => {
    refetchUser();
    refetchApps();
    refetchChannels();
    refetchPlatforms();
    refetchArchitectures();

  }, [refetchUser, refetchApps, refetchChannels, refetchPlatforms, refetchArchitectures]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
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
    
    setNewPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Password copied to clipboard!');
        setTimeout(() => setCopySuccess(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      if (!userData) {
        setPasswordError('User data not available');
        return;
      }

      await updateAdmin({
        id: userData.id,
        username: userData.username,
        password: newPassword
      });

      setPasswordSuccess('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close the modal after a short delay to allow the user to see the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    }
  };

  // Helper function to get name by ID
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

  if (userLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-theme-modal-gradient rounded-lg p-8 w-[500px] max-h-[80vh] overflow-y-auto relative">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-theme-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-theme-modal-gradient rounded-lg p-8 w-[600px] max-h-[80vh] overflow-y-auto relative z-[99999]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-primary hover:text-theme-primary-hover"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-theme-primary mb-6 font-roboto">User Profile</h2>

        {userData && (
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-theme-button-primary rounded-full flex items-center justify-center mr-4">
                <i className={`fas ${userData.is_admin ? 'fa-crown text-yellow-500 text-2xl' : 'fa-user text-blue-500 text-2xl'}`}></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-primary">{userData.username}</h3>
                <p className="text-theme-modal-text">
                  {userData.is_admin ? 'Administrator' : 'Team User'}
                </p>
                {!userData.is_admin && userData.owner && (
                  <p className="text-theme-modal-text text-sm">
                    Owner: {userData.owner}
                  </p>
                )}
              </div>
            </div>

            {userData.is_admin ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-theme-primary mb-3">Change Password</h3>
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-3">
                    <label className="block text-theme-primary mb-1 font-roboto">New Password</label>
                    <div className="flex">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-theme-input text-theme-primary font-roboto"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="ml-2 bg-theme-button-primary text-theme-primary px-3 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200"
                      >
                        Generate
                      </button>
                      {newPassword && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(newPassword)}
                          className="ml-2 bg-theme-button-primary text-theme-primary px-3 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-theme-primary mb-1 font-roboto">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-theme-input text-theme-primary font-roboto"
                      required
                    />
                  </div>
                  {passwordError && (
                    <div className="mb-3 text-red-500">{passwordError}</div>
                  )}
                  {passwordSuccess && (
                    <div className="mb-3 text-green-500">{passwordSuccess}</div>
                  )}
                  {copySuccess && (
                    <div className="mb-3 text-green-500">{copySuccess}</div>
                  )}
                  <button
                    type="submit"
                    className="bg-theme-button-submit text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-submit-hover transition-colors duration-200"
                    disabled={isUpdatingAdmin}
                  >
                    {isUpdatingAdmin ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Changing Password...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>
            ) : userData.permissions && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-theme-primary mb-3">Permissions</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-theme-input bg-opacity-50 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-theme-button-primary text-theme-primary">
                          <th className="px-4 py-2 text-left">Resource</th>
                          <th className="px-4 py-2 text-left">Create</th>
                          <th className="px-4 py-2 text-left">Edit</th>
                          <th className="px-4 py-2 text-left">Delete</th>
                          <th className="px-4 py-2 text-left">Allowed Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(userData.permissions).map(([resource, permissions]: [string, any]) => (
                          <tr key={resource} className="border-t border-theme-modal">
                            <td className="px-4 py-2 text-theme-primary font-medium">{resource}</td>
                            <td className="px-4 py-2 text-theme-primary">
                              {permissions.Create ? (
                                <i className="fas fa-check text-green-500"></i>
                              ) : (
                                <i className="fas fa-times text-red-500"></i>
                              )}
                            </td>
                            <td className="px-4 py-2 text-theme-primary">
                              {permissions.Edit ? (
                                <i className="fas fa-check text-green-500"></i>
                              ) : (
                                <i className="fas fa-times text-red-500"></i>
                              )}
                            </td>
                            <td className="px-4 py-2 text-theme-primary">
                              {permissions.Delete ? (
                                <i className="fas fa-check text-green-500"></i>
                              ) : (
                                <i className="fas fa-times text-red-500"></i>
                              )}
                            </td>
                            <td className="px-4 py-2 text-theme-primary">
                              {permissions.Allowed && permissions.Allowed.length > 0 ? (
                                <div className="max-h-20 overflow-y-auto">
                                  {permissions.Allowed.map((id: string) => {
                                    let type: 'app' | 'channel' | 'platform' | 'arch' = 'app';
                                    if (resource === 'Channels') type = 'channel';
                                    if (resource === 'Platforms') type = 'platform';
                                    if (resource === 'Archs') type = 'arch';
                                    
                                    return (
                                      <div key={id} className="text-sm">
                                        {getNameById(id, type)}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {userData.permissions.Apps && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-theme-primary mb-3">File Actions</h3>
                    <div className="bg-theme-input bg-opacity-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-theme-primary font-medium mr-2">Upload:</span>
                        <span className="text-theme-modal-text">
                          {userData.permissions.Apps.Upload ? (
                            <i className="fas fa-check text-green-500"></i>
                          ) : (
                            <i className="fas fa-times text-red-500"></i>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-theme-primary font-medium mr-2">Download:</span>
                        <span className="text-theme-modal-text">
                          {userData.permissions.Apps.Download ? (
                            <i className="fas fa-check text-green-500"></i>
                          ) : (
                            <i className="fas fa-times text-red-500"></i>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 