import { Platform } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import { ensureDatabaseExists } from './firebaseDBManager';
import RNFS from 'react-native-fs';

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


// getting database form firebase

// FIX: every screen (SectionMenuScreen, ChapterListScreen,
// ChapterContentScreen, SearchScreen, LanguageSelectorScreen) was calling
// getDBConnection_local(language) independently on its own mount, so a
// single tab switch could kick off several concurrent, redundant
// ensureDatabaseExists() calls (each doing its own AsyncStorage read +
// network version check + SQLite.openDatabase) for the *same* language and
// file at once. Besides the wasted work, that pile-up of near-simultaneous
// async state settling — several screens re-rendering within the same
// frame — is exactly the kind of pattern implicated in a recurring Fabric
// crash we started seeing (RetryableMountingLayerException: "Unable to find
// viewState for tag N"), a known upstream React Native New Architecture
// issue where a queued native layout update loses its view mid-race. A
// per-language in-flight/resolved connection cache means only the first
// caller does the real work; everyone else awaits the same promise.
const connectionCache = {};

// Tables every language database is expected to contain. Confirmed via two
// separate real-world crash reports (different devices/users, same
// signature): a file left behind by an interrupted download can pass both
// RNFS.exists() and SQLite.openDatabase() — opening a SQLite file only
// reads its header, it doesn't verify every table that's supposed to be in
// it actually got written before the transfer died — and the app only
// found out when a screen ran `SELECT * FROM sections` and hit "no such
// table: sections", by which point it surfaced as an unhandled promise
// rejection instead of a clean, retryable failure. 'Chapters' added
// alongside 'Sections'/'Contents' since ChapterListScreen and SearchScreen
// depend on it just as directly.
const REQUIRED_TABLES = ['Sections', 'Chapters', 'Contents'];

/**
 * Confirms `db` can actually be queried for every table in
 * `requiredTables`, rather than trusting that a successful
 * SQLite.openDatabase() means the file is complete.
 *
 * FIX (false-positive "missing table" on freshly, correctly downloaded
 * databases, reported immediately after this check shipped): the first
 * version of this check introspected `sqlite_master.name` and compared it
 * against these lowercase literals with a plain JS string/Set lookup.
 * SQLite itself resolves table names in a query case-insensitively (and
 * treats a view exactly like a table for SELECT purposes) — which is
 * exactly why every *other* query in this app (`SELECT * FROM sections`,
 * etc.) has always worked regardless of the real schema's exact casing or
 * table-vs-view choice, while this check's exact-case string comparison
 * against sqlite_master's raw stored name did not, and rejected every
 * database unconditionally. Querying `SELECT 1 FROM <table> LIMIT 1`
 * directly sidesteps both: it's case-insensitive and view-agnostic, same
 * as any other query here, so it only fails for the actual thing this
 * check cares about — the table genuinely isn't usable.
 *
 * This also fixes a second, related bug the false positives surfaced:
 * rejecting a hand-wrapped `new Promise` from inside a
 * `db.transaction(tx => ...)` callback doesn't guarantee the native side's
 * commit has actually finished by the time the caller's `await` continues,
 * so the immediate `db.close()` in the catch block below was racing it
 * ("database cannot be closed while a transaction is in progress").
 * db.executeSql() (SQLite.enablePromise(true) is set at the top of this
 * file) returns a promise that only settles once that call has genuinely
 * completed, so there's no separate manual wrapping left to race.
 */
const verifyRequiredTables = async (db, requiredTables) => {
  for (const table of requiredTables) {
    try {
      await db.executeSql(`SELECT 1 FROM ${table} LIMIT 1;`);
    } catch (error) {
      throw new Error(`Database is missing expected table: ${table}`);
    }
  }
};

/**
 * @param {string} language
 * @param {(percent: number) => void} [onProgress] Forwarded to
 *   ensureDatabaseExists — only fires if a real download happens. Note: if
 *   this language's connection is already cached or has an in-flight
 *   request from another screen, onProgress here won't fire even if a
 *   download is genuinely in progress elsewhere — it's only wired to
 *   whichever call actually kicked off the work.
 */
