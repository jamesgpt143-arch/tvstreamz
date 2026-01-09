import { useState, useEffect, RefObject } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

interface UseImmersiveFullscreenProps {
  containerRef: RefObject<HTMLElement>;
}

export const useImmersiveFullscreen = ({ containerRef }: UseImmersiveFullscreenProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = async () => {
      // Check kung naka-fullscreen ba ngayon ang browser/webview
      const isDocFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isDocFullscreen);

      if (isDocFullscreen) {
        // --- KAPAG NAG-FULLSCREEN (LANDSCAPE MODE) ---
        try {
          // 1. Payagan ang overlay (para sumagad sa notch)
          await StatusBar.setOverlaysWebView({ overlay: true });
          // 2. Itago ang status bar
          await StatusBar.hide();
          // 3. I-force Landscape
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (error) {
          console.error('Error entering immersive mode:', error);
        }
      } else {
        // --- KAPAG NAG-EXIT FULLSCREEN (PORTRAIT MODE) ---
        try {
          // 1. I-lock ulit sa Portrait
          await ScreenOrientation.lock({ orientation: 'portrait' });
          // 2. Ipakita ang Status Bar
          await StatusBar.show();
          // 3. I-off ang overlay (para bumaba ulit ang content at di matakpan)
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (error) {
          console.error('Error exiting immersive mode:', error);
        }
      }
    };

    // Makinig sa pagbabago ng fullscreen status
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Support for older webviews

    // Cleanup function
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      
      // Siguraduhin na pag-alis dito, balik sa normal
      StatusBar.show().catch(() => {});
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    };
  }, [containerRef]);

  return { isFullscreen };
};
