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
 */
export const enterFullscreen = async (element?: HTMLElement | null) => {
  if (isCapacitor()) {
    await loadPlugins();
    try {
      await ScreenOrientation?.lock({ orientation: 'landscape' });
    } catch (e) {
      console.warn('ScreenOrientation lock failed:', e);
    }
    try {
      await StatusBar?.hide();
    } catch (e) {
      console.warn('StatusBar hide failed:', e);
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
      await StatusBar?.show();
    } catch (e) {
      console.warn('StatusBar show failed:', e);
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
    // On Capacitor, we don't auto-rotate based on orientation.
    // Instead, the Shaka/iframe fullscreen button should call enterFullscreen/exitFullscreen.
    // But we still listen for orientation to auto-exit when going portrait.
    let listenerHandle: any = null;

    const setup = async () => {
      await loadPlugins();
      if (!ScreenOrientation) return;

      try {
        listenerHandle = await ScreenOrientation.addListener(
          'screenOrientationChange',
          (result: { type: string }) => {
            const isLandscape = result.type.includes('landscape');
            if (!isLandscape) {
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
