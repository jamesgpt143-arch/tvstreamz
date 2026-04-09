import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tvstreamz.app',
  appName: 'TVStreamz',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
  // ITO ANG NAKALIMUTAN MO (Pinakamahalaga para sa Android Video):
  server: {
    allowNavigation: [
      "*.supabase.co", 
      "*.workers.dev",
      "*"
    ]
  }
};

export default config;
