import type { Env } from './env';
import { verifyFirebaseIdToken } from './firebaseAuth';
import { analyzeEyePhoto } from './gemini';
import { markScanFailed, writeScanAnalysis } from './firestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

type TriggerBody = {
  uid?: string;
  scanId?: string;
  photoUrl?: string;
  symptoms?: string[];
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    let body: TriggerBody;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { uid, scanId, photoUrl, symptoms } = body;
    if (!uid || !scanId || !photoUrl) {
      return json({ error: 'Missing uid, scanId, or photoUrl' }, 400);
    }

    const bearer = request.headers.get('Authorization') ?? '';
    const idToken = bearer.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!idToken) return json({ error: 'Missing Authorization bearer token' }, 401);

    let verifiedUid: string;
    try {
      verifiedUid = await verifyFirebaseIdToken(idToken, env.FIREBASE_PROJECT_ID);
    } catch (err) {
      return json({ error: `Invalid ID token: ${(err as Error).message}` }, 401);
    }
    if (verifiedUid !== uid) {
      return json({ error: 'Token does not match requested uid' }, 403);
    }

    try {
      const analysis = await analyzeEyePhoto(photoUrl, symptoms ?? [], env);
      await writeScanAnalysis(env, uid, scanId, analysis, 'ai_analyzed');
      return json({ ok: true });
    } catch (err) {
      console.error('AI pipeline failed', err);
      await markScanFailed(env, uid, scanId);
      return json({ error: (err as Error).message }, 500);
    }
  },
};
