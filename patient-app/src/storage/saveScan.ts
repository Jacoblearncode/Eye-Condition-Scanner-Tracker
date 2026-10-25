import type { Db } from './migrations';
import { deleteScan, insertScan, type Eye } from './scanRepository';

export type SaveScanInput = {
  // null = record a scan without a photo (e.g. too painful to open the eyes, PLAN.md Phase 1.6).
  photoUri: string | null;
  symptoms: string[];
  eye?: Eye;
};

// The pieces that touch the phone itself are passed in, so this logic runs in plain Node tests.
export type SaveScanDeps = {
  db: Db;
  storePhoto: (sourceUri: string, scanId: string) => string;
  deletePhoto: (fileName: string) => void;
  now: () => Date;
  newId: () => string;
};

export function newScanId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Saves a scan on the device only. No network call happens here (PLAN.md D3).
// Order matters: copy the photo first, then write the record. If the record fails, the copied
// photo is removed so no orphan file is left behind.
export async function saveScan(deps: SaveScanDeps, input: SaveScanInput): Promise<string> {
  const id = deps.newId();
  const photoFile = input.photoUri ? deps.storePhoto(input.photoUri, id) : null;
  try {
    await insertScan(deps.db, {
      id,
      createdAt: deps.now().toISOString(),
      photoFile,
      eye: input.eye ?? null,
      symptoms: input.symptoms,
    });
  } catch (err) {
    if (photoFile) {
      try {
        deps.deletePhoto(photoFile);
      } catch {
        // Cleanup failed; surface the original error, not this one.
      }
    }
    throw err;
  }
  return id;
}

// Deletes a scan record and its photo.
export async function removeScan(
  deps: Pick<SaveScanDeps, 'db' | 'deletePhoto'>,
  id: string
): Promise<boolean> {
  const scan = await deleteScan(deps.db, id);
  if (!scan) return false;
  if (scan.photoFile) deps.deletePhoto(scan.photoFile);
  return true;
}
