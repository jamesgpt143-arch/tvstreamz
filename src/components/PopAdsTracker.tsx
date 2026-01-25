import { useEffect, useRef } from 'react';
import { trackPopAdsImpression } from '@/lib/analytics';

export const PopAdsTracker = () => {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Track impression once when PopAds script is detected
    const checkPopAds = () => {
      if (window._pop && !hasTracked.current) {
        hasTracked.current = true;
        trackPopAdsImpression();
      }
    };

    // Check immediately
    checkPopAds();

    // Also check after a short delay in case script loads later
    const timeout = setTimeout(checkPopAds, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return null;
};

// Extend Window interface for _pop
declare global {
  interface Window {
    _pop?: unknown[];
  }
}
