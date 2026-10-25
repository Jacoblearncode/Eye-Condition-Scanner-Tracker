import { getDb } from '../storage/database';
import { deletePhoto, storePhoto } from '../storage/photoStorage';
import { newScanId, removeScan, saveScan, type SaveScanInput } from '../storage/saveScan';

// Scans are saved on this phone only (PLAN.md D3, local-first). Nothing is uploaded and no
// account is needed. Sharing and AI analysis are separate, explicit actions that come later.
async function deps() {
  return { db: await getDb(), storePhoto, deletePhoto, now: () => new Date(), newId: newScanId };
}

export async function saveScanLocally(input: SaveScanInput): Promise<string> {
  return saveScan(await deps(), input);
}

export async function deleteScanLocally(id: string): Promise<boolean> {
  return removeScan(await deps(), id);
}
