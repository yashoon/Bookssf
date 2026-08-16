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
jest.mock('react-native-fs', () => ({}));

import SQLite from 'react-native-sqlite-storage';
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
});

describe('getMaxChapterId', () => {
  it('resolves with the max id reported by the query', async () => {
    const db = makeFakeDb([{ maxChapterID: 42 }]);

    const result = await getMaxChapterId(db, 'chapters');

    expect(result).toBe(42);
  });
});

describe('getDBConnection_local (connection cache)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('only opens one connection per language even when called concurrently', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/english.db');
    SQLite.openDatabase.mockResolvedValue({ mockConnection: true });

    const [first, second] = await Promise.all([
      getDBConnection_local('english'),
      getDBConnection_local('english'),
    ]);

    expect(ensureDatabaseExists).toHaveBeenCalledTimes(1);
    expect(SQLite.openDatabase).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('reuses the cached connection on a later, sequential call too', async () => {
    ensureDatabaseExists.mockResolvedValue('/mock/path/hindi.db');
    SQLite.openDatabase.mockResolvedValue({ mockConnection: true });

    await getDBConnection_local('hindi');
    await getDBConnection_local('hindi');

    expect(ensureDatabaseExists).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed attempt, so the next call retries', async () => {
    ensureDatabaseExists.mockRejectedValueOnce(new Error('network down'));

    await expect(getDBConnection_local('telugu')).rejects.toThrow('network down');

    ensureDatabaseExists.mockResolvedValueOnce('/mock/path/telugu.db');
    SQLite.openDatabase.mockResolvedValue({ mockConnection: true });

    await expect(getDBConnection_local('telugu')).resolves.toEqual({ mockConnection: true });
    expect(ensureDatabaseExists).toHaveBeenCalledTimes(2);
  });
});
