import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { ScrollView } from 'react-native-gesture-handler';
import { getPreDBConnection, getUsers } from '../database/Database';
import { createBottomTabNavigator } from 'react-navigation/bottom-tabs';
import { NavigationContainer } from 'react-navigation/native';

function MyTabs() {
 
  return (
 
    <Tab.Navigator>
 
      <Tab.Screen name="Home" component={Welcome} />
 
      <Tab.Screen name="Settings" component={SettingsScreen} />
 
    </Tab.Navigator>
 
  );
 
}

const ChapterContentScreen = ({ route }) => {
  console.log('Route:', route.params);
  const { chapterId } = route.params;
  //const { t } = useTranslation();
  //const chapter = chapterContents[chapterId] || {};
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const myObject = {};



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
  }, [chapterId]);
    console.log("after effect -----" + contents[chapterId]?.content);
    console.log(myObject)
    contents.forEach(item => {
      myObject[item.chapter_id] = item;
    });

  return (
    <SafeAreaView style={styles.container}>
    {/* <Header />  */}
   <ScrollView>
    <View style={styles.container}>
      {/* <Text style={styles.title}>yash</Text>
      <Text style={styles.content}>Bangaram</Text> */}
      {/* <Text style={styles.title}>{t(contents[chapterId].chapter_id)}yash</Text>
      <Text style={styles.content}>{t(contents[chapterId].content)}Bangaram</Text> */}
      { 
      // loading || (typeof contents[chapterId]?.content === "undefined") ? (
        
      //   <View style={{ alignItems: 'center' }}>
      //     <ActivityIndicator size="large" color="blue" />
      //     <Text style={{ marginTop: 10, fontSize: 18, color: 'gray' }}>
      //       No content found ...
      //     </Text>
      //   </View>
      // ) : 
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
      {/* <Text style={styles.title}>{contents[chapterId]?.chapter_id}</Text>  */}
      <Text style={styles.title}>{myObject[chapterId]?.chapter_id}</Text> 
      <Text style={styles.content}>{myObject[chapterId]?.content}</Text> 
      {/* <Text style={styles.content}>{contents[chapterId]?.content}</Text> */}
      </View>
      )
      }
      {/* <View style={{ padding: 20 }}> */}
      {/* {loading ? ( 
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <TextInput
          value={contents[chapterId].content}
          onChangeText={getContents(chapterId)}
          style={{
            height: 50,
            borderWidth: 1,
            borderColor: 'gray',
            padding: 10,
            borderRadius: 5,
          }}
        />
      )} */}
    {/* </View> */}
          {/* <FlatList
              data={contents}
              keyExtractor={(item) => item.chapter_id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.chapter} onPress={() => navigation.navigate('ChapterContent', { chapterId: item.chapter_id })}>
                  <Text style={styles.chapterText}>{t(item.content)}</Text>
                </TouchableOpacity>
              )}
            /> */}
    {/* <NavigationContainer> */}
 
     {/* <MyTabs /> */}

{/* </NavigationContainer> */}
    </View>
    {/* <View style={styles.container}><Text>{contents[0].content}</Text></View> */}
    </ScrollView>
    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  content: { fontSize: 16, lineHeight: 24, textAlign: 'justify' },
});

export default ChapterContentScreen;
