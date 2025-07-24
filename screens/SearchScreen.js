// screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDBConnection_local, getPreDBConnection, getUsers } from '../database/Database';
import { useNavigation } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchScreen = (navigation, route) => {
  const [query, setQuery] = useState('');
  const [allChapters, setAllChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  // const navigation = useNavigation();
  // let lan = AsyncStorage.getItem('selectedLanguage').then((language) => {
  //   console.log("Language from AsyncStorage in SearchScreen: " + language);
  //   return language;
  // });

  const getLanguage = async () => {
    const language = await AsyncStorage.getItem('selectedLanguage');
    console.log("Language from AsyncStorage in SearchScreen: " + language);
    return language || 'english'; // Default to 'english' if not set
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
  
      const fetchData = async () => {
        try {
          const language = await getLanguage(); // from AsyncStorage
          console.log("Language from AsyncStorage in SearchScreen: " + language);
  
          const db = await getDBConnection_local(language);
          const chapters = await getUsers(db, 'contents');
  
          if (isActive) {
            setAllChapters(chapters);
            setFilteredChapters(chapters);
            console.log("Fetched chapters:", chapters);
          }
        } catch (e) {
          console.log('Error fetching chapters:', e);
        }
      };
  
      fetchData();
  
      return () => {
        isActive = false; // cleanup on unmount
      };
    }, []) // you can add dependencies here if needed
  );


  useEffect(() => {
    // getPreDBConnection().then((db) => {
    AsyncStorage.getItem('selectedLanguage').then((language) => {
      console.log("Language from AsyncStorage in SearchScreen: " + language);
      
    getDBConnection_local(language).then((db) => {
      getUsers(db, 'contents').then((chapters) => {
        setAllChapters(chapters);
        setFilteredChapters(chapters);
        console.log("Fetched chapters:", chapters);
      });
    });
    });
  }, 
  
  []);

  useEffect(() => {
    // getPreDBConnection().then((db) => {
    AsyncStorage.getItem('selectedLanguage').then((language) => {
      console.log("Language from AsyncStorage in SearchScreen: " + language);
      
    getDBConnection_local(language).then((db) => {
      getUsers(db, 'contents').then((chapters) => {
        setAllChapters(chapters);
        setFilteredChapters(chapters);
        console.log("Fetched chapters:", chapters);
      });
    });
    });
  }, 
  
  []);

  useEffect(() => {
    console.log("Query changed:", query);
    console.log("All chapters:", allChapters);
    // if (!query.trim()) {
    if (!query || !query.trim()) {
      setFilteredChapters(allChapters);
      console.log("Resetting filtered chapters to all chapters");
    } else if (query.length >= 3) {
        console.log("Filtering chapters with query:", query, allChapters);
      const filtered = allChapters.filter((item) =>
        item.content.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredChapters(filtered);
      console.log("Setting Filtered chapters:", filteredChapters);
    }
  }, [query]);

  const getSnippet = (html, keyword) => {
    const text = html.replace(/<[^>]+>/g, ''); // strip HTML
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());

    if (index === -1) return text.slice(0, 100) + '...';

    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + 60);

    return text.slice(start, end) + '...';
  };

  return (
    <AppLayout>
        {/* <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}></SafeAreaView> */}
            <View style={styles.container}>
            <TextInput
                placeholder="Minimum 3 characters required Ex: Bible"
                value={query}
                onChangeText={setQuery}
                style={styles.input}
            />
            <FlatList
                data={filteredChapters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.item}
                    onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id, language: lan })}
                >
                    {/* <Text 
                    // style={styles.title}
                    style={{ fontSize: 18, color: 'gray' }}
                    >{item.content}</Text> */}
                    <Text style={styles.chapterTitle}>Chapter {item.id}</Text>
                    <Text style={styles.snippet}>{getSnippet(item.content, query)}</Text>
                </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                        <Text style={{ fontSize: 18, color: 'gray' }}>
                            No content found. Try searching with different keywords.
                        </Text>
                    </View>
                )}
            />
            </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  item: {
    padding: 12,
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    // backgroundColor: 'red',
  },
  title: {
    fontSize: 16,
    color: 'gray',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgb(34, 143, 68)',
    marginBottom: 6,
  },
});

export default SearchScreen;
