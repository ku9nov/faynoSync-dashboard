import React, { useState, useEffect } from 'react';

interface EditUserModalProps {
  userId: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, newUsername: string, newPassword: string) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  userId,
  username,
  isOpen,
  onClose,
  onSave,
}) => {
  const [newUsername, setNewUsername] = useState(username);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewUsername(username);
      setNewPassword('');
      setError(null);
      setCopySuccess(null);
    }
  }, [isOpen, username]);

  const handleSave = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(userId, newUsername, newPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePassword = () => {
    const length = 32;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    setNewPassword(password);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess('Password copied to clipboard!');
        setTimeout(() => setCopySuccess(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-theme-primary px-6 py-3 rounded-lg shadow-lg z-[60] animate-fade-in">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-roboto">Error: {error}</span>
            {error && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="ml-2 text-theme-primary hover:text-theme-primary-hover"
              >
                <svg
                  className={`w-4 h-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          {showDetails && error && (
            <div className="mt-2 text-sm bg-red-600 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      )}
      <div 
        className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in z-50'
        onClick={handleBackdropClick}
      >
        <div className='bg-theme-modal-gradient p-8 rounded-lg w-96'>
          <h2 className='text-2xl font-bold mb-4 text-theme-primary font-roboto'>
            Edit User
          </h2>
          <div className='mb-4'>
            <label className='block text-theme-primary mb-2 font-roboto'>Username</label>
            <input
              type='text'
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className='w-full p-2 rounded-lg font-roboto bg-theme-card text-theme-primary'
              placeholder='Enter username'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-theme-primary mb-2 font-roboto'>New Password</label>
            <div className='flex'>
              <input
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className='w-full p-2 rounded-lg font-roboto bg-theme-card text-theme-primary'
                placeholder='Enter new password'
              />
              <button
                type='button'
                onClick={generatePassword}
                className='ml-2 bg-theme-button-primary text-theme-primary px-3 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200'
              >
                Generate
              </button>
              {newPassword && (
                <button
                  type='button'
                  onClick={() => copyToClipboard(newPassword)}
                  className='ml-2 bg-theme-button-primary text-theme-primary px-3 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200'
                >
                  <i className='fas fa-copy'></i>
                </button>
              )}
            </div>
            <p className='text-sm text-gray-400 mt-1'>
              Leave empty to keep current password
            </p>
            {copySuccess && (
              <p className='text-sm text-green-500 mt-1'>{copySuccess}</p>
            )}
          </div>
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2 font-roboto hover:bg-gray-400 transition-colors duration-200'>
              Cancel
            </button>
            <button
              type='button'
              onClick={handleSave}
              disabled={isSaving || !newUsername.trim()}
              className='bg-theme-button-primary text-theme-primary px-4 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 