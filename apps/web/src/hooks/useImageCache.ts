import { useEffect, useCallback } from 'react';
import { preloadImages, getCachedImageUrl, imageCache } from '../lib/imageCache';

/**
 * Hook for preloading images to improve UX
 */
export function useImagePreloader() {
  const preload = useCallback(async (urls: string[]) => {
    try {
      await preloadImages(urls);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }, []);

  const preloadSingle = useCallback(async (url: string) => {
    if (!url) return;
    try {
      await getCachedImageUrl(url);
    } catch (error) {
      console.warn(`Failed to preload image ${url}:`, error);
    }
  }, []);

  return { preload, preloadSingle };
}

/**
 * Hook for managing image cache
 */
export function useImageCache() {
  const clearCache = useCallback(async () => {
    await imageCache.clearAllCaches();
  }, []);

  const getCacheStats = useCallback(async () => {
    return await imageCache.getCacheStats();
  }, []);

  return { clearCache, getCacheStats };
}

/**
 * Hook to preload storyboard images when they come into view
 */
export function useStoryboardImagePreloader(frames: Array<{ image_url?: string }>) {
  const { preload } = useImagePreloader();

  useEffect(() => {
    if (!frames?.length) return;

    const imageUrls = frames
      .map(frame => frame.image_url)
      .filter((url): url is string => Boolean(url));

    if (imageUrls.length > 0) {
      preload(imageUrls);
    }
  }, [frames, preload]);
}

/**
 * Hook to preload gallery images with intersection observer
 */
export function useGalleryImagePreloader(
  images: Array<{ image_url?: string }>,
  enabled = true
) {
  const { preload } = useImagePreloader();

  useEffect(() => {
    if (!enabled || !images?.length) return;

    // Preload images with a slight delay to not block initial render
    const timeoutId = setTimeout(() => {
      const imageUrls = images
        .map(img => img.image_url)
        .filter((url): url is string => Boolean(url));

      if (imageUrls.length > 0) {
        preload(imageUrls);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [images, enabled, preload]);
}
