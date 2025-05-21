// components/AppLayout.js
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity,StatusBar, Platform, StyleSheet, Animated } from 'react-native';

export default function AppLayout({ children, fontSize, increaseFont, decreaseFont, showFontControls=false,showAppLayout=true }) {
    const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight : 50; // 44 is safe for iPhone notch
    const headerTranslateY = useRef(new Animated.Value(0)).current;
    const headerHeight = useRef(new Animated.Value(150)).current;  // Original height of the header (adjust this as needed)
    const headerOpacity = useRef(new Animated.Value(1)).current;  // For fading the header in/out

    // useEffect(() => {
    //   Animated.timing(headerTranslateY, {
    //     toValue: showAppLayout ? 0 : -100, // move up by 100 when hidden
    //     duration: 300,
    //     useNativeDriver: true,
    //   }).start();
    // }, [showAppLayout]);
    useEffect(() => {
      // Start the animation when `showAppLayout` changes
      Animated.parallel([
        // Slide up or down the header
        Animated.timing(headerTranslateY, {
          toValue: showAppLayout ? 0 : -150,  // Slide the header up or down
          duration: 300,
          // useNativeDriver: true,
        }),
  
        // Collapse/expand the height of the header
        Animated.timing(headerHeight, {
          toValue: showAppLayout ? 80 : 0,  // Set the height to 0 when hiding the header
          duration: 300,
          useNativeDriver: false, // We can't animate height with native driver
        }),
  
        // Fade in or out the header
        Animated.timing(headerOpacity, {
          toValue: showAppLayout ? 1 : 0,  // Fade in or out
          duration: 300,
          // useNativeDriver: true,
        }),
      ]).start();
    }, [showAppLayout]);  // Run the animation when `showAppLayout` changes

  return (
    
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          height: headerHeight,  // Animate the height
        }}
      >
        {/* {showAppLayout && ( */}
        <StatusBar barStyle="light-content" backgroundColor="rgb(4, 118, 40)" hidden={!showAppLayout}/>
        {/* )} */}

      {/* Header */}
      {/* {showAppLayout && ( */}
      <View style={{
        backgroundColor: 'rgb(4, 118, 40)',
        padding: 10,
        paddingTop:topPadding,
        // paddingBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold',color: 'white' }}>📖 Shepherd's Staff</Text>
        {showFontControls && 
        (<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={decreaseFont} style={styles.button}>
            <Text style={{ fontSize: 18, color: 'white'  }}>−</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, color: 'white' }}>{fontSize}</Text>
          <TouchableOpacity onPress={increaseFont} style={styles.button}>
            <Text style={{ fontSize: 18, color: 'white'  }}>+</Text>
          </TouchableOpacity>
        </View>
        )}
      </View>
       {/* )} */}
      </Animated.View>

      {/* Main content */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    button: {
        // backgroundColor: 'rgba(6, 152, 52, 0.31)', // Sleek blue color for buttons
        backgroundColor: '#069834', // Sleek blue color for buttons
        paddingVertical: 5,
        paddingHorizontal: 20,
        borderRadius: 30, // Rounded corners
        margin: 0,
        elevation: 5, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 4 },
      },
})
