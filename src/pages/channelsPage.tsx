import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { EditChannelModal } from '../components/EditChannelModal';
import { ChannelCard } from '../components/ChannelCard';
import { DeleteChannelConfirmationModal } from '../components/DeleteChannelConfirmationModal';
import { useChannelQuery, Channel } from '../hooks/use-query/useChannelQuery';

export const ChannelsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState<Channel | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = React.useState(false);
  const [channelToDelete, setChannelToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  const openEditModal = (channel: Channel) => {
    setSelectedChannel(channel);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedChannel(null);
    setIsEditModalOpen(false);
  };

  const { channels, deleteChannel } = useChannelQuery();

  const handleDelete = async (channelId: string, channelName: string) => {
    setChannelToDelete({ id: channelId, name: channelName });
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (channelToDelete) {
      try {
        await deleteChannel(channelToDelete.id);
        setDeleteConfirmationOpen(false);
        setChannelToDelete(null);
      } catch (error) {
        console.error('Error deleting channel:', error);
        throw error;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Header
            title="Channels"
            onCreateClick={openCreateModal}
            createButtonText="Create Channel"
          />
          {channels.length === 0 ? (
            <div className="text-center text-white text-xl mt-8">
              No channels has been created yet.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.ID}
                name={channel.ChannelName}
                // description={`Last updated: ${new Date(channel.Updated_at).toLocaleDateString()}`}
                onClick={() => openEditModal(channel)}
                onDelete={() => handleDelete(channel.ID, channel.ChannelName)}
              />
            ))}
          </div>
          )}
        </main>
      </div>

      {isCreateModalOpen && (
        <CreateChannelModal onClose={closeCreateModal} />
      )}

      {isEditModalOpen && selectedChannel && (
        <EditChannelModal
          channelName={selectedChannel.ChannelName}
          channelId={selectedChannel.ID}
          onClose={closeEditModal}
        />
      )}

      {deleteConfirmationOpen && channelToDelete && (
        <DeleteChannelConfirmationModal
          channelId={channelToDelete.id}
          channelName={channelToDelete.name}
          onClose={() => {
            setDeleteConfirmationOpen(false);
            setChannelToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}; 