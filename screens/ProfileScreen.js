import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {signOut, sendPasswordResetEmail} from 'firebase/auth';
import {auth} from '../database/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {use} from 'i18next';
import AppLayout from '../components/AppLayout';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

export default function ProfileScreen({navigation}) {
  const user = auth.currentUser;
  // const user = AsyncStorage.getItem("authUser");

  // Derive a display initial for the avatar from the email (e.g. "j" from "jason@x.com")
  const getInitial = () => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return '?';
  };

  const handlePasswordReset = async () => {
    if (!user?.email)
      return Alert.alert('Error', 'No email found for this user.');
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert(
        'Password Reset',
        `A password reset email has been sent to ${user.email}.`,
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('authUser');
            await auth.signOut();
            // navigation.replace("Login");
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    // Any additional setup can be done here
  }, []);

  return (
    <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar + email header */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitial()}</Text>
          </View>
          <Text style={styles.emailText}>{user?.email || 'Not available'}</Text>
        </View>

        {/* Account info card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBadge}>
              <Icon name="mail-outline" size={18} color="#4CAF50" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not available'}</Text>
            </View>
          </View>
        </View>

        {/* Actions card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={handlePasswordReset}>
            <View style={styles.infoIconBadge}>
              <Icon name="key-outline" size={18} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Change Password</Text>
            <Icon name="chevron-forward" size={18} color="#bbb" />
          </TouchableOpacity>
        </View>

        {/* Logout button, set apart from the rest */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={handleLogout}>
          <Icon
            name="log-out-outline"
            size={18}
            color="#F44336"
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgb(255, 255, 255)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4CAF50',
  },
  emailText: {
    fontSize: 14,
    color: '#888',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders as a distorted rectangle instead of following the
    // rounded corners, showing up as a dark box around the card. boxShadow
    // (New Architecture, already enabled) is correct on both platforms.
    boxShadow: [
      {offsetX: 0, offsetY: 2, blurRadius: 4, color: 'rgba(0, 0, 0, 0.1)'},
    ],
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF5020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4433615',
    borderWidth: 1,
    borderColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
