/**
 * Capacitor-aware fullscreen utilities.
 * Uses native ScreenOrientation + StatusBar plugins when running inside a Capacitor app,
 * falls back to the standard Web Fullscreen API in browsers.
 */

let ScreenOrientation: any = null;
let StatusBar: any = null;

// Lazy-load Capacitor plugins (they throw if not in a native context)
const loadPlugins = async () => {
  if (ScreenOrientation && StatusBar) return;
  try {
    const so = await import('@capacitor/screen-orientation');
    ScreenOrientation = so.ScreenOrientation;
  } catch {}
  try {
    const sb = await import('@capacitor/status-bar');
    StatusBar = sb.StatusBar;
  } catch {}
};

const isCapacitor = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

/**
 * Enter fullscreen: lock landscape + hide status bar on native,
 * or use requestFullscreen on web.
 * @param element The element to enter fullscreen
 * @param forceLock Whether to strictly lock the orientation to landscape (default: true). 
 *                  Set to false if orientation was already changed by the device sensor.
 */
export const enterFullscreen = async (element?: HTMLElement | null, forceLock: boolean = true) => {
  if (isCapacitor()) {
    await loadPlugins();
    try {
      if (forceLock) {
        await ScreenOrientation?.lock({ orientation: 'landscape' });
        // Give the OS a moment to process the rotation before unlocking the sensor
        await new Promise(resolve => setTimeout(resolve, 800));
        await ScreenOrientation?.unlock();
      }
    } catch (e) {
      console.warn('ScreenOrientation lock failed:', e);
    }
    try {
      await StatusBar?.setOverlaysWebView({ overlay: true });
      await StatusBar?.hide();
    } catch (e) {
      console.warn('StatusBar hide failed:', e);
    }
    
    // Use web fullscreen API for immersive mode in WebView
    if (element && !document.fullscreenElement) {
      try {
        await element.requestFullscreen();
      } catch {}
    }
  } else if (element) {
    element.requestFullscreen?.().catch(() => {});
  }
};

/**
 * Exit fullscreen: unlock orientation + show status bar on native,
 * or use exitFullscreen on web.
 */
export const exitFullscreen = async () => {
  if (isCapacitor()) {
    await loadPlugins();
    try {
      await ScreenOrientation?.unlock();
    } catch (e) {
      console.warn('ScreenOrientation unlock failed:', e);
    }
    try {
      await StatusBar?.setOverlaysWebView({ overlay: false });
      await StatusBar?.show();
    } catch (e) {
      console.warn('StatusBar show failed:', e);
    }
    // Also exit web fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  } else if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
};

/**
 * Setup orientation-based auto-fullscreen listener.
 * On Capacitor, listens for native orientation changes.
 * On web, listens for matchMedia orientation changes.
 * Returns a cleanup function.
 */
export const setupOrientationFullscreen = (
  element: HTMLElement | null,
  enabled: boolean
): (() => void) => {
  if (!enabled || !element) return () => {};

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (!isMobile && !isCapacitor()) return () => {};

  if (isCapacitor()) {
    let listenerHandle: any = null;

    const setup = async () => {
      await loadPlugins();
      if (!ScreenOrientation) return;

      try {
        listenerHandle = await ScreenOrientation.addListener(
          'screenOrientationChange',
          (result: { type: string }) => {
            const isLandscape = result.type.includes('landscape');
            if (isLandscape) {
              // We pass false to forceLock because the orientation change 
              // was already triggered by the device sensor.
              enterFullscreen(element, false);
            } else {
              exitFullscreen();
            }
          }
        );
      } catch {}
    };

    setup();
    return () => {
      listenerHandle?.remove?.();
    };
  } else {
    // Web: use matchMedia
    const handleOrientation = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      if (isLandscape && !document.fullscreenElement) {
        element.requestFullscreen?.().catch(() => {});
      } else if (!isLandscape && document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };

    const mql = window.matchMedia('(orientation: landscape)');
    mql.addEventListener('change', handleOrientation);
    return () => mql.removeEventListener('change', handleOrientation);
  }
};
