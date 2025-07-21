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

    const response = await fetch(versionUrl);

    if (!response.ok) {
        const errorText = await response.text(); // try to read error message
        throw new Error(`Failed to fetch version file: ${response.status} - ${errorText}`);
      }
      

    const remoteVersions = await response.json();
    const remoteVersion = remoteVersions['english']?.toString(); // Assuming 'english' is the key for the default language
    // const remoteVersion = remoteVersions['language']?.toString();

    console.log(`Remote version for ${language}:`, remoteVersion);

    const localVersion = await AsyncStorage.getItem(versionKey);
    const dbExists = await RNFS.exists(localPath);

    if (!dbExists || localVersion !== remoteVersion) {
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
    } else {
      console.log('📦 DB already up to date');
    }

    return localPath;
  } catch (err) {
    console.error('⚠️ DB fetch/setup failed:', err);
    throw err;
  }
};
