import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useUsersQuery } from '@/hooks/use-query/useUsersQuery';
import { StepStatus, TufHistoryEntry } from '@/components/settings/tuf/types';
import { getStatusColor, getStatusIcon } from '@/components/settings/tuf/utils';
import { generateTufPythonScript } from '@/components/settings/tuf/generateTufScript';
import { Dropdown } from '@/components/common/Dropdown';
import { FIELD_INPUT, FIELD_LABEL } from '@/components/common/ui';

interface GenerateKeysOfflineProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onGeneratedPayload: (payload: string) => void;
  onStartBootstrap: (payload: string) => void;
  onSaveToHistory: (entry: Omit<TufHistoryEntry, 'id'>) => void;
}

export const GenerateKeysOffline: React.FC<GenerateKeysOfflineProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onGeneratedPayload: _onGeneratedPayload,
  onStartBootstrap: _onStartBootstrap,
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
  const [thresholds, setThresholds] = useState({
    root: 2,
    timestamp: 1,
    snapshot: 1,
    targets: 1,
    delegation: 1,
  });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [showScript, setShowScript] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { data: userData } = useUsersQuery();

  // Calculate file names with app name and admin name
  const adminName = userData?.owner || userData?.username || 'admin';
  const generateInitTufKeysScriptFileName = selectedApp && adminName
    ? `generate_init_tuf_keys_${selectedApp}_${adminName}.py`
    : 'generate_init_tuf_keys.py';
  const bootstrapPayloadFileName = selectedApp && adminName
    ? `bootstrap_payload_${selectedApp}_${adminName}.json`
    : 'bootstrap_payload.json';

  // Handle dropdown clicks
  // Update step status when app changes
  useEffect(() => {
    if (!selectedApp) {
      setStep1Status('ready');
      setGeneratedScript('');
    }
  }, [selectedApp]);

  const generatePythonScript = () => {
    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateTufPythonScript({
      appName: selectedApp,
      keyType,
      roleName,
      adminName,
      expiration,
      thresholds,
    });

    setGeneratedScript(script);
    setShowScript(false);
    setStep1Status('success');
    
    toastSuccess('Python script generated successfully!');
    
    onSaveToHistory({
      timestamp: new Date().toISOString(),
      appName: selectedApp,
      operation: 'generate',
      status: 'success',
    });
  };

  const handleGenerateScript = () => {
    if (!selectedApp || !roleName) {
      toastError('Please fill in all required fields');
      return;
    }
    generatePythonScript();
  };

  const handleCopyScript = async () => {
    if (generatedScript) {
      try {
        await navigator.clipboard.writeText(generatedScript);
        toastSuccess('Script copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy script:', err);
        toastError('Failed to copy script');
      }
    }
  };

  if (!selectedApp || isBootstrapSuccess) {
    return null;
  }

  return (
    <div className="bg-theme-card p-6 rounded-lg border-2 border-blue-500">
      <button
        onClick={() => setShowStep1(!showStep1)}
        className="flex items-center justify-between w-full text-theme-primary hover:text-theme-button-primary mb-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">
            Step 1: Generate TUF Root Keys (Offline Mode)
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
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
              <div className="flex-1">
                <h3 className="text-blue-500 font-semibold mb-2">Offline Key Generation</h3>
                <p className="text-theme-primary text-sm leading-relaxed mb-2">
                  This is the recommended approach for generating TUF root keys. Configure the parameters below, 
                  then generate a Python script that you can run offline on a secure machine.
                </p>
                <p className="text-theme-primary text-sm leading-relaxed mb-2">
                  <strong>Prerequisites:</strong>
                </p>
                <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1 mb-3">
                  <li>Python 3 must be installed</li>
                  <li>cryptography library must be installed</li>
                </ul>
                <p className="text-theme-primary text-sm leading-relaxed mb-2">
                  <strong>Instructions:</strong>
                </p>
                <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1 mb-3">
                  <li>Configure all parameters below</li>
                  <li>Click "Generate Script" to create the Python script</li>
                  <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{generateInitTufKeysScriptFileName}</code> on a secure offline machine</li>
                  <li>Set up Python environment and install dependencies:</li>
                </ol>
                <div className="bg-theme-input rounded-lg p-3 mb-3 font-mono text-xs text-theme-primary overflow-x-auto">
                  <div className="whitespace-pre">python3 -m venv .venv<br />source .venv/bin/activate  # On Windows: .venv\Scripts\activate<br />pip install cryptography securesystemslib<br />python3 {generateInitTufKeysScriptFileName}</div>
                </div>
                <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1" start={5}>
                  <li>Copy the generated keys from <code className="bg-theme-input px-1 rounded">private_keys/</code> folder to the <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> folder specified in the environment variables of the faynosync API server</li>
                  <li>Use the generated <code className="bg-theme-input px-1 rounded">{bootstrapPayloadFileName}</code> to proceed with bootstrap</li>
                </ol>
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
              <label className={FIELD_LABEL}>Keys Threshold</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Root</label>
                  <input
                    type="number"
                    min={1}
                    value={thresholds.root}
                    onChange={(e) => setThresholds(prev => ({ ...prev, root: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Targets</label>
                  <input
                    type="number"
                    min={1}
                    value={thresholds.targets}
                    onChange={(e) => setThresholds(prev => ({ ...prev, targets: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Timestamp</label>
                  <input
                    type="number"
                    min={1}
                    value={thresholds.timestamp}
                    onChange={(e) => setThresholds(prev => ({ ...prev, timestamp: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Snapshot</label>
                  <input
                    type="number"
                    min={1}
                    value={thresholds.snapshot}
                    onChange={(e) => setThresholds(prev => ({ ...prev, snapshot: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={FIELD_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm text-theme-primary mb-1">Delegation</label>
                  <input
                    type="number"
                    min={1}
                    value={thresholds.delegation}
                    onChange={(e) => setThresholds(prev => ({ ...prev, delegation: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className={FIELD_INPUT}
                  />
                </div>
              </div>
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

            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateScript}
                disabled={!selectedApp || !roleName}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {generatedScript && (
                <button
                  onClick={handleCopyScript}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>

            {generatedScript && (
              <div className="mt-4">
                <button
                  onClick={() => setShowScript(!showScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {generatedScript}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCopyScript}
                        className="bg-theme-button-primary text-theme-primary px-3 py-1 rounded text-sm hover:bg-theme-button-primary-hover"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy Script
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
