import { useEffect, useRef } from 'react';
import { trackPopAdsImpression, trackPopAdsClick } from '@/lib/analytics';

export const PopAdsTracker = () => {
  const hasTrackedImpression = useRef(false);
  const lastTriggerTime = useRef(0);
  const scrollTriggerCount = useRef(0);

  useEffect(() => {
    // Track impression once when PopAds script is detected
    const checkPopAds = () => {
      if (window._pop && !hasTrackedImpression.current) {
        hasTrackedImpression.current = true;
        trackPopAdsImpression();
      }
    };

    // Check immediately
    checkPopAds();

    // Also check after a short delay in case script loads later
    const timeout = setTimeout(checkPopAds, 2000);

    // Trigger PopAds on user interaction with rate limiting
    const triggerPopAd = (source: string) => {
      const now = Date.now();
      // Rate limit: minimum 30 seconds between triggers
      if (now - lastTriggerTime.current < 30000) return;
      
      lastTriggerTime.current = now;
      
      // Trigger PopAds by simulating user interaction
      try {
        window.open('about:blank', '_blank')?.close();
        trackPopAdsClick(source);
      } catch (e) {
        // Silently fail if popup blocked
      }
    };

    // Scroll handler - trigger after significant scroll
    const handleScroll = () => {
      scrollTriggerCount.current += 1;
      // Trigger every 5th scroll event (to avoid too frequent triggers)
      if (scrollTriggerCount.current >= 5) {
        scrollTriggerCount.current = 0;
        triggerPopAd('passive_scroll');
      }
    };

    // Click handler - trigger on any click
    const handleClick = (e: MouseEvent) => {
      // Don't trigger on interactive elements that already have their own handlers
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
      
      if (!isInteractive) {
        triggerPopAd('passive_click');
      }
    };

    // Add passive listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
};

// Extend Window interface for _pop
declare global {
  interface Window {
    _pop?: unknown[];
  }
}
