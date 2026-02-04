import React, { useState } from 'react';
import type { StoryboardProject } from '../../types';

interface ShareToGalleryProps {
  project: StoryboardProject;
  onShare: (project: StoryboardProject) => Promise<boolean>;
  disabled?: boolean;
}

export const ShareToGallery: React.FC<ShareToGalleryProps> = ({
  project,
  onShare,
  disabled = false,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    if (isSharing || disabled) return;

    const confirmShare = window.confirm(
      'Share this storyboard to the community gallery? Other users will be able to see and like your creation!'
    );

    if (!confirmShare) return;

    setIsSharing(true);

    try {
      const success = await onShare(project);
      if (success) {
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000); // Reset after 3 seconds
      }
    } catch (error) {
      console.error('Error sharing to gallery:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (isShared) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Shared to Gallery!</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={disabled || isSharing}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        disabled || isSharing
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      }`}
    >
      {isSharing ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>Sharing...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span>Share to Gallery</span>
        </>
      )}
    </button>
  );
};
