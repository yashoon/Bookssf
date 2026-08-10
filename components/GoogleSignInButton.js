import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';

const GoogleSignInButton = ({ onPress, disabled, loading }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Image 
          source={require('../assets/google_logo.png')} 
          style={styles.icon}
        />
        <Text style={styles.text}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcdde1',
    marginBottom: 10,
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders as a distorted rectangle instead of following the
    // rounded corners, showing up as a dark box around the button.
    // boxShadow (New Architecture, already enabled) is correct on both
    // platforms.
    boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 2, color: 'rgba(0, 0, 0, 0.1)' }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 25,
    height: 25,
  },
  text: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default GoogleSignInButton;