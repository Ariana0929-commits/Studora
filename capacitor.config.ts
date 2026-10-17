import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'app.studora.mobile',
  appName: 'Studora',
  webDir: 'mobile',
  server: { url: 'https://studora1.netlify.app', cleartext: false },
  ios: { contentInset: 'automatic' },
};
export default config;
