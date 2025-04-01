"use client";
import React from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Dashboard } from "../components/Dashboard";
import { UploadModal } from "../components/UploadModal";
import { ChangelogModal } from "../components/ChangelogModal";
import { CreateAppModal } from "../components/CreateAppModal";
import { ChangelogEntry } from "../hooks/use-query/useAppsQuery";
import { useParams, useNavigate } from "react-router-dom";

export const HomePage = () => {
  const { appName } = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showCreateAppModal, setShowCreateAppModal] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<string | null>(appName || null);
  const [showChangelogModal, setShowChangelogModal] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState<string | null>(null);
  const [selectedChangelog, setSelectedChangelog] = React.useState<ChangelogEntry[]>([]);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    setSelectedApp(appName || null);
  }, [appName]);

  const toggleUploadModal = () => {
    setShowUploadModal(!showUploadModal);
  };

  const toggleCreateAppModal = () => {
    setShowCreateAppModal(!showCreateAppModal);
  };

  const handleAppClick = (appName: string) => {
    setSelectedApp(appName);
    navigate(`/applications/${appName}`);
  };

  const handleBackClick = () => {
    setSelectedApp(null);
    navigate('/applications');
  };

  const handleChangelogClick = (version: string, changelog: ChangelogEntry[]) => {
    setSelectedVersion(version);
    setSelectedChangelog(changelog);
    setShowChangelogModal(true);
  };

  const closeChangelogModal = () => {
    setShowChangelogModal(false);
    setSelectedVersion(null);
    setSelectedChangelog([]);
  };

  const handleCreateAppSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Header
            title="Applications"
            onCreateClick={toggleUploadModal}
            createButtonText="Upload the app"
            additionalButton={
              <button
                onClick={toggleCreateAppModal}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-700 transition-colors duration-200 flex items-center mr-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create app
              </button>
            }
          />
          <Dashboard 
            selectedApp={selectedApp}
            onAppClick={handleAppClick}
            onChangelogClick={handleChangelogClick}
            onBackClick={handleBackClick}
            refreshKey={refreshKey}
          />
        </main>
      </div>
      {showUploadModal && (
        <UploadModal onClose={toggleUploadModal} />
      )}
      {showCreateAppModal && (
        <CreateAppModal 
          onClose={toggleCreateAppModal} 
          onSuccess={handleCreateAppSuccess}
        />
      )}
      {showChangelogModal && selectedVersion && selectedApp && (
        <ChangelogModal
          appName={selectedApp}
          version={selectedVersion}
          changelog={selectedChangelog}
          onClose={closeChangelogModal}
        />
      )}
    </div>
  );
};
