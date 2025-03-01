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
import { getDBConnection, createTable, getPreDBConnection } from './database/Database';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';


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
        // console.log(users)
    } catch (error) {
       console.error(error);
    }
 };

  useEffect(() => {
    console.log('Initializing database'); 
    getPreDBConnection().then((db) => { 
      console.log('Database initialized');
    });
    // initializeDatabase();
    // initializeDatabase();
    // insertChapters();
  //   try{
  //   //const db = await getDBConnection();
  //   //console.log('its after getting the db connection');
  //   createTable(db);
  // } catch (error) {
  //   console.log("got the error: " + error)
  // }
  // loadDataCallback();
    
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} screenOptions={{headerShown: false}}/>
        <Stack.Screen name="ChapterList" component={ChapterListScreen} />
        <Stack.Screen name="ChapterContent" component={ChapterContentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
