import React from 'react';

interface ChangelogModalProps {
  appName: string;
  version: string;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  appName,
  version,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-[500px]">
        <h2 className="text-2xl font-bold mb-4">
          Changelog for {appName} v{version}
        </h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Changes in this version</h3>
          <ul className="list-disc list-inside">
            <li>Added new feature</li>
            <li>Fixed critical bug</li>
            <li>Improved performance</li>
          </ul>
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