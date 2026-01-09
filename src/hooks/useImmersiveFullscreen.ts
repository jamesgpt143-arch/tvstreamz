import { useEffect, useState, useCallback, RefObject } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

interface UseImmersiveFullscreenOptions {
  containerRef: RefObject<HTMLElement>;
}

export const useImmersiveFullscreen = ({ containerRef }: UseImmersiveFullscreenOptions) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      const container = containerRef.current;
      if (!container) return;

      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        await (container as any).webkitRequestFullscreen();
      }

      // Hide status bar on native Android/iOS
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.hide();
        } catch (e) {
          console.log('StatusBar hide error:', e);
        }
      }

      setIsFullscreen(true);
    } catch (err) {
      console.log('Fullscreen error:', err);
    }
  }, [containerRef]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }

      // Show status bar on native Android/iOS
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.show();
        } catch (e) {
          console.log('StatusBar show error:', e);
        }
      }

      setIsFullscreen(false);
    } catch (err) {
      console.log('Exit fullscreen error:', err);
    }
  }, []);

  // Listen to orientation changes
  useEffect(() => {
    const handleOrientationChange = async () => {
      let landscape = false;

      if (Capacitor.isNativePlatform()) {
        try {
          const orientation = await ScreenOrientation.orientation();
          landscape = orientation.type.includes('landscape');
        } catch {
          // Fallback to window check
          landscape = window.innerWidth > window.innerHeight;
        }
      } else {
        // Web fallback
        if (screen.orientation) {
          landscape = screen.orientation.type.includes('landscape');
        } else {
          landscape = window.innerWidth > window.innerHeight;
        }
      }

      setIsLandscape(landscape);

      // Auto fullscreen on landscape, exit on portrait
      if (landscape && !document.fullscreenElement) {
        enterFullscreen();
      } else if (!landscape && document.fullscreenElement) {
        exitFullscreen();
      }
    };

    // Initial check
    handleOrientationChange();

    // Listen to orientation changes
    if (Capacitor.isNativePlatform()) {
      ScreenOrientation.addListener('screenOrientationChange', handleOrientationChange);
    }

    // Web fallback listeners
    window.addEventListener('resize', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    // Listen to fullscreen changes
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);

      if (Capacitor.isNativePlatform()) {
        if (isFs) {
          StatusBar.hide().catch(() => {});
        } else {
          StatusBar.show().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      if (Capacitor.isNativePlatform()) {
        ScreenOrientation.removeAllListeners();
      }
      window.removeEventListener('resize', handleOrientationChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [enterFullscreen, exitFullscreen]);

  return { isFullscreen, isLandscape, enterFullscreen, exitFullscreen };
};
