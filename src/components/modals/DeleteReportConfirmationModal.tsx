import React, { useState } from 'react';
import { useBackdropClose } from '../../hooks/useBackdropClose';
import { ReportGroup } from '@/hooks/use-query/useReportsQuery';

interface DeleteReportConfirmationModalProps {
  group: ReportGroup;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const formatLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const DeleteReportConfirmationModal: React.FC<DeleteReportConfirmationModalProps> = ({
  group,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const backdropProps = useBackdropClose(onClose);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high"
      {...backdropProps}
    >
      <div className="bg-theme-modal-gradient p-8 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">Delete Report Group</h2>
          <button
            onClick={onClose}
            className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-theme-primary mb-2 font-semibold">
          Permanently delete this report group?
        </p>
        <p className="text-theme-secondary text-sm mb-2">
          {group.application.name} v{group.application.version} · {formatLabel(group.event.type)} / {formatLabel(group.event.reason)}
        </p>
        <p className="text-red-400 text-sm mb-6">
          This removes the group, its detail blobs and the stored S3 objects. This action cannot be undone.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-300 transition-all duration-150 mr-2 border border-gray-300 shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-red-600 text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-red-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ml-2 shadow-sm"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
