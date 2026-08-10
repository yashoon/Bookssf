// components/AppLayout.js
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

const APP_NAME = "Shepherd's Staff";
const HEADER_CONTENT_HEIGHT = 56; // height of the actual title/icon row, excluding the safe-area inset

export default function AppLayout({
  children,
  title,
  fontSize,
  increaseFont,
  decreaseFont,
  showFontControls = false,
  showSearchIcon = true,
  showBackButton = false,// optional override; if omitted, auto-detects via navigation.canGoBack()
  showAppLayout = true,
  // Optional continuous Animated.Value (0 = header fully shown, 1 = fully
  // hidden), driven directly by a parent screen's real-time scroll position
  // — e.g. ChapterContentScreen ties this 1:1 to the WebView's scroll
  // offset, the same way Safari's chrome tracks your finger while
  // scrolling instead of snapping open/closed after the fact.
  //
  // FIX: this replaces the old model where a screen flipped a boolean
  // (`showAppLayout`) and this component reacted by kicking off a fresh
  // Animated.parallel of THREE separate JS-driven timings (translateY,
  // height, opacity) every time. Restarting three independent tweens on
  // every scroll-driven toggle is exactly what produced the flicker —
  // under load from the WebView's postMessage bridge, the JS thread could
  // fall behind and the three properties would visibly drift out of sync
  // with each other and with the actual scroll. Driving everything from one
  // externally-updated value keeps them perfectly in lockstep and removes
  // the repeated start/stop churn entirely.
  scrollProgress,
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Auto-detect: if this screen was reached via a stack push (like Search,
  // opened from the header's search icon) rather than being a tab itself,
  // canGoBack() is true and we show a back arrow instead of the logo —
  // otherwise there'd be no visible way back once the tab bar is out of view.
  const canGoBack = showBackButton;

  const expandedHeaderHeight = insets.top + HEADER_CONTENT_HEIGHT;

  // Screens that never dynamically hide the header (everything except
  // ChapterContentScreen) don't pass scrollProgress at all — fall back to a
  // static, locally-owned value driven by the legacy showAppLayout boolean
  // so their behavior is unchanged.
  const fallbackProgress = useRef(new Animated.Value(showAppLayout ? 0 : 1)).current;
  useEffect(() => {
    if (scrollProgress) return; // externally driven, nothing to do here
    Animated.timing(fallbackProgress, {
      toValue: showAppLayout ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [scrollProgress, showAppLayout, fallbackProgress]);

  const progress = scrollProgress || fallbackProgress;

  const headerTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -expandedHeaderHeight],
    extrapolate: 'clamp',
  });
  const headerHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [expandedHeaderHeight, 0],
    extrapolate: 'clamp',
  });
  const headerOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          height: headerHeight,
          overflow: 'hidden',
        }}
      >
        {/* FIX: no longer toggling `hidden` off the same boolean — that's a
            hard, un-animated native show/hide of the whole status bar and
            was adding its own visible snap on top of the header animation.
            The status bar now stays put; only the in-app header chrome
            hides on scroll, matching how Safari keeps the system status bar
            visible and only collapses its own toolbar. */}
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

        <View style={[styles.header, { paddingTop: insets.top, height: expandedHeaderHeight }]}>
          <View style={styles.headerLeft}>
            {canGoBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="chevron-back" size={26} color="white" />
              </TouchableOpacity>
            ) : (
              <View style={styles.logoBadge}>
                <Image source={require('../assets/SS_Icon.png')} style={styles.logoImage} />
              </View>
            )}

            <View style={styles.titleGroup}>
              {title ? (
                <>
                  <Text style={styles.appNameSmall}>{APP_NAME}</Text>
                  <Text style={styles.screenTitle} numberOfLines={1}>{title}</Text>
                </>
              ) : (
                <Text style={styles.screenTitle} numberOfLines={1}>{APP_NAME}</Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            {showFontControls && (
              <View style={styles.fontControlGroup}>
                <TouchableOpacity onPress={decreaseFont} style={styles.fontControlButton} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Icon name="remove" size={16} color="white" />
                </TouchableOpacity>

                <View style={styles.fontControlDivider} />

                <Text style={styles.fontSizeText}>{fontSize}</Text>

                <View style={styles.fontControlDivider} />

                <TouchableOpacity onPress={increaseFont} style={styles.fontControlButton} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Icon name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {showSearchIcon && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Search')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Icon name="search-outline" size={22} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Main content */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 54,
    height: 54,
    resizeMode: 'cover',
  },
  titleGroup: {
    flexShrink: 1,
  },
  appNameSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontControlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 10,
  },
  fontControlButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontControlDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  fontSizeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    minWidth: 16,
    textAlign: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
});