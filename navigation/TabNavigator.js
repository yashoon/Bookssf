import React, { useEffect, useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import ChapterListScreen from '../screens/ChapterListScreen';
import ChapterContentScreen from '../screens/ChapterContentScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SectionMenuScreen from '../screens/SectionMenuScreen';
import SearchScreen from '../screens/SearchScreen';

//adding animation
import { BottomTabBar } from '@react-navigation/bottom-tabs';

import { Animated } from 'react-native'; // or react-native if using Animated API
//adding animation

const Tab = createBottomTabNavigator();

//adding animation 
const AnimatedTabBar = (props) => {
  const { state, descriptors, navigation, tabBarTranslateY } = props;
  
  return (
    <Animated.View
      style={{
        transform: [{ translateY: tabBarTranslateY }],
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        elevation: 5,
        zIndex: 10,
      }}
    >
      <BottomTabBar 
        {...props} // Pass all props to ensure nothing is missing
      />
    </Animated.View>
  );
};

//adding animation 

const TabNavigator = () => {

    const [lastReadChapter, setLastReadChapter] = useState(null);
    const tabBarTranslateY = useRef(new Animated.Value(0)).current;

      // Add this function to control the tab bar animation
  const toggleTabBar = (visible) => {
    console.log("TabNavigator toggling tab bar: " + visible);
    Animated.timing(tabBarTranslateY, {
      toValue: visible ? 0 : 100,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

    const loadLastReadChapter = async () => {
      try {
        console.log("this is Aysnc loading chapterId")
        const storedChapterId = await AsyncStorage.getItem('lastReadChapter');
        setLastReadChapter(storedChapterId ? parseInt(storedChapterId) : 1);

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
        // tabBarLabelStyle: { fontSize: 12 }, // label font size
      })}
      tabBar={(props) => (
        <AnimatedTabBar {...props} tabBarTranslateY={tabBarTranslateY} />
      )}
    >
      <Tab.Screen name="Sections" component={SectionMenuScreen}  
      options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="menu-outline" color={color} size={size} />
      // <Icon name="menu-outline" size={24} color="#000" />
    ),
  }}/>
      <Tab.Screen name="ChapterList" component={ChapterListScreen} />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="search-outline" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ChapterContent"
        // options={{ tabBarButton: () => null }} // optional: hide tab icon if needed 
      >
    {(props) => (
    <ChapterContentScreen
      {...props}
      toggleTabBar={toggleTabBar}
      tabBarTranslateY={tabBarTranslateY}
    />
  )}
</Tab.Screen>

      {/* <Tab.Screen name="ChapterContent" 
      component={ChapterContentScreen} 
      // initialParams={{ chapterId: lastReadChapter ?? 1}}
      initialParams={{
        chapterId: lastReadChapter ?? 1,
        toggleTabBar, // pass the animation value to the screen
      }}
      /> */}
    </Tab.Navigator>
    // </FontSizeProvider>
  );
};

export default TabNavigator;
