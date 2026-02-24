import React from 'react';
import { useAppsQuery, AppVersion, AppListItem, ChangelogEntry, PaginatedResponse } from '../hooks/use-query/useAppsQuery';
import { ActionIcons } from './ActionIcons';
import { EditVersionModal } from './EditVersionModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { DownloadArtifactsModal } from './DownloadArtifactsModal';
import { EditAppModal } from './EditAppModal';
import { DeleteAppConfirmationModal } from './DeleteAppConfirmationModal';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../config/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '../hooks/useSearch.ts';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { useChannelQuery } from '../hooks/use-query/useChannelQuery';
import { useToast } from '../hooks/useToast';
import ReactMarkdown from 'react-markdown';
import '../styles/cards.css';

interface DashboardProps {
  selectedApp: string | null;
  onAppClick: (appName: string) => void;
  onChangelogClick: (version: string, changelog: ChangelogEntry[]) => void;
  onBackClick: () => void;
  refreshKey?: number;
  searchTerm: string;
}

interface VersionFilters {
  channel: string;
  published: boolean | null;
  critical: boolean | null;
  platform: string;
  arch: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedApp,
  onAppClick,
  onChangelogClick,
  onBackClick,
  refreshKey = 0,
  searchTerm
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<VersionFilters>({
    channel: '',
    published: null,
    critical: null,
    platform: '',
    arch: ''
  });

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const handleDropdownClick = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const handleOptionClick = (dropdownName: string, value: any) => {
    setFilters(prev => ({ ...prev, [dropdownName]: value }));
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
    if (!selectedApp || typeof window === 'undefined') {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [selectedApp]);

  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { channels } = useChannelQuery();

  const { apps, updateApp, deleteApp, isLoading } = useAppsQuery(
    selectedApp || undefined, 
    currentPage, 
    refreshKey,
    filters
  );
  const [selectedVersion, setSelectedVersion] = React.useState<AppVersion | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [expandedApps, setExpandedApps] = React.useState<Record<string, boolean>>({});
  const [showEditAppModal, setShowEditAppModal] = React.useState(false);
  const [showDeleteAppModal, setShowDeleteAppModal] = React.useState(false);
  const [selectedAppData, setSelectedAppData] = React.useState<AppListItem | null>(null);
  const [publishingTuf, setPublishingTuf] = React.useState<Record<string, boolean>>({});
  const [openArtifactsPopoverId, setOpenArtifactsPopoverId] = React.useState<string | null>(null);
  const [hoveredArtifactsPopoverId, setHoveredArtifactsPopoverId] = React.useState<string | null>(null);
  const [suppressHoverArtifactsPopoverId, setSuppressHoverArtifactsPopoverId] = React.useState<string | null>(null);
  const { toastSuccess, toastError } = useToast();

  const appList = React.useMemo(() => {
    if (!apps) return [];
    if (Array.isArray(apps)) {
      return apps as AppListItem[];
    }
    if ('items' in apps) {
      return (apps as PaginatedResponse<AppVersion>).items;
    }
    return [];
  }, [apps]);

  const paginatedVersions = React.useMemo(() => {
    if (!apps) return { items: [], total: 0, page: 1, limit: 9 };
    if ('items' in apps) {
      return apps as PaginatedResponse<AppVersion>;
    }
    return { items: [], total: 0, page: 1, limit: 9 };
  }, [apps]);

  const appVersions = paginatedVersions.items || [];

  const filteredAppList = useSearch(appList, searchTerm) as AppListItem[];

  const { data: appData } = useQuery({
    queryKey: ['appData', selectedApp],
    queryFn: async () => {
      if (!selectedApp) return null;
      const response = await axiosInstance.get('/app/list');
      const app = response.data.apps.find((a: AppListItem) => a.AppName === selectedApp);
      return app || null;
    },
    enabled: !!selectedApp,
  });

  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  const handleDownload = (app: AppVersion) => {
    if (app.Artifacts.length === 1) {
      // First try to fetch the link with authentication
      axiosInstance.get(app.Artifacts[0].link)
        .then(response => {
          // Check if the response is JSON with a download_url
          if (response.data && typeof response.data === 'object' && 'download_url' in response.data) {
            // If it's a JSON with download_url, use that URL
            window.open(response.data.download_url, '_blank');
          } else {
            // Otherwise, it's a direct link to a file, use it directly
            window.open(app.Artifacts[0].link, '_blank');
          }
        })
        .catch(() => {
          // If there's an error (like 401), it might be a direct link to a public file
          // In that case, just open the link directly
          window.open(app.Artifacts[0].link, '_blank');
        });
    } else {
      setSelectedVersion(app);
      setShowDownloadModal(true);
    }
  };

  const handleEdit = (app: AppVersion) => {
    setSelectedVersion(app);
    setShowEditModal(true);
  };

  const handleDelete = (app: AppVersion) => {
    setSelectedVersion(app);
    setShowDeleteModal(true);
  };

  const handleEditApp = (e: React.MouseEvent, app: AppListItem) => {
    e.stopPropagation();
    setSelectedAppData(app);
    setShowEditAppModal(true);
  };

  const handleDeleteApp = (e: React.MouseEvent, app: AppListItem) => {
    e.stopPropagation();
    setSelectedAppData(app);
    setShowDeleteAppModal(true);
  };

  const handleEditSave = async (data: {
    Published: boolean;
    Critical: boolean;
    Intermediate: boolean;
    Changelog: string;
    Platform?: string;
    Arch?: string;
    Files?: File[];
    app_name: string;
    version: string;
    channel: string;
  }) => {
    if (selectedVersion) {
      await updateApp(selectedVersion.ID, data);
      setShowEditModal(false);
      setSelectedVersion(null);
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      // Force a refetch to ensure we have the latest data
      await queryClient.refetchQueries({ queryKey: ['apps'] });
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedVersion) {
      await deleteApp(selectedVersion.ID);
      setShowDeleteModal(false);
      setSelectedVersion(null);
      queryClient.invalidateQueries({ queryKey: ['apps'] });
    }
  };

  const handleEditAppSave = async () => {
    setShowEditAppModal(false);
    setSelectedAppData(null);
    queryClient.invalidateQueries({ queryKey: ['apps'] });
  };

  const handleDeleteAppConfirm = async () => {
    if (selectedAppData) {
      try {
        await axiosInstance.delete(`/app/delete?id=${selectedAppData.ID}`);
        setShowDeleteAppModal(false);
        setSelectedAppData(null);
        queryClient.invalidateQueries({ queryKey: ['apps'] });
      } catch (error) {
        console.error('Error deleting app:', error);
        throw error;
      }
    }
  };

  const totalPages = Math.ceil((paginatedVersions?.total || 0) / 9);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const handleTufPublish = async (e: React.MouseEvent, version: AppVersion) => {
    e.stopPropagation();
    
    if (!appData?.ID) {
      toastError('App ID not found');
      return;
    }

    const versionId = version.ID;
    setPublishingTuf(prev => ({ ...prev, [versionId]: true }));

    try {
      const response = await axiosInstance.post('/tuf/v1/artifacts/publish', {
        app_id: appData.ID,
        version: version.Version
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
          appName: selectedApp || appData.AppName,
          operation: 'publish' as const,
          status: 'success' as const,
          taskId: taskId,
        };
        
        const updatedHistory = [newEntry, ...history].slice(0, 20); // Keep last 20 entries
        localStorage.setItem('tuf-history', JSON.stringify(updatedHistory));
      }
      
      toastSuccess(`TUF artifacts publishing successfully started for version ${version.Version}`);
      
      // Invalidate and refetch queries with correct parameters
      // Add a delay to allow server to process the request and update artifacts
      setTimeout(async () => {
        // Invalidate all apps queries
        queryClient.invalidateQueries({ queryKey: ['apps'] });
        queryClient.invalidateQueries({ queryKey: ['appData', selectedApp] });
        
        // Refetch with exact query key to ensure we get updated data
        await queryClient.refetchQueries({ 
          queryKey: ['apps', selectedApp, currentPage, refreshKey, filters] 
        });
        await queryClient.refetchQueries({ queryKey: ['appData', selectedApp] });
      }, 2000);
      
      // Also refetch after a longer delay to catch status updates (when signing completes)
      setTimeout(async () => {
        await queryClient.refetchQueries({ 
          queryKey: ['apps', selectedApp, currentPage, refreshKey, filters] 
        });
      }, 5000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to publish TUF artifacts';
      toastError(errorMessage);
    } finally {
      setPublishingTuf(prev => ({ ...prev, [versionId]: false }));
    }
  };

  const getTufSignStatus = (version: AppVersion): 'all-signed' | 'partial' | 'none' | null => {
    if (!appData?.Tuf) {
      return null;
    }
    
    // Consider artifacts that have TufTaskID (not null/undefined) OR have TufTaskID === null and TufSigned === false
    const tufArtifacts = version.Artifacts.filter(artifact => {
      // Include artifacts with TufTaskID (not null/undefined)
      if (artifact.TufTaskID) {
        return true;
      }
      // Also include artifacts with TufTaskID === null and TufSigned === false (not signed)
      if (artifact.TufTaskID === null && artifact.TufSigned === false) {
        return true;
      }
      return false;
    });
    
    // If TUF is enabled but no artifacts match the criteria, check if there are any artifacts at all
    if (tufArtifacts.length === 0) {
      if (version.Artifacts.length > 0) {
        return 'none';
      } else {
        return null;
      }
    }
    
    // Count signed artifacts (TufSigned === true)
    const signedCount = tufArtifacts.filter(artifact => artifact.TufSigned === true).length;
    
    if (signedCount === tufArtifacts.length) {
      return 'all-signed';
    }
    if (signedCount > 0) {
      return 'partial';
    }
    return 'none';
  };

  const getArtifactSummary = (artifacts: AppVersion['Artifacts']) => {
    const groupedByPlatform = artifacts.reduce<Record<string, { count: number; label: string }>>((acc, artifact) => {
      const rawPlatform = artifact.platform?.trim() || 'N/A';
      const key = rawPlatform.toLowerCase();
      if (!acc[key]) {
        acc[key] = { count: 0, label: rawPlatform };
      }
      acc[key].count += 1;
      return acc;
    }, {});

    const sortedGroups = Object.entries(groupedByPlatform)
      .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label))
      .map(([, value]) => ({
        count: value.count,
        label: value.label,
      }));

    const visibleGroups = sortedGroups.slice(0, 3);
    const hiddenGroupsCount = Math.max(sortedGroups.length - visibleGroups.length, 0);

    return {
      visibleSummary: visibleGroups.map(item => `${item.label}(${item.count})`).join(' '),
      hiddenGroupsCount,
      details: artifacts.map(artifact => {
        const platform = artifact.platform?.trim() || 'N/A';
        const arch = artifact.arch?.trim() || 'N/A';
        const pkg = artifact.package?.trim() || 'N/A';
        return `${platform}/${arch} - ${pkg}`;
      }),
    };
  };

