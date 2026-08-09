import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import AppLayout from '../components/AppLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDBConnection_local, getUsers } from '../database/Database';
import { useLanguage } from '../components/LanguageContext';
import { ProgressBar } from '@react-native-community/progress-bar-android';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

// Friendly display labels for language codes (keep in sync with LanguageSelectorScreen)
const LANGUAGE_LABELS = {
  english: 'English',
  nepali: 'Nepali',
  hindi: 'हिन्दी',
  telugu: 'తెలుగు',
  swahili: 'Kiswahili',
};

const getLanguageLabel = (code) => {
  if (!code) return '';
  return LANGUAGE_LABELS[code] || code.charAt(0).toUpperCase() + code.slice(1);
};

const SectionMenuScreen = ({ navigation, route }) => {
  const [lastReadChapter, setLastReadChapter] = useState(null);
  const { language, isFirstTime, hasLanguageSet, isLoading: isLanguageLoading } = useLanguage();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('checking'); // 'checking', 'downloading', 'processing', 'complete'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isInitialRender = useRef(true);

  // Loading stage messages
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'checking':
        return 'Checking language settings...';
      case 'downloading':
        return 'Downloading database...';
      case 'processing':
        return 'Preparing your sections...';
      case 'complete':
        return 'All set!';
      default:
        return 'Loading...';
    }
  };

  // Icon shown next to the loading message, matching the status-icon language
  // used on the Language Selector screen
  const getLoadingIconName = () => {
    switch (loadingStage) {
      case 'checking':
        return 'help-circle-outline';
      case 'downloading':
        return 'cloud-download';
      case 'processing':
        return 'sync';
      case 'complete':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const getLoadingIconColor = () => {
    switch (loadingStage) {
      case 'downloading':
        return '#2196F3';
      case 'processing':
        return '#FFA726';
      case 'complete':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const fetchLanguage_new = async () => {
    if (!hasLanguageSet) {
      console.log("SectionMenuScreen: no language set, redirecting to Language tab");
      // This screen needs language - redirect to language selector
      navigation.navigate('Language');
      return;
    }

    try {
      setLoadingStage('downloading');
      setDownloadProgress(0);
      
      console.log("Final Language for Sections Screen: " + language);
      
      // Simulate download progress (you can replace this with actual download progress)
      const simulateDownload = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setDownloadProgress(progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            setLoadingStage('processing');
          }
        }, 200); // Update every 200ms
      };
      
      simulateDownload();
      
      // Get database connection (this might involve downloading)
      const db = await getDBConnection_local(language);
      
      // Update stage to processing
      setLoadingStage('processing');
      
      // Get sections
      const sectionlist = await getUsers(db, 'sections');
      
      console.log("This is section List: ", sectionlist);
      setSections(sectionlist);
      
      // Complete loading
      setLoadingStage('complete');
      setTimeout(() => {
        setLoading(false);
      }, 500); // Brief pause to show completion
      
    } catch (error) {
      console.error('Error fetching sections:', error);
      setLoadingStage('error');
      setLoading(false);
      // You could show an error message here
    }
  };

  // Fetch last read chapter from AsyncStorage — independent of language
  // state, safe to run once on mount.
  useEffect(() => {
    const fetchLastRead = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastReadChapter');
        if (stored) {
          setLastReadChapter(parseInt(stored, 10));
        }
      } catch (e) {
        console.log('Error loading last chapter:', e);
      }
    };

    fetchLastRead();
  }, []);

  // Single source of truth for language-driven behavior. Waits until
  // LanguageContext has actually resolved (isLanguageLoading === false)
  // before deciding anything, then either redirects to language selection
  // or fetches sections — covering every case, including "loading just
  // finished and there's still no language set," which previously had no
  // effect listening for it and left the screen stuck.
  useEffect(() => {
    if (isLanguageLoading) return;

    if (!hasLanguageSet) {
      console.log("SectionMenuScreen: no language set, redirecting to Language tab");
      navigation.navigate('Language');
      return;
    }

    if (language) {
      console.log("Fetching sections for language: " + language);
      setLoading(true);
      setLoadingStage('checking');
      setSections([]);
      fetchLanguage_new();
    }
  }, [language, hasLanguageSet, isLanguageLoading]);

  // Show loading screen while language context is loading
  if (isLanguageLoading) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="green" />
          <Text style={styles.loadingText}>Initializing language settings...</Text>
        </View>
      </AppLayout>
    );
  }

  // Show loading with progress
  if (loading || sections.length === 0) {
    return (
      <AppLayout>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={styles.title}>Book Sections</Text>
          {language && (
            <Text style={styles.subtitle}>Getting things ready in {getLanguageLabel(language)}</Text>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.loadingMessageRow}>
              <Icon
                name={getLoadingIconName()}
                size={18}
                color={getLoadingIconColor()}
                style={styles.loadingMessageIcon}
              />
              <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
            </View>
            
            <ActivityIndicator 
              size="large" 
              color="green" 
              style={styles.spinner} 
            />
            
            {loadingStage === 'downloading' && (
              <View style={styles.progressWrapper}>
                <Text style={styles.progressText}>
                  {downloadProgress}% complete
                </Text>
                
                {Platform.OS === 'android' ? (
                  <View style={styles.example}>
                    <ProgressBar
                      styleAttr="Horizontal"
                      animating={true}
                      color="#2196F3"
                    />
                  </View>
                ) : (
                  // iOS progress bar alternative
                  <View style={styles.progressBarIOS}>
                    <View 
                      style={[
                        styles.progressFillIOS, 
                        { width: `${downloadProgress}%` }
                      ]} 
                    />
                  </View>
                )}
              </View>
            )}
            
            {loadingStage === 'processing' && (
              <Text style={styles.subText}>
                Setting up your content...
              </Text>
            )}
            
            {loadingStage === 'complete' && (
              <View style={styles.completeRow}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" style={styles.completeIcon} />
                <Text style={[styles.subText, { color: '#4CAF50', fontStyle: 'normal', fontWeight: '600' }]}>
                  Ready to go!
                </Text>
              </View>
            )}

            {loadingStage === 'error' && (
              <View style={styles.completeRow}>
                <Icon name="alert-circle" size={16} color="#F44336" style={styles.completeIcon} />
                <Text style={[styles.subText, { color: '#F44336', fontStyle: 'normal', fontWeight: '600' }]}>
                  Something went wrong. Please try again.
                </Text>
              </View>
            )}
          </View>
        </View>
      </AppLayout>
    );
  }

  // Show sections
  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Book Sections</Text>
        
        {language && (
          <View style={styles.languageBadgeContainer}>
            <View style={styles.languageBadge}>
              <Icon name="language-outline" size={14} color="#4CAF50" style={styles.languageBadgeIcon} />
              <Text style={styles.languageBadgeText}>{getLanguageLabel(language)}</Text>
            </View>
          </View>
        )}

        {sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="file-tray-outline" size={40} color="#bbb" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No sections available yet</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              activeOpacity={0.7}
              onPress={() => {
                setLoading(true);
                setLoadingStage('checking');
                fetchLanguage_new();
              }}
            >
              <Icon name="refresh-outline" size={16} color="white" style={styles.retryButtonIcon} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sections.map((section) => (
            <TouchableOpacity
              key={section.section_id}
              style={styles.sectionButton}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ChapterList', {
                  section: section.section_id,
                  language: language, // Pass current language
                })
              }
            >
              <View style={styles.sectionIconBadge}>
                <Icon name="book-outline" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.sectionText}>{section.section_name}</Text>
              <Icon name="chevron-forward" size={20} color="#bbb" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(255, 255, 255)',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 4,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 15,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  loadingMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  loadingMessageIcon: {
    marginRight: 6,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  spinner: {
    marginVertical: 20,
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
  },
  example: {
    width: '80%',
    marginVertical: 4,
  },
  progressBarIOS: {
    width: '80%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillIOS: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  subText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  completeIcon: {
    marginRight: 6,
  },
  languageBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageBadgeIcon: {
    marginRight: 6,
  },
  languageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionText: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  retryButtonIcon: {
    marginRight: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SectionMenuScreen;