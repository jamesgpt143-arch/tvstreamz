import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import 'shaka-player/dist/controls.css';

// Capacitor: Ensure status bar is visible and content doesn't go behind it
const initCapacitor = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      // Show status bar and set style
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    // Not in Capacitor context, ignore
  }
};

initCapacitor();

// ==========================================
// KILL SWITCH PARA SA LUMANG PWA/SERVICE WORKER AT CACHE
// ==========================================
if ('serviceWorker' in navigator) {
  // 1. Patayin ang Service Worker
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Old Service Worker removed.');
    }
  }).catch((err) => {
    console.error('Service Worker unregistration failed: ', err);
  });

  // 2. Burahin ang lahat ng naka-save na lumang files sa storage
  if ('caches' in window) {
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log('Clearing cache: ', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('All caches cleared. Forcing fresh update.');
    });
  }
}
// ==========================================

createRoot(document.getElementById("root")!).render(<App />);
