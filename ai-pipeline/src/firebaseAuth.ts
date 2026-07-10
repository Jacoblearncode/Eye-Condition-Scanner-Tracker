import { decodeProtectedHeader, importX509, jwtVerify } from 'jose';

const CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Module-scope cache: persists across requests within a warm Worker isolate, avoiding
// a cert fetch on every call. Cleared naturally on cold start / redeploy.
let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) return certCache.certs;

  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Google auth certs: ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;

  const maxAgeMatch = res.headers.get('cache-control')?.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 5 * 60 * 1000;
  certCache = { certs, expiresAt: now + maxAgeMs };
  return certs;
}

// Verifies a Firebase Auth ID token per https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
// and returns the token's uid (the `sub` claim) on success.
export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<string> {
  const { kid, alg } = decodeProtectedHeader(idToken);
  if (!kid || alg !== 'RS256') throw new Error('Invalid ID token header');

  const certs = await getGoogleCerts();
  const pem = certs[kid];
  if (!pem) throw new Error('No matching Google cert for ID token');

  const publicKey = await importX509(pem, 'RS256');
  const { payload } = await jwtVerify(idToken, publicKey, {
    algorithms: ['RS256'],
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('ID token missing sub claim');
  }
  return payload.sub;
}
