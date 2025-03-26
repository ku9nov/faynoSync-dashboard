import React from 'react';

interface UploadModalProps {
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gradient-to-b from-purple-800 to-purple-600 rounded-lg p-8 w-[500px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Upload Application</h2>
        <form>
          <div className="mb-4">
            <label className="block text-white mb-2">
              <input type="checkbox" name="publish" className="mr-2" />
              Publish
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">
              <input type="checkbox" name="isCritical" className="mr-2" />
              Is critical
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">App</label>
            <input type="text" name="app" className="w-full px-3 py-2 rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Platform</label>
            <select name="platform" multiple className="w-full px-3 py-2 rounded">
              <option value="win">Windows</option>
              <option value="linux">Linux</option>
              <option value="osx">macOS</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Channels</label>
            <select name="channels" multiple className="w-full px-3 py-2 rounded">
              <option value="stable">Stable</option>
              <option value="beta">Beta</option>
              <option value="alpha">Alpha</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Version</label>
            <input
              type="text"
              name="version"
              className="w-full px-3 py-2 rounded"
              placeholder="e.g., 0.0.1.0"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Arch</label>
            <select name="arch" multiple className="w-full px-3 py-2 rounded">
              <option value="amd64">amd64</option>
              <option value="arm64">arm64</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">File</label>
            <input type="file" name="file" className="w-full text-white" />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">File size</label>
            <input
              type="text"
              name="fileSize"
              className="w-full px-3 py-2 rounded"
              readOnly
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Hash</label>
            <input
              type="text"
              name="hash"
              className="w-full px-3 py-2 rounded"
              readOnly
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Changelog</label>
            <textarea
              name="changelog"
              className="w-full px-3 py-2 rounded"
              rows={4}
              placeholder="# Changes in this version&#10;- Added new feature&#10;- Fixed bug"
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-purple-500 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};