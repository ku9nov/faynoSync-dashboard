import React, { useState, useMemo } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useUsersQuery } from '../../../hooks/use-query/useUsersQuery';
import axiosInstance from '../../../config/axios';
import { generateRotateRootKeysPythonScript } from './generateRotateRootKeysScript';
import { generateCreateNewRootMetadataPythonScript } from './generateCreateNewRootMetadataScript';
import { generateSignMetadataOfflinePythonScript } from './generateSignMetadataOfflineScript';
import { StepperModal, Step } from '../../common/StepperModal';

interface RotateRootKeysProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onSaveToHistory: (entry: Omit<import('./types').TufHistoryEntry, 'id'>) => void;
  onCheckTufTasks: (taskId?: string) => void;
}

export const RotateRootKeys: React.FC<RotateRootKeysProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onSaveToHistory,
  onCheckTufTasks,
}) => {
  const [showRotateKeys, setShowRotateKeys] = useState(false);
  const [keyCount, setKeyCount] = useState<number>(2);
  const [exampleScript, setExampleScript] = useState<string>('');
  const [showScript, setShowScript] = useState(false);
  const [rootMetadata, setRootMetadata] = useState<any>(null);
  const [showRootMetadata, setShowRootMetadata] = useState(false);
  const [loadingRootMetadata, setLoadingRootMetadata] = useState(false);
  const [newRootMetadataScript, setNewRootMetadataScript] = useState<string>('');
  const [showNewRootMetadataScript, setShowNewRootMetadataScript] = useState(false);
  const [signMetadataOfflineScript, setSignMetadataOfflineScript] = useState<string>('');
  const [showSignMetadataOfflineScript, setShowSignMetadataOfflineScript] = useState(false);
  const [metadataPayload, setMetadataPayload] = useState<string>('');
  const [metadataPayloadError, setMetadataPayloadError] = useState<string>('');
  const [submittingMetadata, setSubmittingMetadata] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const { toastSuccess, toastError } = useToast();
  const { data: userData } = useUsersQuery();

  // Calculate file names with app name and admin name
  const adminName = userData?.owner || userData?.username || 'admin';
  const rotateRootKeysScriptFileName = selectedApp && adminName
    ? `rotate_root_keys_${selectedApp}_${adminName}.py`
    : 'rotate_root_keys.py';
  const newRootKeysInfoFileName = selectedApp && adminName 
    ? `new_root_keys_info_${selectedApp}_${adminName}.json`
    : 'new_root_keys_info_*.json';
  const currentRootFileName = selectedApp && adminName
    ? `current_root_${selectedApp}_${adminName}.json`
    : 'current_root.json';
  const createNewRootMetadataScriptFileName = selectedApp && adminName
    ? `create_new_root_metadata_${selectedApp}_${adminName}.py`
    : 'create_new_root_metadata.py';
  const signMetadataOfflineScriptFileName = selectedApp && adminName
    ? `sign_metadata_offline_${selectedApp}_${adminName}.py`
    : 'sign_metadata_offline.py';
  const signedNewRootMetadataFileName = selectedApp && adminName
    ? `signed_new_root_metadata_${selectedApp}_${adminName}.json`
    : 'signed_new_root_metadata.json';

  const generateExampleScript = () => {
    if (!selectedApp || keyCount < 1) {
      toastError('Please fill in all required fields');
      return;
    }

    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateRotateRootKeysPythonScript({
      appName: selectedApp,
      keyCount,
      adminName,
    });

    setExampleScript(script);
    setShowScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleCopyExample = async () => {
    if (exampleScript) {
      try {
        await navigator.clipboard.writeText(exampleScript);
        toastSuccess('Script copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy example script:', err);
        toastError('Failed to copy script');
      }
    }
  };

  const handleGetCurrentRoot = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    setLoadingRootMetadata(true);
    try {
      const response = await axiosInstance.get(`/tuf/v1/metadata/root?appName=${encodeURIComponent(selectedApp)}`);
      
      const responseData = response.data?.data;
      if (!responseData || !responseData.trusted_root) {
        throw new Error('Invalid response: missing trusted_root field');
      }

      setRootMetadata(responseData.trusted_root);
      setShowRootMetadata(false);
      toastSuccess('Root metadata loaded successfully!');
    } catch (error: any) {
      console.error('Failed to get root metadata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get root metadata';
      toastError(errorMessage);
      setRootMetadata(null);
    } finally {
      setLoadingRootMetadata(false);
    }
  };

  const handleCopyRootMetadata = async () => {
    if (rootMetadata) {
      try {
        const jsonString = JSON.stringify(rootMetadata, null, 2);
        await navigator.clipboard.writeText(jsonString);
        toastSuccess('Root metadata copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy root metadata:', err);
        toastError('Failed to copy root metadata');
      }
    }
  };

  const generateNewRootMetadataScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateCreateNewRootMetadataPythonScript({
      appName: selectedApp,
      adminName,
    });

    setNewRootMetadataScript(script);
    setShowNewRootMetadataScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleCopyNewRootMetadataScript = async () => {
    if (newRootMetadataScript) {
      try {
        await navigator.clipboard.writeText(newRootMetadataScript);
        toastSuccess('Script copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy script:', err);
        toastError('Failed to copy script');
      }
    }
  };

  const generateSignMetadataOfflineScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateSignMetadataOfflinePythonScript({
      appName: selectedApp,
      adminName,
    });

    setSignMetadataOfflineScript(script);
    setShowSignMetadataOfflineScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleCopySignMetadataOfflineScript = async () => {
    if (signMetadataOfflineScript) {
      try {
        await navigator.clipboard.writeText(signMetadataOfflineScript);
        toastSuccess('Script copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy script:', err);
        toastError('Failed to copy script');
      }
    }
  };

  const handleMetadataPayloadChange = (value: string) => {
    setMetadataPayload(value);
    setMetadataPayloadError('');
    
    // Validate JSON on change
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (e) {
        // Error will be shown on submit
      }
    }
  };

  const handleSubmitMetadata = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    if (!metadataPayload.trim()) {
      setMetadataPayloadError('Metadata payload is required');
      return;
    }

    // Validate JSON
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadataPayload);
      setMetadataPayloadError('');
    } catch (e) {
      setMetadataPayloadError('Invalid JSON format');
      return;
    }

    setSubmittingMetadata(true);
    try {
      const payload = {
        metadata: {
          root: parsedMetadata,
        },
      };

      const response = await axiosInstance.post(
        `/tuf/v1/metadata?appName=${encodeURIComponent(selectedApp)}`,
        payload
      );

      const responseData = response.data?.data;
      if (!responseData) {
        throw new Error('Invalid response: missing data field');
      }

      const taskId = responseData.task_id;
      const lastUpdate = responseData.last_update;

      if (!taskId) {
        throw new Error('Invalid response: missing task_id');
      }

      toastSuccess('Metadata submitted successfully!');
      setMetadataPayload('');

      // Save to history with initial status, will be updated when we check the actual status
      onSaveToHistory({
        timestamp: lastUpdate || new Date().toISOString(),
        appName: selectedApp,
        operation: 'root-meta-update',
        status: 'pending', // Will be updated when we check actual status via API
        taskId: taskId,
      });

      // Immediately check the task status to update history with real status
      setTimeout(() => {
        onCheckTufTasks(taskId);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to submit metadata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit metadata';
      toastError(errorMessage);

      // Save failed operation to history
      onSaveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'root-meta-update',
        status: 'failed',
      });
    } finally {
      setSubmittingMetadata(false);
    }
  };

  // Generate guided tour steps
  const guidedTourSteps: Step[] = useMemo(() => {
    const adminName = userData?.owner || userData?.username || 'admin';
    const rotateRootKeysScriptFileName = selectedApp && adminName
      ? `rotate_root_keys_${selectedApp}_${adminName}.py`
      : 'rotate_root_keys.py';
    const newRootKeysInfoFileName = selectedApp && adminName 
      ? `new_root_keys_info_${selectedApp}_${adminName}.json`
      : 'new_root_keys_info_*.json';
    const currentRootFileName = selectedApp && adminName
      ? `current_root_${selectedApp}_${adminName}.json`
      : 'current_root.json';
    const createNewRootMetadataScriptFileName = selectedApp && adminName
      ? `create_new_root_metadata_${selectedApp}_${adminName}.py`
      : 'create_new_root_metadata.py';
    const signMetadataOfflineScriptFileName = selectedApp && adminName
      ? `sign_metadata_offline_${selectedApp}_${adminName}.py`
      : 'sign_metadata_offline.py';
    const signedNewRootMetadataFileName = selectedApp && adminName
      ? `signed_new_root_metadata_${selectedApp}_${adminName}.json`
      : 'signed_new_root_metadata.json';

    return [
      {
        stepNumber: 1,
        title: 'Generate initial root metadata script',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <h3 className="text-blue-500 font-semibold mb-2 font-roboto">Root Keys Rotation</h3>
                  <p className="text-theme-primary text-sm leading-relaxed mb-2">
                    This script generates new TUF root keys for rotation. Configure the number of new keys 
                    to generate, then generate and run the Python script on a secure offline machine.
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
                    <li>Configure the number of keys to generate below</li>
                    <li>Click "Generate Script" to create the Python script</li>
                    <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{rotateRootKeysScriptFileName}</code> on a secure offline machine</li>
                    <li>Set up Python environment and install dependencies:</li>
                  </ol>
                  <div className="bg-theme-input rounded-lg p-3 mb-3 font-mono text-xs text-theme-primary overflow-x-auto">
                    <div className="whitespace-pre">python3 -m venv .venv<br />source .venv/bin/activate  # On Windows: .venv\Scripts\activate<br />pip install cryptography<br />python3 {rotateRootKeysScriptFileName}</div>
                  </div>
                  <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1" start={5}>
                    <li>Copy the generated keys from <code className="bg-theme-input px-1 rounded">private_keys/</code> folder to the <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> folder specified in the environment variables of the faynosync API server</li>
                    <li>Use the generated <code className="bg-theme-input px-1 rounded">{newRootKeysInfoFileName}</code> file for reference when updating root metadata</li>
                  </ol>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">App Name</label>
              <input
                type="text"
                value={selectedApp}
                disabled
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">Count of Keys</label>
              <input
                type="number"
                value={keyCount}
                onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
              />
              <p className="text-xs text-theme-primary opacity-70 mt-1">
                Number of new root keys to generate for rotation
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateExampleScript}
                disabled={!selectedApp || keyCount < 1}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {exampleScript && (
                <button
                  onClick={handleCopyExample}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        stepNumber: 2,
        title: 'Get current root metadata',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    After you have successfully generated new root keys, you need to get the current root file. 
                    Click the <strong>"Get current root"</strong> button and save the received JSON to a file named <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code>.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGetCurrentRoot}
                disabled={!selectedApp || loadingRootMetadata}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRootMetadata ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Get current root
                  </>
                )}
              </button>
              {rootMetadata && (
                <button
                  onClick={handleCopyRootMetadata}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Root Metadata
                </button>
              )}
            </div>
            {rootMetadata && (
              <div className="mt-4">
                <div className="bg-theme-input rounded-lg p-4 border border-theme">
                  <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {JSON.stringify(rootMetadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        stepNumber: 3,
        title: 'Create new root metadata script',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now that you have saved the <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code> file, 
                    you can generate new metadata. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{createNewRootMetadataScriptFileName}</code>. 
                    You can see the command to run the script at the beginning of the generated script.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateNewRootMetadataScript}
                disabled={!selectedApp}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {newRootMetadataScript && (
                <button
                  onClick={handleCopyNewRootMetadataScript}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        stepNumber: 4,
        title: 'Sign metadata offline',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now let's sign our metadata offline. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{signMetadataOfflineScriptFileName}</code>. 
                    The complete and correct command to run this script was returned at the end of the <code className="bg-theme-input px-1 rounded">{createNewRootMetadataScriptFileName}</code> script.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateSignMetadataOfflineScript}
                disabled={!selectedApp}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {signMetadataOfflineScript && (
                <button
                  onClick={handleCopySignMetadataOfflineScript}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
          </div>
        ),
      },
      {
        stepNumber: 5,
        title: 'Submit metadata',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now that you have received <code className="bg-theme-input px-1 rounded">{signedNewRootMetadataFileName}</code>, 
                    submit it here.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">Metadata Payload</label>
              <textarea
                value={metadataPayload}
                onChange={(e) => handleMetadataPayloadChange(e.target.value)}
                placeholder="Paste signed root metadata JSON here..."
                rows={8}
                className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                  metadataPayloadError ? 'border-red-500' : 'border-theme'
                }`}
              />
              {metadataPayloadError && (
                <p className="text-red-500 text-sm mt-1">{metadataPayloadError}</p>
              )}
            </div>
            <button
              onClick={handleSubmitMetadata}
              disabled={!selectedApp || !metadataPayload.trim() || submittingMetadata}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingMetadata ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Submit Metadata
                </>
              )}
            </button>
          </div>
        ),
      },
    ];
  }, [
    selectedApp,
    userData,
    keyCount,
    exampleScript,
    rootMetadata,
    loadingRootMetadata,
    newRootMetadataScript,
    signMetadataOfflineScript,
    metadataPayload,
    metadataPayloadError,
    submittingMetadata,
  ]);

  if (!selectedApp || !isBootstrapSuccess) {
    return null;
  }

  return (
    <>
      <StepperModal
        isOpen={showGuidedTour}
        onClose={() => setShowGuidedTour(false)}
        steps={guidedTourSteps}
        title="Root Keys Rotation - Guided Tour"
      />
      <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowRotateKeys(!showRotateKeys)}
            className="flex items-center justify-between flex-1 text-theme-primary hover:text-theme-button-primary transition-colors"
          >
            <h2 className="text-lg font-bold font-roboto">
              Rotate Root Keys
            </h2>
            <i className={`fas fa-chevron-${showRotateKeys ? 'up' : 'down'}`}></i>
          </button>
          {showRotateKeys && (
            <button
              onClick={() => setShowGuidedTour(true)}
              className="ml-4 bg-purple-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-600 transition-colors flex items-center"
              title="Start Guided Tour"
            >
              <i className="fas fa-route mr-2"></i>
              Guided Tour
            </button>
          )}
        </div>

      {showRotateKeys && (
        <>
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
              <div className="flex-1">
                <h3 className="text-blue-500 font-semibold mb-2 font-roboto">Root Keys Rotation</h3>
                <p className="text-theme-primary text-sm leading-relaxed mb-2">
                  This script generates new TUF root keys for rotation. Configure the number of new keys 
                  to generate, then generate and run the Python script on a secure offline machine.
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
                  <li>Configure the number of keys to generate below</li>
                  <li>Click "Generate Script" to create the Python script</li>
                  <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{rotateRootKeysScriptFileName}</code> on a secure offline machine</li>
                  <li>Set up Python environment and install dependencies:</li>
                </ol>
                <div className="bg-theme-input rounded-lg p-3 mb-3 font-mono text-xs text-theme-primary overflow-x-auto">
                  <div className="whitespace-pre">python3 -m venv .venv<br />source .venv/bin/activate  # On Windows: .venv\Scripts\activate<br />pip install cryptography<br />python3 {rotateRootKeysScriptFileName}</div>
                </div>
                <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1" start={5}>
                  <li>Copy the generated keys from <code className="bg-theme-input px-1 rounded">private_keys/</code> folder to the <code className="bg-theme-input px-1 rounded">ONLINE_KEY_DIR</code> folder specified in the environment variables of the faynosync API server</li>
                  <li>Use the generated <code className="bg-theme-input px-1 rounded">{newRootKeysInfoFileName}</code> file for reference when updating root metadata</li>
                </ol>
              </div>
            </div>
          </div>
          <h2 className="text-lg font-bold font-roboto text-theme-primary">
            Step 1: Generate initial root metadata script
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">App Name</label>
              <input
                type="text"
                value={selectedApp}
                disabled
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-theme-primary mb-2 font-roboto">Count of Keys</label>
              <input
                type="number"
                value={keyCount}
                onChange={(e) => setKeyCount(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
              />
              <p className="text-xs text-theme-primary opacity-70 mt-1">
                Number of new root keys to generate for rotation
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={generateExampleScript}
                    disabled={!selectedApp || keyCount < 1}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-code mr-2"></i>
                    Generate Script
                  </button>
                  {exampleScript && (
                    <button
                      onClick={handleCopyExample}
                      className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                    >
                      <i className="fas fa-copy mr-2"></i>
                      Copy Script
                    </button>
                  )}
                </div>
                
                {exampleScript && (
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
                          {exampleScript}
                        </pre>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleCopyExample}
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
              
              <div className="h-px w-full bg-theme-card-hover"></div>
              <h2 className="text-lg font-bold font-roboto text-theme-primary">
                Step 2: Get current root metadata
              </h2>
              {/* Info about getting current root */}
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed">
                      After you have successfully generated new root keys, you need to get the current root file. 
                      Click the <strong>"Get current root"</strong> button and save the received JSON to a file named <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code>.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleGetCurrentRoot}
                  disabled={!selectedApp || loadingRootMetadata}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingRootMetadata ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download mr-2"></i>
                      Get current root
                    </>
                  )}
                </button>
                {rootMetadata && (
                  <button
                    onClick={handleCopyRootMetadata}
                    className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copy Root Metadata
                  </button>
                )}
              </div>
            </div>

            {rootMetadata && (
              <div className="mt-4">
                <button
                  onClick={() => setShowRootMetadata(!showRootMetadata)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showRootMetadata ? 'up' : 'down'} mr-2`}></i>
                  Current Root Metadata {showRootMetadata ? '(click to hide)' : '(click to expand)'}
                </button>
                {showRootMetadata && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(rootMetadata, null, 2)}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCopyRootMetadata}
                        className="bg-theme-button-primary text-theme-primary px-3 py-1 rounded text-sm hover:bg-theme-button-primary-hover"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Copy Root Metadata
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <h2 className="text-lg font-bold font-roboto text-theme-primary">
                Step 3: Create new root metadata script
            </h2>
            {/* Info about creating new root metadata */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now that you have saved the <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code> file, 
                    you can generate new metadata. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{createNewRootMetadataScriptFileName}</code>. 
                    You can see the command to run the script at the beginning of the generated script.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 items-center">
              <button
                onClick={generateNewRootMetadataScript}
                disabled={!selectedApp}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {newRootMetadataScript && (
                <button
                  onClick={handleCopyNewRootMetadataScript}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>

            {newRootMetadataScript && (
              <div className="mt-4">
                <button
                  onClick={() => setShowNewRootMetadataScript(!showNewRootMetadataScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showNewRootMetadataScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showNewRootMetadataScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showNewRootMetadataScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {newRootMetadataScript}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCopyNewRootMetadataScript}
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
            <h2 className="text-lg font-bold font-roboto text-theme-primary">
                Step 4: Sign metadata offline
            </h2>
            {/* Info about signing metadata offline */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now let's sign our metadata offline. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{signMetadataOfflineScriptFileName}</code>. 
                    The complete and correct command to run this script was returned at the end of the <code className="bg-theme-input px-1 rounded">{createNewRootMetadataScriptFileName}</code> script.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 items-center">
              <button
                onClick={generateSignMetadataOfflineScript}
                disabled={!selectedApp}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {signMetadataOfflineScript && (
                <button
                  onClick={handleCopySignMetadataOfflineScript}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>

            {signMetadataOfflineScript && (
              <div className="mt-4">
                <button
                  onClick={() => setShowSignMetadataOfflineScript(!showSignMetadataOfflineScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showSignMetadataOfflineScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showSignMetadataOfflineScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showSignMetadataOfflineScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {signMetadataOfflineScript}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleCopySignMetadataOfflineScript}
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
            <h2 className="text-lg font-bold font-roboto text-theme-primary">
                Step 5: Submit metadata
            </h2>
            {/* Info about submitting metadata */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now that you have received <code className="bg-theme-input px-1 rounded">{signedNewRootMetadataFileName}</code>, 
                    submit it here.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Metadata Payload</label>
                <textarea
                  value={metadataPayload}
                  onChange={(e) => handleMetadataPayloadChange(e.target.value)}
                  placeholder="Paste signed root metadata JSON here..."
                  rows={8}
                  className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                    metadataPayloadError ? 'border-red-500' : 'border-theme'
                  }`}
                />
                {metadataPayloadError && (
                  <p className="text-red-500 text-sm mt-1">{metadataPayloadError}</p>
                )}
              </div>

              <button
                onClick={handleSubmitMetadata}
                disabled={!selectedApp || !metadataPayload.trim() || submittingMetadata}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingMetadata ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Metadata
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
};


