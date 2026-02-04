import React, { useState, useEffect } from 'react';
import { resizeImageToDataURL } from '../../lib/utils';
import { getCachedImageUrl } from '../../lib/imageCache';

interface ResizedImageProps {
  src: string;
  alt: string;
  className?: string;
  scaleFactor?: number; // Default 0.4 (40%)
  fallbackSrc?: string;
}

const ResizedImage: React.FC<ResizedImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  scaleFactor = 0.4,
  fallbackSrc 
}) => {
  const [resizedSrc, setResizedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // First, get the cached version of the image
    getCachedImageUrl(src)
      .then((cachedUrl) => {
        // Then resize the cached image
        return resizeImageToDataURL(cachedUrl, scaleFactor);
      })
      .then((dataURL) => {
        setResizedSrc(dataURL);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn('Failed to resize cached image, using original cached version:', error);
        // Fallback to original cached image without resizing
        return getCachedImageUrl(src)
          .then((cachedUrl) => {
            setResizedSrc(cachedUrl);
            setIsLoading(false);
          })
          .catch((cacheError) => {
            console.warn('Failed to get cached image, using original:', cacheError);
            setResizedSrc(src); // Final fallback to original image
            setIsLoading(false);
          });
      });
  }, [src, scaleFactor]);

  const handleImageError = () => {
    setHasError(true);
    if (fallbackSrc) {
      // Try to get cached fallback image
      getCachedImageUrl(fallbackSrc)
        .then((cachedFallback) => {
          setResizedSrc(cachedFallback);
          setHasError(false);
        })
        .catch(() => {
          setResizedSrc(fallbackSrc);
        });
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (hasError && !fallbackSrc) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm text-center">
          <div>Image failed to load</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resizedSrc || src}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default ResizedImage;
