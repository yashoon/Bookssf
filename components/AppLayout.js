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
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Auto-detect: if this screen was reached via a stack push (like Search,
  // opened from the header's search icon) rather than being a tab itself,
  // canGoBack() is true and we show a back arrow instead of the logo —
  // otherwise there'd be no visible way back once the tab bar is out of view.
  const canGoBack = showBackButton;

  const expandedHeaderHeight = insets.top + HEADER_CONTENT_HEIGHT;

  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(expandedHeaderHeight)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerTranslateY, {
        toValue: showAppLayout ? 0 : -expandedHeaderHeight,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(headerHeight, {
        toValue: showAppLayout ? expandedHeaderHeight : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(headerOpacity, {
        toValue: showAppLayout ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [showAppLayout, expandedHeaderHeight]);

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
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" hidden={!showAppLayout} />

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