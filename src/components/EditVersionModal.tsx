import React from 'react';
import ReactMarkdown from 'react-markdown';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';
import { Artifact, useAppsQuery } from '../hooks/use-query/useAppsQuery';
import { DeleteArtifactConfirmationModal } from './DeleteArtifactConfirmationModal';

interface EditVersionModalProps {
  appName: string;
  version: string;
  channel: string;
  currentData: {
    ID: string;
    Published: boolean;
    Critical: boolean;
    Changelog: string;
    Artifacts: Artifact[];
  };
  onClose: () => void;
  onSave: (data: {
    Published: boolean;
    Critical: boolean;
    Changelog: string;
    Platform?: string;
    Arch?: string;
    Files: File[];
    app_name: string;
    version: string;
    channel: string;
  }) => void;
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState(false);
  const [artifactToDelete, setArtifactToDelete] = React.useState<{ index: number; platform: string; arch: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();
  const { deleteArtifact } = useAppsQuery();

  React.useEffect(() => {
  }, [currentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const requestData = {
        ...formData,
        Files: selectedFiles,
        Platform: selectedFiles.length > 0 ? platform : undefined,
        Arch: selectedFiles.length > 0 ? arch : undefined,
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
      setError('Failed to save changes. Please try again.');
      console.error('Error saving changes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        await deleteArtifact(currentData.ID, appName, version, artifactToDelete.index);
        setFormData(prev => ({
          ...prev,
          Artifacts: prev.Artifacts.filter((_, i) => i !== artifactToDelete.index)
        }));
      } catch (error) {
        console.error('Error deleting artifact:', error);
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

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto relative">
          {isLoading && (
            <div className="fixed top-4 right-4 bg-purple-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="font-roboto">Saving changes...</span>
            </div>
          )}
          {isSuccess && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-fade-in">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-roboto">Changes saved successfully!</span>
            </div>
          )}
          {error && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
              <span className="font-roboto">{error}</span>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-4 text-white font-roboto">
            Edit Version {version}
          </h2>
          <div className="mb-4">
            <p className="text-white">App Name: {appName}</p>
            <p className="text-white">Version: {version}</p>
            <p className="text-white">Channel: {channel}</p>
          </div>

          {hasValidArtifacts ? (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3 text-white font-roboto">Existing Artifacts</h3>
              <div className="space-y-4">
                {formData.Artifacts.map((artifact, index) => (
                  <div
                    key={index}
                    className="bg-white/10 p-4 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{artifact.platform}</p>
                        <p className="text-sm text-gray-300">Architecture: {artifact.arch}</p>
                        <p className="text-sm text-gray-300">Package: {artifact.package}</p>
                      </div>
                      <div className="flex items-center">
                        <a href={artifact.link} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400">
                          <i className="fas fa-download"></i>
                        </a>
                        <button
                          onClick={() => handleDeleteArtifact(index, artifact.platform, artifact.arch)}
                          className="text-red-500 hover:text-red-400 ml-4"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-roboto">
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
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center font-roboto"
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
                      className="flex items-center justify-between bg-purple-700 bg-opacity-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="text-white font-roboto">{file.name}</div>
                          <div className="text-purple-200 text-sm font-roboto">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-white hover:text-red-300 transition-colors duration-200"
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
                      <label className="block text-white mb-2 font-roboto">
                        Platform
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full p-2 rounded-lg font-roboto"
                        required
                      >
                        <option value="">Select platform</option>
                        {platforms.map((p) => (
                          <option key={p.ID} value={p.PlatformName}>
                            {p.PlatformName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {architectures.length > 0 && (
                    <div>
                      <label className="block text-white mb-2 font-roboto">
                        Architecture
                      </label>
                      <select
                        value={arch}
                        onChange={(e) => setArch(e.target.value)}
                        className="w-full p-2 rounded-lg font-roboto"
                        required
                      >
                        <option value="">Select architecture</option>
                        {architectures.map((a) => (
                          <option key={a.ID} value={a.ArchID}>
                            {a.ArchID}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-white mb-2 font-roboto">
                Changelog
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className="text-white text-sm hover:text-gray-300"
                >
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {isPreview ? (
                <div className="bg-white p-4 rounded prose prose-sm max-w-none">
                  <ReactMarkdown>{formData.Changelog}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={formData.Changelog}
                  onChange={(e) => setFormData({ ...formData, Changelog: e.target.value })}
                  className="w-full px-3 py-2 rounded font-roboto"
                  placeholder="Enter changelog in Markdown format..."
                />
              )}
            </div>

            <div className="flex gap-4">
              <label className="flex items-center text-white font-roboto">
                <input
                  type="checkbox"
                  checked={formData.Published}
                  onChange={(e) => setFormData({ ...formData, Published: e.target.checked })}
                  className="mr-2"
                />
                Published
              </label>
              <label className="flex items-center text-white font-roboto">
                <input
                  type="checkbox"
                  checked={formData.Critical}
                  onChange={(e) => setFormData({ ...formData, Critical: e.target.checked })}
                  className="mr-2"
                />
                Critical
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-roboto hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-roboto hover:bg-purple-700 transition-colors duration-200"
                disabled={selectedFiles.length > 0 && (!platform || !arch)}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirmation && artifactToDelete && (
        <DeleteArtifactConfirmationModal
          platform={artifactToDelete.platform}
          arch={artifactToDelete.arch}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setArtifactToDelete(null);
          }}
          onConfirm={confirmDeleteArtifact}
        />
      )}
    </>
  );
}; 