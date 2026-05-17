'use client';

import { useEffect } from 'react';

export default function NavigationRedirectListener() {
  useEffect(() => {
    // 1. Detect browser reload event
    try {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navTiming = navigationEntries[0] as PerformanceNavigationTiming;
        if (navTiming.type === 'reload') {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
            return;
          }
        }
      }
    } catch (e) {
      // Fallback performance navigation method for older engines
      if (window.performance && window.performance.navigation && window.performance.navigation.type === 1) {
        if (window.location.pathname !== '/') {
          window.location.href = '/';
          return;
        }
      }
    }

    // 2. Detect browser back/forward (popstate)
    const handlePopState = () => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}
