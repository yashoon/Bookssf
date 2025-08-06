import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getPreDBConnection, getUsers, getMaxChapterId, getDBConnection_local } from '../database/Database';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { WebView } from 'react-native-webview';
import { useFontSize } from '../components/FontSizeContext/FontSizeContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const ChapterContentScreen = ({ navigation, route, toggleTabBar, tabBarTranslateY }) => {

  const { chapterId = 1, language : paramLang } = route.params || {};
  
  const { width } = useWindowDimensions();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(paramLang); // ✅ Direct initialization instead of null
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [maxChapterId, setMaxChapterId] = useState(0);
  const { fontSize, increaseFont, decreaseFont } = useFontSize();
  const webViewRef = useRef(null);
  const [showUI, setShowUI] = useState(true);
  const scrollOffset = useRef(0);
  const lastScrollY = useRef(0);
  const lastToggleTime = useRef(Date.now());
  const SCROLL_DEBOUNCE_MS = 300;
  const MIN_SCROLL_DELTA = 15;
  const tabBarHeight = useBottomTabBarHeight();

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

  const injectedJS = useMemo(() => `
    window.addEventListener('scroll', () => {
      window.ReactNativeWebView.postMessage(window.scrollY.toString());
    });
    true;
  `, []); // No dependencies since this script doesn't change

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

  const toggleUI = useCallback((visible) => {
    console.log("toggling UI: " + visible);
    if (toggleTabBar) {
      toggleTabBar(visible);
    }
    setShowUI(visible);
    navigation.setOptions({
      headerShown: false
    });
  }, [toggleTabBar, navigation]);

  const handleWebViewMessage = useCallback((event) => {
    const scrollY = Number(event.nativeEvent.data);
    const now = Date.now();
    const delta = scrollY - lastScrollY.current;

    if (Math.abs(delta) < MIN_SCROLL_DELTA || now - lastToggleTime.current < SCROLL_DEBOUNCE_MS) {
      return;
    }

    if (delta > 0) {
      toggleUI(false);
    } else {
      toggleUI(true);
    }

    lastScrollY.current = scrollY;
    lastToggleTime.current = now;
  }, [toggleUI]);

  const handleLoadEnd = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectedJavaScript);
    }
  }, [injectedJavaScript]);

  const handleTap = useCallback(() => {
    if (!showUI) toggleUI(true);
  }, [showUI, toggleUI]);

  // ✅ Separate useEffect for language initialization - prevents unnecessary re-runs
  useEffect(() => {
    if (paramLang && paramLang !== language) {
      setLanguage(paramLang);
    }
  }, [paramLang]); // Only depend on paramLang, not language to avoid loops

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

  }, [language]); // ✅ Only depend on language - prevents unnecessary database calls

  // ✅ Separate effect for font size updates - prevents mixing concerns
  useEffect(() => {
    updateFontSizeInWebView(fontSize);
  }, [fontSize, updateFontSizeInWebView]);

  // ✅ Separate effect for chapter ID changes - cleaner separation of concerns
  useEffect(() => {
    console.log("Chapter ID changed to: " + chapterId);
    setCurrentChapterId(chapterId);
    saveLastReadChapter(chapterId);
  }, [chapterId, saveLastReadChapter]);

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
      showFontControls={true}
      showAppLayout={showUI}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          {loading || !contentMap[chapterId]?.content ? (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="green" />
              <Text style={{ marginTop: 10, fontSize: 18, color: 'gray' }}>
                Loading content...
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: webViewHTML }}
                style={{flex: 1, paddingBottom: 50}}
                injectedJavaScript={injectedJS}
                javaScriptEnabled={true}
                onLoadEnd={handleLoadEnd}
                scrollEventThrottle={16}
                onMessage={handleWebViewMessage}
              />
            </View>
          )}
        </View>
      </View>

      <Animated.View
        style={[
          styles.navContainer,
          {
            transform: [{
              translateY: tabBarTranslateY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, tabBarHeight],
                extrapolate: 'clamp',
              }),
            }],
            bottom: tabBarHeight + 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => goToChapter(currentChapterId - 1)}
          disabled={currentChapterId <= 1}
          style={[styles.circleButton, currentChapterId <= 1 && styles.disabledButton]}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => goToChapter(currentChapterId + 1)}
          disabled={currentChapterId >= maxChapterId}
          style={[styles.circleButton, currentChapterId >= maxChapterId && styles.disabledButton]}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </Animated.View>

    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  content: { fontSize: 30, textAlign: 'justify', color:'red' },
  content_id: { fontSize: 15, textAlign: 'justify', color:'black' },
  webview: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'red',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  fontButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  navText: {
    color: 'white',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
    backgroundColor: 'rgb(4, 118, 40)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    opacity: 0.7,
  },
  arrowText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});

export default ChapterContentScreen;