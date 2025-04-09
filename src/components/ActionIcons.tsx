import React, { useState } from 'react';

interface ActionIconsProps {
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDownload?: boolean;
  artifactLink?: string;
}

export const ActionIcons: React.FC<ActionIconsProps> = ({
  onDownload,
  onEdit,
  onDelete,
  showDownload = true,
  artifactLink,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (artifactLink) {
      try {
        await navigator.clipboard.writeText(artifactLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  return (
    <div className="absolute top-2 right-2 flex gap-2">
      {showDownload && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2 text-green-500 hover:text-green-600 transition-colors duration-200"
            title="Download"
          >
            <i className="fas fa-download"></i>
          </button>
          {artifactLink && (
            <button
              onClick={handleCopyLink}
              className="p-2 text-purple-500 hover:text-purple-600 transition-colors duration-200"
              title={copied ? "Copied!" : "Copy link"}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            </button>
          )}
        </>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-2 text-blue-500 hover:text-blue-600 transition-colors duration-200"
        title="Edit"
      >
        <i className="fas fa-edit"></i>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 text-red-500 hover:text-red-600 transition-colors duration-200"
        title="Delete"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
}; 