import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../config/axios';
import { useToast } from '../../../hooks/useToast';
import { useUsersQuery } from '../../../hooks/use-query/useUsersQuery';
import { generateRotateDelegatedRoleKeysPythonScript } from './generateRotateDelegatedRoleKeysScript';
import { generateCreateNewTargetsDelegationMetadataPythonScript } from './generateCreateNewTargetsMetadataDelegationRotationScript';
import { generateCreateNewDelegatedRoleMetadataPythonScript } from './generateCreateNewDelegatedRoleMetadataScript';
import { generateBuildDelegatedRotationRequestPythonScript } from './generateBuildDelegatedRotationRequestScript';
import { generateSignMetadataForApiPythonScript } from './generateSignMetadataForApiScript';
import { generateUpdateKeyInfoDelegatedRotationPythonScript } from './generateUpdateKeyInfoDelegatedRotationScript';
import { DEFAULT_KEY_ALGORITHM, KeyAlgorithm } from './keyAlgorithm';
import { deleteSigningMetadata } from './deleteSigningMetadata';

interface RotateDelegatedKeysProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onSaveToHistory: (entry: Omit<import('./types').TufHistoryEntry, 'id'>) => void;
  onCheckTufTasks: (taskId?: string) => void;
}

const sanitizeRoleForFileTag = (roleName: string): string =>
  roleName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'default';

const isThresholdNotMetError = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('threshold not reached') ||
    normalized.includes('not enough signatures') ||
    normalized.includes('progress:')
  );
};

const normalizeTrustedTargetsMetadata = (value: unknown): any | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return normalizeTrustedTargetsMetadata(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object') {
    return null;
  }
  const candidate = value as Record<string, any>;
  if (candidate.signed?.version && candidate.signed?.expires) {
    return candidate;
  }
  if (candidate.data?.trusted_targets) {
    return normalizeTrustedTargetsMetadata(candidate.data.trusted_targets);
  }
  if (candidate.trusted_targets) {
    return normalizeTrustedTargetsMetadata(candidate.trusted_targets);
  }
  return null;
};

const normalizeTrustedDelegatedMetadata = (value: unknown): any | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return normalizeTrustedDelegatedMetadata(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object') {
    return null;
  }
  const candidate = value as Record<string, any>;
  if (candidate.signed?.version && candidate.signed?.expires) {
    return candidate;
  }
  if (candidate.data?.trusted_delegated) {
    return normalizeTrustedDelegatedMetadata(candidate.data.trusted_delegated);
  }
  if (candidate.trusted_delegated) {
    return normalizeTrustedDelegatedMetadata(candidate.trusted_delegated);
  }
  return null;
};

