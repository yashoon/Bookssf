import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import ChapterListScreen from '../screens/ChapterListScreen';
import ChapterContentScreen from '../screens/ChapterContentScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SectionMenuScreen from '../screens/SectionMenuScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {

    const [lastReadChapter, setLastReadChapter] = useState(null);

    const loadLastReadChapter = async () => {
      try {
        console.log("this is Aysnc loading chapterId")
        const storedChapterId = await AsyncStorage.getItem('lastReadChapter');
        console.log("Async store chapterId" + storedChapterId)
        setLastReadChapter(storedChapterId);
        // if (storedChapterId) {
        //   navigation.navigate('ContentScreen', { chapterId: parseInt(storedChapterId) });
        // }
      } catch (e) {
        console.log('Error loading last read chapter:', e);
      }
      console.log("this is last read chapter $$$$" + lastReadChapter)
    };

    useEffect(() => {
        loadLastReadChapter();  
    }
    , []);
    console.log("this is last read chapter >>>>>>>" + lastReadChapter)

  return (
    // <FontSizeProvider>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'rgb(4, 118, 40)', // active tab color (purple-ish)
        tabBarInactiveTintColor: 'rgb(68, 72, 69)', // inactive tab color (gray)
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'ChapterList' ? 'list-outline' : 'book-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Sections" component={SectionMenuScreen}  
      options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="menu-outline" color={color} size={size} />
      // <Icon name="menu-outline" size={24} color="#000" />
    ),
  }}/>
      <Tab.Screen name="ChapterList" component={ChapterListScreen} />
      <Tab.Screen name="ChapterContent" component={ChapterContentScreen} initialParams={{ chapterId: lastReadChapter ?? 1}}/>
    </Tab.Navigator>
    // </FontSizeProvider>
  );
};

export default TabNavigator;
