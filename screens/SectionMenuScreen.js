import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ProgressBarAndroid, Platform } from 'react-native';
import AppLayout from '../components/AppLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDBConnection_local, getUsers } from '../database/Database';
import { useLanguage } from '../components/LanguageContext';

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
        return 'Downloading database from internet...';
      case 'processing':
        return 'Processing sections...';
      case 'complete':
        return 'Loading complete!';
      default:
        return 'Loading...';
    }
  };

  const fetchLanguage_new = async () => {
    if (!hasLanguageSet) {
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

  useEffect(() => {
    // Fetch last read chapter from AsyncStorage
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
    
    // Only fetch if language is available
    if (hasLanguageSet && language && !isLanguageLoading) {
      fetchLanguage_new();
    } else if (!hasLanguageSet && !isLanguageLoading) {
      // No language set, redirect
      navigation.navigate('Language');
    }
  }, []);

  useEffect(() => {
    // Re-fetch when language changes
    if (language && hasLanguageSet && !isLanguageLoading) {
      console.log("Language changed, re-fetching sections for: " + language);
      setLoading(true);
      setLoadingStage('checking');
      setSections([]); // Clear existing sections
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
          <Text style={styles.title}>Sections of the Book</Text>
          
          <View style={styles.progressContainer}>
            <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
            
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
                  <ProgressBarAndroid
                    styleAttr="Horizontal"
                    indeterminate={false}
                    progress={downloadProgress / 100}
                    color="green"
                    style={styles.progressBar}
                  />
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
              <Text style={[styles.subText, { color: 'green' }]}>
                ✓ Ready to go!
              </Text>
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
        <Text style={styles.title}>Sections of the Book</Text>
        
        {/* Show current language for debugging */}
        <Text style={styles.debugText}>Language: {language}</Text>

        {sections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Sections Available</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setLoadingStage('checking');
                fetchLanguage_new();
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sections.map((section) => (
            <TouchableOpacity
              key={section.section_id}
              style={styles.sectionButton}
              onPress={() =>
                navigation.navigate('ChapterList', {
                  section: section.section_id,
                  language: language, // Pass current language
                })
              }
            >
              <Text style={styles.sectionText}>{section.section_name}</Text>
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
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontWeight: '500',
  },
  spinner: {
    marginVertical: 20,
  },
  progressWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
  },
  progressBar: {
    width: '80%',
    height: 8,
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
    backgroundColor: 'green',
    borderRadius: 4,
  },
  subText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  sectionButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionText: {
    fontSize: 18,
    textAlign: 'left',
    color: '#333',
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'green',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SectionMenuScreen;