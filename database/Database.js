import SQLite from 'react-native-sqlite-storage';

// Enable debugging
SQLite.enablePromise(true);
SQLite.DEBUG(true);

export const getDBConnection = async () => {
  console.log('Opening database ...');
  return SQLite.openDatabase({ name: "mydatabase.db", location: "default" },
    () => console.log('✅ Database opened successfully ...'),
    error => console.error('❌ Error opening database:', error)
  );
};

// Fetch Nested TOC from Database
// export const fetchTOC = (callback) => {
//   data_db.transaction((tx) => {
//     tx.executeSql(
//       "SELECT * FROM CHAPTERS",
//       [],
//       (_, results) => {
//         let rows = results.rows.raw();

//         // Convert flat list into nested structure
//         const buildHierarchy = (parentId = null) => {
//           return rows
//             .filter((item) => item.parent_chapter === parentId)
//             .map((item) => ({ ...item, subchapters: buildHierarchy(item.chapter_number) }));
//         };

//         callback(buildHierarchy());
//       },
//       (error) => console.error("Error fetching data", error)
//     );
//   });
// };

export const getPreDBConnection = async () => {
  console.log('Opening database ...');
  // opening a pre-populated database in the app bundle (best scenario) 
  //createFromLocation: 1 is the key to open the pre-populated database
  //createFromLocation: 0 is the key to open the empty database
  //createFromLocation: 2 is the key to open the pre-populated database in the documents directory
  //location: 'Library' is the key to open the pre-populated database in the Library directory
  //location: 'Documents' is the key to open the pre-populated database in the Documents directory
  //location: 'Shared' is the key to open the pre-populated database in the Shared directory
  //location: 'Data' is the key to open the pre-populated database in the Data directory
  //location: 'Library' is the key to open the pre-populated database in the Library directory
  return SQLite.openDatabase({ name: "SSF", location: "Library" , createFromLocation: "~SSF.db",},
    () => console.log('✅ Preloaded Database opened successfully ...'),
    error => console.error('❌ Preloaded Error opening database:', error)
  );
};

// const db = SQLite.openDatabase(
//   {
//     name: 'mydatabase.db',
//     location: 'default',
//   },
//   () => console.log('✅ Database opened successfully'),
//   error => console.error('❌ Error opening database:', error)
// );
export const createTable = async (db) => {
  // Create a table if it doesn't exist
  const query = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        age INTEGER
      );`;
console.log('Creating table ...' + query);
try {
  await db.executeSql(query);
} catch (error) {
  console.error('❌ Error creating table:', error);
}
};

export const insertChapters = async (db) => {
  // insert into table
  const query = `INSERT INTO users (name, age) VALUES ('John Doe', 30);`;
console.log('inserting into ...' + query);
try {
  await db.executeSql(query);
} catch (error) {
  console.error('❌ Error creating table:', error);
}
};

// export const getUsersnew = async (db) => {
//   // insert into table
//   const query = 'SELECT * FROM users;';
// console.log('fetching users ...' + query);
// try {
//   await db.executeSql(query, [], (_, results) => 
//     {let users = [];
//       for (let i = 0; i < results.rows.length; i++) {
//         users.push(results.rows.item(i));
//       }
//       console.log('✅ Users fetched:', users);
// });
// } catch (error) {
//   console.error('❌ Error creating table:', error);
// }
// };

export const getUsers = async (db, table) => {

  console.log('Fetching users ...');
  return new Promise(resolve => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM ' + table + ';',
      [],
      (_, results) => {
        // console.log('Results:', results);
        let users = [];
        for (let i = 0; i < results.rows.length; i++) {
          users.push(results.rows.item(i));
          console.log(i);
        }
        console.log('✅ Users fetched:', users);
         resolve(users);
      },
      error => console.error('Error fetching users:', error)
    );
  });
});
};
// export const getUsers1 = async (db, table) => {

//   console.log('Fetching users ...');
//   return new Promise(resolve => {
//     db.transaction(tx => {
//       tx.executeSql(
//         "SELECT sql FROM sqlite_master WHERE type='table'",
//         [],
//         (_, results) => {
//           if (results.rows.length > 0) {
//             console.log('Table Schemas:', results.rows.raw());
//           } else {
//             console.log('No table schemas found');
//           }
//         },
//         error => {
//           console.error('Error fetching schemas:', error);
//         }
//       );
//     });
// });
// };

// export const createTable = async (db) => {
//   db.transaction(tx => {
//     tx.executeSql(
//       `CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT, 
//         name TEXT, 
//         age INTEGER
//       );`,
//       [],
//       () => console.log('✅ Table created'),
//       error => console.error('❌ Error creating table:', error)
//     );
//   });
// };

// createTable();

// export default db;