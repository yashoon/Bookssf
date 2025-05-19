// components/AppLayout.js
import React from 'react';
import { View, Text, TouchableOpacity,StatusBar, Platform, StyleSheet } from 'react-native';

export default function AppLayout({ children, fontSize, increaseFont, decreaseFont, showFontControls=false,showAppLayout=true }) {
    const topPadding = Platform.OS === 'android' ? StatusBar.currentHeight : 50; // 44 is safe for iPhone notch

  return (
    <View style={{ flex: 1 }}>
        {/* {showAppLayout && ( */}
        <StatusBar barStyle="light-content" backgroundColor="rgb(4, 118, 40)" hidden={!showAppLayout}/>
        {/* )} */}

      {/* Header */}
      {showAppLayout && (
      <View style={{
        backgroundColor: 'rgb(4, 118, 40)',
        padding: 10,
        paddingTop:topPadding,
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
      )}

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
