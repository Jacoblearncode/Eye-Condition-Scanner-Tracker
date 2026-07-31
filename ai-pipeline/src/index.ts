import type { Env } from './env';
import { verifyFirebaseIdToken } from './firebaseAuth';
import { analyzeEyePhoto } from './gemini';
import { markScanFailed, writeScanAnalysis } from './firestore';
import { getUidByEmail, setCustomClaims } from './identityToolkit';

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

type SetRoleBody = {
  email?: string;
  role?: 'clinic' | 'admin';
};

// Manual admin-only bootstrap for clinic staff accounts - there's no self-serve signup UI
// for clinic role, since granting it is a security-sensitive action. Call this once per
// staff member after they've created a normal Firebase Auth account (e.g. via the clinic
// dashboard's sign-up form), then have them sign out/in to pick up the new claim. See
// ../README.md for a curl example.
async function handleSetClinicRole(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (request.headers.get('X-Admin-Secret') !== env.ADMIN_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: SetRoleBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.email || (body.role !== 'clinic' && body.role !== 'admin')) {
    return json({ error: 'Expected { email, role: "clinic" | "admin" }' }, 400);
  }

  try {
    const uid = await getUidByEmail(env, body.email);
    await setCustomClaims(env, uid, { role: body.role });
    return json({ ok: true, uid, role: body.role });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);
    if (url.pathname === '/set-clinic-role') return handleSetClinicRole(request, env);

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
