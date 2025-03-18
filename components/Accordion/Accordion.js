import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Collapsible from "react-native-collapsible";
// import { createTable, insertDummyData, fetchTOC } from "./database";
import { getPreDBConnection,getUsers } from '../../database/Database';

const TOCAccordionItem = ({ title, subchapters }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <View style={styles.item}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
      </TouchableOpacity>
      <Collapsible collapsed={collapsed}>
        <View style={styles.subchapterContainer}>
          {subchapters.length > 0 ? (
            subchapters.map((sub) => (
              <TOCAccordionItem key={sub.id} title={sub.title} subchapters={sub.subchapters} />
            ))
          ) : (
            <Text style={styles.noContent}>No further subchapters</Text>
          )}
        </View>
      </Collapsible>
    </View>
  );
};

const MultiLevelAccordion = () => {
  const [tocData, setTocData] = useState([]);
  let a = [];

// Fetch Nested TOC from Database
const fetchTOC = async (data_db, callback) => {
  data_db.transaction((tx) => {
    console.log("inside fetching ..")
    tx.executeSql(
      "SELECT * FROM CHAPTERS",
      [],
      (_, results) => {
        let rows = results.rows.raw();
        console.log("these are rows inside function"+ rows)
        // Convert flat list into nested structure
        let count = 0
        const buildHierarchy = (parentId = null) => {
          count += 1;
            console.log("this is returning" + rows.filter((item) => item.parent_chapter == 0))
          
          console.log("setting rows" + rows);
          // setTocData(rows);
          return rows
            .filter((item) => item.parent_chapter === parentId)
            .map((item) => ({ ...item, subchapters: buildHierarchy(item.chapter_number) }));
        };

        callback(buildHierarchy());
        console.log('this is count ' + count);
      },
      (error) => console.error("Error fetching data", error)
    );
  });
};

  useEffect(() => {

    console.log("this is using effect in accordion");
      getPreDBConnection().then((db) => {
            // getUsers(db, 'Chapters').then((users) => {
            //     console.log("This is chapter List::::::: " + users)
            //     console.log("chapter in Json: " + JSON.stringify(users))
            //     setChapters(users);
            //     console.log("This is chapter List::::::: " + users)
            // }); 
            console.log("this is getting the db to work");
            fetchTOC(db, setTocData).then((a) => {
              console.log("$$$$$$$$$$$$$$$$$: "+ a.length);
            }
            );
            console.log("this is TOC data temp: "+ a.length);
            console.log("this is TOC data: "+ tocData.length);
            console.log("this is TOC data temp: "+ a.length);
   
        });

  }, []);

  console.log("this is TOC data: "+ tocData);
  console.log("this is TOC data temp: "+ a);

  return (
    <View style={styles.container}>
      {tocData.map((item) => (
        <TOCAccordionItem key={item.id} title={item.title} subchapters={item.subchapters} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  item: {
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#007bff",
    padding: 10,
  },
  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subchapterContainer: {
    paddingLeft: 20,
    paddingVertical: 5,
    backgroundColor: "#f9f9f9",
  },
  noContent: {
    fontStyle: "italic",
    color: "#777",
    paddingLeft: 10,
  },
});

export default MultiLevelAccordion;
