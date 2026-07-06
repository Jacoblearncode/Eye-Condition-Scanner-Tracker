import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

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

  const response = await fetch(photoUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `scans/${uid}/${scanId}.jpg`);
  await uploadBytes(storageRef, blob);
  const photoUrl = await getDownloadURL(storageRef);

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
