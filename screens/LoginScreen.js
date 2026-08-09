// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
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
  ScrollView,
  Platform,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithCredential  } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../database/firebaseConfig';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In when component mounts
    console.log("🔧 Configuring Google Sign-In...");
    try {
      GoogleSignin.configure({
        webClientId: '824535204670-ouarn36ts2ofjm89budevs673ri7sqeu.apps.googleusercontent.com',
        // webClientId: '605730930736-ofkf3a2ou9fckk5929vemqre33nqjq94.apps.googleusercontent.com',
        offlineAccess: true,
      });
      console.log("✅ Google Sign-In configured successfully");
    } catch (error) {
      console.error("❌ Error configuring Google Sign-In:", error);
    }
  }, []);

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      console.log("🔍 Checking Google Play Services...");
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log("✅ Google Play Services available");
      
      console.log("🔐 Starting Google Sign-In...");
      
      // Get user's ID token
      const signInResult = await GoogleSignin.signIn();
      console.log("✅ Got sign-in result:", signInResult);
      
      // const { idToken } = signInResult;
      const { idToken, accessToken } = await GoogleSignin.getTokens();
    // idToken is the JWT you send to your server

      
      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }
      
      console.log("✅ Got ID token");
      
      // Create a Google credential with the token
      console.log("🔐 Creating Google credential...");
      const googleCredential = GoogleAuthProvider.credential(idToken);
      console.log("✅ Google credential created");
      
      // Sign in with credential
      console.log("🔐 Signing in with Firebase...");
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;
      
      console.log("✅ Google sign-in successful:", user.email);
      
      // Store user data
      await AsyncStorage.setItem("authUser", JSON.stringify(user));
      
      // navigation.replace("Welcome"); // go to Welcome screen
    } catch (error) {
      console.error("❌ Google Sign-In Error:");
      console.error("  Code:", error.code);
      console.error("  Message:", error.message);
      console.error("  Full error:", error);
      
      // Handle specific error codes
      if (error.code === '12501') {
        // User cancelled the sign-in - don't show error
        console.log('ℹ️ User cancelled Google Sign-In');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setErrors({ firebase: 'An account already exists with the same email address' });
      } else if (error.code === 'auth/invalid-credential') {
        setErrors({ firebase: 'Invalid Google credentials. Please try again.' });
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrors({ firebase: 'Google Sign-In is not enabled. Please contact support.' });
      } else if (error.code === 'auth/user-disabled') {
        setErrors({ firebase: 'This account has been disabled.' });
      } else {
        setErrors({ firebase: error.message || 'Failed to sign in with Google' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Google Sign-In Button */}
        <GoogleSignInButton
          onPress={handleGoogleSignIn}
          disabled={loading}
          loading={loading}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email field */}
        <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
          <Icon name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {errors.email && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={13} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.error}>{errors.email}</Text>
          </View>
        )}

        {/* Password field */}
        <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
          <Icon name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={13} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.error}>{errors.password}</Text>
          </View>
        )}

        {errors.firebase && (
          <View style={styles.firebaseErrorBox}>
            <Icon name="information-circle" size={16} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.errorCenter}>{errors.firebase}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.linkTouchable}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkTouchable}>
          <Text style={styles.linkMuted}>
            Don't have an account? <Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(255, 255, 255)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: 'cover',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  inputContainerError: {
    borderColor: '#F44336',
    backgroundColor: '#F4433608',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkTouchable: {
    marginTop: 16,
  },
  link: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  linkMuted: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
  },
  linkAccent: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    paddingLeft: 4,
  },
  errorIcon: {
    marginRight: 5,
  },
  error: {
    color: '#F44336',
    fontSize: 12,
  },
  firebaseErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4433612',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    marginTop: 12,
  },
  errorCenter: {
    color: '#F44336',
    fontSize: 13,
    textAlign: 'center',
    flexShrink: 1,
  },
});