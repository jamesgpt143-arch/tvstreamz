import { useEffect, useRef } from 'react';
import { trackPopAdsImpression } from '@/lib/analytics';

export const PopAdsTracker = () => {
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    // Function para i-check kung loaded na ang PopAds script
    const checkPopAds = () => {
      // Check kung nag-load na yung script na galing sa index.html
      if (window._pop && !hasTrackedImpression.current) {
        hasTrackedImpression.current = true;
        // Mag-log lang tayo sa analytics na nag-load ang ads
        trackPopAdsImpression();
        console.log("PopAds Tracker: Script detected and tracked");
      }
    };

    // Check immediately
    checkPopAds();

    // Check ulit after 2 seconds kung sakaling mabagal ang internet
    const timeout = setTimeout(checkPopAds, 2000);

    // Wala na tayong listeners dito para sa click/scroll. 
    // Ang script mismo sa index.html ang bahala doon para iwas block.

    return () => clearTimeout(timeout);
  }, []);

  return null;
};

// Types definition para hindi mag-error ang TypeScript sa window._pop
declare global {
  interface Window {
    _pop?: unknown[];
  }
}
