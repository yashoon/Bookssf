import React, {useState, useEffect, useRef} from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
import { getPreDBConnection, getUsers } from '../database/Database';
// import { NavigationContainer } from 'react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
import { WebView } from 'react-native-webview';
import { useFontSize } from '../components/FontSizeContext/FontSizeContext';


const source = {
  html: `
<p style='text-align:center;'>
  Hello World!
</p>`
};

const ChapterContentScreen = ({ navigation, route }) => {

  // console.log('Route:', route.params);
  const { chapterId } = route.params;
  // const { chapterId } = route.params?.chapterId ?? 2;
  //const { t } = useTranslation();
  //const chapter = chapterContents[chapterId] || {};
  const { width } = useWindowDimensions();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const maxChapterId = 10; // replace with the actual max chapter ID
  // const [fontSize, setFontSize] = useFontSize();//useState(16); // default font size
  const { fontSize, increaseFont, decreaseFont } = useFontSize();
  const webViewRef = useRef(null); // create a ref for the WebView
  // const increaseFont = () => setFontSize((prev) => prev + 2);
  // const decreaseFont = () => setFontSize((prev) => (prev > 10 ? prev - 2 : prev));
  const myObject = {};

  // const goToChapter = (chapterId) => {
  //   console.log("saving in async from next and previous buttons" + chapterId)
  //   saveLastReadChapter(chapterId);
  //   navigation.navigate('ChapterContent', { chapterId }); // use replace to avoid stack buildup
  // };

  const updateFontSizeInWebView = (fontSize) => {
    const jsCode = `
      //  document.body.style.backgroundColor = 'lightyellow';
      document.body.style.fontSize = '${fontSize}px';
      true; // note: this is required for the webview to work properly
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  const injectedJavaScript = `
    const style = document.createElement('style');
    style.innerHTML = 'html { font-size: ${fontSize}px;transition: none; }';
    document.head.appendChild(style);
    true; // Required to indicate successful injection
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

  console.log("before effect");
  useEffect(() => { 
    getPreDBConnection().then((db) => {
        getUsers(db, 'contents').then((users) => {
            console.log("This is content List::::::: " + users)
            setContents(users);
            // Convert array to object
            users.forEach(item => {
              // myObject[item.chapter_id] = item;
              myObject[item.id] = item;
            });
            console.log("This is myObject::::::: " + myObject)
            console.log("This is Content List::::::: " + users)
            setLoading(false);
        }, (error) => {
          console.log("This is error::::::: " + error)
          // setLoading(true);
        }
      );
    });
    // loadDataCallback();
    // console.log('Chapters: ', chapters);
    setCurrentChapterId(chapterId);
    //update font size
    updateFontSizeInWebView(fontSize);
    // if (currentChapterId) {
    //   saveLastReadChapter(currentChapterId);
    // }
    console.log('📦 FontSizeProvider rendered. Current fontSize:', fontSize);
  }, [chapterId? chapterId : 1, fontSize]);
    console.log("after effect -----" + contents[chapterId]?.content);
    console.log(myObject)
    contents.forEach(item => {
      // myObject[item.chapter_id] = item;
      myObject[item.id] = item;
    });

  return (
    // <FontSizeProvider>
    <AppLayout
    fontSize={fontSize}
    increaseFont={increaseFont}
    decreaseFont={decreaseFont}
    showFontControls={true}
    >
    <SafeAreaView style={styles.container}>
    
  <View style={{ flex: 1 }}>
    <View style={styles.container}>
      {
      loading || (typeof myObject[chapterId]?.content === "undefined") ? (
        
        <View style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="blue" />
          <Text style={{ marginTop: 10, fontSize: 18, color: 'gray' }}>
            No content found ...
          </Text>
        </View>
      ) : 
      (
      <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        // source={{ html: myObject[chapterId]?.content }}
        source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${myObject[chapterId]?.content}</body></html>` }}
        style={{flex: 1 }}
        // injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        onLoadEnd={handleLoadEnd}
      />
      </View>
      )
      }
    </View>
    {/* </ScrollView> */}
    </View>

    {/* adding buttons for chapter navigation */}

<View style={styles.navContainer}>
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
</View>

    </SafeAreaView>
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
    position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between'
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
