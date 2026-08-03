import React, { useState, useEffect } from 'react';
import axiosInstance from '@/config/axios';
import { useToast } from '@/hooks/useToast';
import { StepStatus, TufHistoryEntry } from '@/components/settings/tuf/types';
import { getStatusColor, getStatusIcon } from '@/components/settings/tuf/utils';
import { Dropdown } from '@/components/common/Dropdown';
import { FIELD_INPUT, FIELD_LABEL } from '@/components/common/ui';

interface GenerateKeysProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onGeneratedPayload: (payload: string) => void;
  onStartBootstrap: (payload: string) => void;
  onSaveToHistory: (entry: Omit<TufHistoryEntry, 'id'>) => void;
}

export const GenerateKeys: React.FC<GenerateKeysProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onGeneratedPayload,
  onStartBootstrap,
  onSaveToHistory,
}) => {
  const [showStep1, setShowStep1] = useState(false);
  const [step1Status, setStep1Status] = useState<StepStatus>('ready');
  const [keyType, setKeyType] = useState<string>('ed25519');
  const [roleName, setRoleName] = useState<string>('default');
  const [expiration, setExpiration] = useState({
    root: 364,
    timestamp: 1,
    snapshot: 6,
    targets: 6,
  });
  const [generatedPayload, setGeneratedPayload] = useState<string>('');
  const [showPayload, setShowPayload] = useState(false);
  const { toastSuccess, toastError } = useToast();

  // Handle dropdown clicks
  // Update step status when app changes
  useEffect(() => {
    if (!selectedApp) {
      setStep1Status('ready');
      setGeneratedPayload('');
    }
  }, [selectedApp]);

  const generateKeys = async () => {
    setStep1Status('in-progress');
    
    try {
      const requestPayload = {
        appName: selectedApp,
        keyType,
        rootExpiration: expiration.root,
        targetsExpiration: expiration.targets,
        snapshotExpiration: expiration.snapshot,
        timestampExpiration: expiration.timestamp,
        roleName: roleName,
      };

      const response = await axiosInstance.post('/tuf/v1/bootstrap/generate', requestPayload);
      
      const payloadData = response.data?.data;
      if (!payloadData) {
        throw new Error('Invalid response: missing data field');
      }
      const responsePayload = JSON.stringify(payloadData, null, 2);
      setGeneratedPayload(responsePayload);
      onGeneratedPayload(responsePayload);
      setStep1Status('success');
      
      toastSuccess('TUF root keys generated successfully!');
      
      onSaveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'generate',
        status: 'success',
      });
    } catch (error: any) {
      console.error('Failed to generate TUF root keys:', error);
      setStep1Status('error');
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate TUF root keys';
      toastError(errorMessage);
      
      onSaveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'generate',
        status: 'failed',
      });
    }
  };

  const handleGenerateKeys = () => {
    if (!selectedApp || !roleName) return;
    generateKeys();
  };

  const handleCopyPayload = async () => {
    if (generatedPayload) {
      try {
        await navigator.clipboard.writeText(generatedPayload);
        toastSuccess('Payload copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy payload:', err);
        toastError('Failed to copy payload');
      }
    }
  };

  if (!selectedApp || isBootstrapSuccess) {
    return null;
  }

  return (
    <div className="bg-theme-card p-6 rounded-lg border-2 border-red-500">
      <button
        onClick={() => setShowStep1(!showStep1)}
        className="flex items-center justify-between w-full text-theme-primary hover:text-theme-button-primary mb-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">
            Easy Start (Not Recommended): Generate TUF Root Keys
          </h2>
          <div className={`flex items-center ${getStatusColor(step1Status)}`}>
            <i className={`fas ${getStatusIcon(step1Status)} mr-2`}></i>
            <span className="text-sm capitalize">{step1Status.replace('-', ' ')}</span>
          </div>
        </div>
        <i className={`fas fa-chevron-${showStep1 ? 'up' : 'down'}`}></i>
      </button>

      {showStep1 && (
        <>
          {/* Danger Zone Warning */}
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-red-500 mr-3 mt-0.5 text-xl"></i>
              <div className="flex-1">
                <h3 className="text-red-500 font-semibold mb-2">Danger Zone</h3>
                <p className="text-theme-primary text-sm leading-relaxed">
                  <strong>Warning:</strong> This step generates private keys and stores them in the database. 
                  This operation should be performed <strong>only once</strong> for each application. 
                  Re-generating keys may cause security issues and disrupt the TUF infrastructure.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={FIELD_LABEL}>App Name</label>
              <input
                type="text"
                value={selectedApp}
                disabled
                className={`${FIELD_INPUT} disabled:opacity-50`}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>Key Type</label>
              <Dropdown
                ariaLabel="Key type"
                value={keyType}
                onChange={setKeyType}
                options={['ed25519', 'rsa', 'ecdsa'].map((type) => ({ value: type, label: type }))}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name (e.g., root, timestamp, snapshot, targets)"
                className={FIELD_INPUT}
              />
            </div>

            <div>
              <label className={FIELD_LABEL}>Expiration Settings</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Root (days)</label>
                  <input
                    type="number"
                    value={expiration.root}
                    onChange={(e) => setExpiration(prev => ({ ...prev, root: parseInt(e.target.value) || 0 }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Timestamp (days)</label>
                  <input
                    type="number"
                    value={expiration.timestamp}
                    onChange={(e) => setExpiration(prev => ({ ...prev, timestamp: parseInt(e.target.value) || 0 }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Snapshot (days)</label>
                  <input
                    type="number"
                    value={expiration.snapshot}
                    onChange={(e) => setExpiration(prev => ({ ...prev, snapshot: parseInt(e.target.value) || 0 }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Targets (days)</label>
                  <input
                    type="number"
                    value={expiration.targets}
                    onChange={(e) => setExpiration(prev => ({ ...prev, targets: parseInt(e.target.value) || 0 }))}
                    className={FIELD_INPUT}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateKeys}
              disabled={!selectedApp || step1Status === 'in-progress'}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step1Status === 'in-progress' ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-key mr-2"></i>
                  Generate Keys
                </>
              )}
            </button>

            {generatedPayload && (
              <div className="mt-4">
                <button
                  onClick={() => setShowPayload(!showPayload)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showPayload ? 'up' : 'down'} mr-2`}></i>
                  Generated Payload {showPayload ? '(click to hide)' : '(click to expand)'}
                </button>
                {showPayload && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto">
                      {generatedPayload}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCopyPayload}
                        className="bg-theme-button-primary text-theme-primary px-3 py-1 rounded text-sm hover:bg-theme-button-primary-hover"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy Payload
                      </button>
                      <button
                        onClick={() => {
                          onStartBootstrap(generatedPayload);
                        }}
                        className="bg-theme-button-primary text-theme-primary px-3 py-1 rounded text-sm hover:bg-theme-button-primary-hover"
                      >
                        <i className="fas fa-rocket mr-1"></i>
                        Start Bootstrap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
