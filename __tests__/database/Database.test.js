// Database.js pulls in react-native-sqlite-storage, react-native-fs, and
// (transitively, via firebaseDBManager) NetInfo/axios/reanimated at module
// load time. getUsers/getMaxChapterId themselves don't touch any of that —
// they just run SQL against whatever `db` object they're handed — so we
// stub the heavy native imports out rather than pull real native modules
// into a Jest run.
jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  DEBUG: jest.fn(),
  openDatabase: jest.fn(),
}));
jest.mock('../../database/firebaseDBManager', () => ({
  ensureDatabaseExists: jest.fn(),
}));
// FIX: previously `{}` — getDBConnection_local's integrity-check cleanup
// path calls RNFS.unlink() on a corrupt file, which would throw
// "RNFS.unlink is not a function" the moment any test exercised that path.
jest.mock('react-native-fs', () => ({
  unlink: jest.fn(() => Promise.resolve()),
}));

import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { ensureDatabaseExists } from '../../database/firebaseDBManager';
import {
  getUsers,
  getMaxChapterId,
  getDBConnection_local,
} from '../../database/Database';

// Minimal fake of the react-native-sqlite-storage `db` object: a
// transaction() that immediately invokes the tx callback, and an
// executeSql() that resolves with a fake `results.rows` collection.
const makeFakeDb = (rows) => ({
  transaction: (txCallback) => {
    const tx = {
      executeSql: (query, params, successCallback) => {
        const results = {
          rows: {
            length: rows.length,
            item: (i) => rows[i],
          },
        };
        successCallback(tx, results);
      },
    };
    txCallback(tx);
  },
});

// Fakes for the rejection-path tests below: a db whose executeSql call
// invokes the *error* callback instead of the success one (simulating a SQL
// failure like "no such table"), and one whose transaction() itself invokes
// its error callback (simulating the transaction failing before any SQL
// runs).
//
// The real react-native-sqlite-storage library (lib/sqlite.core.js,
// SQLitePluginTransaction.prototype.executeSql's `myerror` wrapper) invokes
// the statement-level error callback with a single argument - the error
// itself, not (transaction, error) - confirmed by reading the installed
// library source directly rather than assuming.
const makeFakeDbWithSqlError = (sqlError) => ({
  transaction: (txCallback) => {
    const tx = {
      executeSql: (query, params, successCallback, errorCallback) => {
        errorCallback(sqlError);
      },
    };
    txCallback(tx);
  },
});

const makeFakeDbWithTransactionError = (transactionError) => ({
  transaction: (txCallback, txErrorCallback) => {
    txErrorCallback(transactionError);
  },
});

// getDBConnection_local's integrity check runs `SELECT 1 FROM <table>
// LIMIT 1` (via the promise-based db.executeSql, not the callback-style
// db.transaction/tx.executeSql that makeFakeDb above simulates) against
// whatever connection SQLite.openDatabase() resolves. This fake resolves
// for any table named in `presentTables` and rejects with a "no such
// table" error for anything else — mirroring real SQLite's actual
// behavior closely enough to exercise the check meaningfully, including
// close() for the corrupt-path tests below.
const makeFakeConnection = (presentTables) => ({
  executeSql: jest.fn((sql) => {
    const match = /FROM\s+(\w+)/i.exec(sql);
    const table = match ? match[1] : null;
    if (table && presentTables.includes(table)) {
      return Promise.resolve([{ rows: { length: 0, item: () => null } }]);
    }
    return Promise.reject(new Error(`no such table: ${table}`));
  }),
  close: jest.fn(() => Promise.resolve()),
});

