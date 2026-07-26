import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'win.ordereasy.customer',
  appName: 'Order Easy',
  webDir: 'out',
  server: {
    url: 'https://customer.ordereasy.win',
    cleartext: false
  },
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      clientId: "241725361064-2k6np1n9ecj2admv520596kvgker14hb.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;