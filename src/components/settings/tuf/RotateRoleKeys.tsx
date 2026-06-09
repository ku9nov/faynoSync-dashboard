import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '@/config/axios';
import { useToast } from '@/hooks/useToast';
import { useUsersQuery } from '@/hooks/use-query/useUsersQuery';
import { deleteSigningMetadata } from '@/components/settings/tuf/deleteSigningMetadata';
import { MetadataUpdatePanel } from '@/components/settings/tuf/MetadataUpdatePanel';
import { generateCreateNewRootMetadataRoleRotationPythonScript } from '@/components/settings/tuf/generateCreateNewRootMetadataRoleRotationScript';
import { generateGenerateSignaturesPythonScript } from '@/components/settings/tuf/generateGenerateSignaturesScript';
import { DEFAULT_KEY_ALGORITHM, KeyAlgorithm, normalizeKeyAlgorithm } from '@/components/settings/tuf/keyAlgorithm';
import { generateRotateRoleKeysPythonScript } from '@/components/settings/tuf/generateRotateRoleKeysScript';
import { generateUpdateKeyInfoRoleRotationPythonScript } from '@/components/settings/tuf/generateUpdateKeyInfoRoleRotationScript';

interface RotateRoleKeysProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onSaveToHistory: (entry: Omit<import('@/components/settings/tuf/types').TufHistoryEntry, 'id'>) => void;
  onCheckTufTasks: (taskId?: string) => void;
  onUpdateMetadata: (roles: string[]) => Promise<void> | void;
}

type BuiltInRole = 'timestamp' | 'snapshot' | 'targets';

const sanitizeRoleForFileTag = (roleName: string): string =>
  roleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'role';

const isThresholdNotMetError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('threshold not reached') ||
    normalized.includes('not enough signatures') ||
    normalized.includes('new root not signed by trusted root') ||
    normalized.includes('progress:')
  );
};

const normalizeTrustedRootMetadata = (value: unknown): any | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return normalizeTrustedRootMetadata(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, any>;

  if (candidate.signed?.keys && candidate.signed?.roles) {
    return candidate;
  }

  if (candidate.data?.trusted_root) {
    return normalizeTrustedRootMetadata(candidate.data.trusted_root);
  }

  if (candidate.trusted_root) {
    return normalizeTrustedRootMetadata(candidate.trusted_root);
  }

  return null;
};

