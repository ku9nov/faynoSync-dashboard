import React, { useState } from 'react';
import { Artifact } from '../hooks/use-query/useAppsQuery';
import axiosInstance from '../config/axios';

interface DownloadArtifactsModalProps {
  artifacts: Artifact[];
  onClose: () => void;
}

export const DownloadArtifactsModal: React.FC<DownloadArtifactsModalProps> = ({
  artifacts,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = (artifact: Artifact) => {
    // First try to fetch the link with authentication
    axiosInstance.get(artifact.link)
      .then(response => {
        // Check if the response is JSON with a download_url
        if (response.data && typeof response.data === 'object' && 'download_url' in response.data) {
          // If it's a JSON with download_url, use that URL
          window.open(response.data.download_url, '_blank');
        } else {
          // Otherwise, it's a direct link to a file, use it directly
          window.open(artifact.link, '_blank');
        }
        onClose();
      })
      .catch(() => {
        // If there's an error (like 401), it might be a direct link to a public file
        // In that case, just open the link directly
        window.open(artifact.link, '_blank');
        onClose();
      });
  };

  const handleCopyLink = async (link: string, index: number) => {
    try {
      // First try to fetch the signed URL
      const response = await axiosInstance.get(link);
      
      // Check if the response is JSON with a download_url
      if (response.data && typeof response.data === 'object' && 'download_url' in response.data) {
        // If it's a JSON with download_url, copy that URL
        await navigator.clipboard.writeText(response.data.download_url);
      } else {
        // Otherwise, copy the original link
        await navigator.clipboard.writeText(link);
      }
      
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      // If there's an error, copy the original link
      try {
        await navigator.clipboard.writeText(link);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } catch (clipboardErr) {
        console.error('Failed to copy link:', clipboardErr);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-theme-modal-gradient p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-theme-primary font-roboto">
          Select Artifact to Download
        </h2>
        <div className="space-y-4">
          {artifacts.map((artifact, index) => (
            <div
              key={index}
              className="bg-theme-card p-4 rounded-lg text-theme-primary hover:bg-theme-card-hover transition-colors cursor-pointer"
              onClick={() => handleDownload(artifact)}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{artifact.platform}</p>
                    <p className="text-sm text-gray-300">Architecture: {artifact.arch}</p>
                    <p className="text-sm text-gray-300">Package: {artifact.package}</p>
                  </div>
                  <i className="fas fa-download text-green-500 ml-4 flex-shrink-0"></i>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-300 mb-1">Share link:</p>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="overflow-x-auto pb-1" style={{
                        maxWidth: 'calc(24rem - 64px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgb(107 114 128) transparent'
                      }}>
                        <p className="text-base text-gray-200 whitespace-nowrap pr-2 font-mono">
                          {artifact.link}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(artifact.link, index);
                      }}
                      className="p-1 hover:bg-theme-card-hover rounded transition-colors flex-shrink-0"
                      title="Copy link"
                    >
                      <i className={`fas ${copiedIndex === index ? 'fa-check text-green-500' : 'fa-copy text-gray-300'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-400 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 