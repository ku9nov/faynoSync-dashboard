import React from 'react';
import { useAppsQuery, App, ChangelogEntry } from '../hooks/use-query/useAppsQuery';

interface DashboardProps {
  selectedApp: string | null;
  onAppClick: (appName: string) => void;
  onChangelogClick: (version: string, changelog: ChangelogEntry[]) => void;
  onBackClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedApp,
  onAppClick,
  onChangelogClick,
  onBackClick,
}) => {
  const { apps } = useAppsQuery();

  const uniqueApps = React.useMemo(() => {
    const appMap = new Map<string, App>();
    apps.forEach(app => {
      if (!appMap.has(app.AppName)) {
        appMap.set(app.AppName, app);
      }
    });
    return Array.from(appMap.values());
  }, [apps]);

  const selectedAppVersions = React.useMemo(() => {
    if (!selectedApp) return [];
    return apps.filter(app => app.AppName === selectedApp);
  }, [apps, selectedApp]);

  if (selectedApp) {
    return (
      <div className="mt-8">
        <button
          onClick={onBackClick}
          className="mb-4 text-white hover:text-gray-200"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">{selectedApp}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedAppVersions.map((app) => (
            <div
              key={app.ID}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors"
            >
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {uniqueApps.map((app) => (
        <div
          key={app.ID}
          onClick={() => onAppClick(app.AppName)}
          className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <h3 className="text-xl font-semibold mb-2">{app.AppName}</h3>
          <p className="mb-4">Latest version: {app.Version}</p>
          <p>Channel: {app.Channel}</p>
        </div>
      ))}
    </div>
  );
}; 