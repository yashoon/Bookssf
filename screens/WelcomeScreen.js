import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/welcome.png')} style={styles.image} />
      <Text style={styles.title}>Welcome to Shepherd's Staff</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ChapterList')}>
        <Text style={styles.buttonText}>Start Reading</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  image: { width: 300, height: 300, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 20 },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18 },
});

export default WelcomeScreen;