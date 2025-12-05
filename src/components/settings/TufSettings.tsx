import React, { useState, useEffect, useRef } from 'react';
import { useAppsQuery, AppListItem } from '../../hooks/use-query/useAppsQuery';
import { useToast } from '../../hooks/useToast';
import axiosInstance from '../../config/axios';

type StepStatus = 'ready' | 'in-progress' | 'success' | 'error' | 'waiting' | 'disabled';

type TufHistoryEntry = {
  id: string;
  timestamp: string;
  appName: string;
  operation: 'generate' | 'bootstrap' | 'publish';
  status: 'success' | 'failed';
  taskId?: string;
};

type TaskState = 'PENDING' | 'SUCCESS' | 'FAILURE';

type TaskData = {
  task_id: string;
  state: TaskState;
  result?: {
    message: string;
    status?: boolean;
    task?: string;
    last_update?: string;
    error?: string;
  };
};

export const TufSettings: React.FC = () => {
  const { apps } = useAppsQuery();
  const { toastSuccess, toastError } = useToast();
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Step 1: Generate TUF Root Keys
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
  
  // Step 2: Start TUF Bootstrapping
  const [step2Status, setStep2Status] = useState<StepStatus>('waiting');
  const [payloadSource, setPayloadSource] = useState<'generated' | 'custom'>('generated');
  const [customPayload, setCustomPayload] = useState<string>('');
  const [customPayloadError, setCustomPayloadError] = useState<string>('');
  const [bootstrapTaskId, setBootstrapTaskId] = useState<string>('');
  const [bootstrapLastUpdate, setBootstrapLastUpdate] = useState<string>('');
  
  // Step 3: Monitor Status
  const [step3Status, setStep3Status] = useState<StepStatus>('disabled');
  const [bootstrapStatus, setBootstrapStatus] = useState<TaskData | null>(null);
  const [tufTasks, setTufTasks] = useState<TaskData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TufHistoryEntry[]>([]);
  
  // Polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  // Filter apps with Tuf: true
  const tufApps = React.useMemo(() => {
    if (!Array.isArray(apps)) return [];
    return (apps as AppListItem[]).filter(app => app.Tuf === true);
  }, [apps]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('tuf-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load TUF history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (entry: Omit<TufHistoryEntry, 'id'>) => {
    setHistory(prevHistory => {
      const newEntry: TufHistoryEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      const updatedHistory = [newEntry, ...prevHistory].slice(0, 20); // Keep last 20 entries
      localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Update history entry status based on task state
  const updateHistoryStatus = (taskId: string, state: TaskState) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.map(entry => {
        if (entry.taskId === taskId && entry.operation === 'bootstrap') {
          // Map TaskState to history status
          let newStatus: 'success' | 'failed' = 'failed';
          if (state === 'SUCCESS') {
            newStatus = 'success';
          } else if (state === 'FAILURE') {
            newStatus = 'failed';
          } else if (state === 'PENDING') {
            // Keep current status for pending tasks
            return entry;
          }
          
          return {
            ...entry,
            status: newStatus,
          };
        }
        return entry;
      });
      
      localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  // Handle dropdown clicks
  useEffect(() => {
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

  // Update step statuses based on state
  useEffect(() => {
    console.log('[TufSettings] useEffect step statuses:', {
      selectedApp,
      step1Status,
      step2Status,
      bootstrapTaskId,
    });

    if (!selectedApp) {
      setStep1Status('ready');
      setStep2Status('waiting');
      setStep3Status('disabled');
      return;
    }

    // Step 2 should be available whenever an app is selected
    // User can use custom payload even without generating keys (Step 1)
    // Don't overwrite bootstrap states (error, success, in-progress)
    if (step2Status !== 'error' && step2Status !== 'success' && step2Status !== 'in-progress') {
      console.log('[TufSettings] Setting step2Status to ready (app selected, can use custom payload)');
      setStep2Status('ready');
    } else {
      console.log('[TufSettings] Keeping step2Status as', step2Status, '(already in bootstrap state)');
    }

    if (bootstrapTaskId) {
      setStep3Status('ready');
    }
  }, [selectedApp, step1Status, bootstrapTaskId]);

  // Auto-check bootstrap status and open history when app is selected
  useEffect(() => {
    if (selectedApp) {
      checkBootstrapStatus();
      // Auto-open history when app is selected
      setShowHistory(true);
    }
  }, [selectedApp]);

  // Polling for bootstrap status
  useEffect(() => {
    if (selectedApp && (step2Status === 'in-progress' || step2Status === 'success')) {
      pollingIntervalRef.current = setInterval(() => {
        checkBootstrapStatus();
        setLastChecked(new Date().toLocaleTimeString());
      }, 5000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedApp, step2Status]);

  // API functions
  const generateKeys = async () => {
    setStep1Status('in-progress');
    
    try {
      const requestPayload = {
        appName: selectedApp,
        rootExpiration: expiration.root,
        targetsExpiration: expiration.targets,
        snapshotExpiration: expiration.snapshot,
        timestampExpiration: expiration.timestamp,
        roleName: roleName,
      };

      const response = await axiosInstance.post('/tuf/v1/bootstrap/generate', requestPayload);
      
      // Store only the 'data' field from response for use in bootstrap
      // Response structure: { data: {...}, message: "..." }
      // We need only the 'data' field
      const payloadData = response.data?.data;
      if (!payloadData) {
        throw new Error('Invalid response: missing data field');
      }
      const responsePayload = JSON.stringify(payloadData, null, 2);
      setGeneratedPayload(responsePayload);
      setStep1Status('success');
      
      toastSuccess('TUF root keys generated successfully!');
      
      saveToHistory({
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
      
      saveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'generate',
        status: 'failed',
      });
    }
  };

  const startBootstrap = async (payload: string) => {
    console.log('[TufSettings] startBootstrap called, setting step2Status to in-progress');
    setStep2Status('in-progress');
    
    try {
      // Parse payload to ensure it's valid JSON
      const payloadData = JSON.parse(payload);
      
      const response = await axiosInstance.post('/tuf/v1/bootstrap', payloadData);
      
      // Extract task_id and last_update from response
      // Response structure: { data: { task_id: "...", last_update: "..." }, message: "..." }
      const responseData = response.data?.data;
      if (!responseData) {
        throw new Error('Invalid response: missing data field');
      }
      
      const taskId = responseData.task_id;
      const lastUpdate = responseData.last_update;
      
      if (!taskId) {
        throw new Error('Invalid response: missing task_id');
      }
      
      setBootstrapTaskId(taskId);
      setBootstrapLastUpdate(lastUpdate || new Date().toISOString());
      console.log('[TufSettings] Bootstrap started successfully, setting step2Status to success');
      setStep2Status('success');
      
      toastSuccess('TUF bootstrap started successfully!');
      
      // Save with initial status, will be updated when we check the actual status
      saveToHistory({
        timestamp: lastUpdate || new Date().toISOString(),
        appName: selectedApp,
        operation: 'bootstrap',
        status: 'failed', // Will be updated when we check actual status via API
        taskId: taskId,
      });
      
      // Immediately check the task status to update history with real status
      // Use a longer delay to ensure history state is updated first
      setTimeout(() => {
        checkTufTasks(taskId);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to start TUF bootstrap:', error);
      console.log('[TufSettings] Bootstrap failed, setting step2Status to error');
      setStep2Status('error');
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start TUF bootstrap';
      toastError(errorMessage);
      
      saveToHistory({
        timestamp: new Date().toISOString(),
        appName: selectedApp,
        operation: 'bootstrap',
        status: 'failed',
      });
    }
  };

  const checkBootstrapStatus = async () => {
    if (!selectedApp) return;
    
    try {
      const response = await axiosInstance.get(`/tuf/v1/bootstrap?appName=${encodeURIComponent(selectedApp)}`);
      
      // Response structure can be:
      // 1. Bootstrap not started: { data: { bootstrap: false, id: "", state: null, ... }, message: "..." }
      // 2. Bootstrap completed: { data: { bootstrap: true, id: "...", state: null, ... }, message: "..." }
      // 3. Bootstrap in progress: { data: { task_id, state: "PENDING"/"SUCCESS"/"FAILURE", result? }, message: "..." }
      const responseData = response.data?.data;
      if (!responseData) {
        throw new Error('Invalid response: missing data field');
      }
      
      // Check if bootstrap is not started yet
      if (responseData.bootstrap === false) {
        // Bootstrap not started - allow user to start bootstrap
        // Don't overwrite 'error' state (allows retry after failure)
        console.log('[TufSettings] checkBootstrapStatus: bootstrap is false');
        setBootstrapStatus(null);
        setBootstrapTaskId('');
        setBootstrapLastUpdate('');
        // Only set to 'ready' if not already in a bootstrap state (error, success, in-progress)
        // This allows retry after bootstrap failure
        if (step2Status !== 'error' && step2Status !== 'success' && step2Status !== 'in-progress') {
          console.log('[TufSettings] checkBootstrapStatus: setting step2Status to ready (bootstrap not started)');
          setStep2Status('ready');
        } else {
          console.log('[TufSettings] checkBootstrapStatus: keeping step2Status as', step2Status, '(already in bootstrap state)');
        }
        setStep3Status('disabled');
        return;
      }
      
      // Check if bootstrap is already completed (bootstrap: true, state: null)
      if (responseData.bootstrap === true && responseData.state === null) {
        // Bootstrap completed successfully
        const statusData: TaskData = {
          task_id: responseData.id || '',
          state: 'SUCCESS',
          result: {
            message: response.data?.message || 'Bootstrap completed successfully',
            status: true,
            task: 'bootstrap',
          },
        };
        
        setBootstrapStatus(statusData);
        
        // Update task_id if it wasn't set before
        if (!bootstrapTaskId && statusData.task_id) {
          setBootstrapTaskId(statusData.task_id);
        }
        
        setStep2Status('success');
        setStep3Status('ready');
        
        // Update history status for completed bootstrap
        if (statusData.task_id) {
          updateHistoryStatus(statusData.task_id, 'SUCCESS');
        }
        return;
      }
      
      // Bootstrap is in progress (has state: PENDING/SUCCESS/FAILURE)
      const statusData: TaskData = {
        task_id: responseData.task_id || responseData.id || '',
        state: responseData.state,
        result: responseData.result,
      };
      
      setBootstrapStatus(statusData);
      
      // Update task_id if it wasn't set before
      if (!bootstrapTaskId && statusData.task_id) {
        setBootstrapTaskId(statusData.task_id);
      }
      
      // Update last_update if available
      if (responseData.result?.last_update) {
        setBootstrapLastUpdate(responseData.result.last_update);
      }
      
      // Update step statuses based on state
      if (statusData.state === 'SUCCESS') {
        console.log('[TufSettings] checkBootstrapStatus: state is SUCCESS, setting step2Status to success');
        setStep2Status('success');
        setStep3Status('ready');
      } else if (statusData.state === 'FAILURE') {
        console.log('[TufSettings] checkBootstrapStatus: state is FAILURE, setting step2Status to error');
        setStep2Status('error');
      } else if (statusData.state === 'PENDING') {
        console.log('[TufSettings] checkBootstrapStatus: state is PENDING, setting step2Status to in-progress');
        setStep2Status('in-progress');
      }
      
      // Update history status based on actual task state
      if (statusData.task_id) {
        updateHistoryStatus(statusData.task_id, statusData.state);
      }
    } catch (error: any) {
      console.error('Failed to check bootstrap status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check bootstrap status';
      toastError(errorMessage);
    }
  };

  const checkTufTasks = async (taskId?: string) => {
    // Use provided taskId, or bootstrapTaskId, or bootstrapStatus?.task_id
    const taskIdToUse = taskId || bootstrapTaskId || bootstrapStatus?.task_id;
    if (!taskIdToUse) {
      toastError('No task ID available. Please start bootstrap first or select a task from history.');
      return;
    }
    
    try {
      const response = await axiosInstance.get(`/tuf/v1/task?task_id=${encodeURIComponent(taskIdToUse)}`);
      
      // Response structure: { data: TaskData, message: "..." }
      const responseData = response.data?.data;
      if (!responseData) {
        throw new Error('Invalid response: missing data field');
      }
      
      // Handle both single task and array of tasks
      const tasks: TaskData[] = Array.isArray(responseData) 
        ? responseData 
        : [responseData];
      
      setTufTasks(tasks);
      
      // Update history status based on actual task state
      tasks.forEach(task => {
        if (task.task_id) {
          updateHistoryStatus(task.task_id, task.state);
        }
      });
      
      toastSuccess('TUF task loaded successfully!');
    } catch (error: any) {
      console.error('Failed to check TUF task:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check TUF task';
      toastError(errorMessage);
      setTufTasks([]);
    }
  };

  // Handlers
  const handleGenerateKeys = () => {
    if (!selectedApp || !roleName) return;
    generateKeys();
  };

  const handleStartBootstrap = () => {
    let payloadToUse = '';
    
    if (payloadSource === 'generated') {
      if (!generatedPayload) {
        alert('Please generate keys first or use custom payload');
        return;
      }
      payloadToUse = generatedPayload;
    } else {
      if (!customPayload.trim()) {
        setCustomPayloadError('Custom payload is required');
        return;
      }
      
      // Validate JSON
      try {
        JSON.parse(customPayload);
        setCustomPayloadError('');
        payloadToUse = customPayload;
      } catch (e) {
        setCustomPayloadError('Invalid JSON format');
        return;
      }
    }
    
    startBootstrap(payloadToUse);
  };

  const handleCopyPayload = async () => {
    if (generatedPayload) {
      try {
        await navigator.clipboard.writeText(generatedPayload);
        toastSuccess('Payload copied to clipboard successfully!');
      } catch (err) {
        console.error('Failed to copy payload:', err);
        toastSuccess('Failed to copy payload');
      }
    }
  };

  const handleCustomPayloadChange = (value: string) => {
    setCustomPayload(value);
    setCustomPayloadError('');
    
    // Validate JSON on change
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (e) {
        // Error will be shown on submit
      }
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case 'ready':
        return 'text-blue-500';
      case 'in-progress':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'waiting':
      case 'disabled':
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'ready':
        return 'fa-circle';
      case 'in-progress':
        return 'fa-spinner fa-spin';
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-times-circle';
      case 'waiting':
        return 'fa-clock';
      case 'disabled':
      default:
        return 'fa-circle';
    }
  };

  const getTaskStateColor = (state: TaskState) => {
    switch (state) {
      case 'SUCCESS':
        return 'text-green-500';
      case 'FAILURE':
        return 'text-red-500';
      case 'PENDING':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  // Check if bootstrap is successful
  const isBootstrapSuccess = bootstrapStatus?.state === 'SUCCESS';

  return (
    <div className="space-y-6">
      {/* History - Show first if no app selected */}
      {!selectedApp && (
        <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
          <h2 className="text-lg font-bold font-roboto text-theme-primary mb-4">History</h2>
          {history.length === 0 ? (
            <p className="text-theme-primary opacity-70 text-center py-4">No history yet</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme-card-hover">
                      <th className="text-left py-2 px-2 text-theme-primary">Date</th>
                      <th className="text-left py-2 px-2 text-theme-primary">App</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Operation</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Status</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Task ID</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.id} className="border-b border-theme-card-hover">
                        <td className="py-2 px-2 text-theme-primary">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-theme-primary">{entry.appName}</td>
                        <td className="py-2 px-2 text-theme-primary capitalize">
                          {entry.operation}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={
                              entry.status === 'success'
                                ? 'text-green-500'
                                : 'text-red-500'
                            }
                          >
                            {entry.status === 'success' ? (
                              <i className="fas fa-check-circle mr-1"></i>
                            ) : (
                              <i className="fas fa-times-circle mr-1"></i>
                            )}
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-theme-primary font-mono text-xs">
                          {entry.taskId || '-'}
                        </td>
                        <td className="py-2 px-2">
                          {entry.taskId && entry.operation === 'bootstrap' ? (
                            <button
                              onClick={() => checkTufTasks(entry.taskId)}
                              className="text-theme-primary hover:text-theme-button-primary text-sm transition-colors"
                              title="Check task status"
                            >
                              <i className="fas fa-sync mr-1"></i>
                              Check
                            </button>
                          ) : (
                            <span className="text-theme-primary opacity-50 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('tuf-history');
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Clear History
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* App Selection */}
      <div className="bg-theme-card p-4 rounded-lg border border-theme-card-hover">
        <label className="block text-theme-primary mb-2 font-roboto font-semibold">
          Select App
        </label>
        <div className="relative dropdown-container">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'app' ? null : 'app')}
            className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-all duration-150"
          >
            <span>{selectedApp || 'Select an app with TUF enabled'}</span>
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
              className={`text-theme-primary transition-transform ${openDropdown === 'app' ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {openDropdown === 'app' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover max-h-60 overflow-y-auto">
              {tufApps.length > 0 ? (
                tufApps.map((app) => (
                  <button
                    key={app.ID}
                    type="button"
                    onClick={() => {
                      setSelectedApp(app.AppName);
                      setOpenDropdown(null);
                      // Reset states when app changes
                      setStep1Status('ready');
                      setStep2Status('waiting');
                      setStep3Status('disabled');
                      setGeneratedPayload('');
                      setBootstrapTaskId('');
                      setBootstrapStatus(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors ${
                      selectedApp === app.AppName ? 'bg-theme-button-primary bg-opacity-50' : ''
                    }`}
                  >
                    {app.AppName}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-theme-primary text-center">
                  No apps with TUF enabled found
                </div>
              )}
            </div>
          )}
        </div>
        {tufApps.length > 0 && (
          <p className="text-sm text-theme-primary opacity-70 mt-2">
            <i className="fas fa-info-circle mr-1"></i>
            Only apps with TUF enabled are shown
          </p>
        )}
      </div>

      {/* Step 1: Generate TUF Root Keys - Show only if bootstrap is not SUCCESS */}
      {selectedApp && !isBootstrapSuccess && (
      <div className="bg-theme-card p-6 rounded-lg border-2 border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-theme-primary font-roboto">
            Step 1: Generate TUF Root Keys
          </h2>
          <div className={`flex items-center ${getStatusColor(step1Status)}`}>
            <i className={`fas ${getStatusIcon(step1Status)} mr-2`}></i>
            <span className="text-sm capitalize">{step1Status.replace('-', ' ')}</span>
          </div>
        </div>

        {/* Danger Zone Warning */}
        <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
          <div className="flex items-start">
            <i className="fas fa-exclamation-triangle text-red-500 mr-3 mt-0.5 text-xl"></i>
            <div className="flex-1">
              <h3 className="text-red-500 font-semibold mb-2 font-roboto">Danger Zone</h3>
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
            <label className="block text-theme-primary mb-2 font-roboto">App Name</label>
            <input
              type="text"
              value={selectedApp}
              disabled
              className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-theme-primary mb-2 font-roboto">Key Type</label>
            <div className="relative dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'keyType' ? null : 'keyType')}
                className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover"
              >
                <span>{keyType}</span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'keyType' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'keyType' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  {['ed25519', 'rsa', 'ecdsa'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setKeyType(type);
                        setOpenDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-theme-primary mb-2 font-roboto">Role Name</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name (e.g., root, timestamp, snapshot, targets)"
              className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-theme-primary mb-2 font-roboto">Expiration Settings</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-theme-primary mb-1">Root (days)</label>
                <input
                  type="number"
                  value={expiration.root}
                  onChange={(e) => setExpiration(prev => ({ ...prev, root: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-theme-primary mb-1">Timestamp (days)</label>
                <input
                  type="number"
                  value={expiration.timestamp}
                  onChange={(e) => setExpiration(prev => ({ ...prev, timestamp: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-theme-primary mb-1">Snapshot (days)</label>
                <input
                  type="number"
                  value={expiration.snapshot}
                  onChange={(e) => setExpiration(prev => ({ ...prev, snapshot: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-theme-primary mb-1">Targets (days)</label>
                <input
                  type="number"
                  value={expiration.targets}
                  onChange={(e) => setExpiration(prev => ({ ...prev, targets: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-theme-input text-theme-primary border border-theme rounded-lg px-4 py-2"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateKeys}
            disabled={!selectedApp || step1Status === 'in-progress'}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-roboto hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        setPayloadSource('generated');
                        handleStartBootstrap();
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
      </div>
      )}

      {/* Step 2: Start TUF Bootstrapping - Show only if bootstrap is not SUCCESS */}
      {selectedApp && !isBootstrapSuccess && (
      <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-theme-primary font-roboto">
            Step 2: Start TUF Bootstrapping
          </h2>
          <div className={`flex items-center ${getStatusColor(step2Status)}`}>
            <i className={`fas ${getStatusIcon(step2Status)} mr-2`}></i>
            <span className="text-sm capitalize">{step2Status.replace('-', ' ')}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-theme-primary mb-2 font-roboto">Payload Source</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payloadSource"
                  value="generated"
                  checked={payloadSource === 'generated'}
                  onChange={(e) => setPayloadSource(e.target.value as 'generated' | 'custom')}
                  disabled={!generatedPayload}
                  className="mr-2"
                />
                <span className="text-theme-primary">
                  Use generated payload (from Step 1)
                  {!generatedPayload && <span className="text-gray-500 ml-2">(Not available)</span>}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payloadSource"
                  value="custom"
                  checked={payloadSource === 'custom'}
                  onChange={(e) => setPayloadSource(e.target.value as 'generated' | 'custom')}
                  className="mr-2"
                />
                <span className="text-theme-primary">Use custom payload</span>
              </label>
            </div>
          </div>

          {payloadSource === 'custom' && (
            <div>
              <label className="block text-theme-primary mb-2 font-roboto">Custom Payload</label>
              <textarea
                value={customPayload}
                onChange={(e) => handleCustomPayloadChange(e.target.value)}
                placeholder="Paste JSON payload here..."
                rows={8}
                className={`w-full bg-theme-input text-theme-primary border rounded-lg px-4 py-2 font-mono text-sm ${
                  customPayloadError ? 'border-red-500' : 'border-theme'
                }`}
              />
              {customPayloadError && (
                <p className="text-red-500 text-sm mt-1">{customPayloadError}</p>
              )}
            </div>
          )}

          <button
            onClick={() => {
              console.log('[TufSettings] Start Bootstrap button clicked, step2Status:', step2Status);
              handleStartBootstrap();
            }}
            disabled={(() => {
              // Button is disabled only when:
              // - bootstrap is in progress
              // - bootstrap is disabled
              // - step2Status is waiting (shouldn't happen with new logic, but keep for safety)
              // NOT disabled when step2Status is 'error' (allows retry after failure)
              const isDisabled = step2Status === 'waiting' || step2Status === 'in-progress' || step2Status === 'disabled';
              console.log('[TufSettings] Start Bootstrap button disabled check:', {
                step2Status,
                isDisabled,
                reasons: {
                  waiting: step2Status === 'waiting',
                  inProgress: step2Status === 'in-progress',
                  disabled: step2Status === 'disabled',
                },
              });
              return isDisabled;
            })()}
            className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step2Status === 'in-progress' ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Starting Bootstrap...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-2"></i>
                Start Bootstrap
              </>
            )}
          </button>

          {bootstrapTaskId && (
            <div className="mt-4 p-4 bg-theme-input rounded-lg border border-theme">
              <div className="flex items-center justify-between mb-2">
                <span className="text-theme-primary font-semibold">Bootstrap Status</span>
                {lastChecked && (
                  <span className="text-sm text-theme-primary opacity-70">
                    Last checked: {lastChecked}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-theme-primary opacity-70">Task ID: </span>
                  <span className="text-theme-primary font-mono">{bootstrapTaskId}</span>
                </div>
                {bootstrapLastUpdate && (
                  <div>
                    <span className="text-theme-primary opacity-70">Last Update: </span>
                    <span className="text-theme-primary">
                      {new Date(bootstrapLastUpdate).toLocaleString()}
                    </span>
                  </div>
                )}
                {bootstrapStatus && (
                  <div>
                    <span className="text-theme-primary opacity-70">Status: </span>
                    <span className={getTaskStateColor(bootstrapStatus.state)}>
                      {bootstrapStatus.state}
                    </span>
                    {bootstrapStatus.result && (
                      <div className="mt-2 pl-4 border-l-2 border-theme-card-hover">
                        <div className="text-theme-primary">{bootstrapStatus.result.message}</div>
                        {bootstrapStatus.result.error && (
                          <div className="text-red-500 mt-1">{bootstrapStatus.result.error}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Monitor Status - Show only if app is selected */}
      {selectedApp && (
      <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-theme-primary font-roboto">
            Monitor Status
          </h2>
          <div className={`flex items-center ${getStatusColor(step3Status)}`}>
            <i className={`fas ${getStatusIcon(step3Status)} mr-2`}></i>
            <span className="text-sm capitalize">{step3Status.replace('-', ' ')}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={checkBootstrapStatus}
              disabled={!selectedApp}
              className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-sync mr-2"></i>
              Check Bootstrap Status
            </button>
            <button
              onClick={() => checkTufTasks()}
              disabled={!bootstrapTaskId && !bootstrapStatus?.task_id}
              className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-tasks mr-2"></i>
              Check TUF Task
            </button>
          </div>

          {bootstrapStatus ? (
            <div className="p-4 bg-theme-input rounded-lg border border-theme">
              <h3 className="text-theme-primary font-semibold mb-2">Bootstrap Status</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-theme-primary opacity-70">Task ID: </span>
                  <span className="text-theme-primary font-mono">{bootstrapStatus.task_id}</span>
                </div>
                <div>
                  <span className="text-theme-primary opacity-70">State: </span>
                  <span className={getTaskStateColor(bootstrapStatus.state)}>
                    {bootstrapStatus.state}
                  </span>
                </div>
                {bootstrapStatus.result && (
                  <>
                    <div className="text-theme-primary">{bootstrapStatus.result.message}</div>
                    {bootstrapStatus.result.last_update && (
                      <div>
                        <span className="text-theme-primary opacity-70">Last Update: </span>
                        <span className="text-theme-primary">
                          {new Date(bootstrapStatus.result.last_update).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {bootstrapStatus.result.error && (
                      <div className="text-red-500">{bootstrapStatus.result.error}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-theme-input rounded-lg border border-theme">
              <h3 className="text-theme-primary font-semibold mb-2">Bootstrap Status</h3>
              <div className="text-sm text-theme-primary opacity-70">
                <i className="fas fa-info-circle mr-2"></i>
                Bootstrap has not been started yet. System is available for bootstrap.
              </div>
            </div>
          )}

          {tufTasks.length > 0 && (
            <div className="p-4 bg-theme-input rounded-lg border border-theme">
              <h3 className="text-theme-primary font-semibold mb-2">TUF Tasks</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-theme-card-hover">
                      <th className="text-left py-2 px-2 text-theme-primary">Task ID</th>
                      <th className="text-left py-2 px-2 text-theme-primary">State</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Message</th>
                      <th className="text-left py-2 px-2 text-theme-primary">Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tufTasks.map((task) => (
                      <tr key={task.task_id} className="border-b border-theme-card-hover">
                        <td className="py-2 px-2 text-theme-primary font-mono text-xs">
                          {task.task_id}
                        </td>
                        <td className="py-2 px-2">
                          <span className={getTaskStateColor(task.state)}>
                            {task.state}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-theme-primary">
                          {task.state === 'FAILURE' && task.result?.error
                            ? task.result.error
                            : task.result?.message || '-'}
                        </td>
                        <td className="py-2 px-2 text-theme-primary text-xs">
                          {task.result?.last_update
                            ? new Date(task.result.last_update).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* History - Show when app is selected (collapsible) */}
      {selectedApp && (
      <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-theme-primary hover:text-theme-button-primary"
        >
          <h2 className="text-lg font-bold font-roboto">History</h2>
          <i className={`fas fa-chevron-${showHistory ? 'up' : 'down'}`}></i>
        </button>

        {showHistory && (
          <div className="mt-4">
            {history.length === 0 ? (
              <p className="text-theme-primary opacity-70 text-center py-4">No history yet</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-theme-card-hover">
                        <th className="text-left py-2 px-2 text-theme-primary">Date</th>
                        <th className="text-left py-2 px-2 text-theme-primary">App</th>
                        <th className="text-left py-2 px-2 text-theme-primary">Operation</th>
                        <th className="text-left py-2 px-2 text-theme-primary">Status</th>
                        <th className="text-left py-2 px-2 text-theme-primary">Task ID</th>
                        <th className="text-left py-2 px-2 text-theme-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.id} className="border-b border-theme-card-hover">
                          <td className="py-2 px-2 text-theme-primary">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-theme-primary">{entry.appName}</td>
                          <td className="py-2 px-2 text-theme-primary capitalize">
                            {entry.operation}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={
                                entry.status === 'success'
                                  ? 'text-green-500'
                                  : 'text-red-500'
                              }
                            >
                              {entry.status === 'success' ? (
                                <i className="fas fa-check-circle mr-1"></i>
                              ) : (
                                <i className="fas fa-times-circle mr-1"></i>
                              )}
                              {entry.status}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-theme-primary font-mono text-xs">
                            {entry.taskId || '-'}
                          </td>
                          <td className="py-2 px-2">
                            {entry.taskId && (entry.operation === 'bootstrap' || entry.operation === 'publish') ? (
                              <button
                                onClick={() => checkTufTasks(entry.taskId!)}
                                className="text-theme-primary hover:text-theme-button-primary text-sm transition-colors"
                                title="Check task status"
                              >
                                <i className="fas fa-sync mr-1"></i>
                                Check
                              </button>
                            ) : (
                              <span className="text-theme-primary opacity-50 text-sm">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('tuf-history');
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Clear History
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

