import React, { lazy, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../components/LanguageContext';
import { checkDatabaseExists } from '../database/Database'; // Import your DB check function
// import RNFS from 'react-native-fs'; // If you're using RNFS for file checking

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'english' },
  { label: 'Nepali', value: 'nepali' },
  { label: 'Telugu', value: 'telugu' },
  // Add more as needed
];

export default function LanguageSelectorScreen({ navigation }) {
  const { isFirstTime, language, setLanguage, isLoading: isLanguageLoading } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({}); // Track download status for each language
  const [checkingFiles, setCheckingFiles] = useState(true);

  // Show different UI for first-time vs changing language
  const title = isFirstTime 
    ? 'Welcome! Please select your language' 
    : 'Change Language';

  const handleLanguageChange = async (selectedLanguage) => {
    setLoading(true);
    try {
      console.log("Selected Language: " + selectedLanguage);
      const languageLowerCase = selectedLanguage.toLowerCase();
      
      // Check if database exists before proceeding
      const exists = await checkFileExists(languageLowerCase);
      
      if (!exists && !isFirstTime) {
        Alert.alert(
          'Database Not Found', 
          `The ${selectedLanguage} database is not downloaded. Do you want to download it now?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Download', 
              onPress: async () => {
                await downloadDatabase(languageLowerCase);
                await setLanguage(languageLowerCase);
                navigation.navigate('Sections', { language: languageLowerCase });
              }
            }
          ]
        );
        return;
      }

      await setLanguage(languageLowerCase);
      
      if (exists) {
        navigation.navigate('Sections', { language: languageLowerCase });
      } else {
        // For first-time users, proceed to sections (they'll download there)
        navigation.navigate('Sections', { language: languageLowerCase });
      }

    } catch (err) {
      console.error('Error setting language:', err);
      Alert.alert('Error', 'Failed to update language');
    } finally {
      setLoading(false);
    }
  };

  // Function to check if database file exists for a language
  const checkFileExists = async (languageCode) => {
    try {
      // Option 1: If you have a custom function to check DB existence
      const exists = await checkDatabaseExists(languageCode);
      return exists;

      // Option 2: If you're using RNFS to check file system
      // const dbPath = `${RNFS.DocumentDirectoryPath}/database_${languageCode}.db`;
      // const exists = await RNFS.exists(dbPath);
      // return exists;

      // Option 3: If you're using AsyncStorage to track downloads
      // const downloaded = await AsyncStorage.getItem(`db_downloaded_${languageCode}`);
      // return downloaded === 'true';

    } catch (error) {
      console.error('Error checking file existence for', languageCode, ':', error);
      return false;
    }
  };

  // Function to download database (you'll implement this based on your download logic)
  const downloadDatabase = async (languageCode) => {
    try {
      setDownloadStatus(prev => ({
        ...prev,
        [languageCode]: 'downloading'
      }));

      // Your download logic here
      // await downloadDatabaseFile(languageCode);
      
      // For now, simulate download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDownloadStatus(prev => ({
        ...prev,
        [languageCode]: 'downloaded'
      }));

      // Mark as downloaded in AsyncStorage
      await AsyncStorage.setItem(`db_downloaded_${languageCode}`, 'true');
      
    } catch (error) {
      console.error('Download failed for', languageCode, ':', error);
      setDownloadStatus(prev => ({
        ...prev,
        [languageCode]: 'error'
      }));
      throw error;
    }
  };

  // Check file existence for all languages on component mount
  useEffect(() => {
    const checkAllLanguages = async () => {
      setCheckingFiles(true);
      const statusMap = {};
      
      for (const option of LANGUAGE_OPTIONS) {
        try {
          const exists = await checkFileExists(option.value);
          statusMap[option.value] = exists ? 'downloaded' : 'not_downloaded';
        } catch (error) {
          console.error('Error checking', option.value, ':', error);
          statusMap[option.value] = 'error';
        }
      }
      
      setDownloadStatus(statusMap);
      setCheckingFiles(false);
    };

    checkAllLanguages();
  }, []);

  useEffect(() => {
    console.log("LanguageSelectorScreen mounted");
  }, []);

  // Get icon based on download status
  const getStatusIcon = (languageValue) => {
    const status = downloadStatus[languageValue];
    
    switch (status) {
      case 'downloaded':
        return '✅'; // Downloaded
      case 'downloading':
        return '⏬'; // Downloading
      case 'not_downloaded':
        return '⬇️'; // Not downloaded
      case 'error':
        return '❌'; // Error
      default:
        return '❓'; // Checking
    }
  };

  // Get status text
  const getStatusText = (languageValue) => {
    const status = downloadStatus[languageValue];
    
    switch (status) {
      case 'downloaded':
        return 'Downloaded';
      case 'downloading':
        return 'Downloading...';
      case 'not_downloaded':
        return 'Not Downloaded';
      case 'error':
        return 'Error';
      default:
        return 'Checking...';
    }
  };

  if (isLanguageLoading || checkingFiles) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="green" />
          <Text style={styles.loadingText}>
            {isLanguageLoading ? 'Loading language settings...' : 'Checking download status...'}
          </Text>
        </View>
      </AppLayout>
    );
  }

  const renderLanguageItem = ({ item }) => {
    const status = downloadStatus[item.value];
    const isDownloaded = status === 'downloaded';
    const isDownloading = status === 'downloading';
    const isCurrentLanguage = language === item.value;
    
    return (
      <TouchableOpacity 
        style={[
          styles.chapter,
          isCurrentLanguage && styles.selectedChapter,
          !isDownloaded && styles.notDownloadedChapter
        ]}
        onPress={() => {
          if (!isDownloading) {
            console.log("Selected Language: " + item.value);
            handleLanguageChange(item.value);
          }
        }}
        disabled={loading || isDownloading}
      >
        <View style={styles.languageItem}>
          <View style={styles.languageInfo}>
            <Text style={[
              styles.chapterText,
              isCurrentLanguage && styles.selectedChapterText,
              !isDownloaded && styles.notDownloadedText
            ]}>
              {item.label}
              {isCurrentLanguage && ' (Current)'}
            </Text>
            <Text style={styles.statusText}>
              {getStatusText(item.value)}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>
              {getStatusIcon(item.value)}
            </Text>
            {isDownloading && (
              <ActivityIndicator size="small" color="green" style={styles.smallSpinner} />
            )}
          </View>
        </View>
        
        {!isDownloaded && !isDownloading && (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={async () => {
              try {
                await downloadDatabase(item.value);
              } catch (error) {
                Alert.alert('Download Failed', 'Failed to download database. Please try again.');
              }
            }}
          >
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        
        {language && (
          <Text style={styles.currentLanguageText}>
            Current: {LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || language}
          </Text>
        )}

        <FlatList
          data={LANGUAGE_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={renderLanguageItem}
          style={styles.languageList}
        />

        {loading && (
          <View style={styles.globalLoadingOverlay}>
            <ActivityIndicator size="large" color="green" />
            <Text style={styles.loadingText}>Setting language...</Text>
          </View>
        )}
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: 'rgb(255, 255, 255)' 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10,
    marginTop: 20, 
    textAlign: 'center',
    color: '#333'
  },
  currentLanguageText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  languageList: {
    flex: 1,
  },
  chapter: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedChapter: {
    backgroundColor: '#e8f5e8',
    borderColor: 'green',
    borderWidth: 2,
  },
  notDownloadedChapter: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffa726',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageInfo: {
    flex: 1,
  },
  chapterText: { 
    fontSize: 18, 
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedChapterText: {
    color: 'green',
  },
  notDownloadedText: {
    color: '#ef6c00',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  smallSpinner: {
    marginLeft: 8,
  },
  downloadButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  globalLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// export default LanguageSelectorScreen;