describe('getUsers', () => {
  it('resolves with every row from the given table', async () => {
    const fakeRows = [
      { id: 1, name: 'Intro' },
      { id: 2, name: 'Chapter 1' },
    ];
    const db = makeFakeDb(fakeRows);

    const result = await getUsers(db, 'sections');

    expect(result).toEqual(fakeRows);
  });

  it('resolves with an empty array when the table has no rows', async () => {
    const db = makeFakeDb([]);

    const result = await getUsers(db, 'sections');

    expect(result).toEqual([]);
  });

  // FIX (log analysis of a live "no such table: sections" crash,
  // 2026-09-08): previously the executeSql error callback only
  // console.error'd and never rejected, so a real SQL failure left this
  // promise pending forever instead of throwing - the caller's try/catch
  // never ran, and the raw error surfaced to Sentry as an unhandled/uncaught
  // exception instead of something the UI could show a retry state for.
  it('rejects when the query fails (e.g. missing table)', async () => {
    const sqlError = { code: 1, message: 'no such table: sections' };
    const db = makeFakeDbWithSqlError(sqlError);

    await expect(getUsers(db, 'sections')).rejects.toBe(sqlError);
  });

  it('rejects when the transaction itself fails', async () => {
    const transactionError = new Error('database cannot be closed while a transaction is in progress');
    const db = makeFakeDbWithTransactionError(transactionError);

    await expect(getUsers(db, 'sections')).rejects.toBe(transactionError);
  });
});

describe('getMaxChapterId', () => {
  it('resolves with the max id reported by the query', async () => {
    const db = makeFakeDb([{ maxChapterID: 42 }]);

    const result = await getMaxChapterId(db, 'chapters');

    expect(result).toBe(42);
  });

  it('rejects when the query fails (e.g. missing table)', async () => {
    const sqlError = { code: 1, message: 'no such table: chapters' };
    const db = makeFakeDbWithSqlError(sqlError);

    await expect(getMaxChapterId(db, 'chapters')).rejects.toBe(sqlError);
  });

  it('rejects when the transaction itself fails', async () => {
    const transactionError = new Error('transaction failed');
    const db = makeFakeDbWithTransactionError(transactionError);

    await expect(getMaxChapterId(db, 'chapters')).rejects.toBe(transactionError);
  });
});

describe('getDBConnection_local (connection cache)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only opens one connection per language even when called concurrently', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/english.db');
    const fakeConnection = makeFakeConnection(['Sections', 'Chapters', 'Contents']);
    SQLite.openDatabase.mockResolvedValue(fakeConnection);

    const [first, second] = await Promise.all([
      getDBConnection_local('english'),
      getDBConnection_local('english'),
    ]);

    expect(ensureDatabaseExists).toHaveBeenCalledTimes(1);
    expect(SQLite.openDatabase).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first).toBe(fakeConnection);
  });

  it('reuses the cached connection on a later, sequential call too', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/hindi.db');
    SQLite.openDatabase.mockResolvedValue(makeFakeConnection(['Sections', 'Chapters', 'Contents']));

    await getDBConnection_local('hindi');
    await getDBConnection_local('hindi');

    expect(ensureDatabaseExists).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed attempt, so the next call retries', async () => {
    ensureDatabaseExists.mockRejectedValueOnce(new Error('network down'));

    await expect(getDBConnection_local('telugu')).rejects.toThrow('network down');

    ensureDatabaseExists.mockResolvedValueOnce('/mock/path/telugu.db');
    const fakeConnection = makeFakeConnection(['Sections', 'Chapters', 'Contents']);
    SQLite.openDatabase.mockResolvedValue(fakeConnection);

    await expect(getDBConnection_local('telugu')).resolves.toBe(fakeConnection);
    expect(ensureDatabaseExists).toHaveBeenCalledTimes(2);
  });

  it('forwards an onProgress callback through to ensureDatabaseExists', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/nepali.db');
    SQLite.openDatabase.mockResolvedValue(makeFakeConnection(['Sections', 'Chapters', 'Contents']));
    const onProgress = jest.fn();

    await getDBConnection_local('nepali', onProgress);

    expect(ensureDatabaseExists).toHaveBeenCalledWith('nepali', onProgress);
  });
});

