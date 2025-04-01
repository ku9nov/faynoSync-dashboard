import React from 'react';

interface ActionIconsProps {
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDownload?: boolean;
}

export const ActionIcons: React.FC<ActionIconsProps> = ({
  onDownload,
  onEdit,
  onDelete,
  showDownload = true,
}) => {
  return (
    <div className="absolute top-2 right-2 flex gap-2">
      {showDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-2 text-green-500 hover:text-green-600 transition-colors duration-200"
        >
          <i className="fas fa-download"></i>
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
      >
        <i className="fas fa-edit"></i>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 text-red-500 hover:text-red-600 transition-colors duration-200"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
}; 