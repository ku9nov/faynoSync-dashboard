import React from 'react';
import { Artifact } from '../hooks/use-query/useAppsQuery';

interface DownloadArtifactsModalProps {
  artifacts: Artifact[];
  onClose: () => void;
}

export const DownloadArtifactsModal: React.FC<DownloadArtifactsModalProps> = ({
  artifacts,
  onClose,
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = (artifact: Artifact) => {
    window.open(artifact.link, '_blank');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-white font-roboto">
          Select Artifact to Download
        </h2>
        <div className="space-y-4">
          {artifacts.map((artifact, index) => (
            <div
              key={index}
              className="bg-white/10 p-4 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
              onClick={() => handleDownload(artifact)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{artifact.platform}</p>
                  <p className="text-sm text-gray-300">Architecture: {artifact.arch}</p>
                  <p className="text-sm text-gray-300">Package: {artifact.package}</p>
                </div>
                <i className="fas fa-download text-green-500"></i>
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