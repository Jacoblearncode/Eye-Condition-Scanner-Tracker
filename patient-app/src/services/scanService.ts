import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { uploadPhotoToCloudinary } from './cloudinaryService';

// Matches the scan document shape from the build guide, Section 4.1/4.2.
// aiAnalysis and doctorNote start empty — they're only ever populated by the
// Cloud Function pipeline and the clinic dashboard, never by the patient app.
export async function uploadScan(
  uid: string,
  photoUri: string,
  symptoms: string[]
): Promise<string> {
  const scanRef = doc(collection(db, 'patients', uid, 'scans'));
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

  return scanId;
}
