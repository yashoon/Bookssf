import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={require('../assets/SS_Icon.png')} style={styles.image} />
      </View>
      
      <Text style={styles.title}></Text>

      <View style={styles.infoCard}>
        <Text style={styles.bookMeta}>© World MAP, 1993</Text>
        <Text style={styles.bookMeta}>  All rights reserved.</Text>
        <Text style={styles.bookMeta}></Text>
        <Text style={styles.publishHouse}>Facilitated By:</Text>
        <Text style={styles.publishHouse}>The True Grace Ministries</Text>
        <Text style={styles.publishHouse}>www.ttgm.org</Text>
        <Text style={styles.publishHouse}></Text>
        <Text style={styles.publishNote}>Note: This App is copy right protected and authorized by the World Map organization.</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Shepherd's Staff")}>
        <Text style={styles.buttonText}>Start Reading</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', 
    backgroundColor: '#fff', width: '100%' },
  // image: { width: '80%', height: '30%', resizeMode: 'contain', },
  image: {
    width: 390, // Slightly larger than container
    height: 390,
    resizeMode: 'cover',
  },
  imageContainer: {
    width: 295,
    height: 295,
    borderRadius: 300,
    // borderWidth: 3,
    // borderColor: '#007AFF',
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 2},
  button: { backgroundColor: 'rgb(4, 118, 40)', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18 },
  infoCard: {
    backgroundColor: '#fff',
    marginTop: 0,
    borderRadius: 4,
    padding: 16,
    marginVertical: 12,
    marginHorizontal: 0,
    shadowColor: '#000',
    // shadowOffset: { width: 5, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    elevation: 0.4, // Android shadow
    width: '80%',
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
    color: '#000',
    textAlign: 'center',
    marginTop: 2,
  },
  publishNote: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  publishHouseTitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'left',
    justifyContent: 'space-around',
    marginTop: 2,
  },
});

export default WelcomeScreen;