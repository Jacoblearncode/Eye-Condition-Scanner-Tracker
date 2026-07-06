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

## Safety note

Never wire `aiSeverityHint` (the AI's raw internal guess) into anything the patient sees.
Only `finalSeverity`, set by a doctor via the clinic dashboard, should reach the patient-facing
Results screen. See the build guide's Section 9 and Phase 5 CRITICAL notes.
