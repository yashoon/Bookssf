// screens/LoginScreen.js
import React, { useState } from 'react';
import { getFriendlyFirebaseError } from "../utils/firebaseErrorMessages";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../database/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateFields = () => {
    let valid = true;
    let newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validateFields()) return;

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await AsyncStorage.setItem("authUser", JSON.stringify(user));
  
      // navigation.replace("Welcome"); // go to Welcome screen
    } catch (error) {
        setErrors({ firebase: getFriendlyFirebaseError(error.code) });
        // Alert.alert('Login Error',error.code);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Email is required to send reset link!" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Enter a valid email" });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset Sent', `A reset link was sent to ${email}`);
      setErrors({ firebase: `A reset link was sent to ${email}`});
    } catch (error) {
      setErrors({ firebase: error.message });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >

      <View style={styles.imageContainer}>
        <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
      </View>

      <Text style={styles.title}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      {errors.firebase && <Text style={styles.errorCenter}>{errors.firebase}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
      </TouchableOpacity>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f6fa',
    alignItems: 'center'
  },
  image: {
    width: 390,
    height: 390,
    resizeMode: 'cover',
  },
  imageContainer: {
    width: 295,
    height: 295,
    borderRadius: 300,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2f3640',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    width: '100%',
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    width: '100%',
    marginTop: 15,
    backgroundColor: 'rgb(4,118,40)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    color: '#0984e3',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
  error: {
    color: "red",
    fontSize: 13,
    marginTop: -2,
    marginBottom: 4,
    width: '100%',
  },
  errorCenter: {
    color: "red",
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 6,
    width: '100%',
  },
});
