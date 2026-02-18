import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Fires a page_view event on every SPA route change. */
export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    // No-op for now — placeholder for analytics integration
  }, [location.pathname]);
}
