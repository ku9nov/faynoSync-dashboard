import React from 'react';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { EditModal } from './common/EditEntityModal';

interface Platform {
  name: string;
}

interface EditPlatformModalProps {
  platform: Platform;
  platformId: string;
  onClose: () => void;
}

export const EditPlatformModal: React.FC<EditPlatformModalProps> = ({
  platform,
  platformId,
  onClose,
}) => {
  const { updatePlatform } = usePlatformQuery();

  const handleUpdate = async (newName: string) => {
    await updatePlatform(platformId, newName);
  };

  return (
    <EditModal
      title="Edit Platform"
      label="Rename Platform"
      initialName={platform.name}
      onClose={onClose}
      onUpdate={handleUpdate}
    />
  );
}; 