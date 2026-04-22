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
// KILL SWITCH PARA SA LUMANG PWA/SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('Old Service Worker removed. Forcing fresh update.');
    }
  }).catch((err) => {
    console.error('Service Worker unregistration failed: ', err);
  });
}
// ==========================================

createRoot(document.getElementById("root")!).render(<App />);
