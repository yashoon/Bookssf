import React, { lazy, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppLayout from '../components/AppLayout';
// import { ensureDatabaseExists } from '../utils/dbManager';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'english' },
  { label: 'Nepali', value: 'nepali' },
  { label: 'Telugu', value: 'telugu' },
  // Add more as needed
];

export default function LanguageSelectorScreen({ navigation }) {
  const [selectedLang, setSelectedLang] = useState('english');
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async (language) => {
    setLoading(true);
    try {
    //   await ensureDatabaseExists(selectedLang);
        console.log("Selected Language -----------: " + language);
      await AsyncStorage.setItem('selectedLanguage', language.toString());
      console.log("Language saved to AsyncStorage: " + await AsyncStorage.getItem('selectedLanguage'));
      Alert.alert('Success', `Language set to ${language}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update language');
    } finally {
      setLoading(false);
    }
  };

  return (
         <AppLayout>
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>


              
    <FlatList
      // data={chapters}
      data={LANGUAGE_OPTIONS}
      keyExtractor={(item) => item.value}
      renderItem={({ item }) => (
        <TouchableOpacity style={
          [styles.chapter]
        //   } onPress={() => navigation.navigate('ChapterContent', { chapterId: 1})}>
          } onPress={() => { 
            console.log("Selected Language ++++++++: " + item.value);
            setSelectedLang(item.value);
            handleLanguageChange(item.value.toString());
            navigation.navigate('Sections', { language: item.value.toString() }); 
        }
        }>
          <Text style={[styles.chapterText
            ]}>
            {item.label}
            </Text>
        </TouchableOpacity>
      )}
    /> 

      {/* {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Text style={styles.button} onPress={handleLanguageChange}>
          Save & Download
        </Text>
      )} */}
    </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  picker: { width: '80%' },
  button: { marginTop: 30, fontSize: 16, color: 'blue' },

    container: { flex: 1, padding: 5, backgroundColor: 'rgb(255, 255, 255)'  },
    scontainer: { flex: 1, padding: 5, backgroundColor: 'skyblue' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10,marginTop:0, textAlign: 'center' },
    chapter: 
    { padding: 8, 
      marginVertical: 0, 
      borderRadius: 0, 
      borderTopWidth: 0.2, 
      borderColor: 'green' ,
      borderbottomWidth: 0,
      backgroundColor: 'white',
      mouseover: '',
    },
    ListTitle: {
      color: 'rgb(202, 87, 11)',
      fontWeight: 'bold',
      marginVertical: 4
    },
    subchapter: {
      fontSize: 16,
      color: 'rgb(6, 103, 54)',
      marginLeft: 16, // optional indent
      marginVertical: 4,
      fontWeight: 'bold'
    },
    chapterText: { fontSize: 18, textTransform: 'capitalize', textAlign: 'center' },
    liststyle: { flex: 1, padding: 5, backgroundColor: 'skyblue' },
    item: {
      backgroundColor: '#f9c2ff',
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(125, 125, 125, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBox: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      width: '80%',
      elevation: 5,
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'column',
      gap: 10,
    },
});
