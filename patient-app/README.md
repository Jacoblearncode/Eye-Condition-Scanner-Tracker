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
3. Install dependencies: `npm install`
4. Start the dev server: `npx expo start`
5. Paste `../firestore.rules` into Firebase Console → Firestore Database → Rules (replaces the
   default test-mode rules, which expire after 30 days and are otherwise wide open)

## What's implemented

- Firebase initialization (`src/services/firebase.ts`) — Auth, Firestore
- Cloudinary photo upload (`src/services/cloudinaryService.ts`) — unsigned upload, no backend
- Scan pipeline (`src/services/scanService.ts`) — uploads the photo, creates a Firestore scan
  document at `patients/{uid}/scans/{scanId}`
- Live scan subscription (`src/hooks/useScan.ts`) — Results screen updates the moment a doctor
  sets `aiAnalysis.finalSeverity`, no polling
- Auth state hook (`src/hooks/useAuth.ts`)
- Screens: Onboarding/Consent, Auth (login/register), Home, Scan (camera capture), Symptom
  Checklist, Results (pending + doctor-confirmed states)
- Client-side red-flag symptom detection (`src/utils/severityUtils.ts`) and the full-screen
  emergency alert (`src/components/RedFlagAlert.tsx`) — fires before any AI processing, per the
  build guide's safety requirement
- Navigation wiring (`src/navigation/RootNavigator.tsx`) tying the flow together:
  Onboarding → Auth → Home → Scan → Symptoms → Results
- Firestore security rules (`../firestore.rules`) — role-based access; clinic role checks rely on
  a custom auth claim that isn't set anywhere yet, since there's no clinic dashboard to set it

## Known follow-ups (not yet wired)

- Auth session persistence across app restarts (`getReactNativePersistence` — see comment in
  `src/services/firebase.ts`)
- Cloud Function AI pipeline (Vision API + text model) — see build guide Section 8. Requires
  upgrading the Firebase project to the Blaze plan (Cloud Functions calling external APIs require
  billing enabled, regardless of Cloudinary being used for photo storage)
- Appointment booking flow, recovery progress/history screen, push notifications
- Clinic web dashboard (separate Next.js project, not started yet) — needed before `finalSeverity`
  can ever actually be set on a real scan

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

## Safety note

Never wire `aiSeverityHint` (the AI's raw internal guess) into anything the patient sees.
Only `finalSeverity`, set by a doctor via the clinic dashboard, should reach the patient-facing
Results screen. See the build guide's Section 9 and Phase 5 CRITICAL notes.
