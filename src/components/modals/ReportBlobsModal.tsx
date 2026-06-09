import React, { useState } from 'react';
import { ReportGroup, ReportBlob, useReportBlobsQuery } from '../hooks/use-query/useReportsQuery';
import { copyToClipboard } from '../utils/clipboard';

interface ReportBlobsModalProps {
  group: ReportGroup;
  onClose: () => void;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const formatLabel = (value: string) =>
  value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const ReportBlobsModal: React.FC<ReportBlobsModalProps> = ({ group, onClose }) => {
  const { blobs, isLoading } = useReportBlobsQuery(group.group_hash);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCopyLink = async (blob: ReportBlob) => {
    setCopyError(null);
    const success = await copyToClipboard(blob.url);
    if (success) {
      setCopiedId(blob.id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopyError('Failed to copy link. Please try selecting and copying manually.');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high"
      onClick={handleBackdropClick}
    >
      <div className="bg-theme-modal-gradient p-8 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto flex flex-col">
        <h2 className="text-2xl font-bold mb-1 text-theme-primary font-roboto">
          Report Details
        </h2>
        <p className="text-sm text-theme-secondary mb-4">
          {group.application.name} v{group.application.version} · {formatLabel(group.event.type)} / {formatLabel(group.event.reason)}
        </p>

        {copyError && (
          <div className="mb-4 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-500 text-sm">
            {copyError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-theme-primary"></div>
          </div>
        ) : blobs.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-theme-primary opacity-75">No detail blobs available for this group</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {blobs.map((blob) => (
              <div key={blob.id} className="bg-theme-card p-4 rounded-lg text-theme-primary">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm break-all">{blob.storage.key}</p>
                    <p className="text-sm text-theme-secondary mt-1">
                      {blob.storage.content_type} · {blob.storage.encoding} · {formatBytes(blob.storage.compressed_size)}
                      {blob.storage.decompressed_size > blob.storage.compressed_size && (
                        <> (decompressed {formatBytes(blob.storage.decompressed_size)})</>
                      )}
                    </p>
                    <p className="text-xs text-theme-secondary mt-1">
                      Created {formatDateTime(blob.created_at)} · Link expires {formatDateTime(blob.expires_at)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-purple-500/20 text-purple-300 border-purple-400/30 flex-shrink-0">
                    {blob.storage.driver}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={blob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-button-primary text-theme-primary text-sm font-medium hover:bg-theme-button-primary-hover transition-colors"
                  >
                    <i className="fas fa-download"></i>
                    Download
                  </a>
                  <button
                    onClick={() => handleCopyLink(blob)}
                    className="p-2 hover:bg-theme-card-hover rounded-lg transition-colors"
                    title="Copy presigned link"
                  >
                    <i className={`fas ${copiedId === blob.id ? 'fa-check text-green-500' : 'fa-copy text-theme-secondary'}`}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-300 transition-all duration-150 border border-gray-300 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
