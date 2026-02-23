import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { Artifact, useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { DeleteArtifactConfirmationModal } from './DeleteArtifactConfirmationModal';
import { AxiosError } from 'axios';
import axiosInstance from '../config/axios';
import { BaseModal } from './common/BaseModal';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AppListItem } from '../hooks/use-query/useAppsQuery';
import { useToast } from '../hooks/useToast';

interface EditVersionModalProps {
  appName: string;
  version: string;
  channel: string;
  currentData: {
    ID: string;
    Published: boolean;
    Critical: boolean;
    Intermediate: boolean;
    Changelog: string;
    Artifacts: Artifact[];
  };
  onClose: () => void;
  onSave: (data: {
    Published: boolean;
    Critical: boolean;
    Intermediate: boolean;
    Changelog: string;
    Platform?: string;
    Arch?: string;
    Files: File[];
    app_name: string;
    version: string;
    channel: string;
    updater?: string;
  }) => void;
}
interface ErrorResponse {
  error: string;
  details?: string;
}
export const EditVersionModal: React.FC<EditVersionModalProps> = ({
  appName,
  version,
  channel,
  currentData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = React.useState(currentData);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isPreview, setIsPreview] = React.useState(false);
  const [platform, setPlatform] = React.useState<string>('');
  const [arch, setArch] = React.useState<string>('');
  const [updater, setUpdater] = React.useState<string>('');
  const [signature, setSignature] = React.useState<string>('');
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
  const [artifactToDelete, setArtifactToDelete] = React.useState<{ index: number; platform: string; arch: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [deleteError, setDeleteError] = useState<{ error: string; details?: string } | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [unsignError, setUnsignError] = useState<{ error: string; details?: string } | null>(null);
  const [unsignSuccess, setUnsignSuccess] = useState(false);
  const [isUnsigning, setIsUnsigning] = useState(false);
  const pendingUnsignRef = React.useRef<Set<number>>(new Set());
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { deleteArtifact } = useAppsQuery();
  const queryClient = useQueryClient();
  const { toastSuccess, toastError } = useToast();
  const [error, setError] = useState<{ error: string; details?: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isPublishingTuf, setIsPublishingTuf] = useState(false);

  // Get app data to check if TUF is enabled
  const { data: appData } = useQuery<AppListItem | null>({
    queryKey: ['appData', appName],
    queryFn: async () => {
      const response = await axiosInstance.get('/app/list');
      const app = response.data.apps.find((a: AppListItem) => a.AppName === appName);
      return app || null;
    },
    enabled: !!appName,
  });

  // Get selected platform and its updaters
  const selectedPlatform = platforms.find(p => p.PlatformName === platform);
  const availableUpdaters = selectedPlatform?.Updaters || [];
  const hasMultipleUpdaters = availableUpdaters.length > 1;
  const showUpdaterDropdown = hasMultipleUpdaters && platform;

  // Set default updater to 'manual' when dropdown is shown and no updater is selected
  React.useEffect(() => {
    if (showUpdaterDropdown && !updater) {
      setUpdater('manual');
    }
  }, [showUpdaterDropdown, updater]);

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleOptionClick = (dropdownName: string, value: string) => {
    if (dropdownName === 'platform') {
      setPlatform(value);
      // Reset updater when platform changes
      setUpdater('');
      setSignature('');
    } else if (dropdownName === 'arch') {
      setArch(value);
    } else if (dropdownName === 'updater') {
      setUpdater(value);
      setSignature('');
    }
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

  React.useEffect(() => {
    setFormData(currentData);
  }, [currentData]);

  // Update formData when apps data is refetched after unsign operation
  React.useEffect(() => {
    const updateFormDataFromQuery = async () => {
      // Get all apps queries from cache
      const queryCache = queryClient.getQueryCache();
      const appsQueries = queryCache.findAll({ queryKey: ['apps'] });
      
      // Find the version with matching ID in any of the queries
      for (const query of appsQueries) {
        const data = query.state.data;
        if (!data) continue;
        
        let version: any = null;
        if (Array.isArray(data)) {
          version = data.find((item: any) => item.ID === currentData.ID);
        } else if (data && typeof data === 'object' && 'items' in data) {
          version = (data as any).items.find((item: any) => item.ID === currentData.ID);
        }
        
        if (version && version.Artifacts) {
          // Only update if we have pending unsign operations to check
          if (pendingUnsignRef.current.size > 0) {
            // Check if server has confirmed the unsign for pending artifacts
            const updatedArtifacts = version.Artifacts.map((artifact: Artifact, i: number) => {
              // If this artifact is pending unsign, check if server confirms it
              if (pendingUnsignRef.current.has(i)) {
                // If server confirms TufSigned is false, remove from pending
                if (artifact.TufSigned === false) {
                  pendingUnsignRef.current.delete(i);
                  return artifact;
                }
                // If server still shows TufSigned as true, keep our local change
                // Don't update this artifact from server yet
                const currentArtifact = formData.Artifacts[i];
                if (currentArtifact && currentArtifact.TufSigned === false) {
                  return currentArtifact;
                }
              }
              return artifact;
            });
            
            // Only update if we have changes or if all pending operations are confirmed
            setFormData(prev => ({
              ...prev,
              Artifacts: updatedArtifacts
            }));
          } else {
            // No pending operations, update normally
            setFormData(prev => ({
              ...prev,
              Artifacts: version.Artifacts
            }));
          }
          break;
        }
      }
    };

    // Set up a listener for query updates
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.queryKey[0] === 'apps') {
        // Small delay to ensure data is fully updated
        setTimeout(updateFormDataFromQuery, 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, currentData.ID, formData.Artifacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      const requestData = {
        ...formData,
        Files: selectedFiles,
        Platform: selectedFiles.length > 0 ? platform : undefined,
        Arch: selectedFiles.length > 0 ? arch : undefined,
        updater: selectedFiles.length > 0 && updater && updater !== 'manual' ? updater : undefined,
        signature: selectedFiles.length > 0 && updater === 'tauri' && signature ? signature : undefined,
        app_name: appName,
        version: version,
        channel: channel,
      };

      await onSave(requestData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.data) {
        setError({
          error: axiosError.response.data.error || 'Failed to update',
          details: axiosError.response.data.details
        });
      } else {
        setError({
          error: 'Failed to update',
          details: axiosError.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    if (indexToRemove === 0) {
      setPlatform('');
      setArch('');
      setUpdater('');
      setSignature('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteArtifact = async (index: number, platform: string, arch: string) => {
    setArtifactToDelete({ index, platform, arch });
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteArtifact = async () => {
    if (artifactToDelete) {
      try {
        setDeleteError(null);
        await deleteArtifact(currentData.ID, appName, version, artifactToDelete.index);
        const updatedArtifacts = formData.Artifacts.filter((_, i) => i !== artifactToDelete.index);
        setFormData(prev => ({
          ...prev,
          Artifacts: updatedArtifacts
        }));
        setDeleteSuccess(true);
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        if (axiosError.response?.data) {
          setDeleteError({
            error: axiosError.response.data.error || 'Failed to delete artifact',
            details: axiosError.response.data.details
          });
        } else {
          setDeleteError({
            error: 'Failed to delete artifact',
            details: axiosError.message
          });
        }
      }
      setShowDeleteConfirmation(false);
      setArtifactToDelete(null);
    }
  };

  const hasValidArtifacts = React.useMemo(() => {
    return formData.Artifacts && 
           formData.Artifacts.length > 0 && 
           formData.Artifacts.some(artifact => 
             artifact.link
           );
  }, [formData.Artifacts]);

  const handleDownload = (artifact: Artifact) => {
    // First try to fetch the link with authentication
    axiosInstance.get(artifact.link)
      .then(response => {
        // Check if the response is JSON with a download_url
        if (response.data && typeof response.data === 'object' && 'download_url' in response.data) {
          // If it's a JSON with download_url, use that URL
          window.open(response.data.download_url, '_blank');
        } else {
          // Otherwise, it's a direct link to a file, use it directly
          window.open(artifact.link, '_blank');
        }
      })
      .catch(() => {
        // If there's an error (like 401), it might be a direct link to a public file
        // In that case, just open the link directly
        window.open(artifact.link, '_blank');
      });
  };

  const handleTufPublish = async () => {
    if (!appData?.ID) {
      toastError('App ID not found');
      return;
    }

    setIsPublishingTuf(true);

    try {
      const response = await axiosInstance.post('/tuf/v1/artifacts/publish', {
        app_id: appData.ID,
        version: version
      });
      
      // Extract task_id from response
      const responseData = response.data?.data;
      const taskId = responseData?.task_id;
      
      if (taskId) {
        // Save to localStorage history (similar to bootstrap)
        const savedHistory = localStorage.getItem('tuf-history');
        let history: Array<{
          id: string;
          timestamp: string;
          appName: string;
          operation: 'generate' | 'bootstrap' | 'publish' | 'unsign';
          status: 'success' | 'failed';
          taskId?: string;
          version?: string;
        }> = [];
        
        if (savedHistory) {
          try {
            history = JSON.parse(savedHistory);
          } catch (e) {
            console.error('Failed to load TUF history:', e);
          }
        }
        
        const newEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: responseData.last_update || new Date().toISOString(),
          appName: appName,
          operation: 'publish' as const,
          status: 'success' as const,
          taskId: taskId,
          version: version,
        };
        
        const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 entries
        localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
      }
      
      toastSuccess(`TUF artifacts publishing successfully started for version ${version}`);
      
      // Invalidate and refetch queries to get updated data from server
      // Add a delay to allow server to process the request and update artifacts
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['apps'] });
        await queryClient.invalidateQueries({ queryKey: ['appData', appName] });
        await queryClient.refetchQueries({ queryKey: ['apps'] });
        await queryClient.refetchQueries({ queryKey: ['appData', appName] });
      }, 2000);
      
      // Also refetch after a longer delay to catch status updates (when signing completes)
      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['apps'] });
      }, 5000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to publish TUF artifacts';
      toastError(errorMessage);
      
      // Save failed operation to history
      const savedHistory = localStorage.getItem('tuf-history');
      let history: Array<{
        id: string;
        timestamp: string;
        appName: string;
        operation: 'generate' | 'bootstrap' | 'publish' | 'unsign';
        status: 'success' | 'failed';
        taskId?: string;
        version?: string;
      }> = [];
      
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {
          console.error('Failed to load TUF history:', e);
        }
      }
      
      const newEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        appName: appName,
        operation: 'publish' as const,
        status: 'failed' as const,
        version: version,
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 entries
      localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
    } finally {
      setIsPublishingTuf(false);
    }
  };

  const handleUnsignArtifact = async (index: number) => {
    try {
      setIsUnsigning(true);
      setUnsignError(null);
      
      const requestData = {
        id: currentData.ID,
        app_name: appName,
        version: version,
        artifacts_to_delete: [index.toString()]
      };

      const response = await axiosInstance.post('/tuf/v1/artifacts/delete', JSON.stringify(requestData), {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      // Save to localStorage history (similar to publish)
      const savedHistory = localStorage.getItem('tuf-history');
      let history: Array<{
        id: string;
        timestamp: string;
        appName: string;
        operation: 'generate' | 'bootstrap' | 'publish' | 'unsign';
        status: 'success' | 'failed';
        taskId?: string;
        version?: string;
      }> = [];
      
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {
          console.error('Failed to load TUF history:', e);
        }
      }
      
      const responseData = response.data?.data;
      const taskId = responseData?.task_id;
      
      const newEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: responseData?.last_update || new Date().toISOString(),
        appName: appName,
        operation: 'unsign' as const,
        status: 'success' as const,
        taskId: taskId,
        version: version,
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 entries
      localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));

      // Update the artifact's TufSigned status to false locally immediately
      const updatedArtifacts = formData.Artifacts.map((artifact, i) => 
        i === index ? { ...artifact, TufSigned: false } : artifact
      );
      
      // Mark this artifact as pending unsign confirmation
      pendingUnsignRef.current.add(index);
      
      setFormData(prev => ({
        ...prev,
        Artifacts: updatedArtifacts
      }));

      // Invalidate and refetch queries to get updated data from server
      // Add a delay to allow server to process the request and update artifacts
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['apps'] });
        await queryClient.refetchQueries({ queryKey: ['apps'] });
      }, 2000);
      
      // Also refetch after a longer delay to catch status updates
      setTimeout(async () => {
        await queryClient.refetchQueries({ queryKey: ['apps'] });
        // Clear pending after final refetch
        setTimeout(() => {
          pendingUnsignRef.current.delete(index);
        }, 500);
      }, 5000);

      setUnsignSuccess(true);
      setTimeout(() => {
        setUnsignSuccess(false);
      }, 3000);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      
      // Save failed operation to history
      const savedHistory = localStorage.getItem('tuf-history');
      let history: Array<{
        id: string;
        timestamp: string;
        appName: string;
        operation: 'generate' | 'bootstrap' | 'publish' | 'unsign';
        status: 'success' | 'failed';
        taskId?: string;
        version?: string;
      }> = [];
      
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {
          console.error('Failed to load TUF history:', e);
        }
      }
      
      const newEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        appName: appName,
        operation: 'unsign' as const,
        status: 'failed' as const,
        version: version,
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 entries
      localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
      
      if (axiosError.response?.data) {
        setUnsignError({
          error: axiosError.response.data.error || 'Failed to unsign artifact',
          details: axiosError.response.data.details
        });
      } else {
        setUnsignError({
          error: 'Failed to unsign artifact',
          details: axiosError.message
        });
      }
    } finally {
      setIsUnsigning(false);
    }
  };

  return (
    <>
      <BaseModal
        title={`Edit Version ${version}`}
        onClose={onClose}
        isLoading={isLoading}
        isSuccess={isSuccess}
        successMessage="Changes saved successfully!"
        error={error}
        setError={setError}
        className="w-[800px] max-h-[90vh] overflow-y-auto relative"
      >
        <div className="mb-4">
          <p className="text-theme-primary">App Name: {appName}</p>
          <p className="text-theme-primary">Version: {version}</p>
          <p className="text-theme-primary">Channel: {channel}</p>
        </div>

        {hasValidArtifacts ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-theme-primary font-roboto">Existing Artifacts</h3>
              {appData?.Tuf && (
                <button
                  onClick={handleTufPublish}
                  disabled={isPublishingTuf}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    isPublishingTuf
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-80 active:scale-95 cursor-pointer'
                  } bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30`}
                  title={isPublishingTuf ? 'Publishing...' : 'Publish TUF artifacts'}
                  type="button"
                >
                  {isPublishingTuf ? (
                    <svg 
                      className="w-3 h-3 animate-spin" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  ) : (
                    <svg 
                      className="w-3 h-3" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  )}
                  {isPublishingTuf ? 'Publishing...' : 'Sign All'}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {formData.Artifacts.map((artifact, index) => (
                <div
                  key={index}
                  className="bg-theme-card p-4 rounded-lg text-theme-primary hover:bg-theme-card-hover transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{artifact.platform}</p>
                      <p className="text-sm text-gray-300">Architecture: {artifact.arch}</p>
                      <p className="text-sm text-gray-300">Package: {artifact.package}</p>
                      {artifact.TufTaskID && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                            artifact.TufSigned 
                              ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                              : 'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            <svg 
                              className="w-3 h-3" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                            TUF
                          </span>
                          {artifact.TufSigned && (
                            <button
                              onClick={() => handleUnsignArtifact(index)}
                              disabled={isUnsigning}
                              className="text-orange-500 hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              type="button"
                              title="Unsign artifact from TUF"
                            >
                              {isUnsigning ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-unlock"></i>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleDownload(artifact)} 
                        className="text-green-500 hover:text-green-400"
                        type="button"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteArtifact(index, artifact.platform, artifact.arch)}
                        className="text-theme-danger hover:text-red-400 ml-4"
                        type="button"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-yellow-500/20 p-4 rounded-lg">
            <p className="text-yellow-200 font-roboto">
              This version doesn't have artifacts yet, please upload them
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-theme-primary mb-2 font-roboto font-semibold">
              Add New Files
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="w-full px-4 py-2 bg-theme-button-primary text-theme-primary rounded-lg cursor-pointer hover:bg-theme-input transition-colors duration-200 flex items-center justify-center font-roboto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Choose Files
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-theme-input bg-opacity-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="text-theme-primary font-roboto">{file.name}</div>
                        <div className="text-purple-200 text-sm font-roboto">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-theme-primary hover:text-red-300 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {platforms.length > 0 && (
                  <div>
                    <label className="block text-theme-primary mb-2 font-roboto font-semibold">
                      Platform
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={() => handleDropdownClick('platform')}
                        className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                      >
                        <span className="block min-w-0 flex-1 truncate text-left">{platform || 'Select platform'}</span>
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
                        <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                          {platforms.map((p) => (
                            <button
                              key={p.ID}
                              type="button"
                              onClick={() => handleOptionClick('platform', p.PlatformName)}
                              className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {p.PlatformName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {architectures.length > 0 && (
                  <div>
                    <label className="block text-theme-primary mb-2 font-roboto font-semibold">
                      Architecture
                    </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={() => handleDropdownClick('arch')}
                        className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                      >
                        <span className="block min-w-0 flex-1 truncate text-left">{arch || 'Select architecture'}</span>
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
                        <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                          {architectures.map((a) => (
                            <button
                              key={a.ID}
                              type="button"
                              onClick={() => handleOptionClick('arch', a.ArchID)}
                              className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              {a.ArchID}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                                 {showUpdaterDropdown && (
                   <div>
                     <label className="block text-theme-primary mb-2 font-roboto font-semibold">
                       Updater
                       <span className="text-sm text-theme-secondary ml-2">
                         (This platform has multiple enabled updaters, select desired updater if necessary)
                       </span>
                     </label>
                    <div className="relative dropdown-container">
                      <button
                        type="button"
                        onClick={() => handleDropdownClick('updater')}
                        className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
                      >
                                                 <span className="block min-w-0 flex-1 truncate text-left">{updater || 'manual (default)'}</span>
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
                         <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                           {availableUpdaters.map((u) => (
                             <button
                               key={u.type}
                               type="button"
                               onClick={() => handleOptionClick('updater', u.type)}
                               className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg last:rounded-b-lg"
                             >
                               {u.type}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {updater === 'tauri' && (
              <div>
                <label className="block text-theme-primary mb-2 font-roboto font-semibold">
                  Signature
                </label>
                <input
                  type="text"
                  name="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
                  placeholder="Enter signature for Tauri updater"
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-theme-primary mb-2 font-roboto font-semibold">
              Changelog
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="text-theme-primary text-sm hover:text-gray-300"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {isPreview ? (
              <div className="bg-white dark:bg-white p-4 rounded prose prose-sm max-w-none">
                <ReactMarkdown>{formData.Changelog}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={formData.Changelog}
                onChange={(e) => setFormData({ ...formData, Changelog: e.target.value })}
                className="w-full px-4 py-2 rounded-lg font-roboto bg-theme-input text-theme-primary border border-theme transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 placeholder:text-theme-secondary shadow-sm"
                placeholder="Enter changelog in Markdown format..."
              />
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center text-theme-primary font-roboto">
              <input
                type="checkbox"
                checked={formData.Published}
                onChange={(e) => setFormData({ ...formData, Published: e.target.checked })}
                className="mr-2"
              />
              Published
            </label>
            <label className="flex items-center text-theme-primary font-roboto">
              <input
                type="checkbox"
                checked={formData.Critical}
                onChange={(e) => setFormData({ ...formData, Critical: e.target.checked })}
                className="mr-2"
              />
              Critical
            </label>
            <label className="flex items-center text-theme-primary font-roboto">
              <input
                type="checkbox"
                checked={formData.Intermediate}
                onChange={(e) => setFormData({ ...formData, Intermediate: e.target.checked })}
                className="mr-2"
              />
              Intermediate
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-300 transition-all duration-150 border border-gray-300 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-input transition-colors duration-200"
              disabled={Boolean(selectedFiles.length > 0 && 
                ((platforms.length > 0 && !platform) || 
                 (architectures.length > 0 && !arch) || 
                 (showUpdaterDropdown && updater === '')))}
            >
              Save
            </button>
          </div>
        </form>
      </BaseModal>

      {showDeleteConfirmation && artifactToDelete && (
        <DeleteArtifactConfirmationModal
          platform={artifactToDelete.platform}
          arch={artifactToDelete.arch}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setArtifactToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDeleteArtifact}
        />
      )}

      {deleteSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-[12000] animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-roboto">Artifact deleted successfully!</span>
        </div>
      )}

      {deleteError && (
        <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-[12000] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {deleteError.error}</span>
            {deleteError.details && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showDetails && deleteError.details && (
            <div className="mt-2 text-sm bg-red-600 p-2 rounded">
              {deleteError.details}
            </div>
          )}
        </div>
      )}

      {unsignSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-[12000] animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-roboto">Artifact unsigned successfully!</span>
        </div>
      )}

      {unsignError && (
        <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-[12000] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {unsignError.error}</span>
            {unsignError.details && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showDetails && unsignError.details && (
            <div className="mt-2 text-sm bg-red-600 p-2 rounded">
              {unsignError.details}
            </div>
          )}
        </div>
      )}
    </>
  );
}; 