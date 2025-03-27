import React from 'react';
import { ChangelogEntry } from '../hooks/use-query/useAppsQuery';

interface ChangelogModalProps {
  appName: string;
  version: string;
  changelog: ChangelogEntry[];
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  appName,
  version,
  changelog,
  onClose,
}) => {
  const currentVersionChangelog = changelog.find(entry => entry.Version === version);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-[500px]">
        <h2 className="text-2xl font-bold mb-4">
          Changelog for {appName} v{version}
        </h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Changes in this version</h3>
          {currentVersionChangelog ? (
            <>
              <p className="text-gray-600 mb-2">
                Date: {new Date(currentVersionChangelog.Date).toLocaleDateString()}
              </p>
              <p className="whitespace-pre-wrap">{currentVersionChangelog.Changes || 'No changes description'}</p>
            </>
          ) : (
            <p className="text-gray-600">No changelog information available for this version</p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2"
          >
            Close
          </button>
          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}; 