// Runs the real migration and repository code against Node's built-in SQLite, so the on-device
// storage logic is tested without a phone:  npm test
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';
import { LATEST_SCHEMA_VERSION, migrate, type Db } from '../src/storage/migrations';
import { getScan, insertScan, listScans } from '../src/storage/scanRepository';
import { SETTING_KEYS, getSetting, setSetting } from '../src/storage/settingsRepository';
import { newScanId, removeScan, saveScan, type SaveScanDeps } from '../src/storage/saveScan';

type Params = (string | number | null)[];

// Adapts node:sqlite to the small async interface the app uses from expo-sqlite.
function nodeDb(raw = new DatabaseSync(':memory:')): Db & { raw: DatabaseSync } {
  return {
    raw,
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params: Params) {
      return raw.prepare(sql).run(...params);
    },
    async getFirstAsync<T>(sql: string, params: Params) {
      return (raw.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params: Params) {
      return raw.prepare(sql).all(...params) as T[];
    },
  };
}

const version = (db: { raw: DatabaseSync }) =>
  (db.raw.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;

function fakeDeps(db: Db) {
  const files = new Set<string>();
  let n = 0;
  const deps: SaveScanDeps = {
    db,
    storePhoto: (uri, id) => {
      const name = `${id}.jpg`;
      files.add(name);
      assert.ok(uri.startsWith('file://'));
      return name;
    },
    deletePhoto: (name) => {
      files.delete(name);
    },
    now: () => new Date(Date.UTC(2026, 9, 25, 12, 0, n++)),
    newId: () => `scan-${n}`,
  };
  return { deps, files };
}

describe('migrations', () => {
  it('creates the schema on a fresh database and records the version', async () => {
    const db = nodeDb();
    await migrate(db);
    assert.equal(version(db), LATEST_SCHEMA_VERSION);
    assert.ok(db.raw.prepare("SELECT name FROM sqlite_master WHERE name = 'scans'").get());
  });

  it('is safe to run twice', async () => {
    const db = nodeDb();
    await migrate(db);
    await migrate(db);
    assert.equal(version(db), LATEST_SCHEMA_VERSION);
  });

  it('refuses a database written by a newer app version', async () => {
    const db = nodeDb();
    db.raw.exec(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION + 1}`);
    await assert.rejects(migrate(db), /newer version of the app/);
  });

  it('rolls back a failed migration and leaves the connection usable', async () => {
    const db = nodeDb();
    db.raw.exec('CREATE TABLE scans (conflicting INTEGER)'); // makes the v1 CREATE TABLE fail
    await assert.rejects(migrate(db));
    assert.equal(version(db), 0);
    // If a transaction were still open, BEGIN would throw "cannot start a transaction".
    db.raw.exec('BEGIN');
    db.raw.exec('ROLLBACK');
  });
});

describe('saving scans (on this phone only)', () => {
  it('saves a scan and reads it back, newest first', async () => {
    const db = nodeDb();
    await migrate(db);
    const { deps, files } = fakeDeps(db);

    const a = await saveScan(deps, { photoUri: 'file:///cache/a.jpg', symptoms: ['Redness or pink colouring'] });
    const b = await saveScan(deps, { photoUri: 'file:///cache/b.jpg', symptoms: [], eye: 'both' });

    const scans = await listScans(db);
    assert.deepEqual(scans.map((s) => s.id), [b, a]);
    assert.deepEqual(scans[1].symptoms, ['Redness or pink colouring']);
    assert.equal(scans[0].eye, 'both');
    assert.equal(scans[1].eye, null);
    assert.equal(files.size, 2);
    assert.match(scans[0].createdAt, /^2026-10-25T12:00:\d\d\.\d{3}Z$/);
  });

  it('can save a scan with no photo', async () => {
    const db = nodeDb();
    await migrate(db);
    const { deps, files } = fakeDeps(db);
    const id = await saveScan(deps, { photoUri: null, symptoms: ['Sensitivity to light'] });
    assert.equal((await getScan(db, id))?.photoFile, null);
    assert.equal(files.size, 0);
  });

  it('removes the copied photo if the record cannot be written', async () => {
    const db = nodeDb();
    await migrate(db);
    const { deps, files } = fakeDeps(db);
    deps.newId = () => 'same-id';
    await saveScan(deps, { photoUri: 'file:///cache/a.jpg', symptoms: [] });
    assert.equal(files.size, 1);
    // Same id again: the INSERT fails (primary key) and the second copy must not be left behind.
    const copyThenFail: SaveScanDeps = {
      ...deps,
      storePhoto: () => {
        files.add('orphan.jpg');
        return 'orphan.jpg';
      },
    };
    await assert.rejects(saveScan(copyThenFail, { photoUri: 'file:///cache/b.jpg', symptoms: [] }));
    assert.ok(!files.has('orphan.jpg'));
  });

  it('rejects an invalid eye value at the database level', async () => {
    const db = nodeDb();
    await migrate(db);
    await assert.rejects(
      insertScan(db, { id: 'x', createdAt: 'now', photoFile: null, eye: 'middle' as never, symptoms: [] })
    );
  });

  it('deletes a scan and its photo, and reports unknown ids', async () => {
    const db = nodeDb();
    await migrate(db);
    const { deps, files } = fakeDeps(db);
    const id = await saveScan(deps, { photoUri: 'file:///cache/a.jpg', symptoms: [] });
    assert.equal(await removeScan(deps, id), true);
    assert.equal(files.size, 0);
    assert.equal(await getScan(db, id), null);
    assert.equal(await removeScan(deps, id), false);
  });

  it('still lists a scan whose symptoms field is corrupt', async () => {
    const db = nodeDb();
    await migrate(db);
    db.raw.exec("INSERT INTO scans (id, created_at, symptoms) VALUES ('bad', '2026-01-01T00:00:00Z', 'not json')");
    const [scan] = await listScans(db);
    assert.deepEqual(scan.symptoms, []);
  });

  it('makes no network request', async () => {
    const db = nodeDb();
    await migrate(db);
    const { deps } = fakeDeps(db);
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error('network call attempted while saving a scan');
    }) as typeof fetch;
    try {
      await saveScan(deps, { photoUri: 'file:///cache/a.jpg', symptoms: ['x'] });
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it('generates distinct ids', () => {
    assert.notEqual(newScanId(), newScanId());
  });
});

describe('settings and the v1 -> v2 upgrade', () => {
  it('upgrades a v1 database without losing scans', async () => {
    const db = nodeDb();
    // Build exactly what a phone running the first local-first build would have.
    db.raw.exec(`CREATE TABLE scans (id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL, photo_file TEXT,
      eye TEXT CHECK (eye IN ('left','right','both')), symptoms TEXT NOT NULL DEFAULT '[]');
      CREATE INDEX idx_scans_created_at ON scans (created_at DESC);
      INSERT INTO scans (id, created_at, photo_file, symptoms) VALUES ('old', '2026-10-24T08:00:00.000Z', 'old.jpg', '["redness"]');
      PRAGMA user_version = 1;`);
    await migrate(db);
    assert.equal(version(db), LATEST_SCHEMA_VERSION);
    assert.ok(db.raw.prepare("SELECT name FROM sqlite_master WHERE name = 'settings'").get());
    const [scan] = await listScans(db);
    assert.equal(scan.id, 'old');
    assert.deepEqual(scan.symptoms, ['redness']);
  });

  it('stores, overwrites and reads back settings', async () => {
    const db = nodeDb();
    await migrate(db);
    assert.equal(await getSetting(db, SETTING_KEYS.language), null);
    await setSetting(db, SETTING_KEYS.language, 'ms');
    await setSetting(db, SETTING_KEYS.language, 'en');
    assert.equal(await getSetting(db, SETTING_KEYS.language), 'en');
    await setSetting(db, SETTING_KEYS.onboardingCompletedAt, '2026-10-25T00:00:00.000Z');
    assert.equal(await getSetting(db, SETTING_KEYS.onboardingCompletedAt), '2026-10-25T00:00:00.000Z');
    assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM settings').get()!.n, 2);
  });
});
