import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export interface ScrollToTopOptions {
  behavior?: 'auto' | 'smooth';
  delay?: number;
  offset?: number;
  excludeRoutes?: string[];
}

/**
 * Hook for programmatic scroll to top functionality
 * Provides more control than the basic ScrollToTop component
 */
export function useScrollToTop(options: ScrollToTopOptions = {}) {
  const {
    behavior = 'smooth',
    delay = 0,
    offset = 0,
    excludeRoutes = []
  } = options;

  const location = useLocation();

  const scrollToTop = useCallback((customOptions?: Partial<ScrollToTopOptions>) => {
    const finalOptions = { ...options, ...customOptions };
    
    const doScroll = () => {
      window.scrollTo({
        top: finalOptions.offset || offset,
        left: 0,
        behavior: finalOptions.behavior || behavior
      });
    };

    if (finalOptions.delay || delay) {
      setTimeout(doScroll, finalOptions.delay || delay);
    } else {
      doScroll();
    }
  }, [behavior, delay, offset]);

  const scrollToElement = useCallback((elementId: string, customOffset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - customOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior
      });
    }
  }, [behavior]);

  // Auto scroll on route change
  useEffect(() => {
    const shouldScroll = !excludeRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (shouldScroll) {
      scrollToTop();
    }
  }, [location.pathname, scrollToTop, excludeRoutes]);

  return {
    scrollToTop,
    scrollToElement,
    currentPath: location.pathname
  };
}

/**
 * Hook for smooth page transitions with loading states
 */
export function usePageTransition() {
  const location = useLocation();

  useEffect(() => {
    // Add page transition class to body
    document.body.classList.add('page-transitioning');
    
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Remove transition class after animation
    const timer = setTimeout(() => {
      document.body.classList.remove('page-transitioning');
    }, 300);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove('page-transitioning');
    };
  }, [location.pathname]);

  return location.pathname;
}
