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

  const { data: appLogo } = useQuery({
    queryKey: ['appLogo', selectedApp],
    queryFn: async () => {
      if (!selectedApp) return null;
      const response = await axiosInstance.get('/app/list');
      const app = response.data.apps.find((a: AppListItem) => a.AppName === selectedApp);
      return app?.Logo || null;
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
          {appLogo ? (
            <div className="relative w-12 h-12">
              <img 
                src={appLogo} 
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
                className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span>{filters.channel || 'All Channels'}</span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'channel' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'channel' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('channel', '')}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Channels
                  </button>
                  {channels.map(channel => (
                    <button
                      key={channel.ID}
                      onClick={() => handleOptionClick('channel', channel.ChannelName)}
                      className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
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
                className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span>{filters.platform || 'All Platforms'}</span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'platform' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'platform' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('platform', '')}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Platforms
                  </button>
                  {platforms.map(platform => (
                    <button
                      key={platform.ID}
                      onClick={() => handleOptionClick('platform', platform.PlatformName)}
                      className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
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
                className="w-full bg-theme-card text-theme-primary rounded-lg p-2 pr-8 flex items-center justify-between hover:bg-theme-card-hover transition-colors"
              >
                <span>{filters.arch || 'All Architectures'}</span>
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
                  className={`text-theme-primary transition-transform ${openDropdown === 'arch' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {openDropdown === 'arch' && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-theme-card backdrop-blur-lg rounded-lg shadow-lg z-10 border border-theme-card-hover">
                  <button
                    onClick={() => handleOptionClick('arch', '')}
                    className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors first:rounded-t-lg"
                  >
                    All Architectures
                  </button>
                  {architectures.map(arch => (
                    <button
                      key={arch.ID}
                      onClick={() => handleOptionClick('arch', arch.ArchID)}
                      className="w-full text-left px-4 py-2 text-theme-primary hover:bg-theme-card-hover transition-colors last:rounded-b-lg"
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
            appVersions.map((app) => (
              <div
                key={app.ID}
                className="bg-theme-card backdrop-blur-lg rounded-lg p-6 text-theme-primary hover:bg-theme-card-hover transition-colors relative"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="text-xl font-semibold truncate min-w-0" title={`Version ${app.Version}`}>
                    Version {app.Version}
                  </h3>
                  <ActionIcons
                    onDownload={() => handleDownload(app)}
                    onEdit={() => handleEdit(app)}
                    onDelete={() => handleDelete(app)}
                    showDownload={app.Artifacts.length === 1 ? !!app.Artifacts[0].link : true}
                    artifactLink={app.Artifacts.length === 1 ? app.Artifacts[0].link : undefined}
                  />
                </div>
                <p className="mb-4">Channel: {app.Channel}</p>
                <p className="mb-4 text-theme-primary/70 text-sm">
                  Last updated: {formatDate(app.Updated_at)}
                </p>
                <div className="flex gap-2">
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
                <div className="mt-4 p-3 rounded-lg h-20">
                  {app.Changelog && app.Changelog.length > 0 && app.Changelog[0].Changes ? (
                    <p className="text-sm text-theme-primary/80 line-clamp-3">
                      {app.Changelog[0].Changes}
                    </p>
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
            ))
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
            className="bg-theme-card backdrop-blur-lg rounded-lg p-6 text-theme-primary hover:bg-theme-card-hover transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 min-w-0">
                {app.Logo ? (
                  <div className="relative w-12 h-12 flex-shrink-0">
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
                    <div className="absolute inset-0 rounded-lg bg-theme-card animate-pulse" />
                    {app.Private && (
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
                <h3 
                  className="text-xl font-semibold truncate max-w-[200px] overflow-hidden" 
                  title={app.AppName}
                >
                  {app.AppName}
                </h3>
              </div>
              <div className="flex gap-2 flex-shrink-0">
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
            <div className="relative">
              <div className="flex items-center gap-2">
                <p className={`text-sm text-theme-primary/70 flex-1 ${!expandedApps[app.ID] && 'line-clamp-1'}`}>
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
            logo: selectedAppData.Logo
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