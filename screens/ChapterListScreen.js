import React, { useEffect, useState }  from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDBConnection, getUsers, getUsers1, getPreDBConnection } from '../database/Database';
import MultiLevelAccordion from '../components/Accordion/Accordion';
import TOC from '../components/TOC/TOC';
import { ScrollView } from 'react-native-gesture-handler';

const chapters = [
  { id: '1', title: 'The Bible' },
  { id: '2', title: 'God' },
  { id: '3', title: 'Man and Satan' },
];

const ChapterListScreen = ({ navigation }) => {
  const { t } = useTranslation();
//   const { i18n } = useTranslation();
  const [chapters, setChapters] =  useState([]);

  useEffect(() => { 
    getPreDBConnection().then((db) => {
        getUsers(db, 'Chapters').then((users) => {
            // console.log("This is chapter List::::::: " + users)
            // console.log("chapter in Json: " + JSON.stringify(users))
            setChapters(users);
            // console.log("This is chapter List::::::: " + users)
        });   
    });
    // loadDataCallback();
    // console.log('Chapters: ', chapters);
  }, []);
console.log("this is rendering page")
  return (
    <SafeAreaView style={styles.container}>
    <View>
      <Text style={styles.title}>Table of Contents</Text>
     { <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={
            [styles.chapter]
            } onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id })}>
            <Text style={[styles.chapterText,
              item.parent_chapter == 0 ? styles.ListTitle : styles.subchapter
            ]}>{item.id+ ". " + (item.default_title).trim()}</Text>
          </TouchableOpacity>
        )}
      /> }

    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5 },
  scontainer: { flex: 1, padding: 5, backgroundColor: 'skyblue' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10,marginTop:0, textAlign: 'center' },
  chapter: { padding: 10, marginVertical: 0, borderRadius: 0, borderTopWidth: 1, 
    borderColor: 'gray' ,
    borderbottomWidth: 0,
    backgroundColor: 'cement',
    mouseover: '',
  },
  ListTitle: {
    color: '#ff5733',
    fontWeight: 'bold'
  },
  subchapter: {
    color: 'orange',
  },
  chapterText: { fontSize: 18, textTransform: 'capitalize' },
  liststyle: { flex: 1, padding: 5, backgroundColor: 'skyblue' },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});

export default ChapterListScreen;