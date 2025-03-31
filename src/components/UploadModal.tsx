import React, { useState } from 'react';
import { useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { useUploadQuery } from '../hooks/use-query/useUploadQuery';
import ReactMarkdown from 'react-markdown';

interface UploadModalProps {
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    app_name: '',
    version: '',
    channel: '',
    platform: '',
    arch: '',
    publish: false,
    critical: false,
    changelog: '',
    files: [] as File[],
  });

  const [previewChangelog, setPreviewChangelog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { apps } = useAppsQuery();
  const { channels } = useChannelQuery();
  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { upload, isLoading, error } = useUploadQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles],
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upload(formData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 rounded-lg p-8 w-[500px] max-h-[80vh] overflow-y-auto relative">
        {isLoading && (
          <div className="fixed top-4 right-4 bg-purple-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            <span className="font-roboto">Uploading files...</span>
          </div>
        )}
        {isSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-fade-in">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-roboto">Files uploaded successfully!</span>
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <span className="font-roboto">Upload failed. Please try again.</span>
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-4 font-roboto">Upload Application</h2>
        {!Array.isArray(apps) || apps.length === 0 ? (
          <div className="text-white text-center py-8 font-roboto">
            You don't have created applications, please create application and try again
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">App Name</label>
              <select
                name="app_name"
                value={formData.app_name}
                onChange={(e) => setFormData(prev => ({ ...prev, app_name: e.target.value }))}
                className="w-full px-3 py-2 rounded font-roboto"
                required
              >
                <option value="">Select an app</option>
                {apps.map((app) => (
                  <option key={app.ID} value={app.AppName}>
                    {app.AppName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">Version</label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-3 py-2 rounded font-roboto"
                placeholder="e.g., 0.0.1.0"
                required
              />
            </div>

            {channels.length > 0 && (
              <div className="mb-4">
                <label className="block text-white mb-2 font-roboto">Channel</label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full px-3 py-2 rounded font-roboto"
                  required
                >
                  <option value="">Select a channel</option>
                  {channels.map((channel) => (
                    <option key={channel.ID} value={channel.ChannelName}>
                      {channel.ChannelName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {platforms.length > 0 && (
              <div className="mb-4">
                <label className="block text-white mb-2 font-roboto">Platform</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full px-3 py-2 rounded font-roboto"
                  required
                >
                  <option value="">Select a platform</option>
                  {platforms.map((platform) => (
                    <option key={platform.ID} value={platform.PlatformName}>
                      {platform.PlatformName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {architectures.length > 0 && (
              <div className="mb-4">
                <label className="block text-white mb-2 font-roboto">Architecture</label>
                <select
                  name="arch"
                  value={formData.arch}
                  onChange={(e) => setFormData(prev => ({ ...prev, arch: e.target.value }))}
                  className="w-full px-3 py-2 rounded font-roboto"
                  required
                >
                  <option value="">Select an architecture</option>
                  {architectures.map((arch) => (
                    <option key={arch.ID} value={arch.ArchID}>
                      {arch.ArchID}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">Files</label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  required={formData.files.length === 0}
                />
                <label
                  htmlFor="file-upload"
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center font-roboto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Choose Files
                </label>
              </div>
              {formData.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-purple-700 bg-opacity-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="text-white font-roboto">{file.name}</div>
                          <div className="text-purple-200 text-sm font-roboto">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-white hover:text-red-300 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">
                <input
                  type="checkbox"
                  checked={formData.publish}
                  onChange={(e) => setFormData(prev => ({ ...prev, publish: e.target.checked }))}
                  className="mr-2"
                />
                Publish
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">
                <input
                  type="checkbox"
                  checked={formData.critical}
                  onChange={(e) => setFormData(prev => ({ ...prev, critical: e.target.checked }))}
                  className="mr-2"
                />
                Is critical
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-white mb-2 font-roboto">Changelog</label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => setPreviewChangelog(!previewChangelog)}
                  className="text-white text-sm hover:text-purple-200"
                >
                  {previewChangelog ? 'Edit' : 'Preview'}
                </button>
              </div>
              {previewChangelog ? (
                <div className="bg-white p-4 rounded prose prose-sm max-w-none">
                  <ReactMarkdown>{formData.changelog}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  name="changelog"
                  value={formData.changelog}
                  onChange={(e) => setFormData(prev => ({ ...prev, changelog: e.target.value }))}
                  className="w-full px-3 py-2 rounded font-roboto"
                  rows={4}
                  placeholder="# Changes in this version&#10;- Added new feature&#10;- Fixed bug"
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};