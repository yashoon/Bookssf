import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { ScrollView } from 'react-native-gesture-handler';
import { getPreDBConnection, getUsers } from '../database/Database';
// import { NavigationContainer } from 'react-navigation/native';
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import TabNavigator from '../navigation/TabNavigator';


const source = {
  html: `
<p style='text-align:center;'>
  Hello World!
</p>`
};

const ChapterContentScreen = ({ navigation, route }) => {
  console.log('Route:', route.params);
  const { chapterId } = route.params;
  // const { chapterId } = route.params?.chapterId ?? 2;
  //const { t } = useTranslation();
  //const chapter = chapterContents[chapterId] || {};
  const { width } = useWindowDimensions();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState(chapterId);
  const maxChapterId = 10; // replace with the actual max chapter ID
  const [fontSize, setFontSize] = useState(16); // default font size
  const increaseFont = () => setFontSize((prev) => prev + 2);
  const decreaseFont = () => setFontSize((prev) => (prev > 10 ? prev - 2 : prev));
  const myObject = {};

  const goToChapter = (chapterId) => {
    navigation.navigate('ChapterContent', { chapterId }); // use replace to avoid stack buildup
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
              myObject[item.chapter_id] = item;
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
  }, [chapterId? chapterId : 1]);
    console.log("after effect -----" + contents[chapterId]?.content);
    console.log(myObject)
    contents.forEach(item => {
      myObject[item.chapter_id] = item;
    });

  return (
    <SafeAreaView style={styles.container}>
    {/* <Header />  */}
    
  <View style={{ flex: 1 }}>
  <View style={styles.controls}>
    <TouchableOpacity onPress={decreaseFont} style={styles.fontButton}>
      <Text style={styles.buttonText}>A-</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={increaseFont} style={styles.fontButton}>
     <Text style={styles.buttonText}>A+</Text>
    </TouchableOpacity>
  </View>
  
   <ScrollView>
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
      <View>
      {/* <Text style={styles.content_id}>{myObject[chapterId]?.content_id}</Text>  */}
      <RenderHTML contentWidth={width} source={{ html: myObject[chapterId]?.content }} 
      tagsStyles={{
        h1: { fontSize: fontSize + 12, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
        h4: { fontSize: fontSize, fontWeight: 'bold', marginBottom: 0, textAlign: 'left' },
        p: { fontSize: fontSize, lineHeight: 24, marginBottom: 10 },
        strong: { fontWeight: 'bold' },
        em: { fontStyle: 'italic' },
      }}
      />
      </View>
      )
      }
    </View>
    </ScrollView>
    </View>

    //adding buttons for chapter navigation

<View style={styles.navContainer}>
  <TouchableOpacity
    onPress={() => goToChapter(currentChapterId - 1)}
    disabled={currentChapterId <= 1}
    style={[styles.circleButton, currentChapterId <= 1 && styles.disabledButton]}>
    <Text style={styles.navText}>‹</Text>
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  content: { fontSize: 30, textAlign: 'justify', color:'red' },
  content_id: { fontSize: 15, textAlign: 'justify', color:'black' },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    opacity: 0.9,
  },
  arrowText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});

export default ChapterContentScreen;
