import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
      <Text style={styles.title}></Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Shepherd's Staff")}>
        <Text style={styles.buttonText}>Start Reading</Text>
      </TouchableOpacity>
      <View style={styles.infoCard}>
        {/* <Text style={styles.bookTitle}>Book Title</Text> */}
        <Text style={styles.bookMeta}>© World MAP, 1993</Text>
        <Text style={styles.bookMeta}>  All rights reserved.</Text>
        <Text style={styles.bookMeta}></Text>
        <Text style={styles.publishHouse}>Published by:</Text>
        <Text style={styles.bookMeta}></Text>
        <Text style={styles.publishHouse}>World MAP</Text>
        <Text style={styles.publishHouse}>1419 N. San Fernando Blvd.</Text>
        <Text style={styles.publishHouse}>Burbank, CA 91504-4194 U.S.A.</Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', 
    backgroundColor: '#fff', width: '100%' },
  image: { width: 300, height: 300, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 2},
  button: { backgroundColor: 'rgb(4, 118, 40)', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18 },
  infoCard: {
    backgroundColor: '#fff',
    marginTop: 30,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  bookMeta: {
    fontSize: 14,
    fontWeight: '800',
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
  },
  publishHouse: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default WelcomeScreen;