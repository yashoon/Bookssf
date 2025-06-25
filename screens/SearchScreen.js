// screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getPreDBConnection, getUsers } from '../database/Database';
import { useNavigation } from '@react-navigation/native';
import AppLayout from '../components/AppLayout';
import { SafeAreaView } from 'react-native-safe-area-context';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [allChapters, setAllChapters] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    getPreDBConnection().then((db) => {
      getUsers(db, 'contents').then((chapters) => {
        setAllChapters(chapters);
        setFilteredChapters(chapters);
        console.log("Fetched chapters:", chapters);
      });
    });
  }, []);

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
                    onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id })}
                >
                    <Text 
                    // style={styles.title}
                    style={{ fontSize: 18, color: 'gray' }}
                    >{item.content}</Text>
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
});

export default SearchScreen;
