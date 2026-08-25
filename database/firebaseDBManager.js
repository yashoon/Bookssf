import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSpace } from 'react-native-reanimated';
import axios from 'axios';

const FIREBASE_BASE_URL = 'https://shepherd-s-staff.web.app/databases';

// FIX ("app startup is slow"): this function used to run its independent
// checks — AsyncStorage read, local file-exists check, and network
// connectivity check — one after another with separate `await`s, even
// though none of them depend on each other's result. Every extra sequential
// await adds pure wall-clock latency on the critical path that runs before
// any screen can show real content. Promise.all runs them concurrently
// instead; same result, less waiting.
//
// Also: the version-check request timeout was 30s, meaning a slow/flaky
// (but technically "connected") network could stall the entire startup for
// up to 30 seconds before falling back to the local copy. Trimmed to 8s —
// generous for a small JSON file, but no longer allows a bad connection to
// hang the whole app open.
const VERSION_CHECK_TIMEOUT_MS = 8000;

/**
 * @param {string} language
 * @param {(percent: number) => void} [onProgress] Optional callback, fired
 *   with a 0-100 integer only while an actual file download is happening —
 *   never called if the local copy is already current. Callers use this to
 *   distinguish "genuinely downloading" from "just opening a cached DB", so
 *   the UI doesn't show a "Downloading..." state for work that never
 *   touched the network.
 */
