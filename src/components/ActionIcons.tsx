import React, { useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { copyToClipboard } from '../utils/clipboard';

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
  const [copyError, setCopyError] = useState<string | null>(null);

  // Cleanup function to remove any temporary elements
  useEffect(() => {
    return () => {
      const tempElements = document.querySelectorAll('.temp-clipboard-element');
      tempElements.forEach(el => el.remove());
    };
  }, []);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopyError(null);
    if (artifactLink) {
      try {
        // First try to fetch the signed URL
        const response = await axiosInstance.get(artifactLink);
        
        // Check if the response is JSON with a download_url
        const urlToCopy = response.data && typeof response.data === 'object' && 'download_url' in response.data
          ? response.data.download_url
          : artifactLink;
        
        const success = await copyToClipboard(urlToCopy);
        
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          setCopyError('Failed to copy link. Please try selecting and copying manually.');
          setTimeout(() => setCopyError(null), 3000);
        }
      } catch (err) {
        // If there's an error, try to copy the original link
        try {
          const success = await copyToClipboard(artifactLink);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            setCopyError('Failed to copy link. Please try selecting and copying manually.');
            setTimeout(() => setCopyError(null), 3000);
          }
        } catch (clipboardErr) {
          console.error('Failed to copy link:', clipboardErr);
          setCopyError('Failed to copy link. Please try selecting and copying manually.');
          setTimeout(() => setCopyError(null), 3000);
        }
      }
    }
  };

  return (
    <div className="flex gap-2 flex-shrink-0 relative">
      {copyError && (
        <div className="absolute bottom-full mb-2 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-500 text-sm whitespace-nowrap">
          {copyError}
        </div>
      )}
      {showDownload && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-2 text-green-500 hover:text-green-600 transition-colors duration-200 flex-shrink-0"
            title="Download"
          >
            <i className="fas fa-download"></i>
          </button>
          {artifactLink && (
            <button
              onClick={handleCopyLink}
              className="p-2 text-theme-secondary hover:text-theme-primary transition-colors duration-200 flex-shrink-0"
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
        className="p-2 text-theme-primary hover:text-theme-primary-hover transition-colors duration-200 flex-shrink-0"
        title="Edit"
      >
        <i className="fas fa-edit"></i>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-2 text-theme-danger hover:text-theme-primary-hover transition-colors duration-200 flex-shrink-0"
        title="Delete"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
}; 