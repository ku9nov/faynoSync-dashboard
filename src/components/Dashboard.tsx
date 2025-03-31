import React from 'react';
import { useAppsQuery, AppVersion, AppListItem, ChangelogEntry, PaginatedResponse } from '../hooks/use-query/useAppsQuery';
import { ActionIcons } from './ActionIcons';
import { EditVersionModal } from './EditVersionModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { DownloadArtifactsModal } from './DownloadArtifactsModal';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../config/axios';
import { useQuery } from '@tanstack/react-query';

interface DashboardProps {
  selectedApp: string | null;
  onAppClick: (appName: string) => void;
  onChangelogClick: (version: string, changelog: ChangelogEntry[]) => void;
  onBackClick: () => void;
  refreshKey?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedApp,
  onAppClick,
  onChangelogClick,
  onBackClick,
  refreshKey = 0,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const { apps, updateApp, deleteApp } = useAppsQuery(selectedApp || undefined, currentPage, refreshKey);
  const [selectedVersion, setSelectedVersion] = React.useState<AppVersion | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [expandedApps, setExpandedApps] = React.useState<Record<string, boolean>>({});

  const appList = apps as AppListItem[];
  const paginatedVersions = apps as PaginatedResponse<AppVersion>;
  const appVersions = paginatedVersions?.items || [];

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
      window.open(app.Artifacts[0].link, '_blank');
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

  const handleEditSave = async (data: {
    Published: boolean;
    Critical: boolean;
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
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedVersion) {
      await deleteApp(selectedVersion.ID);
      setShowDeleteModal(false);
      setSelectedVersion(null);
    }
  };

  const totalPages = Math.ceil((paginatedVersions?.total || 0) / 9);

  if (selectedApp) {
    return (
      <div className="mt-8">
        <button
          onClick={onBackClick}
          className="mb-4 text-white hover:text-gray-200"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4 mb-6">
          {appLogo ? (
            <div className="relative w-12 h-12">
              <img 
                src={appLogo} 
                alt={`${selectedApp} logo`}
                className="w-full h-full rounded-lg object-contain bg-white/5 transition-opacity duration-300"
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
              <div className="absolute inset-0 rounded-lg bg-white/5 animate-pulse" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
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
                className="text-white/50"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
          )}
          <h2 className="text-2xl font-bold text-white">{selectedApp}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appVersions.map((app) => (
            <div
              key={app.ID}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors relative"
            >
              <ActionIcons
                onDownload={() => handleDownload(app)}
                onEdit={() => handleEdit(app)}
                onDelete={() => handleDelete(app)}
              />
              <h3 className="text-xl font-semibold mb-2">Version {app.Version}</h3>
              <p className="mb-4">Channel: {app.Channel}</p>
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
              </div>
              <button
                onClick={() => onChangelogClick(app.Version, app.Changelog)}
                className="mt-4 text-sm text-purple-300 hover:text-purple-200"
              >
                View changelog
              </button>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <i className="fas fa-angle-left"></i>
            </button>
            <span className="px-4 py-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <i className="fas fa-angle-right"></i>
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {!appList || appList.length === 0 ? (
        <div className="col-span-full text-center text-white text-xl">
          No applications has been created yet.
        </div>
      ) : (
        appList.map((app) => (
          <div
            key={app.ID}
            onClick={() => onAppClick(app.AppName)}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              {app.Logo ? (
                <div className="relative w-12 h-12">
                  <img 
                    src={app.Logo} 
                    alt={`${app.AppName} logo`}
                    className="w-full h-full rounded-lg object-contain bg-white/5 transition-opacity duration-300"
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
                  <div className="absolute inset-0 rounded-lg bg-white/5 animate-pulse" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
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
                    className="text-white/50"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <path d="M12 8v8"></path>
                    <path d="M8 12h8"></path>
                  </svg>
                </div>
              )}
              <h3 className="text-xl font-semibold">{app.AppName}</h3>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <p className={`text-sm text-white/70 flex-1 ${!expandedApps[app.ID] && 'line-clamp-1'}`}>
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
                    className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    title={expandedApps[app.ID] ? 'Collapse' : 'Expand'}
                  >
                    <i className={`fas ${expandedApps[app.ID] ? 'fa-chevron-up' : 'fa-chevron-down'} text-purple-300 text-xs`}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}; 