// FIX ("no such table: sections" crash, confirmed on 2 separate real
// devices/users): a file left behind by an interrupted download passed
// both RNFS.exists() and SQLite.openDatabase() checks, and the app only
// discovered it was missing a table the first time a screen actually
// queried it — by then, as an unhandled promise rejection. These tests
// exercise the integrity check added to getDBConnection_local directly,
// rather than a copy of its logic, so they fail if the real fix regresses.
describe('getDBConnection_local (database integrity check)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Each test below uses its own language key, distinct from every other
  // test in this file (including the connection-cache describe block
  // above). connectionCache lives at module scope in Database.js and isn't
  // reset between tests within a file - only jest.clearAllMocks() runs in
  // beforeEach, which clears mock call history but not that real cache - so
  // reusing a language another test already cached a successful connection
  // under would silently return that stale entry instead of exercising
  // this test's own setup.
  it('opens successfully when both required tables are present', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/swahili.db');
    const fakeConnection = makeFakeConnection(['Sections', 'Chapters', 'Contents']);
    SQLite.openDatabase.mockResolvedValue(fakeConnection);

    await expect(getDBConnection_local('swahili')).resolves.toBe(fakeConnection);
    expect(RNFS.unlink).not.toHaveBeenCalled();
  });

  it('rejects with a distinguishable isCorrupt error when a required table is missing', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/malayalam.db');
    // Simulates exactly the crash-report scenario: the file opened fine,
    // but a download interrupted mid-transfer means 'Sections' was never
    // written.
    SQLite.openDatabase.mockResolvedValue(makeFakeConnection(['Contents']));

    await expect(getDBConnection_local('malayalam')).rejects.toMatchObject({
      isCorrupt: true,
    });
  });

  it('deletes the corrupt file so the next attempt does a genuine fresh download', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/tamil.db');
    SQLite.openDatabase.mockResolvedValueOnce(makeFakeConnection(['Contents']));

    await expect(getDBConnection_local('tamil')).rejects.toMatchObject({
      isCorrupt: true,
    });

    expect(RNFS.unlink).toHaveBeenCalledWith('/mock/path/tamil.db');
  });

  it('does not poison the cache with a corrupt connection, so a later call can succeed', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/punjabi.db');
    SQLite.openDatabase.mockResolvedValueOnce(makeFakeConnection(['Contents']));

    await expect(getDBConnection_local('punjabi')).rejects.toMatchObject({
      isCorrupt: true,
    });

    // A fresh download (e.g. after the caller retries) lands a real file.
    const fakeConnection = makeFakeConnection(['Sections', 'Chapters', 'Contents']);
    SQLite.openDatabase.mockResolvedValueOnce(fakeConnection);

    await expect(getDBConnection_local('punjabi')).resolves.toBe(fakeConnection);
    expect(ensureDatabaseExists).toHaveBeenCalledTimes(2);
  });

  it('closes the connection before deleting the file', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/marathi.db');
    const corruptConnection = makeFakeConnection(['Contents']);
    SQLite.openDatabase.mockResolvedValue(corruptConnection);

    await expect(getDBConnection_local('marathi')).rejects.toMatchObject({
      isCorrupt: true,
    });

    expect(corruptConnection.close).toHaveBeenCalled();
  });

  it('rejects when the chapters table specifically is missing', async () => {
    // 'chapters' backs ChapterListScreen/SearchScreen just as directly as
    // 'sections'/'contents' back their own screens - added to
    // REQUIRED_TABLES alongside the other two after this exact gap let a
    // ChapterListScreen-only corruption go undetected.
    ensureDatabaseExists.mockResolvedValue('/mock/path/bengali.db');
    SQLite.openDatabase.mockResolvedValue(makeFakeConnection(['Sections', 'Contents']));

    await expect(getDBConnection_local('bengali')).rejects.toMatchObject({
      isCorrupt: true,
    });
  });

  // NOTE: the original version of this check introspected sqlite_master.name
  // and compared it against these table-name literals with a plain JS
  // string/Set lookup - exact-case only. That's what actually shipped and
  // broke every real download ("missing sections, contents" on genuinely
  // correct files), because real SQL table references are case-insensitive
  // (and view-agnostic) in a way a stored-name string comparison isn't - a
  // mismatch invisible to every other query in the app, which references
  // tables directly rather than comparing sqlite_master's raw text. A
  // hand-rolled JS mock can't meaningfully reproduce SQLite's own
  // case-insensitive name resolution to regression-test that specific
  // property, which is why this is a comment rather than another test -
  // the real coverage for it is the fix itself no longer doing any
  // string-based name comparison at all, only direct SELECTs.
});
