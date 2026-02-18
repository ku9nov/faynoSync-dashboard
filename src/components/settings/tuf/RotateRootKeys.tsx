import React, { useState, useMemo } from 'react';
import { useToast } from '../../../hooks/useToast';
import { useUsersQuery } from '../../../hooks/use-query/useUsersQuery';
import axiosInstance from '../../../config/axios';
import { generateRotateRootKeysPythonScript } from './generateRotateRootKeysScript';
import { generateCreateNewRootMetadataPythonScript } from './generateCreateNewRootMetadataScript';
import { generateCreateNewRootMetadataPythonScriptOffline } from './generateCreateNewRootMetadataScriptOffline';
import { generateSignMetadataOfflinePythonScript } from './generateSignMetadataOfflineScript';
import { generateGenerateSignaturesPythonScript } from './generateGenerateSignaturesScript';
import { deleteSigningMetadata } from './deleteSigningMetadata';
import { StepperModal, Step } from '../../common/StepperModal';

interface RotateRootKeysProps {
  selectedApp: string;
  isBootstrapSuccess: boolean;
  onSaveToHistory: (entry: Omit<import('./types').TufHistoryEntry, 'id'>) => void;
  onCheckTufTasks: (taskId?: string) => void;
}

interface SignatureProgress {
  collected: number;
  total: number;
  oldCollected: number;
  newCollected: number;
  remaining: number;
  oldRemaining: number;
  newRemaining: number;
  oldKeysSigned: string[];
  missingOldKeys: string[];
  missingNewKeys: string[];
}

