import { useLayoutEffect } from 'react';

export const ScrollToTop = () => {
  useLayoutEffect(() => {
    // Scroll to top immediately on mount
    window.scrollTo(0, 0);

    // Handle browser back/forward
    const handlePopState = () => {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Also listen to hash changes for hash-based routing
  useLayoutEffect(() => {
    const handleHashChange = () => {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return null;
};
