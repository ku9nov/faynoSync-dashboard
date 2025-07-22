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
    intermediate: false,
    changelog: '',
  });

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleOptionClick = (dropdownName: string, value: string) => {
    setFormData(prev => ({ ...prev, [dropdownName]: value }));
    setOpenDropdown(null);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    e.stopPropagation();
    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });
      
      files.forEach(fileInfo => {
        formDataToSend.append('files', fileInfo.file);
      });
      
      const uploadData = {
        app_name: formData.app_name,
        version: formData.version,
        channel: formData.channel,
        platform: formData.platform,
        arch: formData.arch,
        publish: formData.publish,
        critical: formData.critical,
        intermediate: formData.intermediate,
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
            <label className="block text-theme-primary mb-2 font-roboto font-semibold">App Name</label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => handleDropdownClick('app_name')}
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-sm"
              >
                <span>{formData.app_name || 'Select an app'}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`text-theme-primary transition-transform ${openDropdown === 'app_name' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'app_name' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-input border border-theme rounded-lg shadow-lg z-10 backdrop-blur-lg">
                  {apps.map((app) => (
                    <button
                      key={app.ID}
                      type="button"
                      onClick={() => handleOptionClick('app_name', app.AppName)}
                      className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {app.AppName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-theme-primary mb-2 font-roboto font-semibold">Version</label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
              placeholder="e.g., 0.0.1.0"
              required
            />
          </div>

          {channels.length > 0 && (
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto font-semibold">Channel</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('channel')}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-sm"
                >
                  <span>{formData.channel || 'Select a channel'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'channel' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'channel' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-input border border-theme rounded-lg shadow-lg z-10 backdrop-blur-lg">
                    {channels.map((channel) => (
                      <button
                        key={channel.ID}
                        type="button"
                        onClick={() => handleOptionClick('channel', channel.ChannelName)}
                        className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {channel.ChannelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {platforms.length > 0 && (
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto font-semibold">Platform</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('platform')}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-sm"
                >
                  <span>{formData.platform || 'Select a platform'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'platform' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-input border border-theme rounded-lg shadow-lg z-10 backdrop-blur-lg">
                    {platforms.map((platform) => (
                      <button
                        key={platform.ID}
                        type="button"
                        onClick={() => handleOptionClick('platform', platform.PlatformName)}
                        className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {platform.PlatformName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {architectures.length > 0 && (
            <div className="mb-4">
              <label className="block text-theme-primary mb-2 font-roboto font-semibold">Architecture</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('arch')}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-sm"
                >
                  <span>{formData.arch || 'Select an architecture'}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`text-theme-primary transition-transform ${openDropdown === 'arch' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'arch' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-theme-input border border-theme rounded-lg shadow-lg z-10 backdrop-blur-lg">
                    {architectures.map((arch) => (
                      <button
                        key={arch.ID}
                        type="button"
                        onClick={() => handleOptionClick('arch', arch.ArchID)}
                        className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {arch.ArchID}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="flex items-center text-theme-primary font-roboto font-semibold">
              <input
                type="checkbox"
                checked={formData.publish}
                onChange={(e) => setFormData(prev => ({ ...prev, publish: e.target.checked }))}
                className="mr-3 accent-purple-500 w-5 h-5 border border-theme rounded transition-all duration-150 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-theme-input shadow-sm"
              />
              Publish
            </label>
          </div>

          <div className="mb-4">
            <label className="flex items-center text-theme-primary font-roboto font-semibold">
              <input
                type="checkbox"
                checked={formData.critical}
                onChange={(e) => setFormData(prev => ({ ...prev, critical: e.target.checked }))}
                className="mr-3 accent-purple-500 w-5 h-5 border border-theme rounded transition-all duration-150 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-theme-input shadow-sm"
              />
              Is critical
            </label>
          </div>

          <div className="mb-4">
            <label className="flex items-center text-theme-primary font-roboto font-semibold">
              <input
                type="checkbox"
                checked={formData.intermediate}
                onChange={(e) => setFormData(prev => ({ ...prev, intermediate: e.target.checked }))}
                className="mr-3 accent-purple-500 w-5 h-5 border border-theme rounded transition-all duration-150 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-theme-input shadow-sm"
              />
              Is intermediate
            </label>
          </div>
        </>
      )}
    </AdvancedModal>
  );
};