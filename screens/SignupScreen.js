// screens/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { signUpUser } from '../database/authService';
import CheckBox from '@react-native-community/checkbox';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
// If using Expo instead of react-native-vector-icons, use this import:
// import Icon from '@expo/vector-icons/Ionicons';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const uri =
    'https://drive.google.com/file/d/1tUBRVunzeLx5CQR0uQsKm7wNT8dQdfYF/preview';

  const openPrivacyPolicy = () => {
    Linking.openURL(uri).catch((err) =>
      console.error('An error occurred', err),
    );
  };

  const validateFields = () => {
    let newErrors = {};

    if (!email) {newErrors.email = 'Email is required';}
    else if (!/\S+@\S+\.\S+/.test(email)) {newErrors.email = 'Enter a valid email';}

    if (!password) {newErrors.password = 'Password is required';}
    else if (password.length < 6)
      {newErrors.password = 'Password must be at least 6 characters';}

    if (confirmPassword !== password)
      {newErrors.confirmPassword = 'Passwords do not match';}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!consent) {
      setErrors({
        consents: 'You must agree to email collection before signing up.',
      });
      return;
    }
    if (!validateFields()) {return;}

    setLoading(true);
    try {
      const user = await signUpUser(email, password);
      Alert.alert('Success', `Account created successfully! ${user.email}`);
      navigation.replace("Shepherd's Staff");
    } catch (error) {
      console.log('Signup error:', error);
      // authService already converts Firebase error codes into a friendly
      // message (via getFriendlyFirebaseError), so error.message here is
      // already display-ready — no need to re-convert it.
      setErrors({ firebase: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX ("looks empty and lifeless"): same soft green wash used on
    // Welcome/Login, for visual consistency across the pre-auth flow.
    <LinearGradient
      colors={['#A5D6A7', '#E8F5E9', '#FFFFFF']}
      locations={[0, 0.35, 0.6]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.container}
    >
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardAvoider}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
        </View>

        <Text style={styles.title}>Create Account</Text>
        {/* LOGO THEME: same gold accent rule used on Login/Welcome. */}
        <View style={styles.titleAccent} />
        <Text style={styles.subtitle}>Sign up to get started</Text>

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
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={13} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.error}>{errors.password}</Text>
          </View>
        )}

        {/* Confirm password field */}
        <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError]}>
          <Icon name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#999" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={13} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          </View>
        )}

        {errors.firebase && (
          <View style={styles.firebaseErrorBox}>
            <Icon name="information-circle" size={16} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.errorCenter}>{errors.firebase}</Text>
          </View>
        )}

        {/* Consent row */}
        <View style={styles.consentRow}>
          <CheckBox
            value={consent}
            onValueChange={setConsent}
            tintColors={{ true: '#4CAF50', false: '#999' }}
          />
          <Text style={styles.consentText}>
            I agree to the collection and use of my email as per the{' '}
            <Text style={styles.consentLink} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
        {errors.consents && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={13} color="#F44336" style={styles.errorIcon} />
            <Text style={styles.error}>{errors.consents}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkTouchable}>
          <Text style={styles.linkMuted}>
            Already have an account? <Text style={styles.linkAccent}>Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoider: {
    flex: 1,
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
    // LOGO THEME: matches Login/Welcome — near-opaque white fill + gold
    // ring so the badge stays legible against the gradient.
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2,
    borderColor: '#D4AF37',
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 6, color: 'rgba(0, 0, 0, 0.15)' }],
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  titleAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    // LOGO THEME: matches Login's gold input borders.
    borderWidth: 1,
    borderColor: '#D4AF37',
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
    // FIX: elevation + borderRadius is a known RN 0.77 Android bug — the
    // shadow renders distorted/rectangular instead of following the rounded
    // corners, showing up as a dark box around the button. boxShadow (New
    // Architecture, already enabled) renders correctly on both platforms.
    boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 6, color: 'rgba(76, 175, 80, 0.3)' }],
  },
  buttonDisabled: {
    opacity: 0.6,
    boxShadow: [],
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkTouchable: {
    marginTop: 16,
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  consentLink: {
    color: '#4CAF50',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;
