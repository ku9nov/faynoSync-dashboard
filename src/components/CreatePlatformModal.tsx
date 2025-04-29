import React from 'react';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { CreateEntityModal } from './common/CreateEntityModal';

interface CreatePlatformModalProps {
  onClose: () => void;
}

export const CreatePlatformModal: React.FC<CreatePlatformModalProps> = ({ onClose }) => {
  const { createPlatform } = usePlatformQuery();

  return (
    <CreateEntityModal
      onClose={onClose}
      title="Create Platform"
      entityName="Platform Name"
      onSubmit={createPlatform}
    />
  );
}; 