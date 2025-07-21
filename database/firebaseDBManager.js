import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_BASE_URL = 'https://shepherd-s-staff.web.app/databases';

export const ensureDatabaseExists = async (language) => {
  const dbFileName = `${language}.db`;
  const localPath = `${RNFS.DocumentDirectoryPath}/${dbFileName}`;
  const versionUrl = `${FIREBASE_BASE_URL}/ssf_version.json`;
  const dbUrl = `${FIREBASE_BASE_URL}/${dbFileName}`;
  const versionKey = `db_version_${language}`;

  try {


    // Check if the local version is stored
    const localVersion = await AsyncStorage.getItem(versionKey);
    let remoteVersion = localVersion; // Default if not found
    const dbExists = await RNFS.exists(localPath); // Check if the local database file exists

    // Check network connectivity
    const state = await NetInfo.fetch();
    if (!state.isConnected){
      console.warn('No Internet, can\'t check db updates, using local database if available.');
    }
    else {
      console.log('Internet connection is available. Proceeding to check for updates.');
      const response = await fetch(versionUrl);

      if (!response.ok) {
          const errorText = await response.text(); // try to read error message
          throw new Error(`Failed to fetch version file: ${response.status} - ${errorText}`);
        }
        
  
      const remoteVersions = await response.json();
      remoteVersion = remoteVersions['english']?.toString(); // Assuming 'english' is the key for the default language
      // const remoteVersion = remoteVersions['language']?.toString();
  
      console.log(`Remote version for ${language}:`, remoteVersion);

    }


    if ((state.isConnected && !dbExists) || (state.isConnected && localVersion !== remoteVersion)) {
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

      
      // const fileInfo = await RNFS.stat(this.dbPath);
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
  } catch (err) {
    console.error('⚠️ DB fetch/setup failed:', err);
    throw err;
  }
};
