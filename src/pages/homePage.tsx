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
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="min-h-screen bg-theme-gradient font-sans">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-8">
          <Header
            title="Applications"
            onCreateClick={toggleUploadModal}
            createButtonText="Upload the app"
            additionalButton={
              <button
                onClick={toggleCreateAppModal}
                className="bg-theme-button-primary text-theme-primary p-2.5 md:px-4 md:py-2 rounded-lg font-sans hover:bg-theme-button-primary-hover transition-colors duration-200 flex items-center"
                aria-label="Create app"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline ml-2">Create app</span>
              </button>
            }
            onSearchChange={handleSearchChange}
            hideSearch={!!selectedApp}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <Dashboard 
            selectedApp={selectedApp}
            onAppClick={handleAppClick}
            onChangelogClick={handleChangelogClick}
            onBackClick={handleBackClick}
            refreshKey={refreshKey}
            searchTerm={searchTerm}
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
