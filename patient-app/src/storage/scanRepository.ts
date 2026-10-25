import type { Db } from './migrations';

export type Eye = 'left' | 'right' | 'both';

export type Scan = {
  id: string;
  createdAt: string; // ISO 8601, UTC
  photoFile: string | null;
  eye: Eye | null;
  symptoms: string[];
};

type ScanRow = {
  id: string;
  created_at: string;
  photo_file: string | null;
  eye: Eye | null;
  symptoms: string;
};

function toScan(row: ScanRow): Scan {
  let symptoms: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.symptoms);
    if (Array.isArray(parsed)) symptoms = parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    // A corrupt symptoms field shouldn't make the whole scan unreadable.
  }
  return {
    id: row.id,
    createdAt: row.created_at,
    photoFile: row.photo_file,
    eye: row.eye,
    symptoms,
  };
}

export async function insertScan(db: Db, scan: Scan): Promise<void> {
  await db.runAsync(
    'INSERT INTO scans (id, created_at, photo_file, eye, symptoms) VALUES (?, ?, ?, ?, ?)',
    [scan.id, scan.createdAt, scan.photoFile, scan.eye, JSON.stringify(scan.symptoms)]
  );
}

export async function getScan(db: Db, id: string): Promise<Scan | null> {
  const row = await db.getFirstAsync<ScanRow>('SELECT * FROM scans WHERE id = ?', [id]);
  return row ? toScan(row) : null;
}

// Newest first.
export async function listScans(db: Db): Promise<Scan[]> {
  const rows = await db.getAllAsync<ScanRow>('SELECT * FROM scans ORDER BY created_at DESC, id DESC', []);
  return rows.map(toScan);
}

// Returns the deleted scan so the caller can remove its photo file; null if there was no such scan.
export async function deleteScan(db: Db, id: string): Promise<Scan | null> {
  const scan = await getScan(db, id);
  if (!scan) return null;
  await db.runAsync('DELETE FROM scans WHERE id = ?', [id]);
  return scan;
}
