import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreateArchitectureModal } from '../components/CreateArchitectureModal';
import { EditArchitectureModal } from '../components/EditArchitectureModal';
import { ArchitectureCard } from '../components/ArchitectureCard';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery.ts';

export const ArchitecturesPage = () => {
  const [createArchitectureOpen, setCreateArchitectureOpen] =
    React.useState(false);

  const [selectedArchitecture, setSelectedArchitecture] = React.useState<
    string | null
  >(null);

  const openCreateArchitecture = () => setCreateArchitectureOpen(true);
  const closeCreateArchitecture = () => setCreateArchitectureOpen(false);

  const selectArchitecture = (architecture: string) =>
    setSelectedArchitecture(architecture);

  const { architectures } = useArchitectureQuery();

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto'>
      <div className='flex'>
        <Sidebar activePage='architectures' />
        <main className='flex-1 p-8'>
          <Header
            title='Architectures'
            onCreateClick={openCreateArchitecture}
            createButtonText='Create Architecture'
          />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {architectures.map((architecture) => (
              <ArchitectureCard
                key={architecture.ID}
                archName={architecture.ArchID}
                onClick={() => selectArchitecture(architecture.ArchID)}
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
          archName={selectedArchitecture}
          onClose={() => setSelectedArchitecture(null)}
        />
      )}
    </div>
  );
};
