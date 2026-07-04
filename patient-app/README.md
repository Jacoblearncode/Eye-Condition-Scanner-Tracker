# EyeChecker — Patient App

Phase 1 scaffold: Expo + TypeScript + Firebase Auth, matching the screen flow in the build guide.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase project's web config
   (Firebase Console → Project Settings → General → Your apps → SDK setup and configuration).
2. Install dependencies: `npm install`
3. Start the dev server: `npx expo start`

## What's implemented

- Firebase initialization (`src/services/firebase.ts`) — Auth, Firestore, Storage
- Auth state hook (`src/hooks/useAuth.ts`)
- Screens: Onboarding/Consent, Auth (login), Home, Scan (camera capture), Symptom Checklist,
  Results (pending + doctor-confirmed states)
- Client-side red-flag symptom detection (`src/utils/severityUtils.ts`) and the full-screen
  emergency alert (`src/components/RedFlagAlert.tsx`) — fires before any AI processing, per the
  build guide's safety requirement
- Navigation wiring (`src/navigation/RootNavigator.tsx`) tying the flow together:
  Onboarding → Auth → Home → Scan → Symptoms → Results

## Known follow-ups (not yet wired)

- Auth session persistence across app restarts (`getReactNativePersistence` — see comment in
  `src/services/firebase.ts`)
- Firebase Storage upload + Firestore scan document creation from the Scan screen
- Cloud Function AI pipeline (Vision API + text model) — see build guide Section 8
- Firestore-backed `finalSeverity` in the Results screen (currently hardcoded to `null`)
- Appointment booking flow, recovery progress/history screen, push notifications
- Clinic web dashboard (separate Next.js project, not started yet)

## Safety note

Never wire `aiSeverityHint` (the AI's raw internal guess) into anything the patient sees.
Only `finalSeverity`, set by a doctor via the clinic dashboard, should reach the patient-facing
Results screen. See the build guide's Section 9 and Phase 5 CRITICAL notes.
