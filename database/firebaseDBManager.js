import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSpace } from 'react-native-reanimated';

const FIREBASE_BASE_URL = 'https://shepherd-s-staff.web.app/databases';

export const ensureDatabaseExists = async (language) => {
  const dbFileName = `${language}.db`;
  // const localPath = `${RNFS.DocumentDirectoryPath}/${dbFileName}`;
  const localPath = Platform.OS === 'ios' 
  ? `${RNFS.DocumentDirectoryPath}/${dbFileName}`
  : `${RNFS.DocumentDirectoryPath}/${dbFileName}`;
  const targetDBPath = `${RNFS.LibraryDirectoryPath}/${dbFileName}`; // iOS expects the DB here
  const versionUrl = `${FIREBASE_BASE_URL}/ssf_version.json`;
  const dbUrl = `${FIREBASE_BASE_URL}/ssf_${dbFileName}`;
  const versionKey = `db_version_${language}`;

  try {


    // Check if the local version is stored
    const localVersion = await AsyncStorage.getItem(versionKey) || '';
    
    let remoteVersion = localVersion || ''; // Default if not found
    console.log(`Local version for ${language}:`, localVersion);
    const dbExists = await RNFS.exists(localPath); // Check if the local database file exists

    // Check network connectivity
    const state = await NetInfo.fetch();
    if (!state.isConnected){
      console.warn('No Internet, can\'t check db updates, using local database if available.');
    }
    else {
      console.log('Internet connection is available. Proceeding to check for updates.');
      console.log(`Fetching version from: ${versionUrl}`);
      // const response = await fetch(versionUrl);
      const response = await fetch(`${versionUrl}?t=${Date.now()}`);
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response ok: ${response.ok}`);
      // console.log(`Response : ${response.json()[language]}`);

      if (!response.ok) {
          const errorText = await response.text(); // try to read error message
          throw new Error(`Failed to fetch version file: ${response.status} - ${errorText}`);
        }
        
  
      const remoteVersions = await response.json();
      console.log(`Response -------: ${remoteVersions[language]}`);
      // remoteVersion = remoteVersions['english']?.to String(); // Assuming 'english' is the key for the default language
      remoteVersion = remoteVersions[language]?.toString();
      console.log(`Remote version for ${language}:`, remoteVersion);

    }

    const checkPermissions = async (filePath) => {
      try {
          const directory = filePath.substring(0, filePath.lastIndexOf('/'));
          
          // Check if directory exists and is writable
          const dirExists = await RNFS.exists(directory);
          console.log('Directory exists:', dirExists);
          
          if (dirExists) {
              const dirStats = await RNFS.stat(directory);
              console.log('Directory stats:', dirStats);
          }
          
          // Try to create a test file
          const testFile = `${directory}/test_write.txt`;
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

  checkPermissions(localPath).then((hasPermission) => {
    if (!hasPermission) {
      throw new Error('No write permission to the directory');
    }
  });


    // if ((state.isConnected && !dbExists) || (state.isConnected && localVersion !== remoteVersion)) {
    if (!dbExists) {
      console.log(`⬇️ Downloading ${dbFileName}...`);
      console.log(`Database URL: ${dbUrl}`);
      console.log(`Local path: ${localPath}`);

      const result = await RNFS.downloadFile({
        fromUrl: dbUrl,
        toFile: localPath,
        headers: {
            'Accept': 'application/octet-stream',
          },
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
