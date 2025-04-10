import React, { useState } from 'react';
import axiosInstance from '../config/axios';

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
        // First try to fetch the signed URL
        const response = await axiosInstance.get(artifactLink);
        
        // Check if the response is JSON with a download_url
        if (response.data && typeof response.data === 'object' && 'download_url' in response.data) {
          // If it's a JSON with download_url, copy that URL
          await navigator.clipboard.writeText(response.data.download_url);
        } else {
          // Otherwise, copy the original link
          await navigator.clipboard.writeText(artifactLink);
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // If there's an error, copy the original link
        try {
          await navigator.clipboard.writeText(artifactLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardErr) {
          console.error('Failed to copy link:', clipboardErr);
        }
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