import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tvstreamz.app',
  appName: 'TVStreamz',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      // PATAYIN ITO: Ito ang sumisira sa Direct M3U8 Streams sa Android
      enabled: false, 
    },
  },
  server: {
    allowNavigation: [
      "*.supabase.co", 
      "*.workers.dev",
      "*"
    ]
  }
};

export default config;
