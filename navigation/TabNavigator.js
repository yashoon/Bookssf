import React, { useEffect, useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import ChapterListScreen from '../screens/ChapterListScreen';
import ChapterContentScreen from '../screens/ChapterContentScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SectionMenuScreen from '../screens/SectionMenuScreen';
import LanguageSelectorScreen from '../screens/LanguageSelectorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useLanguage } from '../components/LanguageContext';
import { getInitialRouteName } from './routing';
import Toast from 'react-native-toast-message';

//adding animation
import { BottomTabBar } from '@react-navigation/bottom-tabs';

import { Animated } from 'react-native'; // or react-native if using Animated API
//adding animation

const Tab = createBottomTabNavigator();

//adding animation
// REVERTED: this custom tab bar was re-enabled to make the bottom bar hide
// smoothly in sync with the header, but doing so triggered
// "TypeError: Cannot read property 'forEach' of null" on every tab press —
// somewhere in React Navigation's own tab-switch handling (its internal
// transition animation and event-emitter code both do array.forEach over
// state derived from this navigator's props). It's disabled again
// (`tabBar` prop below is commented out) so the app is back to the stable,
// default, always-visible tab bar rather than shipping a crash.
//
// The header's hide-on-scroll in ChapterContentScreen has separately been
// paused too (see the note at the top of that file) — the WebView bridge it
// depended on couldn't deliver it flicker-free. Both the header and this
// tab bar staying static for now is intentional; the real fix for both is
// the same planned follow-up: drop the WebView for chapter content in favor
// of react-native-render-html + a native ScrollView, which would also let
// this custom tab bar be revisited with real native scroll events instead
// of bridged messages.
const AnimatedTabBar = (props) => {
  const { tabBarTranslateY, onHeightChange, ...tabBarProps } = props;
  const { state } = tabBarProps;
  const focusedRouteName = state?.routes?.[state.index]?.name;
  const isChapterContent = focusedRouteName === 'ChapterContent';

  return (
    <Animated.View
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={{
        transform: isChapterContent ? [{ translateY: tabBarTranslateY }] : undefined,
        position: isChapterContent ? 'absolute' : 'relative',
        bottom: isChapterContent ? 0 : undefined,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        elevation: 5,
        zIndex: 10,
      }}
    >
      <BottomTabBar {...tabBarProps} />
    </Animated.View>
  );
};

//adding animation

const TabNavigator = () => {

    const [lastReadChapter, setLastReadChapter] = useState(null);
    const [isReady, setIsReady] = useState(false); // gate rendering until AsyncStorage read completes
    const { hasLanguageSet, isLoading: isLanguageLoading } = useLanguage();

    // Raw px offset (0 = fully shown) — ChapterContentScreen sets this
    // directly in lockstep with the header, both driven from the same
    // scroll-progress fraction, so they move together instead of drifting.
    const tabBarTranslateY = useRef(new Animated.Value(0)).current;
    const [tabBarHeight, setTabBarHeight] = useState(0);

const loadLastReadChapter = async () => {
  try {
    const storedChapterId = await AsyncStorage.getItem('lastReadChapter');
    setLastReadChapter(storedChapterId ? parseInt(storedChapterId, 10) : null);
  } catch (e) {
    console.log('Error loading last read chapter:', e);
  } finally {
    setIsReady(true); // only now do we know whether to resume or start fresh
  }
};

useEffect(() => {
  loadLastReadChapter();
}, []);

// Wait for both the last-read-chapter lookup AND the language context to
// resolve before deciding where to land. Without waiting on language here,
// a stale/prematurely-written 'lastReadChapter' value alone could route
// straight into ChapterContent and skip Sections — the only screen that
// redirects first-time users (no language set) to the Language selector.
if (!isReady || isLanguageLoading) return null; // or a small ActivityIndicator, to avoid a flash of the default tab
    console.log("this is last read chapter >>>>>>>" + lastReadChapter)

  // Decide the initial tab directly here, rather than relying on
  // SectionMenuScreen to redirect via navigation.navigate('Language') after
  // it mounts. That in-effect redirect was unreliable on the very first
  // mount (a timing/ordering quirk with the tab navigator settling on its
  // initial route), which left first-time users staring at a frozen
  // Sections screen stuck on "Checking language settings...". Choosing the
  // right tab up front avoids that race entirely.
  //
  // Only trust lastReadChapter as a "resume reading" signal if a language
  // has actually been selected. This guards against any stale AsyncStorage
  // data bypassing first-time language selection.
  //
  // The decision itself lives in ./routing.js as a pure function so it's
  // unit-testable without mounting the whole navigator.
  const initialRouteName = getInitialRouteName({ hasLanguageSet, lastReadChapter });

  // FIX (RetryableMountingLayerException): blocks navigating into any tab
  // other than Language while no language is set yet, instead of letting
  // the tap go through and having that screen's own "no language set,
  // redirecting to Language tab" useEffect fire after it's already
  // mounted. Previously, tapping around between tabs before selecting a
  // language could mount several of these screens in quick succession,
  // each independently calling navigation.navigate('Language') — multiple
  // concurrent redirects landing right as React Navigation/Fabric was also
  // mid tab-switch, which is exactly the kind of rapid, concurrent native
  // view churn that triggers "Unable to find viewState for tag N" crash
  // reports. Blocking the tap here means those screens never mount in that
  // state, so there's nothing left to race. The per-screen redirect
  // effects are left in place as a backstop, not removed.
  const guardTabPress = (navigation) => (e) => {
    if (!hasLanguageSet) {
      e.preventDefault();
      Toast.show({
        type: 'info',
        text1: 'Please select a language first',
        position: 'bottom',
      });
      // Guide the user to the one tab that is reachable, rather than
      // leaving them on a dead tap with only the toast as feedback.
      navigation.navigate('Language');
    }
  };

  return (
    // <FontSizeProvider>
<Tab.Navigator
      initialRouteName={initialRouteName}
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
      // tabBar={(props) => (
      //   <AnimatedTabBar
      //     {...props}
      //     tabBarTranslateY={tabBarTranslateY}
      //     onHeightChange={setTabBarHeight}
      //   />
      // )}
>
  <Tab.Screen name="Sections" component={SectionMenuScreen}
      options={{
    tabBarIcon: ({ color, size }) => (
      <Icon name="menu-outline" color={color} size={size} />
      // <Icon name="menu-outline" size={24} color="#000" />
    ),
    }}
      listeners={({ navigation }) => ({ tabPress: guardTabPress(navigation) })}
  />
  <Tab.Screen
    name="ChapterList"
    component={ChapterListScreen}
    listeners={({ navigation }) => ({ tabPress: guardTabPress(navigation) })}
  />

  <Tab.Screen
        name="ChapterContent"
        initialParams={{ chapterId: lastReadChapter ?? 1 }}
        // options={{ tabBarButton: () => null }} // optional: hide tab icon if needed
        listeners={({ navigation }) => ({ tabPress: guardTabPress(navigation) })}
      >
    {(props) => (
    <ChapterContentScreen
      {...props}
    />
  )}
  </Tab.Screen>
  <Tab.Screen name="Language" component={LanguageSelectorScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="language-outline" color={color} size={size} />
          // <Icon name="menu-outline" size={24} color="#000" />
        ),
  }}/>
        <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="person-outline" color={color} size={size} />,
        }}
        listeners={({ navigation }) => ({ tabPress: guardTabPress(navigation) })}
      />


      {/* <Tab.Screen name="ChapterContent" 
      component={ChapterContentScreen} 
      // initialParams={{ chapterId: lastReadChapter ?? 1}}
      initialParams={{
        chapterId: lastReadChapter ?? 1,
        toggleTabBar, // pass the animation value to the screen
      }}
      /> */}
</Tab.Navigator>
    // // </FontSizeProvider>
  );
};

export default TabNavigator;