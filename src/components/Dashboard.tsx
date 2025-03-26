import React from 'react';

interface DashboardProps {
  selectedApp: string | null;
  onAppClick: (appName: string) => void;
  onChangelogClick: (version: string) => void;
  onBackClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedApp,
  onAppClick,
  onChangelogClick,
  onBackClick,
}) => {
  const renderDashboard = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {["Application 1", "Application 2", "Application 3"].map((app) => (
        <div
          key={app}
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
          onClick={() => onAppClick(app)}
        >
          <i className="fas fa-cube text-4xl text-purple-800 mb-2"></i>
          <h3 className="text-lg font-semibold">{app}</h3>
        </div>
      ))}
    </div>
  );

  const renderAppVersions = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">{selectedApp} Versions</h2>
      <table className="w-full">
        <thead>
          <tr className="bg-purple-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Version</th>
            <th className="p-2 text-left">Channel</th>
            <th className="p-2 text-left">Platform</th>
            <th className="p-2 text-left">Architecture</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {["1.0.0", "1.1.0", "1.2.0"].map((version) => (
            <tr key={version} className="border-b">
              <td className="p-2">{selectedApp}</td>
              <td className="p-2">{version}</td>
              <td className="p-2">Stable</td>
              <td className="p-2">Win, Linux, OSX</td>
              <td className="p-2">amd64, arm64</td>
              <td className="p-2">
                <button
                  onClick={() => onChangelogClick(version)}
                  className="text-blue-500 mr-2"
                >
                  <i className="fas fa-eye"></i>
                </button>
                <button className="text-green-500 mr-2">
                  <i className="fas fa-edit"></i>
                </button>
                <button className="text-red-500">
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={onBackClick}
        className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg"
      >
        Back to Dashboard
      </button>
    </div>
  );

  return selectedApp ? renderAppVersions() : renderDashboard();
}; 