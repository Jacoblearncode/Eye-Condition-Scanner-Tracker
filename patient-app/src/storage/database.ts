import { openDatabaseAsync } from 'expo-sqlite';
import { migrate, type Db } from './migrations';

const DB_NAME = 'eyechecker.db';

// One shared, already-migrated connection. The promise is cached so concurrent callers
// during startup don't open and migrate twice.
let dbPromise: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
    // If opening or migrating failed, allow a later call to try again.
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}