export const RotateDelegatedKeys: React.FC<RotateDelegatedKeysProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onSaveToHistory,
  onCheckTufTasks,
}) => {
  const { toastSuccess, toastError } = useToast();
  const { data: userData } = useUsersQuery();

  const [showRotateDelegatedKeys, setShowRotateDelegatedKeys] = useState(false);
  const [roleName, setRoleName] = useState('default');
  const [keyCount, setKeyCount] = useState(1);
  const [threshold, setThreshold] = useState(1);
  const [selectedKeyType, setSelectedKeyType] = useState<KeyAlgorithm>(DEFAULT_KEY_ALGORITHM);

  const [rotateScript, setRotateScript] = useState('');
  const [showRotateScript, setShowRotateScript] = useState(false);
  const [targetsScript, setTargetsScript] = useState('');
  const [showTargetsScript, setShowTargetsScript] = useState(false);
  const [delegatedScript, setDelegatedScript] = useState('');
  const [showDelegatedScript, setShowDelegatedScript] = useState(false);
  const [requestScript, setRequestScript] = useState('');
  const [showRequestScript, setShowRequestScript] = useState(false);
  const [signScript, setSignScript] = useState('');
  const [showSignScript, setShowSignScript] = useState(false);
  const [updateKeyInfoScript, setUpdateKeyInfoScript] = useState('');
  const [showUpdateKeyInfoScript, setShowUpdateKeyInfoScript] = useState(false);

  const [targetsMetadata, setTargetsMetadata] = useState<any>(null);
  const [delegatedMetadata, setDelegatedMetadata] = useState<any>(null);
  const [loadingTargetsMetadata, setLoadingTargetsMetadata] = useState(false);
  const [loadingDelegatedMetadata, setLoadingDelegatedMetadata] = useState(false);
  const [showTargetsMetadata, setShowTargetsMetadata] = useState(false);
  const [showDelegatedMetadata, setShowDelegatedMetadata] = useState(false);

  const [rotationRequestPayload, setRotationRequestPayload] = useState('');
  const [rotationRequestError, setRotationRequestError] = useState('');
  const [submittingRotationRequest, setSubmittingRotationRequest] = useState(false);

  const [signaturePayload, setSignaturePayload] = useState('');
  const [signaturePayloadError, setSignaturePayloadError] = useState('');
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState('');
  const [signatureStatusMessage, setSignatureStatusMessage] = useState('');
  const [signatureErrorMessage, setSignatureErrorMessage] = useState('');
  const [targetsSignaturesRequired, setTargetsSignaturesRequired] = useState(2);
  const [delegatedSignaturesRequired, setDelegatedSignaturesRequired] = useState(1);

  const [checkingSigningQueue, setCheckingSigningQueue] = useState(false);
  const [signingQueueMessage, setSigningQueueMessage] = useState('');
  const [deletingSigningMetadata, setDeletingSigningMetadata] = useState(false);

  const adminName = userData?.owner || userData?.username || 'admin';
  const roleFileTag = sanitizeRoleForFileTag(roleName);
  const normalizedRoleName = roleName.trim() || 'default';

  const rotateScriptFileName = selectedApp
    ? `rotate_delegated_role_keys_${selectedApp}_${adminName}.py`
    : 'rotate_delegated_role_keys.py';
  const createTargetsScriptFileName = selectedApp
    ? `create_new_targets_metadata_delegation_rotation_${selectedApp}_${adminName}.py`
    : 'create_new_targets_metadata_delegation_rotation.py';
  const createDelegatedScriptFileName = selectedApp
    ? `create_new_delegated_role_metadata_${selectedApp}_${adminName}.py`
    : 'create_new_delegated_role_metadata.py';
  const buildRequestScriptFileName = selectedApp
    ? `build_delegated_rotation_request_${selectedApp}_${adminName}.py`
    : 'build_delegated_rotation_request.py';
  const signScriptFileName = selectedApp
    ? `sign_metadata_for_api_${selectedApp}_${adminName}.py`
    : 'sign_metadata_for_api.py';
  const updateKeyInfoScriptFileName = selectedApp
    ? `update_key_info_delegated_rotation_${selectedApp}_${adminName}.py`
    : 'update_key_info_delegated_rotation.py';
  const keyInfoFileName = selectedApp
    ? `key_info_${selectedApp}_${adminName}.json`
    : 'key_info.json';
  const newRoleKeysInfoFileName = selectedApp
    ? `new_${roleFileTag}_keys_info_${selectedApp}_${adminName}.json`
    : 'new_role_keys_info.json';
  const currentTargetsFileName = selectedApp
    ? `current_targets_${selectedApp}_${adminName}.json`
    : 'current_targets.json';
  const currentDelegatedFileName = selectedApp
    ? `current_${roleFileTag}_${selectedApp}_${adminName}.json`
    : 'current_delegated.json';
  const newTargetsMetadataFileName = selectedApp
    ? `new_targets_metadata_${selectedApp}_${adminName}.json`
    : 'new_targets_metadata.json';
  const newDelegatedMetadataFileName = selectedApp
    ? `new_${roleFileTag}_metadata_${selectedApp}_${adminName}.json`
    : 'new_delegated_metadata.json';
  const rotationRequestFileName = selectedApp
    ? `rotation_request_${roleFileTag}_${selectedApp}_${adminName}.json`
    : 'rotation_request.json';
  const signTargetsPayloadPrefix = selectedApp
    ? `sign_targets_payload_${roleFileTag}_${selectedApp}_${adminName}`
    : 'sign_targets_payload';
  const signDelegatedPayloadPrefix = selectedApp
    ? `sign_${roleFileTag}_payload_${selectedApp}_${adminName}`
    : 'sign_delegated_payload';

  useEffect(() => {
    setDelegatedSignaturesRequired(Math.max(1, threshold));
  }, [threshold]);

  const targetsSignCommands = Array.from({ length: Math.max(1, targetsSignaturesRequired) }, (_, index) => ({
    metadataFile: newTargetsMetadataFileName,
    role: 'targets',
    keyArgName: '--key-info',
    keyArgValue: keyInfoFileName,
    keyIndex: index,
    outputFile: `${signTargetsPayloadPrefix}_${index}.json`,
  }));

  const delegatedSignCommands = Array.from({ length: Math.max(1, delegatedSignaturesRequired) }, (_, index) => ({
    metadataFile: newDelegatedMetadataFileName,
    role: normalizedRoleName,
    keyArgName: '--new-keys',
    keyArgValue: newRoleKeysInfoFileName,
    keyIndex: index,
    outputFile: `${signDelegatedPayloadPrefix}_${index}.json`,
  }));

  const handleCopyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toastSuccess(successMessage);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toastError('Failed to copy');
    }
  };

  const handleFetchCurrentTargets = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setLoadingTargetsMetadata(true);
    try {
      const response = await axiosInstance.get(`/tuf/v1/metadata/targets?appName=${encodeURIComponent(selectedApp)}`);
      const normalized = normalizeTrustedTargetsMetadata(response.data);
      if (!normalized) {
        throw new Error('Invalid response: missing trusted_targets');
      }
      setTargetsMetadata(normalized);
      toastSuccess('Targets metadata loaded successfully!');
    } catch (error: any) {
      console.error('Failed to fetch targets metadata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch targets metadata';
      toastError(errorMessage);
      setTargetsMetadata(null);
    } finally {
      setLoadingTargetsMetadata(false);
    }
  };

  const handleFetchCurrentDelegated = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    if (!normalizedRoleName) {
      toastError('Role name is required');
      return;
    }
    setLoadingDelegatedMetadata(true);
    try {
      const response = await axiosInstance.get(
        `/tuf/v1/metadata/delegated?appName=${encodeURIComponent(selectedApp)}&roleName=${encodeURIComponent(normalizedRoleName)}`
      );
      const normalized = normalizeTrustedDelegatedMetadata(response.data);
      if (!normalized) {
        throw new Error('Invalid response: missing trusted_delegated');
      }
      setDelegatedMetadata(normalized);
      toastSuccess('Delegated metadata loaded successfully!');
    } catch (error: any) {
      console.error('Failed to fetch delegated metadata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch delegated metadata';
      toastError(errorMessage);
      setDelegatedMetadata(null);
    } finally {
      setLoadingDelegatedMetadata(false);
    }
  };

  const buildGeneratorParams = () => ({
    appName: selectedApp,
    adminName,
    roleName: normalizedRoleName,
    roleFileTag,
    keyCount,
    threshold,
    keyType: selectedKeyType,
  });

  const handleGenerateRotateScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    if (threshold < 1 || keyCount < 1 || threshold > keyCount) {
      toastError('Invalid key count or threshold');
      return;
    }
    setRotateScript(generateRotateDelegatedRoleKeysPythonScript(buildGeneratorParams()));
    setShowRotateScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleGenerateTargetsScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setTargetsScript(generateCreateNewTargetsDelegationMetadataPythonScript(buildGeneratorParams()));
    setShowTargetsScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleGenerateDelegatedScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setDelegatedScript(generateCreateNewDelegatedRoleMetadataPythonScript(buildGeneratorParams()));
    setShowDelegatedScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleGenerateRequestScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setRequestScript(generateBuildDelegatedRotationRequestPythonScript(buildGeneratorParams()));
    setShowRequestScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleGenerateSignScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setSignScript(generateSignMetadataForApiPythonScript(buildGeneratorParams()));
    setShowSignScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleGenerateUpdateKeyInfoScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setUpdateKeyInfoScript(generateUpdateKeyInfoDelegatedRotationPythonScript(buildGeneratorParams()));
    setShowUpdateKeyInfoScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleSubmitRotationRequest = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    if (!rotationRequestPayload.trim()) {
      setRotationRequestError('Rotation request payload is required');
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(rotationRequestPayload);
      setRotationRequestError('');
    } catch {
      setRotationRequestError('Invalid JSON format');
      return;
    }

    setSubmittingRotationRequest(true);
    try {
      const response = await axiosInstance.post(
        `/tuf/v1/metadata/delegated/rotate?appName=${encodeURIComponent(selectedApp)}`,
        parsedPayload
      );
      const responseData = response.data?.data;
      if (!responseData?.task_id) {
        throw new Error('Invalid response: missing task_id');
      }

      toastSuccess('Delegated rotation staged successfully!');
      setRotationRequestPayload('');

      onSaveToHistory({
        timestamp: responseData.last_update || new Date().toISOString(),
        appName: selectedApp,
        operation: 'metadata-update',
        status: 'pending',
        taskId: responseData.task_id,
      });
      setTimeout(() => onCheckTufTasks(responseData.task_id), 1000);
    } catch (error: any) {
      console.error('Failed to stage delegated rotation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to stage delegated rotation';
      toastError(errorMessage);

      onSaveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'metadata-update',
        status: 'failed',
      });
    } finally {
      setSubmittingRotationRequest(false);
    }
  };

  const handleCheckSigningQueue = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    setCheckingSigningQueue(true);
    setSigningQueueMessage('');
    try {
      const response = await axiosInstance.get(`/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`);
      const message = response.data?.message || response.data?.data?.message || 'Signing queue checked successfully';
      setSigningQueueMessage(message);
      toastSuccess(message);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to check signing queue';
      setSigningQueueMessage(errorMessage);
      toastError(errorMessage);
    } finally {
      setCheckingSigningQueue(false);
    }
  };

  const handleSubmitSignaturePayload = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }
    if (!signaturePayload.trim()) {
      setSignaturePayloadError('Signature payload is required');
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(signaturePayload);
      setSignaturePayloadError('');
    } catch {
      setSignaturePayloadError('Invalid JSON format');
      return;
    }

    setSubmittingSignature(true);
    setSignatureStatus('');
    setSignatureStatusMessage('');
    setSignatureErrorMessage('');

    try {
      const response = await axiosInstance.post(
        `/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`,
        parsedPayload
      );
      const message = response.data?.message || response.data?.data?.message || '';
      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('signing complete') ||
        normalizedMessage.includes('metadata update finished') ||
        normalizedMessage.includes('no metadata pending')
      ) {
        setSignatureStatus('success');
        setSignatureStatusMessage(message || 'Signing complete.');
        toastSuccess(message || 'Signing complete');
      } else {
        setSignatureStatus('partial');
        setSignatureStatusMessage(message || 'Signature payload submitted successfully.');
        toastSuccess(message || 'Signature payload submitted successfully.');
      }

      setSignaturePayload('');
    } catch (error: any) {
      const errorDetail = error.response?.data?.error || '';
      const errorMessage = error.response?.data?.message || '';
      const fullErrorMessage = errorDetail || errorMessage || error.message || 'Failed to submit signature payload';

      if (isThresholdNotMetError(fullErrorMessage)) {
        setSignatureStatus('threshold');
        setSignatureStatusMessage('');
        setSignatureErrorMessage(fullErrorMessage);
        toastError('Threshold not met yet. Continue submitting required signatures.');
        setSignaturePayload('');
      } else {
        setSignatureStatus('error');
        setSignatureStatusMessage('');
        setSignatureErrorMessage(fullErrorMessage);
        toastError(fullErrorMessage);
      }
    } finally {
      setSubmittingSignature(false);
    }
  };

  const handleDeleteSigningMetadata = async () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    setDeletingSigningMetadata(true);
    try {
      const rolesToDelete = ['targets', normalizedRoleName];
      const uniqueRoles = Array.from(new Set(rolesToDelete));
      const results: string[] = [];

      for (const role of uniqueRoles) {
        const result = await deleteSigningMetadata({
          appName: selectedApp,
          role,
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

        results.push(`${role}: ${result.message || 'Signing metadata deleted successfully.'}`);
      }

      toastSuccess(results.join(' | '));
      setSignatureStatus('');
      setSignatureStatusMessage('');
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
        onClick={() => setShowRotateDelegatedKeys(!showRotateDelegatedKeys)}
        className="flex items-center justify-between w-full text-left text-theme-primary hover:text-theme-button-primary transition-colors"
      >
        <h2 className="text-lg font-bold font-roboto">Rotate Delegated Role Keys</h2>
        <i className={`fas fa-chevron-${showRotateDelegatedKeys ? 'up' : 'down'}`}></i>
      </button>

      {showRotateDelegatedKeys && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <p className="text-theme-primary text-sm leading-relaxed">
              This flow stages delegated role metadata rotation (for example, <code className="bg-theme-input px-1 rounded">default</code>)
              and then signs both updated metadata files through the signing API.
            </p>
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Flow parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">Delegated role name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                placeholder="default"
              />
            </div>
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

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 0: Get trusted metadata snapshot</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
              <p className="text-theme-primary text-sm leading-relaxed">
                Download and save two current files before rotation:
                <code className="bg-theme-input px-1 rounded ml-1">{currentTargetsFileName}</code> and
                <code className="bg-theme-input px-1 rounded ml-1">{currentDelegatedFileName}</code>.
              </p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={handleFetchCurrentTargets}
                disabled={!selectedApp || loadingTargetsMetadata}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingTargetsMetadata ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Get current targets
                  </>
                )}
              </button>
              {targetsMetadata && (
                <button
                  onClick={() => handleCopyToClipboard(JSON.stringify(targetsMetadata, null, 2), 'Targets metadata copied successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Targets Metadata
                </button>
              )}
              <button
                onClick={handleFetchCurrentDelegated}
                disabled={!selectedApp || loadingDelegatedMetadata}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingDelegatedMetadata ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download mr-2"></i>
                    Get current delegated
                  </>
                )}
              </button>
              {delegatedMetadata && (
                <button
                  onClick={() => handleCopyToClipboard(JSON.stringify(delegatedMetadata, null, 2), 'Delegated metadata copied successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Delegated Metadata
                </button>
              )}
            </div>

            {targetsMetadata && (
              <div>
                <button
                  onClick={() => setShowTargetsMetadata(!showTargetsMetadata)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showTargetsMetadata ? 'up' : 'down'} mr-2`}></i>
                  Current Targets Metadata {showTargetsMetadata ? '(click to hide)' : '(click to expand)'}
                </button>
                {showTargetsMetadata && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(targetsMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {delegatedMetadata && (
              <div>
                <button
                  onClick={() => setShowDelegatedMetadata(!showDelegatedMetadata)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showDelegatedMetadata ? 'up' : 'down'} mr-2`}></i>
                  Current Delegated Metadata {showDelegatedMetadata ? '(click to hide)' : '(click to expand)'}
                </button>
                {showDelegatedMetadata && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(delegatedMetadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 1: Generate delegated role keys</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {rotateScriptFileName} {'\\'}
              <br />
              --role-name {normalizedRoleName} {'\\'}
              <br />
              --output-dir . {'\\'}
              <br />
              --count {keyCount} {'\\'}
              <br />
              --threshold {threshold} {'\\'}
              <br />
              --app-name {selectedApp} {'\\'}
              <br />
              --admin-name {adminName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateRotateScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {rotateScript && (
                <button
                  onClick={() => handleCopyToClipboard(rotateScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {rotateScript && (
              <div>
                <button
                  onClick={() => setShowRotateScript(!showRotateScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showRotateScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showRotateScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showRotateScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{rotateScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 2: Build new targets metadata with updated delegation</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {createTargetsScriptFileName} {'\\'}
              <br />
              --current-targets {currentTargetsFileName} {'\\'}
              <br />
              --new-keys {newRoleKeysInfoFileName} {'\\'}
              <br />
              --role-name {normalizedRoleName} {'\\'}
              <br />
              --output {newTargetsMetadataFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateTargetsScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {targetsScript && (
                <button
                  onClick={() => handleCopyToClipboard(targetsScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {targetsScript && (
              <div>
                <button
                  onClick={() => setShowTargetsScript(!showTargetsScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showTargetsScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showTargetsScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showTargetsScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{targetsScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 3: Build new delegated role metadata</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {createDelegatedScriptFileName} {'\\'}
              <br />
              --current {currentDelegatedFileName} {'\\'}
              <br />
              --role-name {normalizedRoleName} {'\\'}
              <br />
              --output {newDelegatedMetadataFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateDelegatedScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {delegatedScript && (
                <button
                  onClick={() => handleCopyToClipboard(delegatedScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {delegatedScript && (
              <div>
                <button
                  onClick={() => setShowDelegatedScript(!showDelegatedScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showDelegatedScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showDelegatedScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showDelegatedScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{delegatedScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 4: Build rotation request payload</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {buildRequestScriptFileName} {'\\'}
              <br />
              --role-name {normalizedRoleName} {'\\'}
              <br />
              --targets-metadata {newTargetsMetadataFileName} {'\\'}
              <br />
              --delegated-metadata {newDelegatedMetadataFileName} {'\\'}
              <br />
              --delegator targets {'\\'}
              <br />
              --output {rotationRequestFileName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateRequestScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {requestScript && (
                <button
                  onClick={() => handleCopyToClipboard(requestScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {requestScript && (
              <div>
                <button
                  onClick={() => setShowRequestScript(!showRequestScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showRequestScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showRequestScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showRequestScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{requestScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 5: Stage metadata on backend</h2>
          <div className="space-y-4">
            <textarea
              value={rotationRequestPayload}
              onChange={(e) => {
                setRotationRequestPayload(e.target.value);
                setRotationRequestError('');
              }}
              placeholder={`Paste ${rotationRequestFileName} JSON payload here...`}
              rows={8}
              className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                rotationRequestError ? 'border-red-500' : 'border-theme'
              }`}
            />
            {rotationRequestError && <p className="text-red-500 text-sm">{rotationRequestError}</p>}
            <button
              onClick={handleSubmitRotationRequest}
              disabled={!selectedApp || !rotationRequestPayload.trim() || submittingRotationRequest}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingRotationRequest ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Stage Delegated Rotation
                </>
              )}
            </button>
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 6: Check signing queue status</h2>
          <div className="space-y-4">
            <button
              onClick={handleCheckSigningQueue}
              disabled={!selectedApp || checkingSigningQueue}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingSigningQueue ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Checking...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle mr-2"></i>
                  Check Signing Queue
                </>
              )}
            </button>
            {signingQueueMessage && (
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <p className="text-theme-primary text-sm">{signingQueueMessage}</p>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 7: Generate sign payloads with one script (targets + delegated)</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <p className="text-theme-primary text-sm leading-relaxed">
                Use <code className="bg-theme-input px-1 rounded">{signScriptFileName}</code> for both targets and delegated signing.
                Only parameters change. Number of runs depends on signatures required for each role.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Targets signatures required</label>
                <input
                  type="number"
                  min={1}
                  value={targetsSignaturesRequired}
                  onChange={(e) => setTargetsSignaturesRequired(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Delegated signatures required</label>
                <input
                  type="number"
                  min={1}
                  value={delegatedSignaturesRequired}
                  onChange={(e) => setDelegatedSignaturesRequired(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
                <p className="text-theme-secondary text-xs mt-1">
                  Auto-filled from delegated threshold in Step 1, but can be changed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-theme-input rounded-lg border border-theme">
              <p className="text-theme-primary text-sm">
                Total sign script runs: <strong>{targetsSignaturesRequired + delegatedSignaturesRequired}</strong>
              </p>
            </div>

            <h3 className="text-base font-bold font-roboto text-theme-primary">7A. Targets payloads (old targets keys)</h3>
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              {targetsSignCommands.map((command, index) => (
                <React.Fragment key={`targets-sign-command-${command.keyIndex}`}>
                  {index > 0 && (
                    <>
                      <br />
                    </>
                  )}
                  python3 {signScriptFileName} {'\\'}
                  <br />
                  --metadata {command.metadataFile} {'\\'}
                  <br />
                  --role {command.role} {'\\'}
                  <br />
                  {command.keyArgName} {command.keyArgValue} {'\\'}
                  <br />
                  --key-index {command.keyIndex} {'\\'}
                  <br />
                  --output {command.outputFile}
                  <br />
                </React.Fragment>
              ))}
            </div>

            <h3 className="text-base font-bold font-roboto text-theme-primary">7B. Delegated payloads (new delegated keys)</h3>
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              {delegatedSignCommands.map((command, index) => (
                <React.Fragment key={`delegated-sign-command-${command.keyIndex}`}>
                  {index > 0 && (
                    <>
                      <br />
                    </>
                  )}
                  python3 {signScriptFileName} {'\\'}
                  <br />
                  --metadata {command.metadataFile} {'\\'}
                  <br />
                  --role {command.role} {'\\'}
                  <br />
                  {command.keyArgName} {command.keyArgValue} {'\\'}
                  <br />
                  --key-index {command.keyIndex} {'\\'}
                  <br />
                  --output {command.outputFile}
                  <br />
                </React.Fragment>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateSignScript}
                disabled={!selectedApp}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-code mr-2"></i>
                Generate Script
              </button>
              {signScript && (
                <button
                  onClick={() => handleCopyToClipboard(signScript, 'Script copied to clipboard successfully!')}
                  className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Copy Script
                </button>
              )}
            </div>
            {signScript && (
              <div>
                <button
                  onClick={() => setShowSignScript(!showSignScript)}
                  className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                >
                  <i className={`fas fa-chevron-${showSignScript ? 'up' : 'down'} mr-2`}></i>
                  Generated Python Script {showSignScript ? '(click to hide)' : '(click to expand)'}
                </button>
                {showSignScript && (
                  <div className="bg-theme-input rounded-lg p-4 border border-theme">
                    <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">{signScript}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 8: Submit each sign payload to API</h2>
          <div className="space-y-4">
            <textarea
              value={signaturePayload}
              onChange={(e) => {
                setSignaturePayload(e.target.value);
                setSignaturePayloadError('');
              }}
              placeholder='Paste sign payload JSON and send it to /tuf/v1/metadata/sign?appName=...'
              rows={6}
              className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                signaturePayloadError ? 'border-red-500' : 'border-theme'
              }`}
            />
            {signaturePayloadError && <p className="text-red-500 text-sm">{signaturePayloadError}</p>}

            {signatureStatus === 'success' && (
              <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                <p className="text-green-500 font-semibold">{signatureStatusMessage || 'Signing complete.'}</p>
              </div>
            )}
            {signatureStatus === 'partial' && (
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <p className="text-blue-500 font-semibold">
                  {signatureStatusMessage || 'Signature accepted. Continue sending remaining payloads.'}
                </p>
              </div>
            )}
            {signatureStatus === 'threshold' && (
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-semibold">Threshold not reached yet.</p>
                {signatureErrorMessage && <p className="text-theme-primary text-sm font-mono mt-2">{signatureErrorMessage}</p>}
              </div>
            )}
            {signatureStatus === 'error' && (
              <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-red-500 font-semibold">Error submitting signature payload.</p>
                {signatureErrorMessage && <p className="text-theme-primary text-sm font-mono mt-2">{signatureErrorMessage}</p>}
              </div>
            )}

            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={handleSubmitSignaturePayload}
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
                    Submit Sign Payload
                  </>
                )}
              </button>

              <button
                onClick={handleCheckSigningQueue}
                disabled={!selectedApp || checkingSigningQueue}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingSigningQueue ? (
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
          </div>

          <h2 className="text-lg font-bold font-roboto text-theme-primary">Step 9: Update local key info</h2>
          <div className="space-y-4">
            <div className="bg-theme-input rounded-lg p-3 font-mono text-xs text-theme-primary overflow-x-auto whitespace-pre-wrap">
              python3 {updateKeyInfoScriptFileName} {'\\'}
              <br />
              --key-info {keyInfoFileName} {'\\'}
              <br />
              --new-keys {newRoleKeysInfoFileName} {'\\'}
              <br />
              --role-name {normalizedRoleName}
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleGenerateUpdateKeyInfoScript}
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
