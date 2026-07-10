# EyeChecker — AI Pipeline (Cloudflare Worker)

Free-tier replacement for the Firebase Cloud Function AI pipeline described in the build guide,
Section 8. Firebase Cloud Functions require the paid Blaze plan for any outbound network call
(e.g. to an AI API), even at $0 usage. This Worker does the same job — analyze a scan photo and
write the result back to Firestore — without needing a Firebase billing account.

## How it works

1. The patient app creates a scan document in Firestore (`uploadStatus: 'processing'`), then
   POSTs `{ uid, scanId, photoUrl, symptoms }` to this Worker with the patient's Firebase Auth ID
   token as a bearer token (see `patient-app/src/services/aiPipelineService.ts`).
2. The Worker verifies the ID token against Google's public certs and checks it matches `uid`,
   so only the authenticated patient can trigger analysis for their own scan.
3. It fetches the photo and sends it to the **Gemini API** (multimodal — one call handles both
   the image analysis and the text reasoning step that Vision API + a separate text model would
   have needed).
4. It writes the result to `patients/{uid}/scans/{scanId}.aiAnalysis` via the **Firestore REST
   API**, authenticated as a Firebase service account (the same trust level as the Admin SDK —
   this bypasses Firestore Security Rules, so no rules changes are needed).

`aiAnalysis.aiSeverityHint` is the AI's raw guess — it's for the clinic dashboard only. The
patient app only ever reads `aiAnalysis.finalSeverity`, which stays unset until a doctor sets it
(see the safety note in `patient-app/README.md`).

Note: the pipeline runs synchronously off the client's request, not a Firestore trigger — this
keeps everything on free tiers (no Cloud Functions), at the cost of the scan needing an active
network request to kick off analysis. If a request fails partway, `uploadStatus` is set to
`ai_failed` so it doesn't stay stuck on `processing`, and a clinician can still review the photo
manually.

## Setup (all free, no credit card required)

1. **Cloudflare account** — sign up at [cloudflare.com](https://cloudflare.com), then
   `npm install` in this directory and run `npx wrangler login`.
2. **Firebase service account** — Firebase Console → Project Settings → Service Accounts →
   Generate new private key. Downloads a JSON file with `project_id`, `client_email`, and
   `private_key`.
3. **Gemini API key** — [aistudio.google.com/apikey](https://aistudio.google.com/apikey), free
   tier, no billing required.
4. Copy `.dev.vars.example` to `.dev.vars` and fill in the values from steps 2–3, for local
   testing with `npm run dev`.
5. Set the same values as secrets on the deployed Worker:
   ```
   npx wrangler secret put FIREBASE_PROJECT_ID
   npx wrangler secret put FIREBASE_CLIENT_EMAIL
   npx wrangler secret put FIREBASE_PRIVATE_KEY
   npx wrangler secret put GEMINI_API_KEY
   ```
6. Deploy: `npm run deploy`. Wrangler prints the Worker's URL
   (`https://eyechecker-ai-pipeline.<your-subdomain>.workers.dev`).
7. Add that URL to `patient-app/.env` as `EXPO_PUBLIC_AI_PIPELINE_URL`.

## Free-tier limits to be aware of

- **Cloudflare Workers free plan:** 100,000 requests/day.
- **Gemini API free tier:** rate-limited (varies by model), fine for development and small-scale
  use; check current limits at [ai.google.dev/pricing](https://ai.google.dev/pricing).
- The Firebase service account needs Firestore access (the default `firebase-adminsdk` service
  account Firebase generates already has this).