export const RotateRoleKeys: React.FC<RotateRoleKeysProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onSaveToHistory,
  onCheckTufTasks,
  onUpdateMetadata,
}) => {
  const { toastSuccess, toastError } = useToast();
  const { data: userData } = useUsersQuery();

  const [showRotateRoleKeys, setShowRotateRoleKeys] = useState(false);
  const [selectedRole, setSelectedRole] = useState<BuiltInRole>('timestamp');
  const [keyCount, setKeyCount] = useState(1);
  const [threshold, setThreshold] = useState(1);
  const [selectedKeyType, setSelectedKeyType] = useState<KeyAlgorithm>(DEFAULT_KEY_ALGORITHM);

  const [exampleScript, setExampleScript] = useState('');
  const [showExampleScript, setShowExampleScript] = useState(false);
  const [newRootMetadataScript, setNewRootMetadataScript] = useState('');
  const [showNewRootMetadataScript, setShowNewRootMetadataScript] = useState(false);
  const [generateSignaturesScript, setGenerateSignaturesScript] = useState('');
  const [showGenerateSignaturesScript, setShowGenerateSignaturesScript] = useState(false);
  const [updateKeyInfoScript, setUpdateKeyInfoScript] = useState('');
  const [showUpdateKeyInfoScript, setShowUpdateKeyInfoScript] = useState(false);

  const [rootMetadata, setRootMetadata] = useState<any>(null);
  const [rootMetadataAppName, setRootMetadataAppName] = useState<string | null>(null);
  const [showRootMetadataStep2, setShowRootMetadataStep2] = useState(false);
  const [showRootMetadataStep6, setShowRootMetadataStep6] = useState(false);
  const [loadingRootMetadata, setLoadingRootMetadata] = useState(false);

  const [metadataPayload, setMetadataPayload] = useState('');
  const [metadataPayloadError, setMetadataPayloadError] = useState('');
  const [submittingMetadata, setSubmittingMetadata] = useState(false);

  const [signaturePayload, setSignaturePayload] = useState('');
  const [signaturePayloadError, setSignaturePayloadError] = useState('');
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<string>('');
  const [signatureErrorMessage, setSignatureErrorMessage] = useState('');

  const [checkingMetadataStatus, setCheckingMetadataStatus] = useState(false);
  const [metadataStatusResult, setMetadataStatusResult] = useState<string | null>(null);
  const [deletingSigningMetadata, setDeletingSigningMetadata] = useState(false);

  const adminName = userData?.owner || userData?.username || 'admin';
  const selectedRoleName = selectedRole;
  const selectedRoleFileTag = sanitizeRoleForFileTag(selectedRoleName);

  const rotateRoleKeysScriptFileName = selectedApp
    ? `rotate_${selectedRoleFileTag}_keys_${selectedApp}_${adminName}.py`
    : 'rotate_role_keys.py';
  const newRoleKeysInfoFileName = selectedApp
    ? `new_${selectedRoleFileTag}_keys_info_${selectedApp}_${adminName}.json`
    : 'new_role_keys_info.json';
  const currentRootFileName = selectedApp
    ? `current_root_${selectedApp}_${adminName}.json`
    : 'current_root.json';
  const createNewRootMetadataScriptFileName = selectedApp
    ? `create_new_root_metadata_${selectedRoleFileTag}_rotation_${selectedApp}_${adminName}.py`
    : 'create_new_root_metadata_role_rotation.py';
  const unsignedNewRootMetadataFileName = selectedApp
    ? `new_root_metadata_${selectedApp}_${adminName}.json`
    : 'new_root_metadata.json';
  const generateSignaturesScriptFileName = selectedApp
    ? `generate_signatures_${selectedApp}_${adminName}.py`
    : 'generate_signatures.py';
  const keyInfoFileName = selectedApp
    ? `key_info_${selectedApp}_${adminName}.json`
    : 'key_info.json';
  const updateKeyInfoScriptFileName = selectedApp
    ? `update_key_info_${selectedRoleFileTag}_rotation_${selectedApp}_${adminName}.py`
    : 'update_key_info_role_rotation.py';

  const detectedRoleKeyType = useMemo(() => {
    if (!selectedRoleName) {
      return DEFAULT_KEY_ALGORITHM;
    }
    const normalizedRoot = normalizeTrustedRootMetadata(rootMetadata);
    const keys = normalizedRoot?.signed?.keys;
    const roleKeyIds = normalizedRoot?.signed?.roles?.[selectedRoleName]?.keyids;
    const roleKeyId = Array.isArray(roleKeyIds) ? roleKeyIds[0] : null;
    const rawType = roleKeyId && keys?.[roleKeyId] ? keys[roleKeyId]?.keytype : null;
    try {
      return normalizeKeyAlgorithm(rawType || DEFAULT_KEY_ALGORITHM);
    } catch {
      return DEFAULT_KEY_ALGORITHM;
    }
  }, [rootMetadata, selectedRoleName]);

  useEffect(() => {
    setSelectedKeyType(detectedRoleKeyType);
  }, [detectedRoleKeyType]);

  useEffect(() => {
    setRootMetadata(null);
    setRootMetadataAppName(null);
  }, [selectedApp]);

  useEffect(() => {
    if (threshold > keyCount) {
      setThreshold(keyCount);
    }
  }, [keyCount, threshold]);

  const fetchCurrentRootMetadata = async (showSuccessToast: boolean): Promise<boolean> => {
    if (!selectedApp) {
      return false;
    }
    setLoadingRootMetadata(true);
    try {
      const response = await axiosInstance.get(`/tuf/v1/metadata/root?appName=${encodeURIComponent(selectedApp)}`);
      const responseData = response.data?.data;
      if (!responseData || !responseData.trusted_root) {
        throw new Error('Invalid response: missing trusted_root field');
      }

      const normalizedRoot = normalizeTrustedRootMetadata(responseData.trusted_root);
      if (!normalizedRoot) {
        throw new Error('Invalid trusted_root format');
      }

      setRootMetadata(normalizedRoot);
      setRootMetadataAppName(selectedApp);
      if (showSuccessToast) {
        toastSuccess('Root metadata loaded successfully!');
      }
      return true;
    } catch (error: any) {
      console.error('Failed to get root metadata:', error);
      if (showSuccessToast) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to get root metadata';
        toastError(errorMessage);
      }
      setRootMetadata(null);
      setRootMetadataAppName(null);
      return false;
    } finally {
      setLoadingRootMetadata(false);
    }
  };

  useEffect(() => {
    if (!showRotateRoleKeys || !selectedApp || !isBootstrapSuccess || loadingRootMetadata) {
      return;
    }
    if (rootMetadata && rootMetadataAppName === selectedApp) {
      return;
    }
    void fetchCurrentRootMetadata(false);
  }, [
    showRotateRoleKeys,
    selectedApp,
    isBootstrapSuccess,
    loadingRootMetadata,
    rootMetadata,
    rootMetadataAppName,
  ]);

  const handleCopyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastSuccess(successMessage);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toastError('Failed to copy');
    }
  };

  const handleGetCurrentRoot = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    await fetchCurrentRootMetadata(true);
  };

  const handleCopyRootMetadata = async () => {
    if (!rootMetadata) {
      return;
    }
    await handleCopyToClipboard(JSON.stringify(rootMetadata, null, 2), 'Root metadata copied to clipboard successfully!');
  };

  const generateExampleScript = () => {
    if (!selectedApp) {
      toastError('Please select app and role');
      return;
    }
    if (keyCount < 1 || threshold < 1 || threshold > keyCount) {
      toastError('Invalid key count or threshold');
      return;
    }

    const script = generateRotateRoleKeysPythonScript({
      appName: selectedApp,
      adminName,
      roleName: selectedRoleName,
      roleFileTag: selectedRoleFileTag,
      keyCount,
      threshold,
      keyType: selectedKeyType,
    });
    setExampleScript(script);
    setShowExampleScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const generateNewRootMetadataScript = () => {
    if (!selectedApp) {
      toastError('Please select app and role');
      return;
    }
    const script = generateCreateNewRootMetadataRoleRotationPythonScript({
      appName: selectedApp,
      adminName,
      roleName: selectedRoleName,
      roleFileTag: selectedRoleFileTag,
      keyType: selectedKeyType,
    });
    setNewRootMetadataScript(script);
    setShowNewRootMetadataScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const generateGenerateSignaturesScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    const script = generateGenerateSignaturesPythonScript({
      appName: selectedApp,
      adminName,
      keyType: selectedKeyType,
    });
    setGenerateSignaturesScript(script);
    setShowGenerateSignaturesScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const generateUpdateKeyInfoScript = () => {
    if (!selectedApp) {
      toastError('Please select app and role');
      return;
    }
    const script = generateUpdateKeyInfoRoleRotationPythonScript({
      appName: selectedApp,
      adminName,
      roleName: selectedRoleName,
      roleFileTag: selectedRoleFileTag,
    });
    setUpdateKeyInfoScript(script);
    setShowUpdateKeyInfoScript(false);
    toastSuccess('Python script generated successfully!');
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

    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadataPayload);
      setMetadataPayloadError('');
    } catch {
      setMetadataPayloadError('Invalid JSON format');
      return;
    }

    setSubmittingMetadata(true);
    try {
      const response = await axiosInstance.post(
        `/tuf/v1/metadata?appName=${encodeURIComponent(selectedApp)}`,
        {
          metadata: {
            root: parsedMetadata,
          },
        }
      );
      const responseData = response.data?.data;
      if (!responseData?.task_id) {
        throw new Error('Invalid response: missing task_id');
      }

      toastSuccess('Metadata submitted successfully!');
      setMetadataPayload('');

      onSaveToHistory({
        timestamp: responseData.last_update || new Date().toISOString(),
        appName: selectedApp,
        operation: 'root-meta-update',
        status: 'pending',
        taskId: responseData.task_id,
      });
      setTimeout(() => onCheckTufTasks(responseData.task_id), 1000);
    } catch (error: any) {
      console.error('Failed to submit metadata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit metadata';
      toastError(errorMessage);
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

  const handleSubmitSignature = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    if (!signaturePayload.trim()) {
      setSignaturePayloadError('Signature payload is required');
      return;
    }

    let parsedSignature;
    try {
      parsedSignature = JSON.parse(signaturePayload);
      if (!parsedSignature.keyid || !parsedSignature.sig) {
        setSignaturePayloadError('Signature must contain keyid and sig fields');
        return;
      }
      setSignaturePayloadError('');
    } catch {
      setSignaturePayloadError('Invalid JSON format');
      return;
    }

    setSubmittingSignature(true);
    setSignatureStatus('');
    setSignatureErrorMessage('');

    try {
      const response = await axiosInstance.post(
        `/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`,
        {
          role: 'root',
          signature: parsedSignature,
        }
      );
      const message = response.data?.message || response.data?.data?.message || '';
      if (
        message === 'Metadata update finished' ||
        message === 'No metadata pending signing available' ||
        message.toLowerCase().includes('no metadata pending')
      ) {
        setSignatureStatus('success');
        toastSuccess('Metadata update finished! Role keys rotation completed successfully.');
      } else {
        setSignatureStatus('partial');
        toastSuccess(message || 'Signature submitted successfully. Continue submitting signatures.');
      }
      setSignaturePayload('');
    } catch (error: any) {
      const errorDetail = error.response?.data?.error || '';
      const errorMessage = error.response?.data?.message || '';
      const fullErrorMessage = errorDetail || errorMessage || error.message || 'Failed to submit signature';

      if (
        fullErrorMessage === 'No metadata pending signing available' ||
        fullErrorMessage.toLowerCase().includes('no metadata pending')
      ) {
        setSignatureStatus('success');
        toastSuccess('Metadata update finished! Role keys rotation completed successfully.');
        setSignaturePayload('');
      } else if (isThresholdNotMetError(fullErrorMessage)) {
        setSignatureStatus('threshold');
        setSignatureErrorMessage('Threshold not met');
        toastError('Threshold not met');
        setSignaturePayload('');
      } else {
        setSignatureStatus('error');
        setSignatureErrorMessage(fullErrorMessage);
        toastError(fullErrorMessage);
      }
    } finally {
      setSubmittingSignature(false);
    }
  };

  const handleCheckMetadataStatus = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setCheckingMetadataStatus(true);
    setMetadataStatusResult(null);
    try {
      const response = await axiosInstance.get(`/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`);
      const message = response.data?.message || response.data?.data?.message || '';

      if (
        message === 'Metadata update finished' ||
        message === 'No metadata pending signing available' ||
        message.toLowerCase().includes('no metadata pending')
      ) {
        setMetadataStatusResult('finished');
        toastSuccess('Metadata update finished! Role keys rotation completed successfully.');
      } else if (message) {
        setMetadataStatusResult('in-progress');
        toastSuccess(`Status: ${message}`);
      } else {
        setMetadataStatusResult('unknown');
        toastSuccess('Status checked successfully');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to check metadata status';
      if (errorMessage.includes('not enough signatures') || errorMessage.includes('threshold not reached')) {
        setMetadataStatusResult('threshold-not-met');
      } else {
        setMetadataStatusResult('error');
      }
      toastError(errorMessage);
    } finally {
      setCheckingMetadataStatus(false);
    }
  };

  const handleDeleteSigningMetadata = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setDeletingSigningMetadata(true);
    try {
      const result = await deleteSigningMetadata({
        appName: selectedApp,
        role: 'root',
      });
      if (result.hasTask && result.taskId) {
        onSaveToHistory({
          timestamp: result.lastUpdate || new Date().toISOString(),
          appName: selectedApp,
          operation: 'metadata-update',
          status: 'pending',
          taskId: result.taskId,
        });
        setTimeout(() => onCheckTufTasks(result.taskId), 1000);
      }
      toastSuccess(result.message || 'Signing metadata deleted successfully.');
      setSignatureStatus('');
      setSignatureErrorMessage('');
      setSignaturePayload('');
    } catch (error: any) {
      toastError(error.message || 'Failed to delete signing metadata');
    } finally {
      setDeletingSigningMetadata(false);
    }
  };

  if (!selectedApp || !isBootstrapSuccess) {
    return null;
  }

  return (
    <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
      <button
        onClick={() => setShowRotateRoleKeys(!showRotateRoleKeys)}
        className="flex items-center justify-between w-full text-left text-theme-primary hover:text-theme-button-primary transition-colors"
      >
        <h2 className="text-lg font-bold font-roboto">Rotate Top-Level Role Keys</h2>
        <i className={`fas fa-chevron-${showRotateRoleKeys ? 'up' : 'down'}`}></i>
      </button>

      {showRotateRoleKeys && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <p className="text-theme-primary text-sm leading-relaxed">
              This flow rotates role keys for <code className="bg-theme-input px-1 rounded">timestamp</code>,
              <code className="bg-theme-input px-1 rounded ml-1">snapshot</code>,
              <code className="bg-theme-input px-1 rounded ml-1">targets</code> without root key rotation.
              Root trust remains anchored in root metadata signatures.
            </p>
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 1: Generate role keys</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BuiltInRole)}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                >
                  <option value="timestamp">timestamp</option>
                  <option value="snapshot">snapshot</option>
                  <option value="targets">targets</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Number of keys</label>
                <input
                  type="number"
                  min={1}
                  value={keyCount}
                  onChange={(e) => setKeyCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Role threshold</label>
                <input
                  type="number"
                  min={1}
                  max={keyCount}
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Key algorithm</label>
                <select
                  value={selectedKeyType}
                  onChange={(e) => setSelectedKeyType(e.target.value as KeyAlgorithm)}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                >
                  <option value="ed25519">ed25519</option>
                  <option value="ecdsa">ecdsa</option>
                  <option value="rsa">rsa</option>
                </select>
              </div>
            </div>

            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {rotateRoleKeysScriptFileName}
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={generateExampleScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {exampleScript && (
                <button
                  onClick={() => handleCopyToClipboard(exampleScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>

            {exampleScript && (
              <div>
                <button
                  onClick={() => setShowExampleScript(!showExampleScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showExampleScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showExampleScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showExampleScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{exampleScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 2: Get current root</h2>
          <div className="space-y-4">
            <div className="mt-2 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    After you have successfully generated new keys for the selected role, you need to get the current root file.
                    Click the "Get current root" button and save the received JSON to a file named{' '}
                    <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code>.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGetCurrentRoot}
                disabled={!selectedApp || loadingRootMetadata}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div>
                <button
                  onClick={() => setShowRootMetadataStep2(!showRootMetadataStep2)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showRootMetadataStep2 ? 'up' : 'down'} mr-2`}></i>
                  Current Root Metadata {showRootMetadataStep2 ? '(click to hide)' : '(click to expand)'}
                </button>
                {showRootMetadataStep2 && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(rootMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">
            Step 3: Create new root metadata (only {selectedRoleName || 'role'} key change)
          </h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {createNewRootMetadataScriptFileName} {'\\'}
              <br />
              --current {currentRootFileName} {'\\'}
              <br />
              --new-{selectedRoleFileTag}-keys {newRoleKeysInfoFileName} {'\\'}
              <br />
              --output {unsignedNewRootMetadataFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateNewRootMetadataScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {newRootMetadataScript && (
                <button
                  onClick={() => handleCopyToClipboard(newRootMetadataScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {newRootMetadataScript && (
              <div>
                <button
                  onClick={() => setShowNewRootMetadataScript(!showNewRootMetadataScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showNewRootMetadataScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showNewRootMetadataScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showNewRootMetadataScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{newRootMetadataScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 4: Submit metadata</h2>
          <div className="space-y-4">
            <textarea
              value={metadataPayload}
              onChange={(e) => {
                setMetadataPayload(e.target.value);
                setMetadataPayloadError('');
              }}
              placeholder="Paste unsigned root metadata JSON here..."
              rows={8}
              className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                metadataPayloadError ? 'border-red-500' : 'border-theme'
              }`}
            />
            {metadataPayloadError && <p className="text-red-500 text-sm">{metadataPayloadError}</p>}
            <button
              onClick={handleSubmitMetadata}
              disabled={!selectedApp || !metadataPayload.trim() || submittingMetadata}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 5: Generate signatures</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {generateSignaturesScriptFileName} {'\\'}
              <br />
              --metadata {unsignedNewRootMetadataFileName} {'\\'}
              <br />
              --old-keys-info {keyInfoFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateGenerateSignaturesScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {generateSignaturesScript && (
                <button
                  onClick={() => handleCopyToClipboard(generateSignaturesScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {generateSignaturesScript && (
              <div>
                <button
                  onClick={() => setShowGenerateSignaturesScript(!showGenerateSignaturesScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showGenerateSignaturesScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showGenerateSignaturesScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showGenerateSignaturesScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{generateSignaturesScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 6: Submit signatures</h2>
          <div className="space-y-4">
            <textarea
              value={signaturePayload}
              onChange={(e) => {
                setSignaturePayload(e.target.value);
                setSignaturePayloadError('');
              }}
              placeholder='Paste signature JSON here (e.g., {"keyid": "...", "sig": "..."})'
              rows={6}
              className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                signaturePayloadError ? 'border-red-500' : 'border-theme'
              }`}
            />
            {signaturePayloadError && <p className="text-red-500 text-sm">{signaturePayloadError}</p>}

            {signatureStatus === 'success' && (
              <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                <p className="text-green-500 font-semibold">Metadata update finished successfully.</p>
              </div>
            )}

            {signatureStatus === 'partial' && (
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <p className="text-blue-500 font-semibold">Signature added successfully.</p>
              </div>
            )}

            {signatureStatus === 'threshold' && (
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-semibold">Threshold not met.</p>
              </div>
            )}

            {signatureStatus === 'error' && (
              <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-red-500 font-semibold mb-2">Error submitting signature</p>
                <p className="text-theme-primary text-sm font-mono">{signatureErrorMessage}</p>
              </div>
            )}

            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={handleSubmitSignature}
                disabled={!selectedApp || !signaturePayload.trim() || submittingSignature}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingSignature ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Signature
                  </>
                )}
              </button>

              <button
                onClick={handleCheckMetadataStatus}
                disabled={!selectedApp || checkingMetadataStatus}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingMetadataStatus ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Checking...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle mr-2"></i>
                    Check Status
                  </>
                )}
              </button>

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

              <button
                onClick={handleDeleteSigningMetadata}
                disabled={!selectedApp || deletingSigningMetadata}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingSigningMetadata ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete signing metadata
                  </>
                )}
              </button>
            </div>

            {rootMetadata && (
              <div>
                <button
                  onClick={() => setShowRootMetadataStep6(!showRootMetadataStep6)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showRootMetadataStep6 ? 'up' : 'down'} mr-2`}></i>
                  Current Root Metadata {showRootMetadataStep6 ? '(click to hide)' : '(click to expand)'}
                </button>
                {showRootMetadataStep6 && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(rootMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {metadataStatusResult === 'finished' && (
              <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                <p className="text-green-500 font-semibold">Metadata update finished.</p>
              </div>
            )}
            {metadataStatusResult === 'threshold-not-met' && (
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-semibold">Threshold not reached yet.</p>
              </div>
            )}
            {metadataStatusResult === 'in-progress' && (
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <p className="text-blue-500 font-semibold">Metadata update in progress.</p>
              </div>
            )}
            {metadataStatusResult === 'error' && (
              <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-red-500 font-semibold">Error checking status.</p>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 7: Recommended update metadata files</h2>
          <MetadataUpdatePanel
            onUpdateMetadata={onUpdateMetadata}
            title="Update Metadata Files"
            description="After key rotation is completed, it is strongly recommended to update metadata files to apply the change. Select which roles to update, or leave all unchecked to update all roles (timestamp, targets, snapshot)."
          />

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 8: Recommended update key info state</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <p className="text-theme-primary text-sm leading-relaxed">
                It is recommended to run this script so local key info files keep the correct post-rotation state.
              </p>
            </div>
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {updateKeyInfoScriptFileName} {'\\'}
              <br />
              --key-info {keyInfoFileName} {'\\'}
              <br />
              --new-{selectedRoleFileTag}-keys {newRoleKeysInfoFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={generateUpdateKeyInfoScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {updateKeyInfoScript && (
                <button
                  onClick={() => handleCopyToClipboard(updateKeyInfoScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {updateKeyInfoScript && (
              <div>
                <button
                  onClick={() => setShowUpdateKeyInfoScript(!showUpdateKeyInfoScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showUpdateKeyInfoScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showUpdateKeyInfoScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showUpdateKeyInfoScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{updateKeyInfoScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
