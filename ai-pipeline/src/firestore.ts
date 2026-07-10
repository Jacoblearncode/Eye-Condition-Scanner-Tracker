import { getFirestoreAccessToken } from './googleAuth';
import type { Env } from './env';
import type { AiAnalysis } from './gemini';

type FirestoreValue = Record<string, unknown>;

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toFirestoreValue(v)])
    );
    return { mapValue: { fields } };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

// Patches patients/{uid}/scans/{scanId} directly via the Firestore REST API.
// Only touches aiAnalysis and uploadStatus - never doctorNote or aiAnalysis.finalSeverity,
// which are clinic-dashboard-only fields per the build guide's safety requirement.
export async function writeScanAnalysis(
  env: Env,
  uid: string,
  scanId: string,
  analysis: AiAnalysis,
  uploadStatus: string
): Promise<void> {
  const accessToken = await getFirestoreAccessToken(env);

  const url =
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/patients/${uid}/scans/${scanId}` +
    `?updateMask.fieldPaths=aiAnalysis&updateMask.fieldPaths=uploadStatus`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        aiAnalysis: toFirestoreValue(analysis),
        uploadStatus: toFirestoreValue(uploadStatus),
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Firestore write failed: ${res.status} ${await res.text()}`);
  }
}

// Best-effort status flip so the patient isn't stuck on "processing" forever if the
// AI step fails - a clinician can still review the photo manually from the dashboard.
export async function markScanFailed(env: Env, uid: string, scanId: string): Promise<void> {
  const accessToken = await getFirestoreAccessToken(env);
  const url =
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/patients/${uid}/scans/${scanId}` +
    `?updateMask.fieldPaths=uploadStatus`;

  await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { uploadStatus: toFirestoreValue('ai_failed') } }),
  }).catch(() => undefined);
}
