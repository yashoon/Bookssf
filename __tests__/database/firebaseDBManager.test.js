// firebaseDBManager.test.js
//
// Regression coverage for a real bug found via a Sentry log: NetInfo can
// report isConnected: true on a weak/flaky wifi connection (OS thinks it's
// associated with a network) while the actual version-check request still
// fails with a network error. ensureDatabaseExists used to let that error
// propagate out of the whole function instead of falling back to an
// already-downloaded local copy, blocking a returning user from reading a
// chapter they'd already cached — even though the local file was sitting
// right there on disk.

// Manual mock (rather than bare jest.mock('axios')) because ensureDatabaseExists
// builds an axios.CancelToken.source() before every request — automock leaves
// CancelToken.source() returning undefined, so accessing `.token` on it throws
// synchronously before axios.get is ever reached.
jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: { headers: { common: {} } },
  CancelToken: {
    source: jest.fn(() => ({ token: 'mock-token', cancel: jest.fn() })),
  },
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  LibraryDirectoryPath: '/mock/library',
  exists: jest.fn(),
  downloadFile: jest.fn(() => ({ promise: Promise.resolve({ statusCode: 200 }) })),
  stat: jest.fn(() => Promise.resolve({ size: 1234 })),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

import axios from 'axios';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureDatabaseExists } from '../../database/firebaseDBManager';

describe('ensureDatabaseExists', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    RNFS.exists.mockResolvedValue(false);
    RNFS.downloadFile.mockReturnValue({ promise: Promise.resolve({ statusCode: 200 }) });
    await AsyncStorage.clear();
  });

  it('falls back to the local copy when the version check fails but a local file already exists', async () => {
    RNFS.exists.mockResolvedValue(true);
    await AsyncStorage.setItem('db_version_english', '1.3');
    axios.get.mockRejectedValue(new Error('Network Error'));

    const path = await ensureDatabaseExists('english');

    expect(path).toBe('/mock/library/english.db');
    expect(RNFS.downloadFile).not.toHaveBeenCalled();
  });

  it('still throws when the version check fails and there is no local copy to fall back to', async () => {
    RNFS.exists.mockResolvedValue(false);
    axios.get.mockRejectedValue(new Error('Network Error'));
    RNFS.downloadFile.mockReturnValue({
      promise: Promise.reject(new Error('download also failed')),
    });

    await expect(ensureDatabaseExists('english')).rejects.toThrow();
  });

  it('downloads when the version check succeeds and reports a newer remote version', async () => {
    RNFS.exists.mockResolvedValue(true);
    await AsyncStorage.setItem('db_version_english', '1.0');
    axios.get.mockResolvedValue({ status: 200, data: { english: '1.3' } });

    const path = await ensureDatabaseExists('english');

    expect(RNFS.downloadFile).toHaveBeenCalledTimes(1);
    expect(path).toBe('/mock/library/english.db');
  });

  it('skips the download when the version check succeeds and the local copy is already current', async () => {
    RNFS.exists.mockResolvedValue(true);
    await AsyncStorage.setItem('db_version_english', '1.3');
    axios.get.mockResolvedValue({ status: 200, data: { english: '1.3' } });

    await ensureDatabaseExists('english');

    expect(RNFS.downloadFile).not.toHaveBeenCalled();
  });
});
