"use client";
import React from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Dashboard } from "../components/Dashboard";
import { UploadModal } from "../components/UploadModal";
import { ChangelogModal } from "../components/ChangelogModal";

export const HomePage = () => {
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState<string | null>(null);
  const [showChangelogModal, setShowChangelogModal] = React.useState(false);
  const [selectedVersion, setSelectedVersion] = React.useState<string | null>(null);

  const toggleUploadModal = () => {
    setShowUploadModal(!showUploadModal);
  };

  const handleAppClick = (appName: string) => {
    setSelectedApp(appName);
  };

  const handleChangelogClick = (version: string) => {
    setSelectedVersion(version);
    setShowChangelogModal(true);
  };

  const closeChangelogModal = () => {
    setShowChangelogModal(false);
    setSelectedVersion(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-orange-500 font-roboto">
      <div className="flex">
        <Sidebar activePage="applications" />
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
            onBackClick={() => setSelectedApp(null)}
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
          onClose={closeChangelogModal}
        />
      )}
    </div>
  );
};
