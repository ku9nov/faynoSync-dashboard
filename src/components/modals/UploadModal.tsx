import React, { useState } from 'react';
import { useAppsQuery } from '@/hooks/use-query/useAppsQuery';
import { useChannelQuery } from '@/hooks/use-query/useChannelQuery';
import { usePlatformQuery } from '@/hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '@/hooks/use-query/useArchitectureQuery';
import { useUploadQuery } from '@/hooks/use-query/useUploadQuery';
import { AdvancedModal } from '@/components/common/AdvancedModal';
import { FlagCheckbox } from '@/components/common/FlagCheckbox';
import {
  DROPDOWN_MENU,
  DROPDOWN_OPTION,
  DROPDOWN_TRIGGER,
  FIELD_INPUT,
  FIELD_LABEL,
} from '@/components/common/ui';

const DROPDOWN_MENU_STYLE = {
  background: 'var(--dropdown-bg)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.35)',
};

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
    updater: '',
    signature: '',
  });

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleOptionClick = (dropdownName: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [dropdownName]: value,
      // Reset updater when platform changes
      ...(dropdownName === 'platform' && { updater: '', signature: '' }),
      // Reset signature when updater changes
      ...(dropdownName === 'updater' && { signature: '' })
    }));
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { apps } = useAppsQuery();
  const { channels } = useChannelQuery();
  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { upload, isLoading } = useUploadQuery();

  // Get selected platform and its updaters
  const selectedPlatform = platforms.find(p => p.PlatformName === formData.platform);
  const availableUpdaters = selectedPlatform?.Updaters || [];
  const hasMultipleUpdaters = availableUpdaters.length > 1;
  const showUpdaterDropdown = hasMultipleUpdaters && formData.platform;
  
  // Set default updater to 'manual' when dropdown is shown and no updater is selected
  React.useEffect(() => {
    if (showUpdaterDropdown && !formData.updater) {
      setFormData(prev => ({ ...prev, updater: 'manual' }));
    }
  }, [showUpdaterDropdown, formData.updater]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadError(null);
    try {
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && key !== 'updater') {
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
        files: files.map(f => f.file),
        updater: formData.updater && formData.updater !== 'manual' ? formData.updater : undefined,
        ...(formData.updater === 'tauri' && formData.signature && { signature: formData.signature }),
      };
      
      await upload(uploadData);
      setUploadError(null);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error: any) {
      console.error('Upload failed:', error);
      // Extract error message from API response
      let errorMessage = 'Upload failed';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      // Set error state to display the message
      setUploadError(errorMessage);
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
      error={uploadError ? { error: 'Upload failed', details: uploadError } : null}
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
        <div className="text-theme-primary text-center py-8">
          You don't have created applications, please create application and try again
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className={FIELD_LABEL}>App Name</label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => handleDropdownClick('app_name')}
                className={DROPDOWN_TRIGGER}
              >
                <span className="block min-w-0 flex-1 truncate text-left">{formData.app_name || 'Select an app'}</span>
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
                  className={`text-theme-primary transition-transform flex-shrink-0 ml-2 ${openDropdown === 'app_name' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'app_name' && (
                <div className={`${DROPDOWN_MENU} z-10`} style={DROPDOWN_MENU_STYLE}>
                  {apps.map((app) => (
                    <button
                      key={app.ID}
                      type="button"
                      onClick={() => handleOptionClick('app_name', app.AppName)}
                      className={DROPDOWN_OPTION}
                    >
                      {app.AppName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className={FIELD_LABEL}>Version</label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
              className={FIELD_INPUT}
              placeholder="e.g., 0.0.1.0"
              required
            />
          </div>

          {channels.length > 0 && (
            <div className="mb-4">
              <label className={FIELD_LABEL}>Channel</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('channel')}
                  className={DROPDOWN_TRIGGER}
                >
                  <span className="block min-w-0 flex-1 truncate text-left">{formData.channel || 'Select a channel'}</span>
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
                    className={`text-theme-primary transition-transform flex-shrink-0 ml-2 ${openDropdown === 'channel' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'channel' && (
                  <div className={`${DROPDOWN_MENU} z-10`} style={DROPDOWN_MENU_STYLE}>
                    {channels.map((channel) => (
                      <button
                        key={channel.ID}
                        type="button"
                        onClick={() => handleOptionClick('channel', channel.ChannelName)}
                        className={DROPDOWN_OPTION}
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
              <label className={FIELD_LABEL}>Platform</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('platform')}
                  className={DROPDOWN_TRIGGER}
                >
                  <span className="block min-w-0 flex-1 truncate text-left">{formData.platform || 'Select a platform'}</span>
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
                    className={`text-theme-primary transition-transform flex-shrink-0 ml-2 ${openDropdown === 'platform' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'platform' && (
                  <div className={`${DROPDOWN_MENU} z-10`} style={DROPDOWN_MENU_STYLE}>
                    {platforms.map((platform) => (
                      <button
                        key={platform.ID}
                        type="button"
                        onClick={() => handleOptionClick('platform', platform.PlatformName)}
                        className={DROPDOWN_OPTION}
                      >
                        {platform.PlatformName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {showUpdaterDropdown && (
            <div className="mb-4">
              <label className={FIELD_LABEL}>
                Updater
                <span className="ml-2 font-normal text-white/50">
                  (This platform has multiple enabled updaters, select desired updater if necessary)
                </span>
              </label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('updater')}
                  className={DROPDOWN_TRIGGER}
                >
                  <span className="block min-w-0 flex-1 truncate text-left">{formData.updater || 'manual (default)'}</span>
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
                    className={`text-theme-primary transition-transform flex-shrink-0 ml-2 ${openDropdown === 'updater' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'updater' && (
                  <div className={`${DROPDOWN_MENU} z-10`} style={DROPDOWN_MENU_STYLE}>
                    {availableUpdaters.map((updater) => (
                      <button
                        key={updater.type}
                        type="button"
                        onClick={() => handleOptionClick('updater', updater.type)}
                        className={DROPDOWN_OPTION}
                      >
                        {updater.type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {formData.updater === 'tauri' && (
            <div className="mb-4">
              <label className={FIELD_LABEL}>Signature</label>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                className={FIELD_INPUT}
                placeholder="Enter signature for Tauri updater"
                required
              />
            </div>
          )}

          {architectures.length > 0 && (
            <div className="mb-4">
              <label className={FIELD_LABEL}>Architecture</label>
              <div className="relative dropdown-container">
                <button
                  type="button"
                  onClick={() => handleDropdownClick('arch')}
                  className={DROPDOWN_TRIGGER}
                >
                  <span className="block min-w-0 flex-1 truncate text-left">{formData.arch || 'Select an architecture'}</span>
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
                    className={`text-theme-primary transition-transform flex-shrink-0 ml-2 ${openDropdown === 'arch' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {openDropdown === 'arch' && (
                  <div className={`${DROPDOWN_MENU} z-10`} style={DROPDOWN_MENU_STYLE}>
                    {architectures.map((arch) => (
                      <button
                        key={arch.ID}
                        type="button"
                        onClick={() => handleOptionClick('arch', arch.ArchID)}
                        className={DROPDOWN_OPTION}
                      >
                        {arch.ArchID}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <FlagCheckbox
              label="Publish"
              tone="green"
              checked={formData.publish}
              onChange={(checked) => setFormData(prev => ({ ...prev, publish: checked }))}
            />
            <FlagCheckbox
              label="Critical"
              tone="red"
              checked={formData.critical}
              onChange={(checked) => setFormData(prev => ({ ...prev, critical: checked }))}
            />
            <FlagCheckbox
              label="Intermediate"
              tone="amber"
              checked={formData.intermediate}
              onChange={(checked) => setFormData(prev => ({ ...prev, intermediate: checked }))}
            />
          </div>
        </>
      )}
    </AdvancedModal>
  );
};