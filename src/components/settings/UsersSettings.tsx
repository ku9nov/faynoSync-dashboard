import React, { useState } from 'react';
import { useUsersListQuery } from '../../hooks/use-query/useUsersListQuery';
import { useAppsQuery } from '../../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../../hooks/use-query/useArchitectureQuery';
import { AllowedItemsModal } from './AllowedItemsModal';

export const UsersSettings: React.FC = () => {
  const { data: usersData, isLoading, error } = useUsersListQuery();
  const { apps } = useAppsQuery();
  const { channels } = useChannelQuery();
  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();

  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalItems, setModalItems] = useState<{ id: string; name: string }[]>([]);
  const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);
  const [modalType, setModalType] = useState<'app' | 'channel' | 'platform' | 'arch'>('app');
  const [currentUserId, setCurrentUserId] = useState<string>('');

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

  // Helper function to get all items for a specific type
  const getAllItemsForType = (type: 'app' | 'channel' | 'platform' | 'arch') => {
    let items: any[] = [];
    
    if (type === 'app' && Array.isArray(apps)) {
      return apps.map(app => ({ id: app.ID, name: app.AppName }));
    } else if (type === 'channel' && Array.isArray(channels)) {
      return channels.map(channel => ({ id: channel.ID, name: channel.ChannelName }));
    } else if (type === 'platform' && Array.isArray(platforms)) {
      return platforms.map(platform => ({ id: platform.ID, name: platform.PlatformName }));
    } else if (type === 'arch' && Array.isArray(architectures)) {
      return architectures.map(arch => ({ id: arch.ID, name: arch.ArchID }));
    }
    
    return [];
  };

  // Helper function to get valid allowed items count
  const getAllowedCount = (allowed: string[] | undefined): number => {
    if (!allowed || allowed.length === 0) return 0;
    
    // Filter out empty strings
    const validItems = allowed.filter(id => id && id.trim() !== '');
    return validItems.length;
  };

  // Function to truncate username if it's longer than 9 characters
  const truncateUsername = (username: string): string => {
    if (username.length > 9) {
      return username.substring(0, 9) + '...';
    }
    return username;
  };

  // Function to open the modal
  const openAllowedModal = (
    userId: string,
    type: 'app' | 'channel' | 'platform' | 'arch',
    allowedIds: string[]
  ) => {
    setCurrentUserId(userId);
    setModalType(type);
    
    // Filter out empty strings
    const validIds = allowedIds.filter(id => id && id.trim() !== '');
    setModalSelectedIds(validIds);
    
    // Set title based on type
    const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
    setModalTitle(`Allowed ${typeTitle}s`);
    
    // Set items based on type
    setModalItems(getAllItemsForType(type));
    
    // Open modal
    setModalOpen(true);
  };

  // Function to handle saving allowed items
  const handleSaveAllowedItems = (selectedIds: string[]) => {
    // Here you would typically update the user's permissions in your backend
    console.log(`Saving ${selectedIds.length} allowed items for user ${currentUserId} and type ${modalType}`);
    
    // For now, we'll just log the changes
    // In a real implementation, you would call an API to update the user's permissions
  };

  // Function to handle saving user permissions
  const handleSaveUserPermissions = (userId: string) => {
    console.log(`Saving permissions for user ${userId}`);
    // Here you would implement the logic to save user permissions
  };

  // Function to handle deleting user
  const handleDeleteUser = (userId: string) => {
    console.log(`Deleting user ${userId}`);
    // Here you would implement the logic to delete a user
  };

  // Add the handleEditUser function near other handler functions
  const handleEditUser = (userId: string) => {
    console.log(`Editing user ${userId}`);
    // Here you would implement the logic to edit a user
  };

  if (isLoading) {
    return <div className="text-theme-primary">Loading...</div>;
  }

  if (error) {
    return <div className="text-theme-danger">Error loading users data</div>;
  }

  if (!usersData?.users) {
    return <div className="text-theme-primary">No users found</div>;
  }

  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full rounded-lg border border-theme-modal">
        <thead>
          <tr className="border-b border-theme-modal">
            <th className="px-2 py-1 text-left text-theme-primary border-r border-theme-modal">Username</th>
            <th className="px-2 py-1 text-center text-theme-primary border-r border-theme-modal" colSpan={6}>
              Apps
            </th>
            <th className="px-2 py-1 text-center text-theme-primary border-r border-theme-modal" colSpan={4}>
              Channels
            </th>
            <th className="px-2 py-1 text-center text-theme-primary border-r border-theme-modal" colSpan={4}>
              Platforms
            </th>
            <th className="px-2 py-1 text-center text-theme-primary" colSpan={4}>
              Archs
            </th>
            <th className="px-2 py-1 text-center text-theme-primary border-l border-theme-modal">
              Actions
            </th>
          </tr>
          <tr className="border-b border-theme-modal">
            <th className="px-2 py-1 border-r border-theme-modal"></th>
            {/* Apps subheaders */}
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Create</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Delete</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Edit</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Download</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Upload</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Allowed</div>
            </th>
            {/* Channels subheaders */}
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Create</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Delete</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Edit</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Allowed</div>
            </th>
            {/* Platforms subheaders */}
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Create</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Delete</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Edit</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Allowed</div>
            </th>
            {/* Archs subheaders */}
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Create</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Delete</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary border-r border-theme-modal">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Edit</div>
            </th>
            <th className="min-w-[40px] w-10 h-32 text-center text-theme-primary">
              <div className="transform -rotate-90 whitespace-nowrap h-full flex items-center justify-center">Allowed</div>
            </th>
            <th className="px-2 py-1 text-center text-theme-primary border-l border-theme-modal"></th>
          </tr>
        </thead>
        <tbody>
          {usersData.users.map((user) => (
            <tr key={user.id} className="border-b border-theme-modal">
              <td className="px-2 py-1 text-theme-primary border-r border-theme-modal">
                <div 
                  className="truncate max-w-[100px]" 
                  title={user.username}
                >
                  {truncateUsername(user.username)}
                </div>
              </td>
              {/* Apps permissions */}
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Apps?.Create ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Apps?.Delete ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Apps?.Edit ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Apps?.Download ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Apps?.Upload ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <button 
                  onClick={() => openAllowedModal(user.id, 'app', user.permissions.Apps?.Allowed || [])}
                  className="flex items-center justify-center text-theme-primary hover:text-theme-button-primary"
                >
                  <i className="fas fa-search"></i>
                  <span>{getAllowedCount(user.permissions.Apps?.Allowed)}</span>
                </button>
              </td>
              {/* Channels permissions */}
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Channels?.Create ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Channels?.Delete ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Channels?.Edit ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <button 
                  onClick={() => openAllowedModal(user.id, 'channel', user.permissions.Channels?.Allowed || [])}
                  className="flex items-center justify-center text-theme-primary hover:text-theme-button-primary"
                >
                  <i className="fas fa-search"></i>
                  <span>{getAllowedCount(user.permissions.Channels?.Allowed)}</span>
                </button>
              </td>
              {/* Platforms permissions */}
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Platforms?.Create ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Platforms?.Delete ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Platforms?.Edit ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <button 
                  onClick={() => openAllowedModal(
                    user.id, 
                    'platform', 
                    user.permissions.Platforms?.Allowed || []
                  )}
                  className="flex items-center justify-center space-x-1 text-theme-primary hover:text-theme-button-primary"
                >
                  <i className="fas fa-search"></i>
                  <span>{getAllowedCount(user.permissions.Platforms?.Allowed)}</span>
                </button>
              </td>
              {/* Archs permissions */}
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Archs?.Create ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Archs?.Delete ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center border-r border-theme-modal">
                <i className={`fas fa-${user.permissions.Archs?.Edit ? 'check text-green-500' : 'times text-red-500'}`}></i>
              </td>
              <td className="w-10 px-2 py-1 text-center">
                <button 
                  onClick={() => openAllowedModal(user.id, 'arch', user.permissions.Archs?.Allowed || [])}
                  className="flex items-center justify-center text-theme-primary hover:text-theme-button-primary"
                >
                  <i className="fas fa-search"></i>
                  <span>{getAllowedCount(user.permissions.Archs?.Allowed)}</span>
                </button>
              </td>
              {/* Action buttons */}
              <td className="px-2 py-1 text-center border-l border-theme-modal">
                <div className="flex justify-center space-x-2">
                  <button 
                    onClick={() => handleSaveUserPermissions(user.id)}
                    className="text-theme-primary hover:text-green-500"
                    title="Save user permissions"
                  >
                    <i className="fas fa-save"></i>
                  </button>
                  <button 
                    onClick={() => handleEditUser(user.id)}
                    className="text-theme-primary hover:text-blue-500"
                    title="Edit user"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-theme-primary hover:text-red-500"
                    title="Delete user"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for editing allowed items */}
      <AllowedItemsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        items={modalItems}
        selectedIds={modalSelectedIds}
        onSave={handleSaveAllowedItems}
      />
    </div>
  );
}; 