import React, { useEffect, useState }  from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDBConnection, getUsers, getUsers1, getPreDBConnection } from '../database/Database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const chapters = [
  { id: '1', title: 'The Bible' },
  { id: '2', title: 'God' },
  { id: '3', title: 'Man and Satan' },
];

const ChapterListScreen = ({ navigation }) => {
  const { t } = useTranslation();
//   const { i18n } = useTranslation();
  const [chapters, setChapters] =  useState([]);
  const [lastReadChapter, setLastReadChapter] = useState(null);
  const [showModal, setShowModal] = useState(false);



  useEffect(() => { 
    getPreDBConnection().then((db) => {
        getUsers(db, 'Chapters').then((users) => {
            // console.log("This is chapter List::::::: " + users)
            // console.log("chapter in Json: " + JSON.stringify(users))
            setChapters(users);
            // console.log("This is chapter List::::::: " + users)
        });   
    });

    //code for fetching last read and showing modal
    const fetchLastRead = async () => {
      try {
        const stored = await AsyncStorage.getItem('lastReadChapter');
        if (stored) {
          setLastReadChapter(parseInt(stored, 10));
          setShowModal(true);
        }
      } catch (e) {
        console.log('Error loading last chapter:', e);
      }
    };

    fetchLastRead();
    //code for fetching last read and showing modal

  }, []);

  const handleContinue = () => {
    setShowModal(false);
    navigation.navigate('ChapterContent', { chapterId: lastReadChapter });
  };

  const handleStartFromBeginning = () => {
    setShowModal(false);
    navigation.navigate('ChapterContent', { chapterId: 1 });
  };


console.log("this is rendering page")
  return (
    <SafeAreaView style={styles.container}>
    <View>
      {/* <Text style={styles.title}>Table of Contents</Text> */}
     { <FlatList
        data={chapters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={
            [styles.chapter]
            } onPress={() => navigation.navigate('ChapterContent', { chapterId: item.id })}>
            <Text style={[styles.chapterText,
              item.parent_chapter == null ? styles.ListTitle : styles.subchapter
            ]}>
              {
              // item.id+ ". " + 
            (item.default_title).trim()}</Text>
          </TouchableOpacity>
        )}
      /> }

    <Modal
        visible={showModal}
        transparent
        animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              Continue reading from Chapter {lastReadChapter}?
            </Text>
            <View style={styles.buttonRow}>
              <Button title="📖 Continue" onPress={handleContinue} />
              <Button title="🔁 Start Over" onPress={handleStartFromBeginning} />
              <Button title="🔍 Let Me Choose" onPress={() => setShowModal(false)} />
            </View>
          </View>
        </View>
    </Modal>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5, backgroundColor: 'rgb(255, 255, 255)'  },
  scontainer: { flex: 1, padding: 5, backgroundColor: 'skyblue' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10,marginTop:0, textAlign: 'center' },
  chapter: 
  { padding: 5, 
    marginVertical: 0, 
    borderRadius: 0, 
    borderTopWidth: 0.2, 
    borderColor: '' ,
    borderbottomWidth: 0,
    backgroundColor: 'cement',
    mouseover: '',
  },
  ListTitle: {
    color: 'rgb(202, 87, 11)',
    fontWeight: 'bold'
  },
  subchapter: {
    fontSize: 16,
    color: 'rgb(6, 103, 54)',
    marginLeft: 16, // optional indent
    marginVertical: 4,
    fontWeight: 'bold'
  },
  chapterText: { fontSize: 18, textTransform: 'capitalize' },
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

export default ChapterListScreen;