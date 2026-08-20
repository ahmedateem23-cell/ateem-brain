import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ateem.store',
  appName: 'ATEEM STORE',
  webDir: 'www',
  server: {
    allowNavigation: ['www.ateem-store.com', 'ateem-store.com']
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F5F0E8'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      backgroundColor: '#F5F0E8',
      androidSplashResourceName: 'splash',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F5F0E8',
      overlaysWebView: true
    }
  }
};

export default config;
