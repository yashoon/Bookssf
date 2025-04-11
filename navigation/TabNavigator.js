import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import ChapterListScreen from '../screens/ChapterListScreen';
import ChapterContentScreen from '../screens/ChapterContentScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'ChapterList' ? 'list-outline' : 'book-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ChapterList" component={ChapterListScreen} />
      <Tab.Screen name="ChapterContent" component={ChapterContentScreen} initialParams={{ chapterId: 1 }}/>
    </Tab.Navigator>
  );
};

export default TabNavigator;
