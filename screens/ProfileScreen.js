import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../database/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { use } from 'i18next';

export default function ProfileScreen({ navigation }) {
  
  const user = auth.currentUser;
  // const user = AsyncStorage.getItem("authUser");

  const handlePasswordReset = async () => {
    if (!user?.email) return Alert.alert("Error", "No email found for this user.");
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Password Reset', `A password reset email has been sent to ${user.email}.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
  await AsyncStorage.removeItem("authUser");
  await auth.signOut();
  // navigation.replace("Login");
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    // Any additional setup can be done here
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'Not available'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fafafa',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
    color: '#333',
  },
  infoBox: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
