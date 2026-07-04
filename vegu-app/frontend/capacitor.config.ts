import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();
const appUrl = liveReloadUrl || 'https://frontend-jet-sigma-69.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.vegu.app',
  appName: 'VEGU',
  webDir: '.next',
  server: {
    // Production APK uses the deployed frontend; CAP_SERVER_URL can override this for local native debugging.
    url: appUrl,
    cleartext: appUrl.startsWith('http://'),
    allowNavigation: [
      '*.vercel.app',
      'vegu-backend.vercel.app',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: false,
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
