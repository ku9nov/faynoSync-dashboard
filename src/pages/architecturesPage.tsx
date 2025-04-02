import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { CreateArchitectureModal } from '../components/CreateArchitectureModal';
import { EditArchitectureModal } from '../components/EditArchitectureModal';
import { ArchitectureCard } from '../components/ArchitectureCard';
import { DeleteArchitectureConfirmationModal } from '../components/DeleteArchitectureConfirmationModal';
import { useArchitectureQuery, Architecture } from '../hooks/use-query/useArchitectureQuery.ts';

export const ArchitecturesPage = () => {
  const [createArchitectureOpen, setCreateArchitectureOpen] =
    React.useState(false);

  const [selectedArchitecture, setSelectedArchitecture] = React.useState<
    { id: string; name: string } | null
  >(null);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = React.useState(false);
  const [architectureToDelete, setArchitectureToDelete] = React.useState<{ id: string; name: string } | null>(null);

  const openCreateArchitecture = () => setCreateArchitectureOpen(true);
  const closeCreateArchitecture = () => setCreateArchitectureOpen(false);

  const selectArchitecture = (architecture: Architecture) =>
    setSelectedArchitecture({ id: architecture.ID, name: architecture.ArchID });

  const { architectures, deleteArchitecture, isLoading } = useArchitectureQuery();

  const handleDelete = async (archId: string, archName: string) => {
    setArchitectureToDelete({ id: archId, name: archName });
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (architectureToDelete) {
      try {
        await deleteArchitecture(architectureToDelete.id);
        setDeleteConfirmationOpen(false);
        setArchitectureToDelete(null);
      } catch (error) {
        console.error('Error deleting architecture:', error);
        throw error;
      }
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto'>
      <div className='flex'>
        <Sidebar />
        <main className='flex-1 p-8'>
          <Header
            title='Architectures'
            onCreateClick={openCreateArchitecture}
            createButtonText='Create Architecture'
          />
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : architectures.length === 0 ? (
            <div className="text-center text-white text-xl mt-8">
              No architecture has been created yet.
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {architectures.map((architecture: Architecture) => (
                <ArchitectureCard
                  key={architecture.ID}
                  archName={architecture.ArchID}
                  onClick={() => selectArchitecture(architecture)}
                  onDelete={() => handleDelete(architecture.ID, architecture.ArchID)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {createArchitectureOpen && (
        <CreateArchitectureModal onClose={closeCreateArchitecture} />
      )}

      {selectedArchitecture && (
        <EditArchitectureModal
          archName={selectedArchitecture.name}
          archId={selectedArchitecture.id}
          onClose={() => setSelectedArchitecture(null)}
        />
      )}

      {deleteConfirmationOpen && architectureToDelete && (
        <DeleteArchitectureConfirmationModal
          architectureId={architectureToDelete.id}
          architectureName={architectureToDelete.name}
          onClose={() => {
            setDeleteConfirmationOpen(false);
            setArchitectureToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
