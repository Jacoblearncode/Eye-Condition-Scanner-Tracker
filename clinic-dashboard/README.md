# EyeChecker — Clinic Dashboard

Next.js web app where clinic staff review a patient's scan photo plus the AI pipeline's draft
(`aiAnalysis.aiSeverityHint`) and set `aiAnalysis.finalSeverity` — the only field the patient app
ever displays. See the safety note in `../patient-app/README.md`: the AI's raw hint must never
reach the patient directly.

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in the same Firebase web config used by
   `patient-app/.env.example` (same Firebase project).
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev` → [localhost:3000](http://localhost:3000)
4. Deploy `../firestore.indexes.json` so the pending-scans query works:
   `firebase deploy --only firestore:indexes` (from the repo root, needs the Firebase CLI).

### Granting clinic access

There's no self-serve way to become clinic staff — that's deliberate, since it's a
security-sensitive grant. The flow is:

1. A staff member signs up on the dashboard's login page (creates a normal Firebase Auth
   account, but can't see any patient data yet — `firestore.rules` only grants access to the
   `clinic`/`admin` custom claim, which nothing sets automatically).
2. An admin bootstraps their role by calling the `ai-pipeline` Worker's admin endpoint (see
   `../ai-pipeline/README.md` for deploying it):
   ```
   curl -X POST https://eyechecker-ai-pipeline.<your-subdomain>.workers.dev/set-clinic-role \
     -H "X-Admin-Secret: <your ADMIN_SECRET>" \
     -H "Content-Type: application/json" \
     -d '{"email": "doctor@example.com", "role": "clinic"}'
   ```
3. The staff member signs out and back in (or just waits ~1 hour for their ID token to refresh)
   to pick up the new claim, then reloads the dashboard.

## What's implemented

- Firebase Auth (email/password) + a `clinic`/`admin` custom-claim gate (`src/context/AuthContext.tsx`,
  `app/dashboard/layout.tsx`) — unauthorized accounts see a "pending" screen instead of the queue
- Pending-review queue (`app/dashboard/page.tsx`) — a live `collectionGroup('scans')` query across
  all patients for scans not yet reviewed
- Scan review form (`app/dashboard/[patientId]/[scanId]/page.tsx`) — shows the photo, patient-
  reported symptoms, and the AI's draft, and lets a clinician set `finalSeverity`, a doctor's
  note, and home-care steps, all written straight to Firestore via the client SDK (allowed by
  `firestore.rules`'s `isClinicStaff()` check once the custom claim is set)

## Deploying

Any static-friendly host works (Vercel's free tier is the easiest fit, given the rest of this
project already avoids Firebase Hosting/Functions billing). Set the same `NEXT_PUBLIC_FIREBASE_*`
env vars in the host's dashboard.

## Known follow-ups

- No UI for revoking clinic access or listing existing staff — use the Firebase Console
  (Authentication tab) or the Identity Toolkit REST API directly for now.
- No audit trail of who reviewed which scan (the `finalSeverity`/`doctorNote` writer's uid isn't
  recorded on the document).
