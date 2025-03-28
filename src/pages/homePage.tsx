"use client";
import React from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Dashboard } from "../components/Dashboard";
import { UploadModal } from "../components/UploadModal";
import { ChangelogModal } from "../components/ChangelogModal";
import { ChangelogEntry } from "../hooks/use-query/useAppsQuery";
import { useParams, useNavigate } from "react-router-dom";

export const HomePage = () => {
  const { appName } = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<string | null>(appName || null);
  const [showChangelogModal, setShowChangelogModal] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState<string | null>(null);
  const [selectedChangelog, setSelectedChangelog] = React.useState<ChangelogEntry[]>([]);

  React.useEffect(() => {
    setSelectedApp(appName || null);
  }, [appName]);

  const toggleUploadModal = () => {
    setShowUploadModal(!showUploadModal);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Header
            title="Applications"
            onCreateClick={toggleUploadModal}
            createButtonText="Upload the app"
          />
          <Dashboard 
            selectedApp={selectedApp}
            onAppClick={handleAppClick}
            onChangelogClick={handleChangelogClick}
            onBackClick={handleBackClick}
          />
        </main>
      </div>
      {showUploadModal && (
        <UploadModal onClose={toggleUploadModal} />
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
