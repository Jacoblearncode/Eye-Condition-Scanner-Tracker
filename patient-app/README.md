# EyeChecker — Patient App

Phase 1 scaffold: Expo + TypeScript + Firebase Auth, matching the screen flow in the build guide.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase project's web config
   (Firebase Console → Project Settings → General → Your apps → SDK setup and configuration).
2. Create a free [Cloudinary](https://cloudinary.com) account for photo uploads (Firebase Storage
   now requires the paid Blaze plan, even for free-tier-sized usage). In the Cloudinary dashboard:
   - Copy your **Cloud name** from the dashboard home page
   - Go to Settings → Upload → Upload presets → Add upload preset → set **Signing Mode: Unsigned**
     → save, and copy the preset name
   - Add both values to `.env`
3. (Optional) Set up the AI pipeline — see `../ai-pipeline/README.md` — and add the deployed
   Worker URL to `.env` as `EXPO_PUBLIC_AI_PIPELINE_URL`. Skip this to leave scans unanalyzed
   (they'll sit at `uploadStatus: 'processing'` for manual clinic review).
4. Install dependencies: `npm install`
5. Start the dev server: `npx expo start`
6. Paste `../firestore.rules` into Firebase Console → Firestore Database → Rules (replaces the
   default test-mode rules, which expire after 30 days and are otherwise wide open)

## What's implemented

- Firebase initialization (`src/services/firebase.ts`) — Auth, Firestore
- Cloudinary photo upload (`src/services/cloudinaryService.ts`) — unsigned upload, no backend
- Scan pipeline (`src/services/scanService.ts`) — uploads the photo, creates a Firestore scan
  document at `patients/{uid}/scans/{scanId}`, then triggers the AI pipeline
- AI pipeline trigger (`src/services/aiPipelineService.ts`) — calls the `../ai-pipeline`
  Cloudflare Worker (Gemini API + Firestore REST write-back) instead of a Firebase Cloud
  Function, since Cloud Functions require the paid Blaze plan for any outbound API call
- Live scan subscription (`src/hooks/useScan.ts`) — Results screen updates the moment a doctor
  sets `aiAnalysis.finalSeverity`, no polling
- Auth state hook (`src/hooks/useAuth.ts`) — session persists across app restarts via
  `initializeAuth` + `getReactNativePersistence(AsyncStorage)`
- Screens: Onboarding/Consent, Auth (login/register), Home, Scan (camera capture), Symptom
  Checklist, Results (pending + doctor-confirmed states)
- Client-side red-flag symptom detection (`src/utils/severityUtils.ts`) and the full-screen
  emergency alert (`src/components/RedFlagAlert.tsx`) — fires before any AI processing, per the
  build guide's safety requirement
- Navigation wiring (`src/navigation/RootNavigator.tsx`) tying the flow together:
  Onboarding → Auth → Home → Scan → Symptoms → Results
- Firestore security rules (`../firestore.rules`) — role-based access; clinic role checks rely on
  a custom auth claim set via the `../ai-pipeline` Worker's admin endpoint (see
  `../clinic-dashboard/README.md` for the staff-onboarding flow)
- Clinic web dashboard (`../clinic-dashboard`) — where a doctor reviews the AI's draft and sets
  `aiAnalysis.finalSeverity`, the only field this app ever shows the patient

## Known follow-ups (not yet wired)

- Appointment booking flow, recovery progress/history screen, push notifications

## Troubleshooting: Known Issues & Fixes

### Expo SDK Version Compatibility

**Issue:** App crashes on Expo Go client with "something went wrong" errors if the project SDK
version doesn't match the client version.

**Solution:** The project uses **Expo SDK 54**, which requires Expo Go client version 54.x installed
on the test device. To check your device's client version, open Expo Go and navigate to
Settings → About. If your device has an older or newer SDK version, you have two options:
1. Downgrade/upgrade the project to match your device's SDK (adjust `expo` field in `app.json`)
2. Install a matching Expo Go client version from Google Play / App Store

**Why this matters:** Expo Go is the development client that runs your React Native code. The client's
native module versions must match the project's `app.json` `expo` field, or the app won't load.

### ScrollView Layout & Button Reachability

**Issue:** Buttons at the bottom of screens (Next button on Symptom screen, Submit on scan forms)
were off-screen and untappable because ScrollView didn't reserve space for its children.

**Solution:** All ScrollView wrappers now include `contentContainerStyle={{ flexGrow: 1 }}` and
`scrollEnabled={false}` where scrolling isn't needed, or explicit flex: 1 on the parent container.
This ensures buttons anchored to the bottom of the scroll content remain reachable.

```tsx
<ScrollView contentContainerStyle={{ flexGrow: 1 }}>
  {/* content */}
  <TouchableOpacity style={styles.nextButton}>
    <Text>Next</Text>
  </TouchableOpacity>
</ScrollView>
```

### Safe-Area Insets & Gesture Navigation (Xiaomi & Android)

**Issue:** On devices with on-screen gesture navigation (common on Xiaomi, recent Samsung, etc.),
bottom-anchored buttons were swallowed by the gesture zone and couldn't be tapped.

