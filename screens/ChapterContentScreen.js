import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPreDBConnection, getUsers, getMaxChapterId, getDBConnection_local } from '../database/Database';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { WebView } from 'react-native-webview';
import { useFontSize } from '../components/FontSizeContext/FontSizeContext';
import { useLanguage } from '../components/LanguageContext';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

// PAUSED: header/tab-bar hide-on-scroll is disabled for now. It was driven
// by scroll messages bridged from the WebView via postMessage, and no
// amount of tuning (thresholds, debouncing, then a continuous 1:1-tracked
// Animated.Value) got rid of the flicker — the bridge itself is the
// bottleneck, since every update has to cross to the JS thread before an
// animation can react to it. The real fix is dropping the WebView for
// chapter content in favor of react-native-render-html in a native
// ScrollView, which allows a genuinely native-driven, bridge-free
// Animated.event — planned as a follow-up. Until then, the header just
// stays put; no more flicker, at the cost of not hiding while reading.

const ChapterContentScreen = ({ navigation, route }) => {

  const { chapterId = 1, language : paramLang } = route.params || {};

  const { width } = useWindowDimensions();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [maxChapterId, setMaxChapterId] = useState(0);
  const { fontSize, increaseFont, decreaseFont } = useFontSize();
  const webViewRef = useRef(null);
  const { language, isLoading: isLanguageLoading } = useLanguage();

  // ✅ Memoize contentMap properly - prevents recreation on every render
  const contentMap = useMemo(() => {
    if (!contents.length) return {};
    const obj = {};
    contents.forEach(item => {
      obj[item.id] = item;
    });
    return obj;
  }, [contents]);

  // ✅ Memoize injected JavaScript to prevent WebView reloads
  const injectedJavaScript = useMemo(() => `
    const style = document.createElement('style');
    style.innerHTML = 'html { font-size: ${fontSize}px;transition: none; }';
    document.head.appendChild(style);
    true;
  `, [fontSize]);

  // ✅ Memoize functions to prevent recreating on every render
  const updateFontSizeInWebView = useCallback((fontSize) => {
    const jsCode = `
      document.body.style.fontSize = '${fontSize}px';
      true;
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  }, []); // No fontSize dependency - it's passed as parameter

  const saveLastReadChapter = useCallback(async (chapterId) => {
    try {
      console.log("saving chapterId: " + chapterId);
      await AsyncStorage.setItem('lastReadChapter', chapterId.toString());
    } catch (e) {
      console.log('Error saving last read chapter:', e);
    }
  }, []);

  const goToChapter = useCallback(async (chapterId) => {
    try {
      console.log("navigating to chapter: " + chapterId);
      await saveLastReadChapter(chapterId);
    } catch (e) {
      console.log('Error during save:', e);
    }
    navigation.navigate('ChapterContent', { chapterId, language });
  }, [navigation, language, saveLastReadChapter]);

  const handleLoadEnd = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectedJavaScript);
    }
  }, [injectedJavaScript]);

  // Safety net: if this tab is reached directly (e.g. a first-time user taps
  // the ChapterContent tab bar icon before ever selecting a language),
  // redirect to the Language selector instead of sitting on a spinner
  // forever with no way to pick a language.
  useEffect(() => {
    if (isLanguageLoading) return;
    if (!language) {
      console.log("ChapterContentScreen: no language set, redirecting to Language tab");
      navigation.navigate('Language');
    }
  }, [language, isLanguageLoading, navigation]);

  // ✅ Main data loading effect - only run when language changes
  useEffect(() => {
    if (!language) return;

    console.log("Loading data for language: " + language);
    setLoading(true);
    
    // Use Promise.all for better performance and error handling
    getDBConnection_local(language).then((db) => {
      Promise.all([
        getUsers(db, 'contents'),
        getMaxChapterId(db, 'contents')
      ]).then(([users, maxId]) => {
        console.log("Loaded users count: " + users.length);
        setContents(users);
        setMaxChapterId(maxId);
        setLoading(false);
      }).catch((error) => {
        console.log("Database error: " + error);
        setLoading(false);
      });
    });

  }, [language, isLanguageLoading]); // ✅ Only depend on language - prevents unnecessary database calls

  // ✅ Separate effect for font size updates - prevents mixing concerns
  useEffect(() => {
    updateFontSizeInWebView(fontSize);
  }, [fontSize, updateFontSizeInWebView]);

  // ✅ Separate effect for chapter ID changes - cleaner separation of concerns
  useEffect(() => {
    console.log("Chapter ID changed to: " + chapterId);
    setCurrentChapterId(chapterId);
  }, [chapterId]);

  // FIX: only persist "lastReadChapter" once a language is actually set.
  // Previously this ran unconditionally on mount, which meant a first-time
  // user who tapped the ChapterContent tab before ever picking a language
  // would silently write lastReadChapter=1 to AsyncStorage. On the next app
  // launch, TabNavigator would then read that value and boot straight into
  // ChapterContent instead of Sections — skipping the only screen that
  // redirects first-time users to the Language selector, so the app got
  // stuck on a permanent loading spinner with no way back to language
  // selection.
  useEffect(() => {
    if (!language) return;
    saveLastReadChapter(chapterId);
  }, [chapterId, language, saveLastReadChapter]);

  // ✅ Memoize WebView HTML content - prevents unnecessary WebView reloads
  const webViewHTML = useMemo(() => {
    const content = contentMap[chapterId]?.content || '';
    return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${content}<div style="height:50;"></div></body></html>`;
  }, [contentMap, chapterId]);

  return (
    <AppLayout
      fontSize={fontSize}
      increaseFont={increaseFont}
      decreaseFont={decreaseFont}
      showFontControls={false}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          {loading || !contentMap[chapterId]?.content ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" style={styles.spinner} />
              <Text style={styles.loadingText}>Loading content...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: webViewHTML }}
                style={{flex: 1, paddingBottom: 50}}
                javaScriptEnabled={true}
                onLoadEnd={handleLoadEnd}
              />
            </View>
          )}
        </View>
      </View>

      {/*
        The tab bar is the standard, always-visible one (TabNavigator's
        custom animated version is disabled — see the note there), which
        lays out normally and already reserves its own space. So this just
        needs a small fixed gutter above it, not the tab bar's height.
      */}
      <View style={[styles.navContainer, { bottom: 20 }]}>
        <TouchableOpacity
          onPress={() => goToChapter(currentChapterId - 1)}
          disabled={currentChapterId <= 1}
          activeOpacity={0.7}
          style={[styles.circleButton, currentChapterId <= 1 && styles.disabledButton]}>
          <Icon name="chevron-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => goToChapter(currentChapterId + 1)}
          disabled={currentChapterId >= maxChapterId}
          activeOpacity={0.7}
          style={[styles.circleButton, currentChapterId >= maxChapterId && styles.disabledButton]}>
          <Icon name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>

    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5, backgroundColor: 'rgb(255, 255, 255)' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  navContainer: {
    position: 'absolute', 
    left: 20, 
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 50,
    elevation: 10,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChapterContentScreen;