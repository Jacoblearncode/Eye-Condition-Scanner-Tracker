import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { uploadPhotoToCloudinary } from './cloudinaryService';
import { triggerAiAnalysis } from './aiPipelineService';

// Matches the scan document shape from the build guide, Section 4.1/4.2.
// aiAnalysis and doctorNote start empty — they're only ever populated by the
// AI pipeline (see ../../../ai-pipeline) and the clinic dashboard, never by the patient app.
export async function uploadScan(
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
