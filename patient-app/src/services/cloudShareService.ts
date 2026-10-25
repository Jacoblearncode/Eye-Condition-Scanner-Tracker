import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { uploadPhotoToCloudinary } from './cloudinaryService';
import { triggerAiAnalysis } from './aiPipelineService';

// NOT CALLED BY THE APP YET. Since PLAN.md D3 (local-first) a scan is saved only on the phone
// (see scanService.ts); photos and records leave the device only when the owner explicitly
// chooses to share (Phase 4) or run AI analysis (Phase 0.8/3.4), each behind its own consent
// screen. This is the previous automatic upload (Cloudinary + Firestore + AI pipeline), kept
// for that explicit share path. Before wiring it to a button: Firestore rules must validate scan
// creation (PLAN.md P1/P2), and the Cloudinary preset is public (P3).
//
// Matches the scan document shape from the build guide, Section 4.1/4.2.
// aiAnalysis and doctorNote start empty — they're only ever populated by the
// AI pipeline (see ../../../ai-pipeline) and the clinic dashboard, never by the patient app.
export async function uploadScanToCloud(
  user: User,
  photoUri: string,
  symptoms: string[]
): Promise<string> {
  const scanRef = doc(collection(db, 'patients', user.uid, 'scans'));
  const scanId = scanRef.id;

  const photoUrl = await uploadPhotoToCloudinary(photoUri);

  await setDoc(scanRef, {
    photoUrl,
    symptoms,
    scanDate: serverTimestamp(),
    uploadStatus: 'processing',
    doctorNote: null,
    aiAnalysis: null,
  });

  const idToken = await user.getIdToken();
  triggerAiAnalysis(idToken, user.uid, scanId, photoUrl, symptoms).catch((err) => {
    console.warn('AI pipeline trigger failed, scan will need manual review:', err);
  });

  return scanId;
}
