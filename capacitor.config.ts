import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tvstreamz.app', // (Kung ano man ang appId mo)
  appName: 'TVStreamz',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    // ITO ANG PINAKAMAHALAGA PARA MA-BYPASS ANG CORS SA ANDROID:
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;