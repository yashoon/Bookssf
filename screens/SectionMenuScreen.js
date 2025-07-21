import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AppLayout from '../components/AppLayout';
import { use } from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDBConnection_local, getUsers } from '../database/Database';

const SectionMenuScreen = ({ navigation, route}) => {
    // const sections = ['1. New Believers Training Manual', 
        // '2. Topical Concordance', 
        // '3. Leaders Training Guide'];
    const [lastReadChapter, setLastReadChapter] = useState(null);
    const [sections, setSections] =  useState([]);
    const [selectedLang, setSelectedLang] = useState('english');
    const { language } = route.params || {language: ''};


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
        const fetchLanguage = async () => {
          try {
            setSelectedLang(await AsyncStorage.getItem('selectedLanguage'));
            console.log("Selected Language from Sections Menu: " + selectedLang);
           
          } catch (e) {
            console.log('Error loading last chapter:', e);
          }
        };
    
        fetchLastRead();
        fetchLanguage();

        //getting sections from database.
        // language = 'ssf_' + selectedLang || 'ssf_english';
        console.log("language for sections screen: " + language);
        console.log("language for sections screen from Async: " + selectedLang);

        // language ? 'ssf_' + language : (selectedLang ? : 'ssf_' + selectedLang : 'ssf_english')
        let final_language = "ssf_english";
        if (selectedLang != null || selectedLang != '') {
          final_language = 'ssf_' + selectedLang;
        }
        else if (language != null || language != '') {
          final_language = 'ssf_' + language;
        }
          
        getDBConnection_local(final_language).then((db) => {
              getUsers(db, 'sections').then((sectionlist) => {
                  console.log("This is section List::::::: " + sectionlist)
                  // console.log("chapter in Json: " + JSON.stringify(users))
                  setSections(sectionlist);
                  // console.log("This is chapter List::::::: " + users)
              });   
          });
        //code for fetching last read and showing modal
    }, []);

    useEffect(() => {
      getDBConnection_local('ssf_' + language).then((db) => {
        getUsers(db, 'sections').then((sectionlist) => {
            console.log("This is section List::::::: " + sectionlist)
            // console.log("chapter in Json: " + JSON.stringify(users))
            setSections(sectionlist);
            // console.log("This is chapter List::::::: " + users)
        });   
    });
    }, [language !== selectedLang]);
    console.log("language passed to sections screen: " + language);
    console.log("language variable in sections screen: " + selectedLang);
  
    return (
        // <FontSizeProvider>
        <AppLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Sections of the Book</Text>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.section_id}
            style={styles.sectionButton}
            onPress={() => navigation.navigate('ChapterList', { section: section.section_id })}
          >
            <Text style={styles.sectionText}>{section.section_name}</Text>
          </TouchableOpacity>
        ))}

{/* {sections.map((section) => (
  <Text key={section.section_id}>{section.section_name}</Text>
))} */}
      </View>
      </AppLayout>
      // </FontSizeProvider>
    );
  };
  


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

export default SectionMenuScreen;