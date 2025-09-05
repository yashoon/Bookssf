// screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDBConnection_local, getPreDBConnection, getUsers } from '../database/Database';
import { useNavigation } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import { useLanguage } from '../components/LanguageContext';
import { RenderHTML } from 'react-native-render-html';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [allChapters, setAllChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const navigation = useNavigation();
  // const [language, setLanguage] = useState('english'); // Default language
  const { language, isLoading: isLanguageLoading } = useLanguage();

  // const getLanguage = async () => {
  //   const language = await AsyncStorage.getItem('selectedLanguage');
  //   console.log("Language from AsyncStorage in SearchScreen: " + language);
  //   return language || 'english'; // Default to 'english' if not set
  // };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        if (!language || isLanguageLoading) return; // Wait for language to be loaded
  
      // const fetchData = async () => {
        try {
          // language = await getLanguage(); // from AsyncStorage
          setIsLoadingChapters(true);
          console.log("Fetching chapters for language:", language);
          console.log("Language from AsyncStorage in SearchScreen: " + language);
          // setLanguage(language);
  
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
       finally {
        if (isActive) {
          setIsLoadingChapters(false);
        }
      }
      };
  
      fetchData();
  
      return () => {
        isActive = false; // cleanup on unmount
      };
    }, [language, isLanguageLoading]) // you can add dependencies here if needed
  );


  useEffect(() => {
    if (language && !isLanguageLoading) {
      const fetchChapters = async () => {
        try {
          setIsLoadingChapters(true);
          console.log("Language changed, fetching chapters for:", language);
          const db = await getDBConnection_local(language);
          const chapters = await getUsers(db, 'contents');

        setAllChapters(chapters);
        setFilteredChapters(chapters);
        console.log("Fetched chapters for language change:", chapters.length);
}
 catch (e) {
        console.log('Error fetching chapters on language change:', e);
      } finally {
        setIsLoadingChapters(false);
      }
    }
     

    fetchChapters();
  };
  }, [language]);


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
    const end = Math.min(text.length, index + 250);

    return text.slice(start, end) + '...';
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html
      // remove style/script tags and their content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      // remove all HTML tags
      .replace(/<\/?[^>]+(>|$)/g, "")
      // decode HTML entities like &nbsp; &amp;
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      // trim extra spaces/newlines
      .trim();
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
                    onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id, language: language})}
                >
                    <Text style={styles.chapterTitle}>Chapter {item.id}</Text>
                    {/* <Text style={styles.snippet}>{getSnippet(stripHtml(item.content), query)}</Text> */}
                    <RenderHTML contentWidth={10} source={{ html: getSnippet(stripHtml(item.content), query) }} />
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
