// jest.setup.js
//
// Global test-environment mocks for third-party native modules that don't
// ship their own Jest mock and would otherwise blow up simply by being
// imported (they reach for NativeModules that don't exist outside a real
// app). Keep this file limited to things genuinely needed across multiple
// test files — anything only one test file cares about should be
// jest.mock()'d locally in that file instead.

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Standard RN Testing Library setup for gesture-handler / reanimated —
// both ship official Jest mocks; without them any screen that pulls in
// react-navigation/stack (which uses gesture-handler under the hood) throws
// on a missing native TurboModule.
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Native modules with no real behavior needed for rendering/import — stub
// them to plain objects/no-ops so screens that import them don't crash at
// module-load time in the Jest (non-native) environment.
jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  DEBUG: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({})),
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  LibraryDirectoryPath: '/mock/library',
  exists: jest.fn(() => Promise.resolve(false)),
  downloadFile: jest.fn(() => ({ promise: Promise.resolve({ statusCode: 200 }) })),
  stat: jest.fn(() => Promise.resolve({ size: 0 })),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));
jest.mock('sp-react-native-in-app-updates', () => {
  return jest.fn().mockImplementation(() => ({
    addStatusUpdateListener: jest.fn(),
    removeStatusUpdateListener: jest.fn(),
    checkNeedsUpdate: jest.fn(() => Promise.resolve({ shouldUpdate: false })),
    startUpdate: jest.fn(),
    installUpdate: jest.fn(),
  }));
});
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});

// The Firebase Web SDK (used here instead of @react-native-firebase) ships
// ESM that Jest can't parse out of node_modules, and its real init talks to
// the network — neither of which we want for a render smoke test. Stub the
// pieces App.js/firebaseConfig.js actually call.
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: '[DEFAULT]' })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({ name: '[DEFAULT]' })),
}));
jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()), // returns an unsubscribe fn
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));