export const RotateRootKeys: React.FC<RotateRootKeysProps> = ({
  selectedApp,
  isBootstrapSuccess,
  onSaveToHistory,
  onCheckTufTasks,
}) => {
  const [showRotateKeys, setShowRotateKeys] = useState(false);
  const [rotationFlow, setRotationFlow] = useState<'online' | 'offline'>('online');
  const [keyCount, setKeyCount] = useState<number>(2);
  const [exampleScript, setExampleScript] = useState<string>('');
  const [showScript, setShowScript] = useState(false);
  const [offlineExampleScript, setOfflineExampleScript] = useState<string>('');
  const [showOfflineScript, setShowOfflineScript] = useState(false);
  const [rootMetadata, setRootMetadata] = useState<any>(null);
  const [showRootMetadataStep2, setShowRootMetadataStep2] = useState(false);
  const [showRootMetadataStep6, setShowRootMetadataStep6] = useState(false);
  const [loadingRootMetadata, setLoadingRootMetadata] = useState(false);
  const [newRootMetadataScript, setNewRootMetadataScript] = useState<string>('');
  const [showNewRootMetadataScript, setShowNewRootMetadataScript] = useState(false);
  const [signMetadataOfflineScript, setSignMetadataOfflineScript] = useState<string>('');
  const [showSignMetadataOfflineScript, setShowSignMetadataOfflineScript] = useState(false);
  const [generateSignaturesScript, setGenerateSignaturesScript] = useState<string>('');
  const [showGenerateSignaturesScript, setShowGenerateSignaturesScript] = useState(false);
  const [metadataPayload, setMetadataPayload] = useState<string>('');
  const [metadataPayloadError, setMetadataPayloadError] = useState<string>('');
  const [submittingMetadata, setSubmittingMetadata] = useState(false);
  const [signaturePayload, setSignaturePayload] = useState<string>('');
  const [signaturePayloadError, setSignaturePayloadError] = useState<string>('');
  const [submittingSignature, setSubmittingSignature] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<string>('');
  const [signatureErrorMessage, setSignatureErrorMessage] = useState<string>('');
  const [signatureProgress, setSignatureProgress] = useState<SignatureProgress | null>(null);
  const [checkingMetadataStatus, setCheckingMetadataStatus] = useState(false);
  const [metadataStatusResult, setMetadataStatusResult] = useState<string | null>(null);
  const [deletingSigningMetadata, setDeletingSigningMetadata] = useState(false);
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
    ? `sign_metadata_online_${selectedApp}_${adminName}.py`
    : 'sign_metadata_online.py';
  const signedNewRootMetadataFileName = selectedApp && adminName
    ? `signed_new_root_metadata_${selectedApp}_${adminName}.json`
    : 'signed_new_root_metadata.json';
  const unsignedNewRootMetadataFileName = selectedApp && adminName
    ? `new_root_metadata_${selectedApp}_${adminName}.json`
    : 'new_root_metadata_.json';
  const generateSignaturesScriptFileName = selectedApp && adminName
    ? `generate_signatures_${selectedApp}_${adminName}.py`
    : 'generate_signatures.py';

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
      keyDirName: `root_keys_${selectedApp}_${adminName}`, // Online flow uses root_keys_{appName}_{adminName}
    });

    setExampleScript(script);
    setShowScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const generateOfflineExampleScript = () => {
    if (!selectedApp || keyCount < 1) {
      toastError('Please fill in all required fields');
      return;
    }

    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateRotateRootKeysPythonScript({
      appName: selectedApp,
      keyCount,
      adminName,
      keyDirName: `root_keys_${selectedApp}_${adminName}`, // Offline flow uses root_keys_{appName}_{adminName}
    });

    setOfflineExampleScript(script);
    setShowOfflineScript(false);
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

  const handleCopyOfflineExample = async () => {
    if (offlineExampleScript) {
      try {
        await navigator.clipboard.writeText(offlineExampleScript);
        toastSuccess('Script copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy offline example script:', err);
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
    
    let script: string;
    if (rotationFlow === 'offline') {

      script = generateCreateNewRootMetadataPythonScriptOffline({
        appName: selectedApp,
        adminName,
      });
    } else {
      // Use online script generator
      const keyDirName = `root_keys_${selectedApp}_${adminName}`;
      script = generateCreateNewRootMetadataPythonScript({
        appName: selectedApp,
        adminName,
        keyDirName,
      });
    }

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

  const generateGenerateSignaturesScript = () => {
    if (!selectedApp) {
      toastError('Please select an app');
      return;
    }

    const adminName = userData?.owner || userData?.username || 'admin';
    const script = generateGenerateSignaturesPythonScript({
      appName: selectedApp,
      adminName,
    });

    setGenerateSignaturesScript(script);
    setShowGenerateSignaturesScript(false);
    toastSuccess('Python script generated successfully!');
  };

  const handleCopyGenerateSignaturesScript = async () => {
    if (generateSignaturesScript) {
      try {
        await navigator.clipboard.writeText(generateSignaturesScript);
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

  const handleSignaturePayloadChange = (value: string) => {
    setSignaturePayload(value);
    setSignaturePayloadError('');
    setSignatureStatus('');
    setSignatureErrorMessage('');
    setSignatureProgress(null);
    
    // Validate JSON on change
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value);
        // Validate structure
        if (!parsed.keyid || !parsed.sig) {
          setSignaturePayloadError('Signature must contain keyid and sig fields');
        }
      } catch (e) {
        // Error will be shown on submit
      }
    }
  };

  const parseSignatureProgress = (errorMessage: string): SignatureProgress | null => {
    try {
      // Parse progress: "Progress: 1/4 signatures collected (1 old + 0 new). 3 more required (1 old + 2 new)."
      // Make regex more flexible to handle variations in spacing and punctuation
      const progressMatch = errorMessage.match(/Progress:\s*(\d+)\/(\d+)\s+signatures\s+collected\s+\((\d+)\s+old\s+\+\s+(\d+)\s+new\)[.\s]*(\d+)\s+more\s+required\s+\((\d+)\s+old\s+\+\s+(\d+)\s+new\)/i);
      
      if (!progressMatch) {
        console.log('Progress regex did not match. Error message:', errorMessage);
        return null;
      }

      const collected = parseInt(progressMatch[1], 10);
      const total = parseInt(progressMatch[2], 10);
      const oldCollected = parseInt(progressMatch[3], 10);
      const newCollected = parseInt(progressMatch[4], 10);
      const remaining = parseInt(progressMatch[5], 10);
      const oldRemaining = parseInt(progressMatch[6], 10);
      const newRemaining = parseInt(progressMatch[7], 10);

      // Parse old keys signed: "Old keys signed: [key1 key2]."
      const oldKeysSignedMatch = errorMessage.match(/Old keys signed:\s*\[([^\]]+)\]/i);
      const oldKeysSigned = oldKeysSignedMatch 
        ? oldKeysSignedMatch[1].trim().split(/\s+/).filter(k => k.length > 0)
        : [];

      // Parse missing old keys: "Missing old keys: [key1 key2]."
      const missingOldKeysMatch = errorMessage.match(/Missing old keys:\s*\[([^\]]+)\]/i);
      const missingOldKeys = missingOldKeysMatch
        ? missingOldKeysMatch[1].trim().split(/\s+/).filter(k => k.length > 0)
        : [];

      // Parse missing new keys: "Missing new keys: [key1 key2]."
      const missingNewKeysMatch = errorMessage.match(/Missing new keys:\s*\[([^\]]+)\]/i);
      const missingNewKeys = missingNewKeysMatch
        ? missingNewKeysMatch[1].trim().split(/\s+/).filter(k => k.length > 0)
        : [];

      return {
        collected,
        total,
        oldCollected,
        newCollected,
        remaining,
        oldRemaining,
        newRemaining,
        oldKeysSigned,
        missingOldKeys,
        missingNewKeys,
      };
    } catch (e) {
      console.error('Failed to parse signature progress:', e);
      return null;
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

    // Validate JSON
    let parsedSignature;
    try {
      parsedSignature = JSON.parse(signaturePayload);
      setSignaturePayloadError('');
      
      // Validate structure
      if (!parsedSignature.keyid || !parsedSignature.sig) {
        setSignaturePayloadError('Signature must contain keyid and sig fields');
        return;
      }
    } catch (e) {
      setSignaturePayloadError('Invalid JSON format');
      return;
    }

    setSubmittingSignature(true);
    setSignatureStatus('');
    setSignatureErrorMessage('');
    setSignatureProgress(null);
    
    try {
      const payload = {
        role: 'root',
        signature: parsedSignature,
      };

      const response = await axiosInstance.post(
        `/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`,
        payload
      );

      const responseData = response.data;
      const message = responseData?.message || responseData?.data?.message || '';
      
      // Check if we got success message
      if (
        message === 'Metadata update finished' || 
        message === 'No metadata pending signing available' ||
        message.toLowerCase().includes('no metadata pending')
      ) {
        setSignatureStatus('success');
        setSignatureErrorMessage('');
        setSignatureProgress(null);
        toastSuccess('Metadata update finished! Root keys rotation completed successfully.');
        setSignaturePayload(''); // Clear input for next signature if needed
      } else if (message) {
        setSignatureStatus('partial');
        setSignatureErrorMessage('');
        setSignatureProgress(null);
        toastSuccess(`Signature submitted: ${message}`);
        setSignaturePayload(''); // Clear input for next signature
      } else {
        setSignatureStatus('partial');
        setSignatureErrorMessage('');
        setSignatureProgress(null);
        toastSuccess('Signature submitted successfully! Continue submitting more signatures until threshold is reached.');
        setSignaturePayload(''); // Clear input for next signature
      }
    } catch (error: any) {
      console.error('Failed to submit signature:', error);
      console.log('Error response data:', error.response?.data);
      
      // Prioritize error field over message field, as it contains detailed progress info
      const errorDetail = error.response?.data?.error || '';
      const errorMessage = error.response?.data?.message || '';
      // Combine both fields, prioritizing error detail which contains progress info
      const fullErrorMessage = errorDetail || errorMessage || error.message || 'Failed to submit signature';
      
      console.log('Full error message:', fullErrorMessage);
      console.log('Contains "not enough signatures":', fullErrorMessage.includes('not enough signatures'));
      console.log('Contains "threshold not reached":', fullErrorMessage.includes('threshold not reached'));
      
      // Check if it's a success message (no metadata pending = all signed)
      if (
        fullErrorMessage === 'No metadata pending signing available' ||
        fullErrorMessage.toLowerCase().includes('no metadata pending')
      ) {
        setSignatureStatus('success');
        setSignatureErrorMessage('');
        setSignatureProgress(null);
        toastSuccess('Metadata update finished! Root keys rotation completed successfully.');
        setSignaturePayload(''); // Clear input
      } else if (
        fullErrorMessage.includes('not enough signatures') || 
        fullErrorMessage.includes('threshold not reached') ||
        fullErrorMessage.includes('Progress:')
      ) {
        // Check if it's a threshold error (expected, continue submitting)
        // Also check for "Progress:" as it indicates threshold progress info
        console.log('Setting status to threshold');
        setSignatureStatus('threshold');
        setSignatureErrorMessage(fullErrorMessage);
        
        // Parse progress information from error message
        const progress = parseSignatureProgress(fullErrorMessage);
        console.log('Parsed progress:', progress);
        setSignatureProgress(progress);
        
        toastError(`Threshold not reached yet. Continue submitting more signatures.`);
        setSignaturePayload(''); // Clear input for next signature
      } else {
        console.log('Setting status to error');
        setSignatureStatus('error');
        setSignatureErrorMessage(fullErrorMessage);
        
        // Try to parse progress even for error status, in case it contains threshold info
        const progress = parseSignatureProgress(fullErrorMessage);
        setSignatureProgress(progress);
        
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
      const response = await axiosInstance.get(
        `/tuf/v1/metadata/sign?appName=${encodeURIComponent(selectedApp)}`
      );

      const responseData = response.data;
      const message = responseData?.message || responseData?.data?.message || '';
      
      // Check for success conditions
      if (
        message === 'Metadata update finished' || 
        message === 'No metadata pending signing available' ||
        message.toLowerCase().includes('no metadata pending')
      ) {
        setMetadataStatusResult('finished');
        toastSuccess('Metadata update finished! Root keys rotation completed successfully.');
      } else if (message) {
        // If there's a message but it's not a success message, it might be in progress
        setMetadataStatusResult('in-progress');
        toastSuccess(`Status: ${message}`);
      } else {
        setMetadataStatusResult('unknown');
        toastSuccess('Status checked successfully');
      }
    } catch (error: any) {
      console.error('Failed to check metadata status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to check metadata status';
      
      if (errorMessage.includes('not enough signatures') || errorMessage.includes('threshold not reached')) {
        setMetadataStatusResult('threshold-not-met');
        toastError(`Threshold not reached: ${errorMessage}`);
      } else {
        setMetadataStatusResult('error');
        toastError(errorMessage);
      }
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
      
      // If we have a task_id, save to history
      if (result.hasTask && result.taskId) {
        onSaveToHistory({
          timestamp: result.lastUpdate || new Date().toISOString(),
          appName: selectedApp,
          operation: 'metadata-update',
          status: 'pending', // Will be updated when we check actual status via API
          taskId: result.taskId,
        });
        
        // Optionally check the task status
        if (result.taskId) {
          setTimeout(() => {
            onCheckTufTasks(result.taskId);
          }, 1000);
        }
        
        toastSuccess(result.message || 'Metadata sign delete accepted.');
      } else {
        // No task means nothing was being signed (success case)
        toastSuccess(result.message || 'No signing process for root.');
      }
      
      // Clear signature status and progress after deletion
      setSignatureStatus('');
      setSignatureErrorMessage('');
      setSignatureProgress(null);
      setSignaturePayload('');
    } catch (error: any) {
      console.error('Failed to delete signing metadata:', error);
      const errorMessage = error.message || 'Failed to delete signing metadata';
      toastError(errorMessage);
    } finally {
      setDeletingSigningMetadata(false);
    }
  };

  // Generate guided tour steps based on selected flow
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
    const unsignedNewRootMetadataFileName = selectedApp && adminName
      ? `new_root_metadata_${selectedApp}_${adminName}.json`
      : 'new_root_metadata_.json';
    const generateSignaturesScriptFileName = selectedApp && adminName
      ? `generate_signatures_${selectedApp}_${adminName}.py`
      : 'generate_signatures.py';

    if (rotationFlow === 'online') {
      // Online Flow Steps
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
                    <h3 className="text-blue-500 font-semibold mb-2 font-roboto">Root Keys Rotation - Online Flow</h3>
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
                      <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{rotateRootKeysScriptFileName}</code> on a faynoSync API server machine</li>
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
          title: 'Sign metadata online',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed">
                      Now let's sign our metadata online. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{signMetadataOfflineScriptFileName}</code>. 
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
    } else {
      // Offline Flow Steps
      return [
        {
          stepNumber: 1,
          title: 'Generate initial root metadata script',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <h3 className="text-yellow-500 font-semibold mb-2 font-roboto">Root Keys Rotation - Offline Flow</h3>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      This script generates new TUF root keys for rotation. Configure the number of new keys 
                      to generate, then generate and run the Python script on a secure offline machine.
                    </p>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      <strong>Prerequisites:</strong>
                    </p>
                    <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1 mb-3">
                      <li>Python 3 must be installed on an offline machine</li>
                      <li>cryptography library must be installed</li>
                      <li>Access to current root metadata</li>
                      <li>Access to old root keys for signing</li>
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
                      <li>Keys will be saved to <code className="bg-theme-input px-1 rounded">root_keys_{selectedApp}_{adminName}/</code> folder (keep them locally, do not upload to ONLINE_KEY_DIR)</li>
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
                  onClick={generateOfflineExampleScript}
                  disabled={!selectedApp || keyCount < 1}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-code mr-2"></i>
                  Generate Script
                </button>
                {offlineExampleScript && (
                  <button
                    onClick={handleCopyOfflineExample}
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
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
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
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
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
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          title: 'Submit metadata',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed">
                      Now that you have received <code className="bg-theme-input px-1 rounded">{unsignedNewRootMetadataFileName}</code>, 
                      submit it here. This is the unsigned metadata that will be signed in the next steps.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Metadata Payload</label>
                <textarea
                  value={metadataPayload}
                  onChange={(e) => handleMetadataPayloadChange(e.target.value)}
                  placeholder="Paste unsigned root metadata JSON here..."
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
          ),
        },
        {
          stepNumber: 5,
          title: 'Generate signatures',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      Generate signatures for the metadata. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{generateSignaturesScriptFileName}</code>. 
                      This script can work in two modes:
                    </p>
                    <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1 mb-3">
                      <li><strong>Single signature mode:</strong> Signs with one key</li>
                      <li><strong>Batch mode:</strong> Signs with all keys from key info JSON files</li>
                    </ul>
                    <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 mt-3">
                      <p className="text-theme-primary text-sm leading-relaxed">
                        <strong>Note:</strong> If you have all necessary files locally (key_info.json and new_root_keys_info.json), 
                        use batch mode for convenience.
                      </p>
                    </div>
                  </div>
                </div>
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
                    onClick={handleCopyGenerateSignaturesScript}
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
          stepNumber: 6,
          title: 'Submit signatures',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      After generating signature files (signature1.json, signature2.json, signatureold1.json, etc.) in Step 5, 
                      submit them one by one. Paste the JSON content from each signature file below and submit.
                    </p>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      <strong>Instructions:</strong>
                    </p>
                    <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1 mb-3">
                      <li>Open a signature file (e.g., signature1.json or signatureold1.json)</li>
                      <li>Copy the entire JSON content (should contain "keyid" and "sig" fields)</li>
                      <li>Paste it into the field below</li>
                      <li>Click "Submit Signature"</li>
                      <li>Repeat for each signature file until you receive "Metadata update finished" message</li>
                    </ol>
                    <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 mt-3">
                      <p className="text-theme-primary text-sm leading-relaxed">
                        <strong>Note:</strong> You may receive errors about "not enough signatures" or "threshold not reached" 
                        while submitting. This is expected - continue submitting signatures until the threshold is met and 
                        you receive the "Metadata update finished" message.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-theme-primary mb-2 font-roboto">Signature Payload</label>
                <textarea
                  value={signaturePayload}
                  onChange={(e) => handleSignaturePayloadChange(e.target.value)}
                  placeholder='Paste signature JSON here (e.g., {"keyid": "...", "sig": "..."})'
                  rows={6}
                  className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                    signaturePayloadError ? 'border-red-500' : 'border-theme'
                  }`}
                />
                {signaturePayloadError && (
                  <p className="text-red-500 text-sm mt-1">{signaturePayloadError}</p>
                )}
              </div>

              {signatureStatus === 'success' && (
                <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-green-500 font-semibold mb-1">Metadata update finished!</p>
                      <p className="text-theme-primary text-sm">
                        Root keys rotation has been completed successfully. All required signatures have been submitted and the threshold has been met. Now you can check "Root-Meta-Update" task in the history to see the result.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {signatureStatus === 'threshold' && (
                <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-yellow-500 font-semibold mb-2">Threshold not reached yet</p>
                      
                      {signatureProgress ? (
                        <div className="space-y-3">
                          {/* Overall Progress */}
                          <div className="bg-theme-input rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-theme-primary font-semibold">Overall Progress</span>
                              <span className="text-yellow-500 font-bold">
                                {signatureProgress.collected} / {signatureProgress.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                              <div 
                                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${(signatureProgress.collected / signatureProgress.total) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-theme-primary text-xs">
                              {signatureProgress.remaining} more {signatureProgress.remaining === 1 ? 'signature' : 'signatures'} required
                            </p>
                          </div>

                          {/* Breakdown by Old/New Keys */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-theme-input rounded-lg p-3">
                              <p className="text-theme-primary text-xs font-semibold mb-1">Old Keys</p>
                              <p className="text-green-400 text-sm font-bold">
                                {signatureProgress.oldCollected} collected
                              </p>
                              {signatureProgress.oldRemaining > 0 && (
                                <p className="text-yellow-400 text-xs mt-1">
                                  {signatureProgress.oldRemaining} more needed
                                </p>
                              )}
                            </div>
                            <div className="bg-theme-input rounded-lg p-3">
                              <p className="text-theme-primary text-xs font-semibold mb-1">New Keys</p>
                              <p className="text-green-400 text-sm font-bold">
                                {signatureProgress.newCollected} collected
                              </p>
                              {signatureProgress.newRemaining > 0 && (
                                <p className="text-yellow-400 text-xs mt-1">
                                  {signatureProgress.newRemaining} more needed
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Signed Keys */}
                          {signatureProgress.oldKeysSigned.length > 0 && (
                            <div className="bg-theme-input rounded-lg p-3">
                              <p className="text-theme-primary text-xs font-semibold mb-2">✓ Old Keys Signed</p>
                              <div className="flex flex-wrap gap-1">
                                {signatureProgress.oldKeysSigned.map((key, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded font-mono"
                                  >
                                    {key.substring(0, 8)}...
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Missing Keys */}
                          {(signatureProgress.missingOldKeys.length > 0 || signatureProgress.missingNewKeys.length > 0) && (
                            <div className="bg-theme-input rounded-lg p-3">
                              <p className="text-theme-primary text-xs font-semibold mb-2">⚠ Missing Keys</p>
                              {signatureProgress.missingOldKeys.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-yellow-400 text-xs mb-1">Old Keys:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {signatureProgress.missingOldKeys.map((key, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                      >
                                        {key.substring(0, 8)}...
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {signatureProgress.missingNewKeys.length > 0 && (
                                <div>
                                  <p className="text-yellow-400 text-xs mb-1">New Keys:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {signatureProgress.missingNewKeys.map((key, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                      >
                                        {key.substring(0, 8)}...
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : signatureErrorMessage && (
                        <div>
                          <p className="text-theme-primary text-sm mb-2 font-mono text-xs bg-theme-input p-2 rounded">
                            {signatureErrorMessage}
                          </p>
                          {(() => {
                            // Fallback: Extract progress information (got X, want Y)
                            const gotMatch = signatureErrorMessage.match(/got\s+(\d+)/i);
                            const wantMatch = signatureErrorMessage.match(/want\s+(\d+)/i);
                            if (gotMatch && wantMatch) {
                              const got = parseInt(gotMatch[1], 10);
                              const want = parseInt(wantMatch[1], 10);
                              const remaining = want - got;
                              return (
                                <p className="text-theme-primary text-sm mb-2">
                                  <strong>Progress:</strong> {got} of {want} signatures submitted 
                                  ({remaining} more {remaining === 1 ? 'signature' : 'signatures'} needed)
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                      
                      <p className="text-theme-primary text-sm mt-3">
                        Continue submitting more signatures. The input field has been cleared for the next signature.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {signatureStatus === 'partial' && (
                <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-blue-500 font-semibold mb-1">Signature submitted</p>
                      <p className="text-theme-primary text-sm">
                        Continue submitting more signatures until the threshold is met. The input field has been cleared for the next signature.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {signatureStatus === 'error' && (
                <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-exclamation-circle text-red-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-red-500 font-semibold mb-1">Error submitting signature</p>
                      {signatureErrorMessage && (
                        <>
                          <p className="text-theme-primary text-sm mb-2 font-mono text-xs bg-theme-input p-2 rounded">
                            {signatureErrorMessage}
                          </p>
                          {/* Show progress even for error status if it contains threshold info */}
                          {signatureProgress ? (
                            <div className="mt-3 space-y-3">
                              {/* Overall Progress */}
                              <div className="bg-theme-input rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-theme-primary font-semibold">Overall Progress</span>
                                  <span className="text-yellow-500 font-bold">
                                    {signatureProgress.collected} / {signatureProgress.total}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                  <div 
                                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(signatureProgress.collected / signatureProgress.total) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-theme-primary text-xs">
                                  {signatureProgress.remaining} more {signatureProgress.remaining === 1 ? 'signature' : 'signatures'} required
                                </p>
                              </div>

                              {/* Breakdown by Old/New Keys */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-theme-input rounded-lg p-3">
                                  <p className="text-theme-primary text-xs font-semibold mb-1">Old Keys</p>
                                  <p className="text-green-400 text-sm font-bold">
                                    {signatureProgress.oldCollected} collected
                                  </p>
                                  {signatureProgress.oldRemaining > 0 && (
                                    <p className="text-yellow-400 text-xs mt-1">
                                      {signatureProgress.oldRemaining} more needed
                                    </p>
                                  )}
                                </div>
                                <div className="bg-theme-input rounded-lg p-3">
                                  <p className="text-theme-primary text-xs font-semibold mb-1">New Keys</p>
                                  <p className="text-green-400 text-sm font-bold">
                                    {signatureProgress.newCollected} collected
                                  </p>
                                  {signatureProgress.newRemaining > 0 && (
                                    <p className="text-yellow-400 text-xs mt-1">
                                      {signatureProgress.newRemaining} more needed
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Signed Keys */}
                              {signatureProgress.oldKeysSigned.length > 0 && (
                                <div className="bg-theme-input rounded-lg p-3">
                                  <p className="text-theme-primary text-xs font-semibold mb-2">✓ Old Keys Signed</p>
                                  <div className="flex flex-wrap gap-1">
                                    {signatureProgress.oldKeysSigned.map((key, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded font-mono"
                                      >
                                        {key.substring(0, 8)}...
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Missing Keys */}
                              {(signatureProgress.missingOldKeys.length > 0 || signatureProgress.missingNewKeys.length > 0) && (
                                <div className="bg-theme-input rounded-lg p-3">
                                  <p className="text-theme-primary text-xs font-semibold mb-2">⚠ Missing Keys</p>
                                  {signatureProgress.missingOldKeys.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-yellow-400 text-xs mb-1">Old Keys:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {signatureProgress.missingOldKeys.map((key, idx) => (
                                          <span 
                                            key={idx}
                                            className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                          >
                                            {key.substring(0, 8)}...
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {signatureProgress.missingNewKeys.length > 0 && (
                                    <div>
                                      <p className="text-yellow-400 text-xs mb-1">New Keys:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {signatureProgress.missingNewKeys.map((key, idx) => (
                                          <span 
                                            key={idx}
                                            className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                          >
                                            {key.substring(0, 8)}...
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : signatureErrorMessage && (signatureErrorMessage.includes('not enough signatures') || signatureErrorMessage.includes('threshold not reached')) && (
                            <div className="mt-3 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                              <p className="text-yellow-500 text-sm font-semibold mb-2">Threshold not reached</p>
                              <p className="text-theme-primary text-sm">
                                This is expected - continue submitting more signatures until the threshold is met.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      <p className="text-theme-primary text-sm mt-3">
                        {signatureProgress || (signatureErrorMessage && (signatureErrorMessage.includes('not enough signatures') || signatureErrorMessage.includes('threshold not reached')))
                          ? 'Continue submitting more signatures. The input field has been cleared for the next signature.'
                          : 'Please check the error message above and try again.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-center">
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
              </div>

              {metadataStatusResult === 'finished' && (
                <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-green-500 font-semibold mb-1">Metadata update finished!</p>
                      <p className="text-theme-primary text-sm">
                        Root keys rotation has been completed successfully. All required signatures have been submitted and the threshold has been met. Now you can check "Root-Meta-Update" task in the history to see the result.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metadataStatusResult === 'threshold-not-met' && (
                <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                  <div className="flex items-start">
                    <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                    <div className="flex-1">
                      <p className="text-yellow-500 font-semibold mb-1">Threshold not reached</p>
                      <p className="text-theme-primary text-sm">
                        Continue submitting more signatures until the threshold is met.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        },
      ];
    }
  }, [
    selectedApp,
    userData,
    keyCount,
    exampleScript,
    offlineExampleScript,
    rootMetadata,
    loadingRootMetadata,
    newRootMetadataScript,
    signMetadataOfflineScript,
    generateSignaturesScript,
    metadataPayload,
    metadataPayloadError,
    submittingMetadata,
    signaturePayload,
    signaturePayloadError,
    submittingSignature,
    signatureStatus,
    signatureErrorMessage,
    checkingMetadataStatus,
    metadataStatusResult,
    rotationFlow,
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
        title={`Root Keys Rotation - Guided Tour (${rotationFlow === 'online' ? 'Online' : 'Offline'} Flow)`}
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
          {/* Flow Selection */}
          <div className="mb-6">
            <label className="block text-theme-primary mb-3 font-roboto font-semibold">
              Select Rotation Flow:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rotationFlow"
                  value="online"
                  checked={rotationFlow === 'online'}
                  onChange={(e) => setRotationFlow(e.target.value as 'online' | 'offline')}
                  className="mr-2"
                />
                <span className="text-theme-primary font-roboto">Online Flow</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rotationFlow"
                  value="offline"
                  checked={rotationFlow === 'offline'}
                  onChange={(e) => setRotationFlow(e.target.value as 'online' | 'offline')}
                  className="mr-2"
                />
                <span className="text-theme-primary font-roboto">Offline Flow</span>
              </label>
            </div>
          </div>

          {rotationFlow === 'online' ? (
            <>
              {/* Online Flow Instructions */}
              <div className="mb-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <h3 className="text-blue-500 font-semibold mb-2 font-roboto">Root Keys Rotation - Online Flow</h3>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      This flow allows you to rotate root keys using the online API. Configure the number of new keys 
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
                      <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{rotateRootKeysScriptFileName}</code> on a faynoSync API server machine</li>
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
                Step 4: Sign metadata online
            </h2>
            {/* Info about signing metadata online */}
            <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                <div className="flex-1">
                  <p className="text-theme-primary text-sm leading-relaxed">
                    Now let's sign our metadata online. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{signMetadataOfflineScriptFileName}</code>. 
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
          ) : (
            <>
              {/* Offline Flow Instructions */}
              <div className="mb-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <h3 className="text-yellow-500 font-semibold mb-2 font-roboto">Root Keys Rotation - Offline Flow</h3>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      This flow allows you to rotate root keys completely offline without using the online API. 
                      All operations are performed on a secure offline machine. Keys are stored in <code className="bg-theme-input px-1 rounded">root_keys_{selectedApp}_{adminName}</code> folder.
                    </p>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      <strong>Prerequisites:</strong>
                    </p>
                    <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1 mb-3">
                      <li>Python 3 must be installed on an offline machine</li>
                      <li>cryptography library must be installed</li>
                      <li>Access to current root metadata</li>
                      <li>Access to old root keys for signing</li>
                    </ul>
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
                        onClick={generateOfflineExampleScript}
                        disabled={!selectedApp || keyCount < 1}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-code mr-2"></i>
                        Generate Script
                      </button>
                      {offlineExampleScript && (
                        <button
                          onClick={handleCopyOfflineExample}
                          className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                        >
                          <i className="fas fa-copy mr-2"></i>
                          Copy Script
                        </button>
                      )}
                    </div>
                    
                    {offlineExampleScript && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowOfflineScript(!showOfflineScript)}
                          className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                        >
                          <i className={`fas fa-chevron-${showOfflineScript ? 'up' : 'down'} mr-2`}></i>
                          Generated Python Script {showOfflineScript ? '(click to hide)' : '(click to expand)'}
                        </button>
                        {showOfflineScript && (
                          <div className="bg-theme-input rounded-lg p-4 border border-theme">
                            <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                              {offlineExampleScript}
                            </pre>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={handleCopyOfflineExample}
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
                  
                  <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-theme-primary text-sm leading-relaxed mb-2">
                          <strong>Instructions:</strong>
                        </p>
                        <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1 mb-3">
                          <li>Configure the number of keys to generate above</li>
                          <li>Click "Generate Script" to create the Python script</li>
                          <li>Copy the generated script and save it as <code className="bg-theme-input px-1 rounded">{rotateRootKeysScriptFileName}</code> on a secure offline machine</li>
                          <li>Set up Python environment and install dependencies:</li>
                        </ol>
                        <div className="bg-theme-input rounded-lg p-3 mb-3 font-mono text-xs text-theme-primary overflow-x-auto">
                          <div className="whitespace-pre">python3 -m venv .venv<br />source .venv/bin/activate  # On Windows: .venv\Scripts\activate<br />pip install cryptography<br />python3 {rotateRootKeysScriptFileName}</div>
                        </div>
                        <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1" start={5}>
                          <li>Keys will be saved to <code className="bg-theme-input px-1 rounded">root_keys_{selectedApp}_{adminName}/</code> folder (keep them locally, do not upload to ONLINE_KEY_DIR)</li>
                          <li>Use the generated <code className="bg-theme-input px-1 rounded">{newRootKeysInfoFileName}</code> file for reference when updating root metadata</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-px w-full bg-theme-card-hover mt-6"></div>
              <h2 className="text-lg font-bold font-roboto text-theme-primary">
                Step 2: Get current root metadata
              </h2>
              {/* Info about getting current root */}
              <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed">
                      After you have successfully generated new root keys, you need to get the current root file. 
                      Click the <strong>"Get current root"</strong> button and save the received JSON to a file named <code className="bg-theme-input px-1 rounded">{currentRootFileName}</code>.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2 items-center">
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
              
              <h2 className="text-lg font-bold font-roboto text-theme-primary mt-6">
                Step 3: Create new root metadata script
              </h2>
              {/* Info about creating new root metadata */}
              <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
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
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              
              <h2 className="text-lg font-bold font-roboto text-theme-primary mt-6">
                Step 4: Submit metadata
              </h2>
              {/* Info about submitting metadata */}
              <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed">
                      Now that you have received <code className="bg-theme-input px-1 rounded">{unsignedNewRootMetadataFileName}</code>, 
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
                    placeholder="Paste unsigned root metadata JSON here..."
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
              
              <h2 className="text-lg font-bold font-roboto text-theme-primary mt-6">
                Step 5: Generate signatures
              </h2>
              {/* Info about generating signatures */}
              <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      Generate signatures for the metadata. Generate the script and save it with the name <code className="bg-theme-input px-1 rounded">{generateSignaturesScriptFileName}</code>. 
                      This script can work in two modes:
                    </p>
                    <ul className="text-theme-primary text-sm leading-relaxed list-disc list-inside ml-2 space-y-1 mb-3">
                      <li><strong>Single signature mode:</strong> Signs with one key</li>
                      <li><strong>Batch mode:</strong> Signs with all keys from key info JSON files</li>
                    </ul>
                    <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 mt-3">
                      <p className="text-theme-primary text-sm leading-relaxed">
                        <strong>Note:</strong> If you have all necessary files locally (key_info.json and new_root_keys_info.json), 
                        use batch mode for convenience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 items-center">
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
                    onClick={handleCopyGenerateSignaturesScript}
                    className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copy Script
                  </button>
                )}
              </div>

              {generateSignaturesScript && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowGenerateSignaturesScript(!showGenerateSignaturesScript)}
                    className="text-theme-primary hover:text-theme-button-primary mb-2 flex items-center"
                  >
                    <i className={`fas fa-chevron-${showGenerateSignaturesScript ? 'up' : 'down'} mr-2`}></i>
                    Generated Python Script {showGenerateSignaturesScript ? '(click to hide)' : '(click to expand)'}
                  </button>
                  {showGenerateSignaturesScript && (
                    <div className="bg-theme-input rounded-lg p-4 border border-theme">
                      <pre className="text-sm text-theme-primary overflow-x-auto whitespace-pre-wrap">
                        {generateSignaturesScript}
                      </pre>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={handleCopyGenerateSignaturesScript}
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
              
              <h2 className="text-lg font-bold font-roboto text-theme-primary mt-6">
                Step 6: Submit signatures
              </h2>
              {/* Info about submitting signatures */}
              <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                  <div className="flex-1">
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      After generating signature files (signature1.json, signature2.json, signatureold1.json, etc.) in Step 5, 
                      submit them one by one. Paste the JSON content from each signature file below and submit.
                    </p>
                    <p className="text-theme-primary text-sm leading-relaxed mb-2">
                      <strong>Instructions:</strong>
                    </p>
                    <ol className="text-theme-primary text-sm leading-relaxed list-decimal list-inside ml-2 space-y-1 mb-3">
                      <li>Open a signature file (e.g., signature1.json or signatureold1.json)</li>
                      <li>Copy the entire JSON content (should contain "keyid" and "sig" fields)</li>
                      <li>Paste it into the field below</li>
                      <li>Click "Submit Signature"</li>
                      <li>Repeat for each signature file until you receive "Metadata update finished" message</li>
                    </ol>
                    <div className="bg-yellow-500 bg-opacity-20 rounded-lg p-3 mt-3">
                      <p className="text-theme-primary text-sm leading-relaxed">
                        <strong>Note:</strong> You may receive errors about "not enough signatures" or "threshold not reached" 
                        while submitting. This is expected - continue submitting signatures until the threshold is met and 
                        you receive the "Metadata update finished" message.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-theme-primary mb-2 font-roboto">Signature Payload</label>
                  <textarea
                    value={signaturePayload}
                    onChange={(e) => handleSignaturePayloadChange(e.target.value)}
                    placeholder='Paste signature JSON here (e.g., {"keyid": "...", "sig": "..."})'
                    rows={6}
                    className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                      signaturePayloadError ? 'border-red-500' : 'border-theme'
                    }`}
                  />
                  {signaturePayloadError && (
                    <p className="text-red-500 text-sm mt-1">{signaturePayloadError}</p>
                  )}
                </div>

                {signatureStatus === 'success' && (
                  <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-green-500 font-semibold mb-1">Metadata update finished!</p>
                        <p className="text-theme-primary text-sm">
                          Root keys rotation has been completed successfully. All required signatures have been submitted and the threshold has been met. Now you can check "Root-Meta-Update" task in the history to see the result.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {signatureStatus === 'threshold' && (
                  <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-yellow-500 font-semibold mb-2">Threshold not reached yet</p>
                        
                        {signatureProgress ? (
                          <div className="space-y-3">
                            {/* Overall Progress */}
                            <div className="bg-theme-input rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-theme-primary font-semibold">Overall Progress</span>
                                <span className="text-yellow-500 font-bold">
                                  {signatureProgress.collected} / {signatureProgress.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                <div 
                                  className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${(signatureProgress.collected / signatureProgress.total) * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-theme-primary text-xs">
                                {signatureProgress.remaining} more {signatureProgress.remaining === 1 ? 'signature' : 'signatures'} required
                              </p>
                            </div>

                            {/* Breakdown by Old/New Keys */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-theme-input rounded-lg p-3">
                                <p className="text-theme-primary text-xs font-semibold mb-1">Old Keys</p>
                                <p className="text-green-400 text-sm font-bold">
                                  {signatureProgress.oldCollected} collected
                                </p>
                                {signatureProgress.oldRemaining > 0 && (
                                  <p className="text-yellow-400 text-xs mt-1">
                                    {signatureProgress.oldRemaining} more needed
                                  </p>
                                )}
                              </div>
                              <div className="bg-theme-input rounded-lg p-3">
                                <p className="text-theme-primary text-xs font-semibold mb-1">New Keys</p>
                                <p className="text-green-400 text-sm font-bold">
                                  {signatureProgress.newCollected} collected
                                </p>
                                {signatureProgress.newRemaining > 0 && (
                                  <p className="text-yellow-400 text-xs mt-1">
                                    {signatureProgress.newRemaining} more needed
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Signed Keys */}
                            {signatureProgress.oldKeysSigned.length > 0 && (
                              <div className="bg-theme-input rounded-lg p-3">
                                <p className="text-theme-primary text-xs font-semibold mb-2">✓ Old Keys Signed</p>
                                <div className="flex flex-wrap gap-1">
                                  {signatureProgress.oldKeysSigned.map((key, idx) => (
                                    <span 
                                      key={idx}
                                      className="text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded font-mono"
                                    >
                                      {key.substring(0, 8)}...
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Missing Keys */}
                            {(signatureProgress.missingOldKeys.length > 0 || signatureProgress.missingNewKeys.length > 0) && (
                              <div className="bg-theme-input rounded-lg p-3">
                                <p className="text-theme-primary text-xs font-semibold mb-2">⚠ Missing Keys</p>
                                {signatureProgress.missingOldKeys.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-yellow-400 text-xs mb-1">Old Keys:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {signatureProgress.missingOldKeys.map((key, idx) => (
                                        <span 
                                          key={idx}
                                          className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                        >
                                          {key.substring(0, 8)}...
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {signatureProgress.missingNewKeys.length > 0 && (
                                  <div>
                                    <p className="text-yellow-400 text-xs mb-1">New Keys:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {signatureProgress.missingNewKeys.map((key, idx) => (
                                        <span 
                                          key={idx}
                                          className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                        >
                                          {key.substring(0, 8)}...
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : signatureErrorMessage && (
                          <div>
                            <p className="text-theme-primary text-sm mb-2 font-mono text-xs bg-theme-input p-2 rounded">
                              {signatureErrorMessage}
                            </p>
                            {(() => {
                              // Fallback: Extract progress information (got X, want Y)
                              const gotMatch = signatureErrorMessage.match(/got\s+(\d+)/i);
                              const wantMatch = signatureErrorMessage.match(/want\s+(\d+)/i);
                              if (gotMatch && wantMatch) {
                                const got = parseInt(gotMatch[1], 10);
                                const want = parseInt(wantMatch[1], 10);
                                const remaining = want - got;
                                return (
                                  <p className="text-theme-primary text-sm mb-2">
                                    <strong>Progress:</strong> {got} of {want} signatures submitted 
                                    ({remaining} more {remaining === 1 ? 'signature' : 'signatures'} needed)
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                        
                        <p className="text-theme-primary text-sm mt-3">
                          Continue submitting more signatures. The input field has been cleared for the next signature.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {signatureStatus === 'partial' && (
                  <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-blue-500 font-semibold mb-1">Signature submitted</p>
                        <p className="text-theme-primary text-sm">
                          Continue submitting more signatures until the threshold is met. The input field has been cleared for the next signature.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {signatureStatus === 'error' && (
                  <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-exclamation-circle text-red-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-red-500 font-semibold mb-1">Error submitting signature</p>
                        {signatureErrorMessage && (
                          <>
                            <p className="text-theme-primary text-sm mb-2 font-mono text-xs bg-theme-input p-2 rounded">
                              {signatureErrorMessage}
                            </p>
                            {/* Show progress even for error status if it contains threshold info */}
                            {signatureProgress ? (
                              <div className="mt-3 space-y-3">
                                {/* Overall Progress */}
                                <div className="bg-theme-input rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-theme-primary font-semibold">Overall Progress</span>
                                    <span className="text-yellow-500 font-bold">
                                      {signatureProgress.collected} / {signatureProgress.total}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                    <div 
                                      className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300"
                                      style={{ width: `${(signatureProgress.collected / signatureProgress.total) * 100}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-theme-primary text-xs">
                                    {signatureProgress.remaining} more {signatureProgress.remaining === 1 ? 'signature' : 'signatures'} required
                                  </p>
                                </div>

                                {/* Breakdown by Old/New Keys */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-theme-input rounded-lg p-3">
                                    <p className="text-theme-primary text-xs font-semibold mb-1">Old Keys</p>
                                    <p className="text-green-400 text-sm font-bold">
                                      {signatureProgress.oldCollected} collected
                                    </p>
                                    {signatureProgress.oldRemaining > 0 && (
                                      <p className="text-yellow-400 text-xs mt-1">
                                        {signatureProgress.oldRemaining} more needed
                                      </p>
                                    )}
                                  </div>
                                  <div className="bg-theme-input rounded-lg p-3">
                                    <p className="text-theme-primary text-xs font-semibold mb-1">New Keys</p>
                                    <p className="text-green-400 text-sm font-bold">
                                      {signatureProgress.newCollected} collected
                                    </p>
                                    {signatureProgress.newRemaining > 0 && (
                                      <p className="text-yellow-400 text-xs mt-1">
                                        {signatureProgress.newRemaining} more needed
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Signed Keys */}
                                {signatureProgress.oldKeysSigned.length > 0 && (
                                  <div className="bg-theme-input rounded-lg p-3">
                                    <p className="text-theme-primary text-xs font-semibold mb-2">✓ Old Keys Signed</p>
                                    <div className="flex flex-wrap gap-1">
                                      {signatureProgress.oldKeysSigned.map((key, idx) => (
                                        <span 
                                          key={idx}
                                          className="text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded font-mono"
                                        >
                                          {key.substring(0, 8)}...
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Missing Keys */}
                                {(signatureProgress.missingOldKeys.length > 0 || signatureProgress.missingNewKeys.length > 0) && (
                                  <div className="bg-theme-input rounded-lg p-3">
                                    <p className="text-theme-primary text-xs font-semibold mb-2">⚠ Missing Keys</p>
                                    {signatureProgress.missingOldKeys.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-yellow-400 text-xs mb-1">Old Keys:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {signatureProgress.missingOldKeys.map((key, idx) => (
                                            <span 
                                              key={idx}
                                              className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                            >
                                              {key.substring(0, 8)}...
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {signatureProgress.missingNewKeys.length > 0 && (
                                      <div>
                                        <p className="text-yellow-400 text-xs mb-1">New Keys:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {signatureProgress.missingNewKeys.map((key, idx) => (
                                            <span 
                                              key={idx}
                                              className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded font-mono"
                                            >
                                              {key.substring(0, 8)}...
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : signatureErrorMessage && (signatureErrorMessage.includes('not enough signatures') || signatureErrorMessage.includes('threshold not reached')) && (
                              <div className="mt-3 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                                <p className="text-yellow-500 text-sm font-semibold mb-2">Threshold not reached</p>
                                <p className="text-theme-primary text-sm">
                                  This is expected - continue submitting more signatures until the threshold is met.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        <p className="text-theme-primary text-sm mt-3">
                          {signatureProgress || (signatureErrorMessage && (signatureErrorMessage.includes('not enough signatures') || signatureErrorMessage.includes('threshold not reached')))
                            ? 'Continue submitting more signatures. The input field has been cleared for the next signature.'
                            : 'Please check the error message above and try again.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 items-center">
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
                  <div className="mt-4">
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

                {metadataStatusResult === 'finished' && (
                  <div className="p-4 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-green-500 font-semibold mb-1">Metadata update finished!</p>
                        <p className="text-theme-primary text-sm">
                          Root keys rotation has been completed successfully. All required signatures have been submitted and the threshold has been met. Now you can check "Root-Meta-Update" task in the history to see the result.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metadataStatusResult === 'threshold-not-met' && (
                  <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-yellow-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-yellow-500 font-semibold mb-1">Threshold not reached</p>
                        <p className="text-theme-primary text-sm">
                          Continue submitting more signatures until the threshold is met.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metadataStatusResult === 'in-progress' && (
                  <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-blue-500 font-semibold mb-1">Metadata update in progress</p>
                        <p className="text-theme-primary text-sm">
                          The metadata update is still in progress. Continue submitting signatures if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metadataStatusResult === 'error' && (
                  <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-exclamation-circle text-red-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-red-500 font-semibold mb-1">Error checking status</p>
                        <p className="text-theme-primary text-sm">
                          An error occurred while checking the metadata status. Please try again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {metadataStatusResult === 'unknown' && (
                  <div className="p-4 bg-gray-500 bg-opacity-10 border border-gray-500 rounded-lg">
                    <div className="flex items-start">
                      <i className="fas fa-question-circle text-gray-500 mr-3 mt-0.5 text-xl"></i>
                      <div className="flex-1">
                        <p className="text-gray-500 font-semibold mb-1">Status unknown</p>
                        <p className="text-theme-primary text-sm">
                          Could not determine the exact status. Please check the response or try submitting more signatures.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      </div>
    </>
  );
};


