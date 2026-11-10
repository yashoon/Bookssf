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
    // Nothing was ever written to disk in this case (RNFS.exists is false
    // throughout), so there's nothing to clean up.
    expect(RNFS.unlink).not.toHaveBeenCalled();
  });

  // FIX (log analysis of a live "no such table: sections" crash,
  // 2026-09-08): RNFS.downloadFile() writes bytes directly to the
  // destination path as they arrive rather than to a temp file it renames on
  // success, so an aborted download (e.g. the app backgrounding mid-transfer
  // - confirmed via Sentry: "Software caused connection abort" logged right
  // after an app.lifecycle "background" event) leaves a partial, unusable
  // file sitting at the exact path this function's own dbExists check looks
  // at. On the very next call, if the version check *also* fails (a common
  // pairing right after a backgrounding/foregrounding cycle interrupts
  // connectivity), localVersion/remoteVersion both fall back to '' and
  // compare equal, so the function concludes "already up to date" and hands
  // back a path to that corrupt partial file instead of retrying. These
  // tests exercise the cleanup added to prevent that: any failure removes
  // whatever partial file might have been left behind, so the next call
  // sees a clean dbExists: false and genuinely retries the download.
  describe('cleanup after a failed download', () => {
    it('removes a partial download file left behind when the download itself fails', async () => {
      // First RNFS.exists call is the function's own initial dbExists check
      // (no file yet); the second is the cleanup check after the download
      // has failed, simulating the partial file the failed download left on
      // disk.
      RNFS.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      axios.get.mockResolvedValue({ status: 200, data: { english: '1.3' } });
      RNFS.downloadFile.mockReturnValue({
        promise: Promise.reject(new Error('Software caused connection abort')),
      });

      await expect(ensureDatabaseExists('english')).rejects.toThrow(
        'Software caused connection abort',
      );

      expect(RNFS.unlink).toHaveBeenCalledWith('/mock/library/english.db');
    });

    it('still surfaces the original download error even if the cleanup unlink itself fails', async () => {
      RNFS.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      axios.get.mockResolvedValue({ status: 200, data: { english: '1.3' } });
      RNFS.downloadFile.mockReturnValue({
        promise: Promise.reject(new Error('Software caused connection abort')),
      });
      RNFS.unlink.mockRejectedValueOnce(new Error('unlink failed'));

      await expect(ensureDatabaseExists('english')).rejects.toThrow(
        'Software caused connection abort',
      );
    });

    it('does not attempt cleanup when no file was ever written', async () => {
      // Both calls to RNFS.exists (initial check, cleanup check) report no
      // file - e.g. the failure happened before any bytes were written.
      RNFS.exists.mockResolvedValue(false);
      axios.get.mockResolvedValue({ status: 200, data: { english: '1.3' } });
      RNFS.downloadFile.mockReturnValue({
        promise: Promise.reject(new Error('Software caused connection abort')),
      });

      await expect(ensureDatabaseExists('english')).rejects.toThrow();

      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
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
