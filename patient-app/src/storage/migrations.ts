// On-device schema, versioned with SQLite's PRAGMA user_version. Add a new entry to MIGRATIONS
// to change the schema; never edit an entry that has shipped. See PLAN.md section 2.2 (local-first).

// The slice of expo-sqlite's SQLiteDatabase that this app uses. Keeping it this small lets the
// repository and migrations run against Node's built-in SQLite in tests (tests/storage.test.ts).
export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: (string | number | null)[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, params: (string | number | null)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: (string | number | null)[]): Promise<T[]>;
}

const MIGRATIONS: string[] = [
  // v1: scans. photo_file is a file name inside the app's private scans folder (not a full
  // path: absolute paths can change after an app update or restore). It is nullable because
  // Phase 1.6 lets a scan be recorded without a photo when opening the eyes is too painful.
  // eye stays NULL until the capture flow records it (Phase 1.1). symptoms is a JSON array of
  // strings for now; Phase 2.6 replaces it with structured entries tied to the reference ids.
  `CREATE TABLE scans (
     id TEXT PRIMARY KEY NOT NULL,
     created_at TEXT NOT NULL,
     photo_file TEXT,
     eye TEXT CHECK (eye IN ('left', 'right', 'both')),
     symptoms TEXT NOT NULL DEFAULT '[]'
   );
   CREATE INDEX idx_scans_created_at ON scans (created_at DESC);`,
  // v2: small key/value settings kept on the phone (chosen language, when onboarding finished).
  // Replaces in-memory state that used to reset on every app launch. See settingsRepository.ts.
  `CREATE TABLE settings (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL
   );`,
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;
  if (current > LATEST_SCHEMA_VERSION) {
    // A newer app version wrote this database. Refuse rather than risk corrupting health records.
    throw new Error(
      `This data was saved by a newer version of the app (schema ${current}, this app supports ${LATEST_SCHEMA_VERSION}). Update the app.`
    );
  }
  for (let version = current; version < LATEST_SCHEMA_VERSION; version++) {
    // One transaction per step so a failed migration leaves the previous version intact.
    // user_version is set inside the same transaction; SQLite makes that atomic with the schema change.
    try {
      await db.execAsync(`BEGIN; ${MIGRATIONS[version]}; PRAGMA user_version = ${version + 1}; COMMIT;`);
    } catch (err) {
      // Without this the connection would stay inside the half-finished transaction.
      await db.execAsync('ROLLBACK').catch(() => undefined);
      throw err;
    }
  }
}
