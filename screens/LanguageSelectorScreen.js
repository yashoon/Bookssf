import React, { lazy, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, SectionList, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../components/LanguageContext';
import RNFS from 'react-native-fs';
import { getDBConnection_local } from '../database/Database';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'english' },
  { label: 'Nepali', value: 'nepali' },
  { label: 'हिन्दी', value: 'hindi' },
  // { label: 'తెలుగు', value: 'telugu' },
  // { label: 'Kiswahili', value: 'swahili' },
  // Add more as needed 
];

export default function LanguageSelectorScreen({ navigation }) {
  const { isFirstTime, language, setLanguage, isLoading: isLanguageLoading } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [checkingFiles, setCheckingFiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Actual rendered height of the bottom tab bar (includes safe-area adjustments).
  // NOTE: this only works if LanguageSelectorScreen is rendered inside a
  // Tab.Navigator (directly, or nested inside a Stack that itself sits inside
  // the tab navigator). If this screen is NOT under a Tab.Navigator, this hook
  // will throw — swap for useSafeAreaInsets() + a fixed estimate instead.
  const tabBarHeight = useBottomTabBarHeight();

  const title = isFirstTime 
    ? 'Welcome! Please select your language' 
    : 'Change Language';

  // Filter first, then bucket into sections: Downloaded / Downloading / Available
  const filteredOptions = LANGUAGE_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const downloadedItems = filteredOptions.filter(
    (opt) => downloadStatus[opt.value] === 'downloaded'
  );
  const downloadingItems = filteredOptions.filter(
    (opt) => downloadStatus[opt.value] === 'downloading'
  );
  const availableItems = filteredOptions.filter((opt) => {
    const status = downloadStatus[opt.value];
    return status !== 'downloaded' && status !== 'downloading';
  });

  const sections = [
    ...(downloadedItems.length > 0 ? [{ title: 'Downloaded', data: downloadedItems }] : []),
    ...(downloadingItems.length > 0 ? [{ title: 'Downloading', data: downloadingItems }] : []),
    ...(availableItems.length > 0 ? [{ title: 'Available to Download', data: availableItems }] : []),
  ];

  const handleLanguageChange = async (selectedLanguage) => {
    setLoading(true);
    try {
      console.log("Selected Language: " + selectedLanguage);
      const languageLowerCase = selectedLanguage.toLowerCase();
      
      const exists = await checkFileExists(languageLowerCase);
      
      if (!exists && !isFirstTime) {
        console.log("Database does not exist for: " + exists);
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
      const dbPath = Platform.OS === 'ios' 
      ? `${RNFS.LibraryDirectoryPath}/${languageCode}.db`
      : `${RNFS.DocumentDirectoryPath}/${languageCode}.db`;
      const exists = await RNFS.exists(dbPath);
      console.log(`Database file for ${languageCode} exists:`, exists);
      console.log('Checked path:', dbPath);
      return exists;
    } catch (error) {
      console.error('Error checking file existence for', languageCode, ':', error);
      return false;
    }
  };

  // Function to download database
  const downloadDatabase = async (languageCode) => {
    try {
      setDownloadStatus(prev => ({
        ...prev,
        [languageCode]: 'downloading'
      }));

      // FIX ("first-time language download is taking time"): this used to
      // add a flat, unconditional 2-second delay after the real download
      // finished, for no functional reason — a pure tax on top of however
      // long the actual network transfer already took.
      await getDBConnection_local(languageCode);

      setDownloadStatus(prev => ({
        ...prev,
        [languageCode]: 'downloaded'
      }));

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

  useEffect(() => {
    console.log("LanguageSelectorScreen mounted");
  }, []);

  // Check file existence for all languages on component mount
  useEffect(() => {
    // FIX ("app startup is slow"): this is the very first screen a
    // first-time user lands on (TabNavigator sends anyone with no language
    // set here), and it used to check every supported language's file
    // existence one at a time in a sequential for-loop — 12 separate,
    // serialized native-bridge round trips before the screen could render
    // anything useful. Each RNFS.exists() call is independent, so running
    // them concurrently is both safe and strictly faster.
    const checkAllLanguages = async () => {
      setCheckingFiles(true);

      const results = await Promise.all(
        LANGUAGE_OPTIONS.map(async (option) => {
          try {
            const exists = await checkFileExists(option.value);
            return [option.value, exists ? 'downloaded' : 'not_downloaded'];
          } catch (error) {
            console.error('Error checking', option.value, ':', error);
            return [option.value, 'error'];
          }
        }),
      );

      setDownloadStatus(Object.fromEntries(results));
      setCheckingFiles(false);
    };

    checkAllLanguages();
  }, []);

  useEffect(() => {
    console.log("LanguageSelectorScreen mounted");
  }, []);

  // Icon name based on download status
  const getStatusIconName = (languageValue) => {
    const status = downloadStatus[languageValue];
    switch (status) {
      case 'downloaded':
        return 'checkmark-circle';
      case 'downloading':
        return 'cloud-download';
      case 'not_downloaded':
        return 'cloud-download-outline';
      case 'error':
        return 'alert-circle';
      default:
        return 'help-circle-outline';
    }
  };

  // Color based on download status
  const getStatusColor = (languageValue) => {
    const status = downloadStatus[languageValue];
    switch (status) {
      case 'downloaded':
        return '#4CAF50';
      case 'downloading':
        return '#2196F3';
      case 'not_downloaded':
        return '#FFA726';
      case 'error':
        return '#F44336';
      default:
        return '#999';
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
        activeOpacity={0.8}
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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.value) + '20' }]}>
              <Icon 
                name={getStatusIconName(item.value)} 
                size={16} 
                color={getStatusColor(item.value)} 
              />
            </View>
            {isDownloading && (
              <ActivityIndicator size="small" color="#2196F3" style={styles.smallSpinner} />
            )}
          </View>
        </View>
        
        {!isDownloaded && !isDownloading && (
          <TouchableOpacity 
            style={styles.downloadButton}
            activeOpacity={0.7}
            onPress={async () => {
              try {
                await downloadDatabase(item.value);
              } catch (error) {
                Alert.alert('Download Failed', 'Failed to download database. Please try again.');
              }
            }}
          >
            <Icon name="download-outline" size={16} color="white" style={styles.downloadButtonIcon} />
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        
        {language && (
          <Text style={styles.currentLanguageText}>
            Current: {LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label || language}
          </Text>
        )}

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Icon name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {sections.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No languages found matching "{searchQuery}"</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.value}
            renderItem={renderLanguageItem}
            renderSectionHeader={renderSectionHeader}
            style={styles.languageList}
            contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
          />
        )}

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 6,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  noResultsText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  sectionHeaderContainer: {
    backgroundColor: 'rgb(255, 255, 255)',
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders as a distorted rectangle instead of following the
    // rounded corners, showing up as a dark box around the card. boxShadow
    // (New Architecture, already enabled) is correct on both platforms.
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(0, 0, 0, 0.1)' }],
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
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  smallSpinner: {
    marginLeft: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(76, 175, 80, 0.3)' }],
  },
  downloadButtonIcon: {
    marginRight: 6,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
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