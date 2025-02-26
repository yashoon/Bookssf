import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { SelectList } from 'react-native-dropdown-select-list'
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getPreDBConnection, getUsers } from '../database/Database';

const Header = ({ currentChapter }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [chapters, setChapters] =  useState([]);

  // const chapters = [
  //   { label: 1, value: 'Chapter 1' },
  //   { label: t('Chapter 2'), value: '2' },
  //   { label: t('Chapter 3'), value: '3' },
  // ];
  const data = [
    {key:'0', value:'Chapter 1'},
    {key:'1', value:'Chapter 2'},
    {key:'2', value:'Chapter 3'},
    {key:'4', value:'Computers', disabled:true},
]

  useEffect(() => { 
    // getChapters('en', setChapters);
    // console.log('Chapters:', chapters);
    getPreDBConnection().then((db) => {
        getUsers(db, 'Chapters').then((users) => {
            console.log("This is chapter List:::::::headeer " + users)
            setChapters(users);
            console.log("This is chapter List:::::::headeer " + users)
        });
        // getUsers1(db, 'sqlite_master').then((users) => {
        //     console.log("This is chapter List::::::: " + users)
        //     setChapters(users);
        //     // console.log("This is chapter List::::::: " + users)
        // });
        
    });
    // loadDataCallback();
    // console.log('Chapters: ', chapters);
  }, []);

  return (
    <View style={styles.header}>
      {/* <Text style={styles.title}>{t('Chapters')}</Text> */}
      {/* <RNPickerSelect
        onValueChange={(value) => {
          if (value) navigation.navigate('ChapterContent', { chapterId: value });
        }}
        items={chapters}
        placeholder={{ label: t('Select Chapter'), value: null }}
        style={pickerStyles}
        value={currentChapter}
      /> */}
      {/* <RNPickerSelect
      onValueChange={(value) => console.log(value)}
      items={[
        { label: 'Football', value: 'football' },
        { label: 'Baseball', value: 'baseball' },
        { label: 'Hockey', value: 'hockey' },
      ]}
    /> */}
    <SelectList 
        setSelected={value => {
            if (value) navigation.navigate('ChapterContent', { chapterId: value });
          console.log("this is dropdown::::" + value);
          }}
        data={data} 
        save="label"
        boxStyles={{width: '100%', height: 50, color: 'white', fontSize: 16, alignItems: 'center'}}
        dropdownStyles={{width: '330%', color: 'white', fontSize: 16}}
        // inputStyles={{width: '100%', color: 'white', fontSize: 16}}
        dropdownItemStyles={{width: '100%', color: 'white', fontSize: 16}}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { padding: 15, backgroundColor: '#007bff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex:1000 },
  title: { fontSize: 18, color: 'white', fontWeight: 'bold' },
});

const pickerStyles = {
  inputIOS: { color: 'white', fontSize: 16 },
  inputAndroid: { color: 'white', fontSize: 16 },
};

export default Header;
