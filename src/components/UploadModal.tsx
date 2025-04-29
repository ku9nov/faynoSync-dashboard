import React, { useState } from 'react';
import { useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { useUploadQuery } from '../hooks/use-query/useUploadQuery';
import { AdvancedModal } from './common/AdvancedModal';

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
  });

  const [previewChangelog, setPreviewChangelog] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [files, setFiles] = useState<{ file: File; id: string }[]>([]);

  const { apps } = useAppsQuery();
  const { channels } = useChannelQuery();
  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { upload, isLoading, error } = useUploadQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a FormData object
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Add files
      files.forEach(fileInfo => {
        formDataToSend.append('files', fileInfo.file);
      });
      
      // Convert FormData to a regular object for the upload function
      const uploadData = {
        app_name: formData.app_name,
        version: formData.version,
        channel: formData.channel,
        platform: formData.platform,
        arch: formData.arch,
        publish: formData.publish,
        critical: formData.critical,
        changelog: formData.changelog,
        files: files.map(f => f.file)
      };
      
      await upload(uploadData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <AdvancedModal
      onClose={onClose}
      title="Upload Application"
      onSubmit={handleSubmit}
      submitButtonText="Upload"
      isLoading={isLoading}
      isSuccess={isSuccess}
      successMessage="Files uploaded successfully!"
      error={error ? { error: 'Upload failed', details: error.message } : null}
      showChangelogPreview={previewChangelog}
      changelogValue={formData.changelog}
      onChangelogChange={(value) => setFormData(prev => ({ ...prev, changelog: value }))}
      onChangelogPreviewToggle={() => setPreviewChangelog(!previewChangelog)}
      fileUploadConfig={{
        multiple: true,
        required: true
      }}
      onFilesChange={setFiles}
      files={files}
    >
      {!Array.isArray(apps) || apps.length === 0 ? (
        <div className="text-theme-primary text-center py-8 font-roboto">
          You don't have created applications, please create application and try again
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-theme-primary mb-2 font-roboto">App Name</label>
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
            <label className="block text-theme-primary mb-2 font-roboto">Version</label>
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
              <label className="block text-theme-primary mb-2 font-roboto">Channel</label>
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
              <label className="block text-theme-primary mb-2 font-roboto">Platform</label>
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
              <label className="block text-theme-primary mb-2 font-roboto">Architecture</label>
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
            <label className="block text-theme-primary mb-2 font-roboto">
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
            <label className="block text-theme-primary mb-2 font-roboto">
              <input
                type="checkbox"
                checked={formData.critical}
                onChange={(e) => setFormData(prev => ({ ...prev, critical: e.target.checked }))}
                className="mr-2"
              />
              Is critical
            </label>
          </div>
        </>
      )}
    </AdvancedModal>
  );
};