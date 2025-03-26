import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreateArchitectureModal } from '../components/CreateArchitectureModal';
import { EditArchitectureModal } from '../components/EditArchitectureModal';
import { ArchitectureCard } from '../components/ArchitectureCard';

interface Architecture {
  name: string;
}

export const ArchitecturesPage = () => {
  const [createArchitectureOpen, setCreateArchitectureOpen] = React.useState(false);
  const [selectedArchitecture, setSelectedArchitecture] = React.useState<Architecture | null>(null);

  const openCreateArchitecture = () => setCreateArchitectureOpen(true);
  const closeCreateArchitecture = () => setCreateArchitectureOpen(false);

  const selectArchitecture = (architecture: Architecture) => setSelectedArchitecture(architecture);

  const architectures = [
    { name: 'x86' },
    { name: 'x64' },
    { name: 'arm64' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar activePage="architectures" />
        <main className="flex-1 p-8">
          <Header
            title="Architectures"
            onCreateClick={openCreateArchitecture}
            createButtonText="Create Architecture"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {architectures.map((architecture) => (
              <ArchitectureCard
                key={architecture.name}
                architecture={architecture}
                onClick={() => selectArchitecture(architecture)}
              />
            ))}
          </div>
        </main>
      </div>

      {createArchitectureOpen && (
        <CreateArchitectureModal onClose={closeCreateArchitecture} />
      )}

      {selectedArchitecture && (
        <EditArchitectureModal
          architecture={selectedArchitecture}
          onClose={() => setSelectedArchitecture(null)}
        />
      )}
    </div>
  );
}; 