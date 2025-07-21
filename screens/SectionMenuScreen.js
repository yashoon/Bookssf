import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AppLayout from '../components/AppLayout';
import { use } from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SectionMenuScreen = ({ navigation }) => {
    const sections = ['1. New Believers Training Manual', 
        '2. Topical Concordance', 
        '3. Leaders Training Guide'];
    const [lastReadChapter, setLastReadChapter] = useState(null);
    


useEffect(() => {
    // You can add any initialization logic here if needed
        //code for fetching last read and showing modal
        const fetchLastRead = async () => {
          try {
            const stored = await AsyncStorage.getItem('lastReadChapter');
            if (stored) {
              setLastReadChapter(parseInt(stored, 10));
              
              // setShowModal(false); // setting false temporarily to avoid showing modal on initial load
            }
          } catch (e) {
            console.log('Error loading last chapter:', e);
          }
        };
    
        fetchLastRead();
        //code for fetching last read and showing modal
    }, []);
  
    return (
        // <FontSizeProvider>
        <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Sections of the Book</Text>
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sectionButton}
            onPress={() => navigation.navigate('ChapterList', { section: index+1 })}
          >
            <Text style={styles.sectionText}>{section}</Text>
          </TouchableOpacity>
        ))}
      </View>
      </AppLayout>
      // </FontSizeProvider>
    );
  };
  
  export default SectionMenuScreen;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fafafa',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 40,
    },
    sectionButton: {
      backgroundColor: '#ffffff',
      paddingVertical: 20,
      paddingHorizontal: 30,
      marginVertical: 10,
      borderRadius: 12,
      elevation: 3, // Android
      shadowColor: '#000', // iOS
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 4 },
    },
    sectionText: {
      fontSize: 18,
      textAlign: 'left',
      color: '#333',
    },
  });