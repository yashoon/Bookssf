import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import AppLayout from '../components/AppLayout';
import { use } from 'i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDBConnection_local, getUsers } from '../database/Database';
import { LanguageContext } from '../components/LanguageContext';

const SectionMenuScreen = ({ navigation, route}) => {
  // const { language, setLanguage } = useContext(LanguageContext);
    // const sections = ['1. New Believers Training Manual', 
        // '2. Topical Concordance', 
        // '3. Leaders Training Guide'];
    const [lastReadChapter, setLastReadChapter] = useState(null);
    const [sections, setSections] =  useState([]);
    const [selectedLang, setSelectedLang] = useState();
    const { language } = route.params || {language: ''};
    let final_language = language || '';
    const isInitialRender = useRef(true);


    const fetchLanguage_new = async() => {
      try {
        language_cache = await AsyncStorage.getItem('selectedLanguage');
        console.log("Language from AsyncStorage: " + language_cache);
        if (language_cache) {
          console.log("SETTING SELECTEDLANG: " + language_cache);
          setSelectedLang(language_cache);
        }
        else {
          navigation.navigate('Language');
        }
        console.log("Selected Language from Sections Menu: " + language_cache);

        console.log("language for sections screen: " + language);

        if (language != null && language != '') {
          console.log("SEtting setting language:" + language);
          final_language = language;
        }
        else if (language_cache != null && language_cache != '') {
          console.log("SEtting langauge_cache: " + language_cache);
          final_language = language_cache;
        }
        
        console.log("Final Language for Sections Screen: " + final_language);
          
        getDBConnection_local(final_language).then((db) => {
              getUsers(db, 'sections').then((sectionlist) => {
                  console.log("This is section List::::::: " + sectionlist)
                  // console.log("chapter in Json: " + JSON.stringify(users))
                  setSections(sectionlist);
                  // console.log("This is chapter List::::::: " + users)
              });   
          });
       
      } catch (e) {
        console.log('Error loading last chapter:', e);
      }
    };

useEffect(() => {
        
       // this is for getting the last read chapter from AsyncStorage
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
        //code for fetching last read and showing modal


        fetchLastRead();
        fetchLanguage_new();
    }, []);

    useEffect(() => {

      if (isInitialRender.current) {
        // Skip execution on the initial render
        isInitialRender.current = false;
        return;
      }
      console.log("this is second user Effect")
      fetchLanguage_new();
      // getDBConnection_local('ssf_' + language).then((db) => {
        console.log("Final language att selection screen before calling db: " + final_language);
    //   getDBConnection_local(final_language).then((db) => {
    //     getUsers(db, 'sections').then((sectionlist) => {
    //         console.log("This is section List::::::: " + sectionlist)
    //         // console.log("chapter in Json: " + JSON.stringify(users))
    //         setSections(sectionlist);
    //         // console.log("This is chapter List::::::: " + users)
    //     });   
    // });
    }, [language]);
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
            onPress={() => navigation.navigate('ChapterList', { section: section.section_id, language: selectedLang})}
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