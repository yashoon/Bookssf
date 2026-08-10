import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, Platform, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import Toast from 'react-native-toast-message';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './database/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './navigation/TabNavigator';
import SearchScreen from './screens/SearchScreen';
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

  useEffect(() => {
    if (Platform.OS !== 'android') return; // Play Core API is Android-only
  
    const inAppUpdates = new SpInAppUpdates(false);
  
    inAppUpdates.addStatusUpdateListener((status) => {
      if (status.status === 'DOWNLOADED') {
        Alert.alert(
          'Update Ready',
          'A new version has been downloaded. Restart now to apply it?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Restart', onPress: () => inAppUpdates.installUpdate() },
          ]
        );
      }
    });
  
    inAppUpdates.checkNeedsUpdate().then((result) => {
      if (result.shouldUpdate) {
        inAppUpdates.startUpdate({
          updateType: IAUUpdateKind.FLEXIBLE,
        });
      }
    }).catch((err) => {
      console.log('In-app update check failed:', err);
    });
  
    return () => {
      inAppUpdates.removeStatusUpdateListener();
    };
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
    // FIX: the app never rendered a real <SafeAreaProvider> anywhere, so
    // every useSafeAreaInsets() call (the header's top padding in
    // AppLayout, SearchScreen, and — indirectly — the bottom tab bar's own
    // padding, which React Navigation pads using insets it gets from this
    // same context) was falling back to React Navigation's internal
    // SafeAreaProviderCompat. That fallback is a rough, static estimate,
    // not the real per-device measurement — close enough on many phones to
    // go unnoticed, but visibly short on others (different gesture-nav
    // heights, curved corners, etc.), which is exactly why content was
    // sitting right up against the edges and bottom bezel only on some
    // Android phones. A real SafeAreaProvider at the root supplies the
    // actual measured insets to everything below it.
    <SafeAreaProvider>
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
                  <Stack.Screen name="Search" component={SearchScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>

          {/* ✅ Toast must be here */}
          <Toast />
        </FontSizeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}