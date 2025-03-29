import React from 'react';
import ReactMarkdown from 'react-markdown';
import { usePlatformQuery } from '../hooks/use-query/usePlatformQuery';
import { useArchitectureQuery } from '../hooks/use-query/useArchitectureQuery';

interface EditVersionModalProps {
  appName: string;
  version: string;
  channel: string;
  currentData: {
    Published: boolean;
    Critical: boolean;
    Changelog: string;
  };
  onClose: () => void;
  onSave: (data: {
    Published: boolean;
    Critical: boolean;
    Changelog: string;
    Platform?: string;
    Arch?: string;
    File?: File;
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
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isPreview, setIsPreview] = React.useState(false);
  const [platform, setPlatform] = React.useState<string>('');
  const [arch, setArch] = React.useState<string>('');

  const { platforms } = usePlatformQuery();
  const { architectures } = useArchitectureQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      File: selectedFile || undefined,
      Platform: selectedFile ? platform : undefined,
      Arch: selectedFile ? arch : undefined,
      app_name: appName,
      version: version,
      channel: channel,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPlatform('');
      setArch('');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gradient-to-b from-purple-800 to-purple-400 p-8 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-white font-roboto">
          Edit Version {version}
        </h2>
        <div className="mb-4">
          <p className="text-white">App Name: {appName}</p>
          <p className="text-white">Version: {version}</p>
          <p className="text-white">Channel: {channel}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 font-roboto">
              App File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full p-2 rounded-lg font-roboto bg-white/10 text-white"
            />
            {selectedFile && (
              <>
                <p className="text-white text-sm mt-1">
                  Selected file: {selectedFile.name}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
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
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-white mb-2 font-roboto">
              Changelog (Markdown)
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
              <div className="bg-white/10 p-4 rounded-lg text-white prose prose-invert max-w-none">
                <ReactMarkdown>{formData.Changelog}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={formData.Changelog}
                onChange={(e) => setFormData({ ...formData, Changelog: e.target.value })}
                className="w-full p-2 rounded-lg font-roboto h-32 bg-white/10 text-white"
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
              disabled={!!selectedFile && (!platform || !arch)}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 