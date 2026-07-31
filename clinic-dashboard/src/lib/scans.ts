import {
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export type FinalSeverity = 'normal' | 'follow-up' | 'hospital';

export type AiAnalysis = {
  aiSeverityHint?: FinalSeverity;
  confidence?: number;
  findings?: string;
  homeCareSteps?: string[];
  finalSeverity?: FinalSeverity;
} | null;

export type ScanDetail = {
  id: string;
  patientId: string;
  photoUrl: string;
  symptoms: string[];
  uploadStatus: string;
  scanDate: Timestamp | null;
  aiAnalysis: AiAnalysis;
  doctorNote: string | null;
};

const PENDING_STATUSES = ['processing', 'ai_analyzed', 'ai_failed'];

function mapScanDoc(patientId: string, snap: DocumentSnapshot<DocumentData>): ScanDetail | null {
  const data = snap.data();
  if (!data) return null;
  return {
    id: snap.id,
    patientId,
    photoUrl: data.photoUrl,
    symptoms: data.symptoms ?? [],
    uploadStatus: data.uploadStatus,
    scanDate: data.scanDate ?? null,
    aiAnalysis: data.aiAnalysis ?? null,
    doctorNote: data.doctorNote ?? null,
  };
}

function patientIdFromScanSnapshot(snap: QueryDocumentSnapshot<DocumentData>): string {
  // scans live at patients/{patientId}/scans/{scanId} - parent.parent is the patient doc.
  return snap.ref.parent.parent!.id;
}

// Clinic queue: any scan not yet reviewed, newest first. Requires the collection-group
// index in ../../../firestore.indexes.json (deploy with `firebase deploy --only firestore:indexes`).
export function subscribeToPendingScans(onChange: (scans: ScanDetail[]) => void): Unsubscribe {
  const q = query(
    collectionGroup(db, 'scans'),
    where('uploadStatus', 'in', PENDING_STATUSES),
    orderBy('scanDate', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const scans = snapshot.docs
      .map((snap) => mapScanDoc(patientIdFromScanSnapshot(snap), snap))
      .filter((s): s is ScanDetail => s !== null);
    onChange(scans);
  });
}

export function subscribeToScan(
  patientId: string,
  scanId: string,
  onChange: (scan: ScanDetail | null) => void
): Unsubscribe {
  const scanRef = doc(db, 'patients', patientId, 'scans', scanId);
  return onSnapshot(scanRef, (snapshot) => onChange(mapScanDoc(patientId, snapshot)));
}

// Sets the patient-facing fields. finalSeverity/homeCareSteps only ever reach the patient
// app once a clinician submits this - see the safety note in patient-app/README.md.
export async function submitReview(
  patientId: string,
  scanId: string,
  existingAnalysis: AiAnalysis,
  finalSeverity: FinalSeverity,
  doctorNote: string,
  homeCareSteps: string[]
): Promise<void> {
  const scanRef = doc(db, 'patients', patientId, 'scans', scanId);
  await updateDoc(scanRef, {
    doctorNote: doctorNote || null,
    uploadStatus: 'reviewed',
    aiAnalysis: {
      ...(existingAnalysis ?? {}),
      finalSeverity,
      homeCareSteps,
    },
  });
}
