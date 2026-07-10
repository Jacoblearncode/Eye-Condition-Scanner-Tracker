const AI_PIPELINE_URL = process.env.EXPO_PUBLIC_AI_PIPELINE_URL;

// Fires the Cloudflare Worker AI pipeline (see ../../../ai-pipeline) after a scan document
// is created. Best-effort: a failure here doesn't block the scan from existing - it just
// stays at uploadStatus 'processing' until a clinician reviews it manually, or the caller
// (scanService.uploadScan) retries. See ../../../ai-pipeline/README.md for why this replaces
// the Firebase Cloud Function pipeline from the build guide (Blaze plan requirement).
export async function triggerAiAnalysis(
  idToken: string,
  uid: string,
  scanId: string,
  photoUrl: string,
  symptoms: string[]
): Promise<void> {
  if (!AI_PIPELINE_URL) return;

  const res = await fetch(AI_PIPELINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid, scanId, photoUrl, symptoms }),
  });

  if (!res.ok) {
    throw new Error(`AI pipeline request failed: ${res.status}`);
  }
}