export const ensureDatabaseExists = async (language, onProgress) => {
  const dbFileName = `${language}.db`;
  // const localPath = `${RNFS.DocumentDirectoryPath}/${dbFileName}`;
  const localPath = Platform.OS === 'ios'
  ? `${RNFS.LibraryDirectoryPath}/${dbFileName}`
  : `${RNFS.DocumentDirectoryPath}/${dbFileName}`;
  const targetDBPath = `${RNFS.LibraryDirectoryPath}/${dbFileName}`; // iOS expects the DB here
  const versionUrl = `${FIREBASE_BASE_URL}/ssf_version.json`;
  const dbUrl = `${FIREBASE_BASE_URL}/ssf_${dbFileName}`;
  const versionKey = `db_version_${language}`;

      // Configure axios defaults
      axios.defaults.timeout = VERSION_CHECK_TIMEOUT_MS;
      axios.defaults.headers.common['Accept'] = 'application/json';

    // Create cancel token for request cancellation if needed
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

  try {

    const [storedVersion, dbExists, state] = await Promise.all([
      AsyncStorage.getItem(versionKey),
      RNFS.exists(localPath),
      NetInfo.fetch(),
    ]);

    // Check if the local version is stored
    const localVersion = storedVersion || '';

    let remoteVersion = localVersion || ''; // Default if not found
    console.log(`Local version for ${language}:`, localVersion);
    if (!state.isConnected){
      console.warn('No Internet, can\'t check db updates, using local database if available.');
    }
    else {
      console.log('Internet connection is available. Proceeding to check for updates.');
      console.log(`Fetching version from: ${versionUrl}`);

      // FIX: this version-check request used to be inside the function's
      // outer try/catch with no catch of its own, so any failure here
      // (not just NetInfo reporting "offline") propagated all the way out
      // of ensureDatabaseExists and aborted the whole call — even when a
      // perfectly good local copy already existed on disk (dbExists,
      // checked above, was simply never consulted in that case). NetInfo's
      // isConnected only reflects whether the OS thinks it's associated
      // with a network, not whether that network can actually reach the
      // internet — a weak/flaky wifi signal reports isConnected: true and
      // then fails the actual request with a Network Error (confirmed via
      // a Sentry log: NETWORK_CAPABILITIES_CHANGED showed signal_strength
      // -88/-89 dBm right before the axios GET failed). Catching it here
      // and leaving remoteVersion at its localVersion default means the
      // "up to date" check below naturally falls back to the existing
      // local file instead of throwing — matching the offline branch above
      // and the behavior documented for this function.
      try {
        const response = await axios.get(`${versionUrl}?t=${Date.now()}`, {
          timeout: VERSION_CHECK_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cancelToken: source.token,
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response status: ${response.data}`);

        if (response.status !== 200) {
          throw new Error(`Failed to fetch version file: ${response.status} - ${response.statusText}`);
        }

        const remoteVersions = response.data; // axios already parses JSON
        remoteVersion = remoteVersions[language]?.toString();
        console.log(`Response -------: ${remoteVersions[language]}`);
        console.log(`Remote version for ${language}:`, remoteVersion);
      } catch (versionCheckErr) {
        console.warn(
          `⚠️ Version check failed (${versionCheckErr.message}), using local database if available.`,
        );
        // remoteVersion stays equal to localVersion (set above), so if
        // dbExists is true the download-trigger check below evaluates to
        // false and we fall straight into the "use local copy" branch. If
        // dbExists is false, it correctly still tries to download (there's
        // nothing to fall back to) and surfaces a real error from that.
      }
    }

    const checkPermissions = async (filePath) => {
      // FIX: testFile was declared inside the try block, so the finally
      // block below (which also ran even on failure, before testFile
      // existed) referenced an out-of-scope variable — a guaranteed
      // ReferenceError on any call. Hoisted the declaration so cleanup can
      // actually see it.
      const directory = filePath.substring(0, filePath.lastIndexOf('/'));
      const testFile = `${directory}/test_write.txt`;
      try {
          // Check if directory exists and is writable
          const dirExists = await RNFS.exists(directory);
          console.log('Directory exists:', dirExists);

          if (dirExists) {
              const dirStats = await RNFS.stat(directory);
              console.log('Directory stats:', dirStats);
          }

          // Try to create a test file
          await RNFS.writeFile(testFile, 'test', 'utf8');
          console.log('Write permission: OK');

          // Clean up test file
          // await RNFS.unlink(testFile);

          return true;
      } catch (error) {
          console.error('Permission check failed:', error);
          return false;
      }
      finally {
         // Clean up test file
         await RNFS.unlink(testFile);
      }
  };

  // checkPermissions(localPath).then((hasPermission) => {
  //   if (!hasPermission) {
  //     throw new Error('No write permission to the directory');
  //   }
  // });


    // FIX ("show a proper no-internet error"): previously, a genuinely
    // offline device with no local copy of this language (e.g. picking a
    // language you've never downloaded before, with no signal) fell
    // through to the RNFS.downloadFile() call below anyway, which then
    // failed several seconds later with a raw native DNS error ("Unable to
    // resolve host...") — technically correct, but a confusing, unfriendly
    // message for what is simply "you're offline." Failing fast here with
    // a clear, purpose-built error lets the UI show something a user
    // actually understands. `isOffline` is a boolean marker (rather than
    // callers string-matching err.message) so screens can reliably detect
    // this specific case regardless of wording.
    if (!state.isConnected && !dbExists) {
      const offlineError = new Error(
        `No internet connection. Connect to the internet to download the ${language} language pack.`,
      );
      offlineError.isOffline = true;
      throw offlineError;
    }

    // if ((state.isConnected && !dbExists) || (state.isConnected && localVersion !== remoteVersion)) {
    if ((!dbExists) || (localVersion !== remoteVersion)) {
      console.log(`⬇️ Downloading ${dbFileName}...`);
      console.log(`Database URL: ${dbUrl}`);
      console.log(`Local path: ${localPath}`);

      const result = await RNFS.downloadFile({
        fromUrl: dbUrl,
        toFile: localPath,
        headers: {
            'Accept': 'application/octet-stream',
          },
        // FIX: previously the UI faked a fixed-time progress animation
        // completely disconnected from the real download — misleading on a
        // slow connection (bar finishes, file keeps downloading) and adding
        // nothing but wasted time on a fast one. Report real bytes-written
        // progress instead, throttled to whole-percent steps.
        progressDivider: 1,
        progress: onProgress
          ? (res) => {
              if (res.contentLength > 0) {
                onProgress(Math.round((res.bytesWritten / res.contentLength) * 100));
              }
            }
          : undefined,
      }).promise;

      console.log(`Download result status: ${result.statusCode}`);
      // console.log('📁 Moving DB to Library directory (iOS)');
      // await RNFS.copyFile(localPath, targetDBPath);
      // console.log(`Database file copied to: ${targetDBPath}`);
      // console.log(`Database file exists at target check --: ${await RNFS.exists(targetDBPath)}`);

      
      // const fileInfo = await RNFS.stat(this.dbPath);
      console.log(`Database file downloaded to: ${localPath}`);
      const fileInfo = await RNFS.stat(localPath);
      console.log(`Database file size: ${fileInfo.size} bytes`);

      console.log('Download result:', result);

      if (result.statusCode === 200) {
        await AsyncStorage.setItem(versionKey, remoteVersion);
        console.log('✅ DB download complete');
      } else {
        throw new Error('❌ Failed to download DB');
      }
    } 
    else if (!state.isConnected && dbExists) {
      console.log(`No Internet connectivity using local database: ${dbFileName}`);
    }
    else {
      console.log('📦 DB already up to date');
    }
   
    return localPath;
    // return targetDBPath; // Return the path where the DB is stored
  } catch (err) {
    console.error('⚠️ DB fetch/setup failed:', err.message);
    throw err;
  }
};
