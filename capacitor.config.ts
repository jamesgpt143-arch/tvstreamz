import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tvstreamz.app', // (Kung ano man ang appId mo)
  appName: 'TVStreamz',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      // Panatilihin itong false para gumana ang Direct M3U8
      enabled: false, 
    },
  },
  server: {
    allowNavigation: [
      "*.supabase.co", 
      "*.workers.dev"
      // TININGGAL NATIN YUNG "*" DITO PARA LUMABAS NA ANG POPUPS SA SYSTEM BROWSER/SHOPEE APP
    ]
  }
};

export default config;
