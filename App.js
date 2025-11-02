import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './database/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './navigation/TabNavigator';
import { FontSizeProvider } from './components/FontSizeContext/FontSizeContext';
import { LanguageProvider } from './components/LanguageContext';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await AsyncStorage.setItem("authUser", JSON.stringify(currentUser));

        if (!user) {
          Toast.show({
            type: "success",
            text1: "Auto login successful ✅",
          });
        }

        setUser(currentUser);
      } else {
        await AsyncStorage.removeItem("authUser");
        setUser(null);
      }

      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  // ✅ Show loader while checking auth
  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 15, fontSize: 16 }}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <LanguageProvider>
      <FontSizeProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Shepherd's Staff" component={TabNavigator} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>

        {/* ✅ Toast must be here */}
        <Toast />
      </FontSizeProvider>
    </LanguageProvider>
  );
}
