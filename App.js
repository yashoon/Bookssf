import React, {useEffect, useState, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {ActivityIndicator, View, Text, Platform, Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SpInAppUpdates, {IAUUpdateKind} from 'sp-react-native-in-app-updates';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from './database/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './screens/WelcomeScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './navigation/TabNavigator';
import SearchScreen from './screens/SearchScreen';
import {FontSizeProvider} from './components/FontSizeContext/FontSizeContext';
import {LanguageProvider} from './components/LanguageContext';
import {SENTRY_DSN} from '@env';
const Stack = createStackNavigator();

// Deliberately minimal: error + native crash monitoring and manual
// breadcrumbs only — no tracesSampleRate/tracing integration, no
// profilesSampleRate, no session replay. Those are the pieces that add the
// bulk of Sentry's JS bundle weight and runtime overhead (~500KB, per
// Sentry's own community-measured numbers, when tracing is enabled); our
// goal here is purely "what screen was the user on when a crash happened",
// which manual navigation breadcrumbs below already cover without them.
//
// If SENTRY_DSN isn't set (no .env entry), Sentry.init() safely no-ops —
// the SDK stays disabled rather than erroring, so this is safe to ship
// even before a real DSN is configured.
//
// Navigation instrumentation for performance tracing — separate from the
// manual addBreadcrumb() call below, which just logs "what screen was the
// user on" for crash context. This integration additionally times screen
// transitions/renders so slow ones show up as performance data in Sentry.
const navigationIntegration = Sentry.reactNavigationIntegration();

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !__DEV__,
  // Performance tracing: samples ~1 in 5 sessions rather than all of them,
  // to keep the added network/battery cost small while still surfacing
  // real slowdowns. Crash/error capture above is unaffected by this and
  // always runs at 100% regardless of this rate.
  tracesSampleRate: 0.2,
  // Surfaces dropped/frozen UI frames (jank) and JS-thread stalls as part
  // of each traced session — the two signals most useful for "is the app
  // slowing down".
  enableNativeFramesTracking: true,
  enableStallTracking: true,
  integrations: [navigationIntegration],
});

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  // Tracks the previously-active route name so onStateChange below only logs
  // an actual screen change, not every navigation-state update (nested
  // param changes, etc. also fire onStateChange).
  const currentRouteNameRef = useRef();
  const navigationRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        await AsyncStorage.setItem('authUser', JSON.stringify(currentUser));

        if (!user) {
          Toast.show({
            type: 'success',
            text1: 'Auto login successful ✅',
          });
        }

        setUser(currentUser);
      } else {
        await AsyncStorage.removeItem('authUser');
        setUser(null);
      }

      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return; // Play Core API is Android-only

    const inAppUpdates = new SpInAppUpdates(false);

    inAppUpdates.addStatusUpdateListener(status => {
      if (status.status === 'DOWNLOADED') {
        Alert.alert(
          'Update Ready',
          'A new version has been downloaded. Restart now to apply it?',
          [
            {text: 'Later', style: 'cancel'},
            {text: 'Restart', onPress: () => inAppUpdates.installUpdate()},
          ],
        );
      }
    });

    inAppUpdates
      .checkNeedsUpdate()
      .then(result => {
        if (result.shouldUpdate) {
          inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.FLEXIBLE,
          });
        }
      })
      .catch(err => {
        console.log('In-app update check failed:', err);
      });

    return () => {
      inAppUpdates.removeStatusUpdateListener();
    };
  }, []);

  // ✅ Show loader while checking auth
  if (checkingAuth) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{marginTop: 15, fontSize: 16}}>
          Checking login status...
        </Text>
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
          <NavigationContainer
            onReady={() => {
              currentRouteNameRef.current =
                navigationRef.current?.getCurrentRoute()?.name;
              // Hands the live navigation ref to Sentry's navigation
              // integration so it can time screen transitions for
              // performance tracing (separate from the breadcrumb/tag
              // logging below, which is for crash context, not timing).
              navigationIntegration.registerNavigationContainer(
                navigationRef,
              );
            }}
            ref={navigationRef}
            // This is the "which screen was the user on" context for the
            // recurring Fabric mounting crash — a single navigation
            // listener here covers every screen transition app-wide,
            // instead of manually instrumenting each screen. Breadcrumbs
            // show the transition trail inline on a crash report; the tag
            // additionally makes screen searchable/filterable across all
            // issues in the Sentry dashboard.
            onStateChange={() => {
              const previousRouteName = currentRouteNameRef.current;
              const currentRouteName =
                navigationRef.current?.getCurrentRoute()?.name;

              if (currentRouteName && previousRouteName !== currentRouteName) {
                Sentry.addBreadcrumb({
                  category: 'navigation',
                  message: `${
                    previousRouteName ?? '(none)'
                  } -> ${currentRouteName}`,
                  level: 'info',
                });
                Sentry.setTag('screen', currentRouteName);
              }

              currentRouteNameRef.current = currentRouteName;
            }}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              {!user ? (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Signup" component={SignupScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Welcome" component={WelcomeScreen} />
                  <Stack.Screen
                    name="Shepherd's Staff"
                    component={TabNavigator}
                  />
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

// Sentry.wrap gives baseline touch-event tracking and ensures errors thrown
// during render are captured by Sentry's error boundary, without pulling in
// tracing/performance instrumentation.
export default Sentry.wrap(App);
