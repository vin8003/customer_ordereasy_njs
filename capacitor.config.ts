import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'win.ordereasy.customer',
  appName: 'ordereasy',
  webDir: 'out',
  server: {
    url: 'https://customer.ordereasy.win',
    cleartext: false
  }
};

export default config;