import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { signUpUser } from "../database/authService";
import { getFriendlyFirebaseError } from "../utils/firebaseErrorMessages";
import CheckBox from "@react-native-community/checkbox";

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const uri = 'https://drive.google.com/file/d/1tUBRVunzeLx5CQR0uQsKm7wNT8dQdfYF/preview';

  const openPrivacyPolicy = () => {
    Linking.openURL(uri).catch(err => console.error('An error occurred', err));
  };

  const validateFields = () => {
    let valid = true;
    let newErrors = {};

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (confirmPassword !== password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!consent) {
      setErrors({consents :"You must agree to email collection before signing up."});
      return;
    }
    if (!validateFields()) return;

    try {
      const user = await signUpUser(email, password);
      Alert.alert("Success", `Account created successfully! ${user.email}`);
      navigation.replace("Shepherd's Staff");
    } catch (error) {
        console.log('Signup error:', error);
        setErrors({ firebase: error.message});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View style={styles.errorContainer}>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}
      </View>

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.errorContainer}>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      </View>

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <View style={styles.errorContainer}>
        {errors.confirmPassword && (
          <Text style={styles.error}>{errors.confirmPassword}</Text>
        )}
      </View>

      {errors.firebase && (
        <Text style={[styles.error, { textAlign: "center", marginTop: 5 }]}>
          {errors.firebase}
        </Text>
      )}

<View style={styles.consentRow}>
        <CheckBox value={consent} onValueChange={setConsent} />
        <Text style={styles.consentText}>
          I agree to the collection and use of my email as per the       <TouchableOpacity onPress={()=> openPrivacyPolicy()}>
  <Text style={{ color: 'blue', textDecorationLine: 'underline', marginLeft: 4 }}>
    Privacy Policy
  </Text>
</TouchableOpacity>
        </Text>
      </View>

      {errors.consents && (
        <Text style={[styles.error, { textAlign: "center", marginTop: 5 }]}>
          {errors.consents}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          !(email && password && confirmPassword) && styles.disabledButton,
        ]}
        onPress={handleSignup}
        disabled={!(email && password && confirmPassword)}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    fontSize: 15,
  },
  errorContainer: {
    minHeight: 18, // ✅ keeps space reserved
    marginTop: 4,
  },
  error: {
    color: "red",
    fontSize: 13,
  },
  button: {
    backgroundColor: 'rgb(4,118,40)',
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    textAlign: "center",
    color: "#007bff",
    marginTop: 18,
    fontSize: 14,
  },
});

export default SignupScreen;