**Solution:** Screens are wrapped in `SafeAreaView` with `edges={['bottom']}` to respect the OS gesture
zone. For absolutely-positioned elements (like emergency alerts), use `useSafeAreaInsets()` to offset
from the bottom:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function RedFlagAlert() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ bottom: insets.bottom + 16 }}>
      {/* alert content */}
    </View>
  );
}
```

All screens wrap their main content in `SafeAreaView` to handle device notches and gesture zones
automatically.

### Photo Upload: Firebase Storage → Cloudinary

**Issue:** App crashed on launch with "something went wrong" when trying to initialize Firebase Storage.

**Root cause:** Firebase Storage no longer supports the free tier. Even with no uploads, the
`getStorage()` call fails if the Firebase project isn't upgraded to the paid Blaze plan. This blocks
the entire app from loading, preventing any development work.

**Solution:** Replaced Firebase Storage with **Cloudinary's free tier**, which requires no billing
and supports unlimited unsigned uploads:

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud name from the dashboard home page
3. Create an unsigned upload preset: Settings → Upload → Upload presets → Add → set Signing Mode to
   "Unsigned" → copy the preset name
4. Add both values to `.env`:
   ```
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```

The app now calls `uploadPhotoToCloudinary()` in `src/services/cloudinaryService.ts`, which uploads
directly to Cloudinary without a backend. The photo URL is stored in Firestore scans.

**Why Cloudinary?** Firebase Storage requires a credit card to enable the Blaze plan, even for
free-tier-sized usage. Cloudinary's free tier (25GB/month) is sufficient for development and small
deployments, and requires no credit card.

### AI Pipeline: Firebase Cloud Functions → Cloudflare Worker

**Issue:** The build guide's AI pipeline (Vision API + text model, triggered by a Cloud Function
on scan creation) needs Cloud Functions to make outbound calls to an external AI API. Firebase
Cloud Functions require the paid Blaze plan for *any* outbound network call, even at $0 usage —
same billing wall as Firebase Storage.

**Solution:** Replaced the Cloud Function with a **Cloudflare Worker** (`../ai-pipeline`), which
has a free tier requiring no credit card, and swapped Vision API + a separate text model for the
**Gemini API** — it's multimodal, so one call does both the image analysis and the text reasoning
that would've needed two separate services. The Worker verifies the patient's Firebase Auth ID
token, calls Gemini with the scan photo, and writes the result back to Firestore via the REST API
using a Firebase service account (same trust level as the Admin SDK — Firestore Security Rules
don't apply, so no rules changes were needed).

**Why not just enable Blaze?** Blaze requires a credit card on file, even though Cloud Functions'
own usage would stay within its free tier for a project this size. The whole point of this stack
is $0 and no billing setup, matching the Cloudinary decision above.

See `../ai-pipeline/README.md` for setup and architecture details.

### Photo Capture & Preview

**Issue:** After taking a photo with `expo-camera`, the app showed a black screen and the photo wasn't
displayed anywhere.

**Solution:** Added an Image component to render the captured photo URI in the camera preview:

```tsx
import { Image } from 'react-native';

{capturedUri && (
  <Image
    source={{ uri: capturedUri }}
    style={{ width: '100%', height: 300 }}
  />
)}
```

The scan flow is now: Camera → Preview (with Image) → Symptoms → Upload & Navigate to Results.

### Navigation Stuck After Symptom Submission

**Issue:** After selecting symptoms and tapping the next button on SymptomScreen, the app did nothing.
The navigation event fired but the screen didn't change; the Results screen never appeared.

**Solution:** Made the `onSubmit` handler async and added `await` before the navigation call:

```tsx
async function handleSubmit() {
  const scanId = await uploadScan(uid, photoUri, selectedSymptoms);
  navigation.navigate('Results', { scanId });
}
```

The issue was that `navigation.navigate()` was firing before the async `uploadScan()` completed.
By awaiting the upload first, we ensure the Firestore document is created before the Results
screen tries to subscribe to it with `useScan(scanId)`.

### Auth Persistence: `getReactNativePersistence` TypeScript Error

**Issue:** After wiring up `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
for session persistence, `tsc` failed with `Module '"firebase/auth"' has no exported member
'getReactNativePersistence'`, even though the function works fine at runtime.

**Root cause:** Firebase's `package.json` `exports` field for `firebase/auth` only declares TypeScript
types for the `node` and `browser` conditions — there's no typed `react-native` condition. Metro (the
RN bundler) still resolves the `react-native` condition at runtime and finds the real
`getReactNativePersistence` export; `tsc` just can't see its types through the package's export map.

**Solution:** Import it as a separate statement with a `@ts-expect-error` suppressing the missing-types
error, since the function is verified to exist at runtime:

```ts
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-expect-error - firebase's package.json "exports" field omits RN-specific types,
// but getReactNativePersistence exists at runtime (Metro resolves the "react-native" condition).
import { getReactNativePersistence } from 'firebase/auth';
```

`initializeAuth()` also throws if called twice on the same app (e.g. during Fast Refresh), so it's
wrapped in a `try/catch` that falls back to `getAuth(app)` — see `src/services/firebase.ts`.

## Safety note

Never wire `aiSeverityHint` (the AI's raw internal guess) into anything the patient sees.
Only `finalSeverity`, set by a doctor via the clinic dashboard, should reach the patient-facing
Results screen. See the build guide's Section 9 and Phase 5 CRITICAL notes.
