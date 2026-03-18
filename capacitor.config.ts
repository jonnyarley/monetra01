import type { CapacitorConfig } from '@capacitor/cli';

// ⚠️ CONFIGURAÇÃO IMPORTANTE:
// Para desenvolvimento local, deixe server.url comentado
// Para produção, descomente e coloque sua URL:

const PRODUCTION_URL = 'https://monex.app'; // ← URL de produção

const config: CapacitorConfig = {
  appId: 'com.monex.app',
  appName: 'Monex',
  webDir: 'out',
  server: {
    // DESCOMENTE A LINHA ABAIXO PARA PRODUÇÃO:
    // url: PRODUCTION_URL,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1a1a2e'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a1a2e'
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
