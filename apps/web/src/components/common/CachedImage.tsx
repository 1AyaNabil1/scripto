import React, { useState, useEffect, useCallback } from 'react';
import { getCachedImageUrl } from '../../lib/imageCache';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  loading?: 'lazy' | 'eager';
  // Legacy prop kept for backward compatibility but not used
  scaleFactor?: number;
}

/**
 * CachedImage component with smart caching, loading states, and error handling
 * Automatically caches images in memory and IndexedDB for optimal UX
 */
const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
  loading = 'lazy'
  // scaleFactor is kept for backward compatibility but not used
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadImage = useCallback(async () => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // Get cached image URL
      const cachedUrl = await getCachedImageUrl(src);
      setImageSrc(cachedUrl);
      setIsLoading(false);
      
      if (onLoad) {
        onLoad();
      }
    } catch (error) {
      console.error('Failed to load cached image:', error);
      setHasError(true);
      setIsLoading(false);
      
      if (onError) {
        onError(error as Error);
      }

      // Try fallback if available
      if (fallbackSrc) {
        try {
          const fallbackUrl = await getCachedImageUrl(fallbackSrc);
          setImageSrc(fallbackUrl);
          setHasError(false);
        } catch (fallbackError) {
          console.error('Fallback image also failed:', fallbackError);
        }
      }
    }
  }, [src, fallbackSrc, onLoad, onError]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

  // Handle image load error
  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
    
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      // Try fallback image
      getCachedImageUrl(fallbackSrc)
        .then(fallbackUrl => {
          setImageSrc(fallbackUrl);
          setHasError(false);
        })
        .catch(fallbackError => {
          console.error('Fallback image failed:', fallbackError);
          if (onError) {
            onError(new Error('Both primary and fallback images failed to load'));
          }
        });
    } else if (onError) {
      onError(new Error('Image failed to load'));
    }
  };

  // Loading placeholder
  if (isLoading) {
    return placeholder || (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Error state
  if (hasError || !imageSrc) {
    return (
      <div className={`bg-red-50 border border-red-200 flex items-center justify-center ${className}`}>
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
    );
  }

  // Successful image load
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
      draggable={false}
    />
  );
};

export default CachedImage;
