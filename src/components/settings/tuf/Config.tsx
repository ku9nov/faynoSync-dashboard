import React, { useState } from 'react';
import { TufConfig } from './types';

interface ConfigProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  tufConfig: TufConfig | null;
  configLoading: boolean;
  configUpdating: boolean;
  editableExpiration: {
    targets: number;
    snapshot: number;
    timestamp: number;
  };
  onLoadConfig: () => void;
  onUpdateConfig: (expiration: { targets: number; snapshot: number; timestamp: number }) => void;
  onResetConfigLoaded: () => void;
  onUpdateMetadata: (roles: string[]) => void;
}

export const Config: React.FC<ConfigProps> = ({
  selectedApp,
  isBootstrapSuccess,
  tufConfig,
  configLoading,
  configUpdating,
  editableExpiration,
  onLoadConfig,
  onUpdateConfig,
  onResetConfigLoaded,
  onUpdateMetadata,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [localExpiration, setLocalExpiration] = useState(editableExpiration);
  const [selectedRoles, setSelectedRoles] = useState<{
    timestamp: boolean;
    targets: boolean;
    snapshot: boolean;
  }>({
    timestamp: false,
    targets: false,
    snapshot: false,
  });
  const [customRole, setCustomRole] = useState<string>('');
  const [updatingMetadata, setUpdatingMetadata] = useState(false);

  React.useEffect(() => {
    setLocalExpiration(editableExpiration);
  }, [editableExpiration]);

  const handleRefresh = () => {
    onResetConfigLoaded();
    onLoadConfig();
  };

  const handleUpdateConfig = () => {
    onUpdateConfig(localExpiration);
  };

  const handleRoleToggle = (role: 'timestamp' | 'targets' | 'snapshot') => {
    setSelectedRoles(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleUpdateAllRoles = () => {
    setSelectedRoles({
      timestamp: true,
      targets: true,
      snapshot: true,
    });
  };

  const handleClearAllRoles = () => {
    setSelectedRoles({
      timestamp: false,
      targets: false,
      snapshot: false,
    });
    setCustomRole('');
  };

  const handleUpdateMetadata = async () => {
    const roles: string[] = [];
    
    if (selectedRoles.timestamp) roles.push('timestamp');
    if (selectedRoles.targets) roles.push('targets');
    if (selectedRoles.snapshot) roles.push('snapshot');
    if (customRole.trim()) roles.push(customRole.trim());
    
    // If no roles selected and no custom role, update all (empty array)
    setUpdatingMetadata(true);
    try {
      await onUpdateMetadata(roles);
      // Reset after successful update
      setSelectedRoles({
        timestamp: false,
        targets: false,
        snapshot: false,
      });
      setCustomRole('');
    } finally {
      setUpdatingMetadata(false);
    }
  };

  if (!selectedApp || !isBootstrapSuccess) {
    return null;
  }

  return (
    <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-3 text-theme-primary hover:text-theme-button-primary transition-colors"
        >
          <h2 className="text-lg font-bold font-roboto">
            Update tuf config
          </h2>
          <i className={`fas fa-chevron-${showConfig ? 'up' : 'down'}`}></i>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRefresh();
          }}
          disabled={configLoading}
          className="text-theme-primary hover:text-theme-button-primary transition-colors disabled:opacity-50"
          title="Reload config"
        >
          <i className={`fas fa-sync ${configLoading ? 'fa-spin' : ''} mr-2`}></i>
          Refresh
        </button>
      </div>

      {showConfig && (
        <>
          {configLoading ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin text-theme-primary text-2xl mb-2"></i>
              <p className="text-theme-primary opacity-70">Loading config...</p>
            </div>
          ) : tufConfig ? (
            <div className="space-y-6">
              {/* Read-only fields */}
              <div>
                <h3 className="text-md font-semibold text-theme-primary mb-3 font-roboto">Configuration Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Bootstrap ID</div>
                    <div className="text-theme-primary font-mono text-sm">{tufConfig.bootstrap}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Role Expiration</div>
                    <div className="text-theme-primary">{tufConfig.role_expiration} days</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Root Expiration</div>
                    <div className="text-theme-primary">{tufConfig.root_expiration} days</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Root Keys</div>
                    <div className="text-theme-primary">{tufConfig.root_num_keys}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Root Threshold</div>
                    <div className="text-theme-primary">{tufConfig.root_threshold}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Snapshot Keys</div>
                    <div className="text-theme-primary">{tufConfig.snapshot_num_keys}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Snapshot Threshold</div>
                    <div className="text-theme-primary">{tufConfig.snapshot_threshold}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Targets Keys</div>
                    <div className="text-theme-primary">{tufConfig.targets_num_keys}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Targets Online Key</div>
                    <div className="text-theme-primary">{tufConfig.targets_online_key}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Targets Threshold</div>
                    <div className="text-theme-primary">{tufConfig.targets_threshold}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Timestamp Keys</div>
                    <div className="text-theme-primary">{tufConfig.timestamp_num_keys}</div>
                  </div>
                  <div className="bg-theme-input p-3 rounded-lg border border-theme">
                    <div className="text-sm text-theme-primary opacity-70 mb-1">Timestamp Threshold</div>
                    <div className="text-theme-primary">{tufConfig.timestamp_threshold}</div>
                  </div>
                </div>
              </div>

              {/* Editable expiration fields */}
              <div>
                <h3 className="text-md font-semibold text-theme-primary mb-3 font-roboto">Expiration Settings (Editable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-theme-input p-4 rounded-lg border border-theme">
                    <label className="block text-sm text-theme-primary mb-2 font-roboto">
                      Targets Expiration (days)
                    </label>
                    <input
                      type="number"
                      value={localExpiration.targets}
                      onChange={(e) => setLocalExpiration(prev => ({ ...prev, targets: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-theme-card text-theme-primary border border-theme rounded-lg px-4 py-2"
                      min="1"
                    />
                    <p className="text-xs text-theme-primary opacity-70 mt-1">
                      Current: {tufConfig.targets_expiration} days
                    </p>
                  </div>
                  <div className="bg-theme-input p-4 rounded-lg border border-theme">
                    <label className="block text-sm text-theme-primary mb-2 font-roboto">
                      Snapshot Expiration (days)
                    </label>
                    <input
                      type="number"
                      value={localExpiration.snapshot}
                      onChange={(e) => setLocalExpiration(prev => ({ ...prev, snapshot: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-theme-card text-theme-primary border border-theme rounded-lg px-4 py-2"
                      min="1"
                    />
                    <p className="text-xs text-theme-primary opacity-70 mt-1">
                      Current: {tufConfig.snapshot_expiration} days
                    </p>
                  </div>
                  <div className="bg-theme-input p-4 rounded-lg border border-theme">
                    <label className="block text-sm text-theme-primary mb-2 font-roboto">
                      Timestamp Expiration (days)
                    </label>
                    <input
                      type="number"
                      value={localExpiration.timestamp}
                      onChange={(e) => setLocalExpiration(prev => ({ ...prev, timestamp: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-theme-card text-theme-primary border border-theme rounded-lg px-4 py-2"
                      min="1"
                    />
                    <p className="text-xs text-theme-primary opacity-70 mt-1">
                      Current: {tufConfig.timestamp_expiration} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateConfig}
                  disabled={configUpdating}
                  className="bg-theme-button-primary text-theme-primary px-6 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {configUpdating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Update Config
                    </>
                  )}
                </button>
              </div>

              {/* Metadata Update Section */}
              {tufConfig && (
                <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                  <div className="flex items-start mb-4">
                    <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <h3 className="text-blue-500 font-semibold mb-2 font-roboto">Update Metadata Files</h3>
                      <p className="text-theme-primary text-sm leading-relaxed mb-3">
                        After updating the configuration, you need to update the metadata files to apply the changes. 
                        Select which roles to update, or leave all unchecked to update all roles (timestamp, targets, snapshot).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-theme-primary mb-3 font-roboto">
                        Select Roles to Update
                      </label>
                      <div className="flex flex-wrap gap-4 mb-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRoles.timestamp}
                            onChange={() => handleRoleToggle('timestamp')}
                            className="mr-2 w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                          />
                          <span className="text-theme-primary font-roboto">Timestamp</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRoles.targets}
                            onChange={() => handleRoleToggle('targets')}
                            className="mr-2 w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                          />
                          <span className="text-theme-primary font-roboto">Targets</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRoles.snapshot}
                            onChange={() => handleRoleToggle('snapshot')}
                            className="mr-2 w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                          />
                          <span className="text-theme-primary font-roboto">Snapshot</span>
                        </label>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={handleUpdateAllRoles}
                          className="text-xs text-blue-500 hover:text-blue-600 font-roboto"
                        >
                          Select All
                        </button>
                        <span className="text-theme-primary opacity-50">|</span>
                        <button
                          onClick={handleClearAllRoles}
                          className="text-xs text-blue-500 hover:text-blue-600 font-roboto"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Custom Role Input */}
                    <div>
                      <label className="block text-sm text-theme-primary mb-2 font-roboto">
                        Custom Role (optional)
                      </label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Enter custom role name..."
                        className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 text-sm"
                      />
                      <p className="text-xs text-theme-primary opacity-70 mt-1">
                        You can specify a custom role name to update
                      </p>
                    </div>

                    {/* Update Button */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleUpdateMetadata}
                        disabled={updatingMetadata}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingMetadata ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sync mr-2"></i>
                            Update Metadata
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-primary opacity-70">No config available</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
