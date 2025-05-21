import React, {useState, useEffect, useRef, useMemo} from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
import { getPreDBConnection, getUsers, getMaxChapterId } from '../database/Database';
// import { NavigationContainer } from 'react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { WebView } from 'react-native-webview';
import { useFontSize } from '../components/FontSizeContext/FontSizeContext';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const ChapterContentScreen = ({ navigation, route, toggleTabBar, tabBarTranslateY }) => {

  const { chapterId } = route.params;
  const { width } = useWindowDimensions();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const [maxChapterId, setMaxChapterId] = useState(0);
  const { fontSize, increaseFont, decreaseFont } = useFontSize();
  const webViewRef = useRef(null); // create a ref for the WebView
  const [showUI, setShowUI] = useState(true);
  const scrollOffset = useRef(0);
  // const navigation = useNavigation();
  const lastScrollY = useRef(0);
  const lastToggleTime = useRef(Date.now());
  const SCROLL_DEBOUNCE_MS = 300;
  const MIN_SCROLL_DELTA = 15;
  // const translateY = useRef(new Animated.Value(0)).current; // 0 = visible, 100 = hidden
  const tabBarHeight = useBottomTabBarHeight();
  // const translateY = tabBarTranslateY;
  // const { tabBarTranslateY } = props;


  
  const updateFontSizeInWebView = (fontSize) => {
    const jsCode = `
      //  document.body.style.backgroundColor = 'lightyellow';
      document.body.style.fontSize = '${fontSize}px';
      true; // note: this is required for the webview to work properly
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  //this is for changing font size
  const injectedJavaScript = `
    const style = document.createElement('style');
    style.innerHTML = 'html { font-size: ${fontSize}px;transition: none; }';
    document.head.appendChild(style);
    true; // Required to indicate successful injection
  `;

  // this is for sending the scroll position to the app
  const injectedJS = `
  window.addEventListener('scroll', () => {
    window.ReactNativeWebView.postMessage(window.scrollY.toString());
  });
  true;
`;

  const handleLoadEnd = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(injectedJavaScript);
    }
  };

  const goToChapter = async (chapterId) => {
    try {
      console.log("saving in async from next and previous buttons " + chapterId);
      await saveLastReadChapter(chapterId);
    } catch (e) {
      console.log('Error during save:', e);
      // Optionally show a toast or fallback
    }
    navigation.navigate('ChapterContent', { chapterId });
  };

  const saveLastReadChapter = async (chapterId) => {
    try {
      console.log("this is Async saving chapterId" + chapterId)
      await AsyncStorage.setItem('lastReadChapter', chapterId.toString());
    } catch (e) {
      console.log('Error saving last read chapter:', e);
    }
  };

  function getContents(chapterId){
    console.log("this is changing text")
    return null;
  };

  // const toggleUI = (visible) => {
  //   console.log("this is toggling UI" + visible, translateY)
  //   Animated.timing(translateY, {
  //     toValue: visible ? 0 : 100, // Push down to hide
  //     duration: 500,
  //     useNativeDriver: true,
  //   }).start();
  //   setShowUI(visible);
  //   navigation.setOptions({
  //     headerShown: false,
  //     tabBarStyle: visible ? undefined : { display: 'none' }, // optional: force hide if needed
  //   });
  // };
  const toggleUI = (visible) => {
    console.log("this is toggling UI: " + visible);
    // Call the function passed from the tab navigator
    if (toggleTabBar) {
      toggleTabBar(visible);
    }
    setShowUI(visible);
    navigation.setOptions({
      headerShown: false
      // Remove tabBarStyle because it doesn't work this way with bottom tabs
      // tabBarStyle: visible ? undefined : { display: 'none' },
    });
  };

  const handleWebViewMessage = (event) => {
    const scrollY = Number(event.nativeEvent.data);
    const now = Date.now();
    const delta = scrollY - lastScrollY.current;

    if (Math.abs(delta) < MIN_SCROLL_DELTA || now - lastToggleTime.current < SCROLL_DEBOUNCE_MS) {
      return;
    }

    if (delta > 0) {
      // Scrolling down
      // setShowUI(false);
      toggleUI(false);
    } else {
      // Scrolling up
      // setShowUI(true);
      toggleUI(true);
    }

    lastScrollY.current = scrollY;
    lastToggleTime.current = now;
  };

  const handleTap = () => {
    if (!showUI) toggleUI(true);
  };

  console.log("before effect");
  useEffect(() => { 
    getPreDBConnection().then((db) => {
        getUsers(db, 'contents').then((users) => {
            console.log("This is content List::::::: " + users)
            setContents(users);
            // Convert array to object
            users.forEach(item => {
              contentMap[item.id] = item;
            });
            console.log("This is Content List::::::: " + users)
            setLoading(false);
        }, (error) => {
          console.log("This is error::::::: " + error)
          // setLoading(true);
        }
      );
        getMaxChapterId(db, 'contents').then((maxId) => {
          // console.log('Max chapter ID:', maxId);
          setMaxChapterId(maxId);
        });
    });
    

    //getting Max Chapter ID
    getMaxChapterId().then((maxId) => {
      console.log('Max chapter ID:', maxId);
    });
    //getting Max Chapter ID

    //update font size
    updateFontSizeInWebView(fontSize);

    console.log('tab bar height:', tabBarHeight);
    setCurrentChapterId(chapterId);

  // }, [chapterId? chapterId : 1, fontSize, navigation, maxChapterId]);
  }, [fontSize, maxChapterId]);
    console.log("after effect -----" + contents[chapterId]?.content);

  // Sync chapterId from route
useEffect(() => {
  console.log("this is chapterId from route" + route.params.chapterId)
  setCurrentChapterId(route.params.chapterId);
  try {
    console.log("saving in async from next and previous buttons " + chapterId);
     saveLastReadChapter(chapterId);
  } catch (e) {
    console.log('Error during save:', e);
    // Optionally show a toast or fallback
  }
}, [route.params.chapterId]);

// for animating the nav buttons
// const buttonBottom = tabBarTranslateY.interpolate({
//   inputRange: [0, 100],  // tab visible (0) -> hidden (100)
//   outputRange: [tabBarHeight + 10, 30],
//   extrapolate: 'clamp',
// });
// const navOpacity = tabBarTranslateY.interpolate({
//   inputRange: [0, 100],
//   outputRange: [1, 0], // fully visible → fully transparent
//   extrapolate: 'clamp',
// });

  const contentMap = useMemo(() => {
      const obj = {};
      contents.forEach(item => {
        obj[item.id] = item;
      });
      return obj;
    }, [contents]);

  return (
    // <FontSizeProvider>
    <AppLayout
    fontSize={fontSize}
    increaseFont={increaseFont}
    decreaseFont={decreaseFont}
    showFontControls={true}
    showAppLayout={showUI}
    >
    {/* <SafeAreaView style={styles.container}> */}
    
  <View style={{ flex: 1 }}>
    <View style={styles.container}>
      {
      loading || (typeof contentMap[chapterId]?.content === "undefined") ? (
        
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, fontSize: 18, color: 'gray' }}>
            No content found ...
          </Text>
        </View>
      ) : 
      (
      // <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${contentMap[chapterId]?.content}<div style="height:50;"></div></body></html>` }}
        style={{flex: 1,paddingBottom: 50}}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        onLoadEnd={handleLoadEnd}
        scrollEventThrottle={16}
        onMessage={handleWebViewMessage}
      />
      </View>
      // </TouchableWithoutFeedback>
      )
      }
      
    </View>
    {/* </ScrollView> */}
    </View>

    {/* adding buttons for chapter navigation */}

{/* <View style={styles.navContainer} contentContainerStyle={{ paddingBottom: tabBarHeight }}> */}

{/* <View style={[styles.navContainer, { bottom: showUI ? tabBarHeight + 10 : 30 }]}> */}
<Animated.View
  style={[
    styles.navContainer,
    {
      transform: [{
        translateY: tabBarTranslateY.interpolate({
          inputRange: [0, 100],
          outputRange: [0, tabBarHeight], // move down when tab hides
          extrapolate: 'clamp',
        }),
      }],
      // opacity: navOpacity, // 🔥 Fade in/out
      bottom: tabBarHeight + 20, // ✅ dynamic bottom padding
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
    {/* <Text style={styles.navText}>Next →</Text> */}
    <Text style={styles.arrowText}>›</Text>
  </TouchableOpacity>
</Animated.View>

    {/* </SafeAreaView> */}
    </AppLayout>
    // </FontSizeProvider>
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
    borderColor: 'red', // to see if it's rendering at all
    // height: 500,
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
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // marginTop: 20,
    // paddingHorizontal: 40,
    position: 'absolute', 
    // bottom: 100, 
    left: 20, 
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 50, // <- higher than tab bar (which you had at zIndex: 10)
    elevation: 10, // <- for Android
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
