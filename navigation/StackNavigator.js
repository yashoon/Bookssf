import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
// import ChapterDetails from '../screens/ChapterDetails'; // or any deep screens

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    // <FontSizeProvider>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={TabNavigator} />
      {/* <Stack.Screen name="ChapterDetails" component={ChapterDetails} /> */}
    </Stack.Navigator>
    // </FontSizeProvider> 
  );
};

export default StackNavigator;
