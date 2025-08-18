import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ChapterListScreen from './screens/ChapterListScreen';
import ChapterContentScreen from './screens/ChapterContentScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import SQLite from 'react-native-sqlite-storage';
import { useEffect, useState } from 'react';
// import './i18n'; // Import i18n configuration
import { insertChapters } from './database/Database';
import { getDBConnection, createTable, getPreDBConnection, getDBConnection_local } from './database/Database';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabNavigator from './navigation/TabNavigator'
import { FontSizeProvider } from './components/FontSizeContext/FontSizeContext';
import Toast from 'react-native-toast-message';
import { LanguageProvider } from './components/LanguageContext';



const Tab = createBottomTabNavigator();
enableScreens();



const Stack = createStackNavigator();

// const db = SQLite.openDatabase(
//   { name: 'bookDB.db', location: 'default' },
//   () => console.log('Database opened'),
//   (error) => console.error('Error opening database', error)
// );

export default function App() {

  const [users, setUsers] = useState([]);

  const loadDataCallback = async () => {
    try {
       
       const db = await getDBConnection();
       await createTable(db);
        await insertChapters(db);
        // const user = await getUsers(db);
        // setUsers(user);
        // console.log("above is for getting users")
        // console. log(users)
    } catch (error) {
       console.error(error);
    }
 };

  useEffect(() => {
    // console.log('Initializing database'); 
    // getPreDBConnection().then((db) => { 
    //   console.log('Database initializing...');
    // });
    // getDBConnection_local('ssf_english').then((db) => {
    //   console.log('Local database initialized');
    // });
  }, []);

  return (
    // <>
    // <LanguageProvider> {/* ✅ Wrap once here */}
    <LanguageProvider>
    <FontSizeProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, headerLeft: null, headerTitleAlign: 'center' }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} screenOptions={{headerShown: false}}/>
        <Stack.Screen name="Shepherd's Staff" component={TabNavigator} />
        {/* <Stack.Screen name="ChapterList" component={ChapterListScreen} /> */}
        {/* <Stack.Screen name="ChapterContent" component={ChapterContentScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
    </FontSizeProvider>
     </LanguageProvider>
    // <Toast />
    // </>
  );
}
