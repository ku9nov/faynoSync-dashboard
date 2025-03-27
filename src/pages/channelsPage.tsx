import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreateChannelModal } from '../components/CreateChannelModal';
import { EditChannelModal } from '../components/EditChannelModal';
import { ChannelCard } from '../components/ChannelCard';

export const ChannelsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedChannel, setSelectedChannel] = React.useState<string | null>(null);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  const openEditModal = (channel: string) => {
    setSelectedChannel(channel);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedChannel(null);
    setIsEditModalOpen(false);
  };

  const channels = [
    { name: 'nightly', description: 'Nightly build channel' },
    { name: 'stable', description: 'Stable release channel' },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.name}
                name={channel.name}
                description={channel.description}
                onClick={() => openEditModal(channel.name)}
              />
            ))}
          </div>
        </main>
      </div>

      {isCreateModalOpen && (
        <CreateChannelModal onClose={closeCreateModal} />
      )}

      {isEditModalOpen && selectedChannel && (
        <EditChannelModal
          channelName={selectedChannel}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
}; 