export const getDBConnection_local = async (language, onProgress) => {
  if (connectionCache[language]) {
    return connectionCache[language];
  }

  const connectionPromise = (async () => {
    console.log('language name from database.js: ' + language);

    const dbPath = await ensureDatabaseExists(language, onProgress);
    console.log('Database path:', dbPath);
    const dbName = `${language}.db`;

    const db = await SQLite.openDatabase(
      Platform.OS === 'ios'
      ? {
          name: dbName,
          // location: 'Documents', // iOS needs this
          location: 'Library', // iOS needs this
        }
      : {
          name: dbPath, // Use the full path for Android
          // location: 'default', // Android handles from DocumentDirectoryPath
        },
      () => console.log('✅ Opened database for', language),
      error => console.error('❌ DB Open error:', error)
    );

    // FIX ("no such table: sections" crash, confirmed on 2 separate real
    // devices): checked here, once, right after opening — before this
    // connection is cached or handed to any caller — rather than only
    // right after a fresh download. connectionCache is in-memory only and
    // resets on every app restart, so this still runs at least once per
    // language per app session even for a file that's been sitting on disk
    // for weeks, which is what actually self-heals the two already-broken
    // installs behind those crash reports (neither is about to re-download
    // on its own, since ensureDatabaseExists sees a matching version).
    try {
      await verifyRequiredTables(db, REQUIRED_TABLES);
    } catch (integrityError) {
      console.error(
        `❌ Database integrity check failed for ${language}:`,
        integrityError.message || integrityError,
      );
      try {
        await db.close();
      } catch (closeErr) {
        console.warn('Failed to close corrupt database before removing it:', closeErr.message);
      }
      try {
        await RNFS.unlink(dbPath);
        console.log(`🗑️ Removed corrupt database file: ${dbPath}`);
      } catch (cleanupErr) {
        console.warn('Failed to remove corrupt database file:', cleanupErr.message);
      }
      // isCorrupt mirrors the existing isOffline marker pattern
      // (firebaseDBManager.js) so callers can show a specific message
      // rather than string-matching err.message.
      const corruptError = new Error(
        'The downloaded language file appears to be corrupted. Please try downloading it again.',
      );
      corruptError.isCorrupt = true;
      throw corruptError;
    }

    return db;
  })();

  connectionCache[language] = connectionPromise;

  try {
    return await connectionPromise;
  } catch (error) {
    // Don't poison the cache with a failed attempt — let the next caller retry.
    delete connectionCache[language];
    throw error;
  }
};


// getting database form firebase
//

export const getPreDBConnection = async () => {
  console.log('Opening database ...');
  //https://shepherd-s-staff.web.app/databases/SSF.db
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


// FIX (log analysis of a live "no such table: sections" crash, 2026-09-08):
// this and getMaxChapterId below used to only ever resolve their Promise -
// the error callback passed to tx.executeSql just console.error'd and never
// called reject. Any real SQL failure (missing table, corrupt db, etc.) left
// the returned promise permanently pending instead of throwing, so the raw
// SQLite error object surfaced to Sentry as an unhandled/uncaught exception
// ("Object captured as exception with keys: code, message") instead of
// something a caller's existing try/catch could show a retry state for. Also
// added a transaction-level error callback (previously omitted entirely) so
// a failure in the transaction itself, not just in executeSql, still rejects
// rather than hanging silently.
export const getUsers = async (db, table) => {

  console.log('Fetching users ...' + db);
  return new Promise((resolve, reject) => {
  db.transaction(
    tx => {
      tx.executeSql(
        'SELECT * FROM ' + table + ';',
        [],
        (_, results) => {
          // console.log('Results:', results);
          let users = [];
          for (let i = 0; i < results.rows.length; i++) {
            users.push(results.rows.item(i));
            // console.log(i);
          }
          // console.log('✅ Users fetched:', users);
           resolve(users);
        },
        error => {
          console.error('Error fetching users:', error);
          reject(error);
          // FIX: react-native-sqlite-storage's real statement error handling
          // (SQLitePluginTransaction.prototype.handleStatementFailure)
          // requires the error callback to explicitly return `false`, or it
          // throws its own "a statement error callback did not return
          // false" internally (caught and merely logged as a "warning -
          // exception while invoking a callback" - confirmed in a live
          // Sentry log - but still noise worth avoiding).
          return false;
        },
      );
    },
    transactionError => {
      console.error('Transaction error fetching users:', transactionError);
      reject(transactionError);
    },
  );
});
};

export const getMaxChapterId = async (db, table) => {

  // console.log('Fetching Max Chapter ID ...');
  return new Promise((resolve, reject) => {
  db.transaction(
    tx => {
      tx.executeSql(
        'SELECT max(id) as maxChapterID FROM ' + table + ';',
        [],
        (_, results) => {
          // console.log('Results:', results);
          const row = results.rows.item(0);
          // console.log('✅ Max ID fetched:', row.maxChapterID);
          resolve(row.maxChapterID);
        },
        error => {
          console.error('Error fetching maxChapterID:', error);
          reject(error);
          // See the matching comment in getUsers' error callback above.
          return false;
        },
      );
    },
    transactionError => {
      console.error('Transaction error fetching maxChapterID:', transactionError);
      reject(transactionError);
    },
  );
});
};