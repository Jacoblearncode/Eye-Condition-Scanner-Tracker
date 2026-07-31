import { getIdentityToolkitAccessToken } from './googleAuth';
import type { Env } from './env';

// Sets a Firebase Auth custom claim (e.g. { role: 'clinic' }) via the Identity Toolkit
// REST API, authenticated as the same service account used for Firestore writes. This is
// what setCustomUserClaims() does in the Admin SDK - there's no Cloud Functions equivalent
// needed, since this only requires an authenticated REST call, not a hosted function.
export async function setCustomClaims(
  env: Env,
  uid: string,
  claims: Record<string, unknown>
): Promise<void> {
  const accessToken = await getIdentityToolkitAccessToken(env);

  const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify(claims),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to set custom claims: ${res.status} ${await res.text()}`);
  }
}

// Looks up a user's uid by email, needed since dashboard admins bootstrap clinic staff by
// email rather than uid (see the /set-clinic-role route in index.ts).
export async function getUidByEmail(env: Env, email: string): Promise<string> {
  const accessToken = await getIdentityToolkitAccessToken(env);

  const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: [email] }),
  });

  if (!res.ok) throw new Error(`Failed to look up user: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { users?: Array<{ localId: string }> };
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new Error(`No user found with email ${email}`);
  return uid;
}
