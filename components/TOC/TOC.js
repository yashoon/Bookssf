import React, {useEffect, useState} from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { getPreDBConnection,getUsers } from '../../database/Database';
import { t } from 'i18next';

const items = ['Apple', 'Banana', 'Cherry'];


const TOC = ({ navigation }) => {

    const [chapters, setChapters] =  useState([]);

  useEffect(() => { 
    getPreDBConnection().then((db) => {
        getUsers(db, 'Chapters').then((users) => {
            // console.log("This is chapter List::::::: " + users)
            console.log("chapter in Json: " + JSON.stringify(users))
            setChapters(users);
            // console.log("This is chapter List::::::: " + users)
        });   
    });
}, []);

// console.log("--------" + props.nav)
const data = ['Apple', 'Banana', 'Cherry'];
const transformedData = [];

for (let i = 0; i < chapters.length; i++) {
const current_chapter = chapters[i].chapter_number
if (chapters[i].parent_chapter == null){
    transformedData.push(<TouchableOpacity  onPress={() => navigation.navigate('ChapterContent', { chapterId: chapters[i].chapter_number })}>
                        <Text>
                            {chapters[i].chapter_number}. 
                            {chapters[i].default_title}
                        </Text>
                      </TouchableOpacity>)
// transformedData.push(<Text key={i}>{chapters[i].default_title}</Text>);
}
    for (let j = 0; j < chapters.length; j++){
        if (current_chapter == chapters[j].parent_chapter){
            transformedData.push(<TouchableOpacity  onPress={() => navigation.navigate('ChapterContent', { chapterId: chapters[j].chapter_number })}>
                        <Text style={{color: 'blue'}}>
                            {/* {chapters[j].chapter_number}.  */}
                            {chapters[j].default_title}
                            </Text>
                      </TouchableOpacity>)
            // transformedData.push(<Text style={{ color: 'blue' }} key={j}> Child{chapters[j].default_title}</Text>)
        }

    }
}
{ console.log(transformedData)}
  return (
    <View key={transformedData.id}>
        {/* { console.log(transformedData)} */}
        {transformedData}
      {/* {chapters.map((item, index) => (

            <Text key={index}>
            {item.id}. {item.default_title}
            </Text>
            
            
      ))} */}
    </View>
  );
//         <Text key={index}>
//             {item.parent_chapter}{item.id}{item.default_title}
//             </Text> 
//       ))}
//     </View>
//   );
};

export default TOC;

