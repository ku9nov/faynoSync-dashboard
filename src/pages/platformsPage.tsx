import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreatePlatformModal } from '../components/CreatePlatformModal';
import { EditPlatformModal } from '../components/EditPlatformModal';
import { PlatformCard } from '../components/PlatformCard';
import { usePlatformQuery, Platform } from '../hooks/use-query/usePlatformQuery';

export const PlatformsPage = () => {
  const [createPlatformOpen, setCreatePlatformOpen] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform | null>(null);

  const openCreatePlatform = () => setCreatePlatformOpen(true);
  const closeCreatePlatform = () => setCreatePlatformOpen(false);

  const selectPlatform = (platform: Platform) => setSelectedPlatform(platform);

  const { platforms, deletePlatform } = usePlatformQuery();

  const handleDelete = async (platformName: string) => {
    try {
      await deletePlatform(platformName);
    } catch (error) {
      console.error('Error deleting platform:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Header
            title="Platforms"
            onCreateClick={openCreatePlatform}
            createButtonText="Create Platform"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform) => (
              <PlatformCard
                key={platform.ID}
                platform={{ name: platform.PlatformName }}
                onClick={() => selectPlatform(platform)}
                onDelete={() => handleDelete(platform.PlatformName)}
              />
            ))}
          </div>
        </main>
      </div>

      {createPlatformOpen && (
        <CreatePlatformModal onClose={closeCreatePlatform} />
      )}

      {selectedPlatform && (
        <EditPlatformModal
          platform={{ name: selectedPlatform.PlatformName }}
          onClose={() => setSelectedPlatform(null)}
        />
      )}
    </div>
  );
}; 