  if (selectedApp) {
    return (
      <div className="mt-8">
        <button
          onClick={onBackClick}
          className="mb-4 px-4 py-2 bg-theme-card text-theme-primary rounded-lg hover:bg-theme-card-hover transition-colors flex items-center gap-2"
        >
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
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="flex items-center gap-4 mb-6">
          {appData?.Logo ? (
            <div className="relative w-12 h-12">
              <img 
                src={appData.Logo} 
                alt={`${selectedApp} logo`}
                className="w-full h-full rounded-lg object-contain bg-theme-card-hover transition-opacity duration-300"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '0';
                  setTimeout(() => {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0E2RkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxwYXRoIGQ9Ik0xMiA4djgiPjwvcGF0aD48cGF0aCBkPSJNOCAxMmg4Ij48L3BhdGg+PC9zdmc+';
                    target.style.opacity = '1';
                  }, 300);
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '1';
                }}
              />
              <div className="absolute inset-0 rounded-lg bg-theme-card animate-pulse" />
              {appData?.Private && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                        <svg 
                          className="w-3 h-3 text-theme-primary" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    )}
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-theme-card flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-theme-primary-hover"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
          )}
          <h2 
            className="text-2xl font-bold text-theme-primary" 
            title={selectedApp}
          >
            {selectedApp}
          </h2>
        </div>

        {/* Filters Section */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick('channel')}
                className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span className="block min-w-0 flex-1 truncate text-left">{filters.channel || 'All Channels'}</span>
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('channel', '')}
                    className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Channels
                  </button>
                  {channels.map(channel => (
                    <button
                      key={channel.ID}
                      onClick={() => handleOptionClick('channel', channel.ChannelName)}
                      className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
                    >
                      {channel.ChannelName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick('platform')}
                className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span className="block min-w-0 flex-1 truncate text-left">{filters.platform || 'All Platforms'}</span>
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
                  <button
                    onClick={() => handleOptionClick('platform', '')}
                    className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Platforms
                  </button>
                  {platforms.map(platform => (
                    <button
                      key={platform.ID}
                      onClick={() => handleOptionClick('platform', platform.PlatformName)}
                      className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
                    >
                      {platform.PlatformName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick('arch')}
                className="w-full min-w-0 bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span className="block min-w-0 flex-1 truncate text-left">{filters.arch || 'All Architectures'}</span>
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
                  <button
                    onClick={() => handleOptionClick('arch', '')}
                    className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Architectures
                  </button>
                  {architectures.map(arch => (
                    <button
                      key={arch.ID}
                      onClick={() => handleOptionClick('arch', arch.ArchID)}
                      className="w-full text-left truncate px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
                    >
                      {arch.ArchID}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick('published')}
                className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span>
                  {filters.published === null ? 'Publication Status' :
                   filters.published ? 'Published' : 'Not Published'}
                </span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'published' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'published' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('published', null)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    Publication Status
                  </button>
                  <button
                    onClick={() => handleOptionClick('published', true)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors"
                  >
                    Published
                  </button>
                  <button
                    onClick={() => handleOptionClick('published', false)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
                  >
                    Not Published
                  </button>
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownClick('critical')}
                className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span>
                  {filters.critical === null ? 'Critical Status' :
                   filters.critical ? 'Critical' : 'Not Critical'}
                </span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'critical' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'critical' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('critical', null)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    Critical Status
                  </button>
                  <button
                    onClick={() => handleOptionClick('critical', true)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors"
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => handleOptionClick('critical', false)}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
                  >
                    Not Critical
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reset Filters Button */}
          {(filters.channel || filters.platform || filters.arch || filters.published !== null || filters.critical !== null) && (
            <button
              onClick={() => setFilters({
                channel: '',
                published: null,
                critical: null,
                platform: '',
                arch: ''
              })}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-card-hover text-theme-primary rounded-lg transition-colors"
            >
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
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
            </div>
          ) : appVersions.length === 0 ? (
            <div className="col-span-full text-center text-theme-primary text-xl">
              No versions have been uploaded yet.
            </div>
          ) : (
            appVersions.map((app) => {
              const tufStatus = getTufSignStatus(app);
              const isDangerZone = app.Published && tufStatus !== null && tufStatus !== 'all-signed';
              const artifactSummary = getArtifactSummary(app.Artifacts);
              
              return (
              <div
                key={app.ID}
                className={`sharedCard backdrop-blur-lg rounded-lg p-6 text-theme-primary transition-all relative ${
                  isDangerZone 
                    ? 'border-2 border-red-500' 
                    : 'bg-theme-card hover:bg-theme-card-hover'
                }`}
                style={{ 
                  ['--card-color' as any]: isDangerZone ? '#EF4444' : '#8B5CF6',
                  ...(isDangerZone ? {
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.3)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  } : {})
                }}
                onMouseEnter={(e) => {
                  if (isDangerZone) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.35)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDangerZone) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                  }
                }}
              >
                <div className="flex items-center justify-end mb-4 min-w-0 w-full">
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    {tufStatus && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleTufPublish(e, app)}
                          disabled={publishingTuf[app.ID]}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            publishingTuf[app.ID]
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:opacity-80 active:scale-95'
                          } ${
                            tufStatus === 'all-signed'
                              ? 'bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30'
                              : tufStatus === 'partial'
                              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30 hover:bg-yellow-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30'
                          }`}
                          title={publishingTuf[app.ID] ? 'Publishing...' : 'Publish TUF artifacts'}
                        >
                          {publishingTuf[app.ID] ? (
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
                          TUF
                        </button>
                      </div>
                    )}
                    <ActionIcons
                      onDownload={() => handleDownload(app)}
                      onEdit={() => handleEdit(app)}
                      onDelete={() => handleDelete(app)}
                      showDownload={app.Artifacts.length === 1 ? !!app.Artifacts[0].link : true}
                      artifactLink={app.Artifacts.length === 1 ? app.Artifacts[0].link : undefined}
                    />
                  </div>
                </div>
                <div className="sharedCardContent relative w-full min-w-0">
                  <h3 
                    className="sharedCardTitle text-2xl font-bold mb-3 text-white" 
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      letterSpacing: '0.025em'
                    }}
                    title={`Version ${app.Version}`}
                  >
                    Version {app.Version}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-theme-primary/70 flex-1 sharedCardDescription">
                      Channel: {app.Channel}
                    </p>
                  </div>
                  <p className="mb-2 text-theme-primary/70 text-sm">
                    Last updated: {formatDate(app.Updated_at)}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      app.Published ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {app.Published ? 'Published' : 'Not published'}
                    </span>
                    {app.Critical && (
                      <span className="px-2 py-1 rounded text-sm bg-red-500">
                        Critical
                      </span>
                    )}
                    {app.Intermediate && (
                      <span className="px-2 py-1 rounded text-sm bg-yellow-500">
                        Intermediate
                      </span>
                    )}
                  </div>
                  {app.Artifacts.length > 0 && (
                    <div
                      className="relative group mb-2 w-full min-w-0"
                      onMouseEnter={() => {
                        setHoveredArtifactsPopoverId(app.ID);
                      }}
                      onMouseLeave={() => {
                        setHoveredArtifactsPopoverId(prev => (prev === app.ID ? null : prev));
                        setSuppressHoverArtifactsPopoverId(prev => (prev === app.ID ? null : prev));
                      }}
                    >
                      <button
                        type="button"
                        className="block w-full min-w-0 max-w-full truncate px-2 py-1 rounded text-xs bg-theme-card/70 border border-theme-card-hover text-theme-primary/90 hover:text-theme-primary transition-colors text-left"
                        title={`Artifacts: ${artifactSummary.visibleSummary}${artifactSummary.hiddenGroupsCount > 0 ? ` +${artifactSummary.hiddenGroupsCount}` : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenArtifactsPopoverId(prev => {
                            const isClosing = prev === app.ID;
                            if (isClosing) {
                              setSuppressHoverArtifactsPopoverId(app.ID);
                              return null;
                            }
                            setSuppressHoverArtifactsPopoverId(null);
                            return app.ID;
                          });
                        }}
                      >
                        Artifacts: {artifactSummary.visibleSummary}
                        {artifactSummary.hiddenGroupsCount > 0 ? ` +${artifactSummary.hiddenGroupsCount}` : ''}
                      </button>
                      <div
                        className={`absolute left-0 right-0 bottom-full z-20 mb-2 rounded-lg border border-theme-card-hover bg-gray-900 p-3 shadow-xl transition-opacity duration-150 max-h-44 overflow-hidden flex flex-col ${
                          openArtifactsPopoverId === app.ID ||
                          (hoveredArtifactsPopoverId === app.ID && suppressHoverArtifactsPopoverId !== app.ID)
                            ? 'opacity-100 pointer-events-auto'
                            : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenArtifactsPopoverId(null);
                          setSuppressHoverArtifactsPopoverId(app.ID);
                        }}
                      >
                        <p className="mb-2 text-xs font-semibold text-theme-primary">
                          Artifact details
                        </p>
                        <div className="overflow-y-auto pr-1 flex-1 min-h-0">
                          {artifactSummary.details.map((detail, index) => (
                            <p key={`${app.ID}-artifact-${index}`} className="text-xs text-theme-primary/80 break-all mb-1 last:mb-0">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 p-3 rounded-lg h-20">
                    {app.Changelog && app.Changelog.length > 0 && app.Changelog[0].Changes ? (
                      <div className="text-sm text-theme-primary/80 line-clamp-3 prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="m-0">{children}</p>,
                            ul: ({ children }) => <ul className="m-0 pl-4">{children}</ul>,
                            ol: ({ children }) => <ol className="m-0 pl-4">{children}</ol>,
                            li: ({ children }) => <li className="m-0">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-theme-input px-1 rounded text-xs">{children}</code>,
                            h1: ({ children }) => <h1 className="text-base font-bold m-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold m-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold m-0">{children}</h3>,
                          }}
                        >
                          {app.Changelog[0].Changes}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-theme-primary/60 italic">
                        Changelog not provided
                      </p>
                    )}
                  </div>
                  {app.Changelog && app.Changelog.length > 0 && app.Changelog[0].Changes && (
                    <button
                      onClick={() => onChangelogClick(app.Version, app.Changelog)}
                      className="mt-4 px-4 py-2 bg-theme-card text-theme-primary rounded-lg hover:bg-theme-card-hover transition-colors flex items-center gap-2"
                    >
                      View full changelog
                    </button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <i className="fas fa-angle-left"></i>
            </button>
            <span className="px-4 py-2 text-theme-primary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-theme-card text-theme-primary hover:bg-theme-card-hover disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        )}

        {showEditModal && selectedVersion && (
          <EditVersionModal
            appName={selectedApp}
            version={selectedVersion.Version}
            channel={selectedVersion.Channel}
            currentData={{
              ID: selectedVersion.ID,
              Published: selectedVersion.Published,
              Critical: selectedVersion.Critical,
              Intermediate: selectedVersion.Intermediate,
              Changelog: selectedVersion.Changelog[0]?.Changes || '',
              Artifacts: selectedVersion.Artifacts
            }}
            onClose={() => {
              setShowEditModal(false);
              setSelectedVersion(null);
            }}
            onSave={handleEditSave}
          />
        )}

        {showDeleteModal && selectedVersion && (
          <DeleteConfirmationModal
            version={`${selectedVersion.Version}`}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedVersion(null);
            }}
            onConfirm={handleDeleteConfirm}
          />
        )}

        {showDownloadModal && selectedVersion && (
          <DownloadArtifactsModal
            artifacts={selectedVersion.Artifacts}
            onClose={() => {
              setShowDownloadModal(false);
              setSelectedVersion(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {isLoading ? (
        <div className="col-span-full flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
        </div>
      ) : !filteredAppList || filteredAppList.length === 0 ? (
        <div className="col-span-full text-center text-theme-primary text-xl">
          {searchTerm ? 'No applications found matching your search.' : 'No applications have been created yet.'}
        </div>
      ) : (
        filteredAppList.map((app) => (
          <div
            key={app.ID}
            onClick={() => onAppClick(app.AppName)}
            className={"bg-theme-card backdrop-blur-lg rounded-lg p-6 text-theme-primary hover:bg-theme-card-hover transition-colors cursor-pointer sharedCard"}
            style={{ ['--card-color' as any]: '#8B5CF6' }}
          >
            <div className="flex items-center mb-4 min-w-0 w-full">
              <div className="relative w-12 h-12 flex-shrink-0">
                <div className="sharedCardIcon w-12 h-12">
                  {app.Logo ? (
                    <img 
                      src={app.Logo} 
                      alt={`${app.AppName} logo`}
                      className="w-full h-full rounded-lg object-contain bg-theme-card-hover transition-opacity duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.opacity = '0';
                        setTimeout(() => {
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0E2RkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxwYXRoIGQ9Ik0xMiA4djgiPjwvcGF0aD48cGF0aCBkPSJNOCAxMmg4Ij48L3BhdGg+PC9zdmc+';
                          target.style.opacity = '1';
                        }, 300);
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.opacity = '1';
                      }}
                    />
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-theme-primary-hover w-full h-full"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <path d="M12 8v8"></path>
                      <path d="M8 12h8"></path>
                    </svg>
                  )}
                </div>
                {app.Private && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 z-10">
                    <svg 
                      className="w-3 h-3 text-theme-primary" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="2" 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h3 
                  className="text-xl font-semibold truncate max-w-[200px] overflow-hidden sharedCardTitle" 
                  title={app.AppName}
                >
                  {app.AppName}
                </h3>
                {app.Tuf && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
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
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-auto">
                <button
                  onClick={(e) => handleEditApp(e, app)}
                  className="p-2 text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
                  title="Edit app"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={(e) => handleDeleteApp(e, app)}
                  className="p-2 text-theme-danger hover:text-theme-primary-hover transition-colors duration-200"
                  title="Delete app"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div className="relative sharedCardContent">
              <div className="flex items-center gap-2">
                <p className={`text-sm text-theme-primary/70 flex-1 ${!expandedApps[app.ID] && 'line-clamp-1'} sharedCardDescription`}>
                  {app.Description || 'No description available'}
                </p>
                {app.Description && app.Description.length > 50 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedApps(prev => ({
                        ...prev,
                        [app.ID]: !prev[app.ID]
                      }));
                    }}
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-theme-card hover:bg-theme-card-hover transition-colors"
                    title={expandedApps[app.ID] ? 'Collapse' : 'Expand'}
                  >
                    <i className={`fas ${expandedApps[app.ID] ? 'fa-chevron-up' : 'fa-chevron-down'} text-theme-primary text-xs`}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {showEditAppModal && selectedAppData && (
        <EditAppModal
          onClose={() => {
            setShowEditAppModal(false);
            setSelectedAppData(null);
          }}
          onSuccess={handleEditAppSave}
          appData={{
            id: selectedAppData.ID,
            app: selectedAppData.AppName,
            description: selectedAppData.Description,
            logo: selectedAppData.Logo,
            tuf: selectedAppData.Tuf
          }}
        />
      )}

      {showDeleteAppModal && selectedAppData && (
        <DeleteAppConfirmationModal
          appName={selectedAppData.AppName}
          onClose={() => {
            setShowDeleteAppModal(false);
            setSelectedAppData(null);
          }}
          onConfirm={handleDeleteAppConfirm}
        />
      )}
    </div>
  );
}; 