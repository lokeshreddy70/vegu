import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vegu.app',
  appName: 'VEGU',
  webDir: '.next',
  server: {
    // Uses deployed frontend in mobile wrapper. Switch to local dev URL if needed.
    url: 'https://frontend-jet-sigma-69.vercel.app',
    cleartext: false,
    allowNavigation: [
      '*.vercel.app',
      'vegu-backend.vercel.app',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: '#16a34a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
  },
};

export default config;
