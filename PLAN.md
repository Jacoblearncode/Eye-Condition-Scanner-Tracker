# EyeChecker — Product & Build Plan

Living planning document. **Rule: nothing is built until the phase it belongs to has its
"Decisions" resolved here.** If something isn't written down in this file, it is an assumption
and should be confirmed before coding. Update the checkboxes and the Decision Log as we go.

Last updated: 2026-10-25 · Status: **planning, no new code yet**

---

## 1. Product vision

*Source: stated by the owner. Anything not in this section is not yet confirmed.*

EyeChecker is a **personal eye-condition tracker** for the owner's own use first.

1. **Patient self-monitoring.** The patient photographs their eye with the phone camera (provided
   the phone's camera is capable of a usable image) and tracks the condition over time —
   comparing photos for **redness, swelling and healing**.
2. **Documented history for doctors.** Clinics and doctors who specialise in these conditions can
   see the documented history, so they understand the patient better when they meet.
3. **AI as an assistant, not a decision-maker.** AI helps with analysis and with **setting up
   bookings with suitable doctors**.

### Non-goals (until explicitly changed)

- The app does **not diagnose**. It is a progress/recording aid.
- AI never decides urgency on its own. Emergency (red-flag) detection stays **rule-based**.
- No public launch / app-store release in the first iterations (personal use first).

---

## 2. Where we are today (verified in the code, 2026-10-25)

Three parts in one repo:

| Part | Stack | State |
|---|---|---|
| `patient-app/` | Expo SDK 54, React Native 0.81, Firebase Auth/Firestore, react-native-paper | Onboarding → Auth → Home → Scan → Symptoms → Results works end to end |
| `ai-pipeline/` | Cloudflare Worker + Gemini | Verifies Firebase ID token, sends photo + symptoms to Gemini, writes `aiAnalysis` to Firestore via REST; `/set-clinic-role` admin endpoint |
| `clinic-dashboard/` | Next.js + Firebase | Pending-scan queue; doctor sets `finalSeverity`, note, home-care steps |

Hosting choices (all free-tier, no credit card): Firebase Auth + Firestore, **Cloudinary** (photos,
unsigned upload), **Cloudflare Workers**, **Gemini API**.

**What exists vs. what the vision needs**

| Vision need | Today |
|---|---|
| Take eye photo | ✅ `ScanScreen` — plain back-camera capture, no guidance |
| Consistent photos for comparison | ❌ none (no framing guide, no eye side, no quality check) |
| History / timeline | ❌ no history screen; `Home` is **hard-coded** ("Good morning", "Day 12", "On Track") |
| Compare photos over time | ❌ none |
| Track a named condition | ❌ no condition concept in the data model |
| Doctors view patient history | ⚠️ dashboard shows a *review queue*, not a per-patient timeline |
| Patient controls who sees their data | ❌ any `clinic` user can read every patient (`firestore.rules`) |
| AI-assisted booking | ❌ `appointments`/`clinics` rules exist, no UI, no data, no AI |
| Reminders | ❌ none |

### Current data model (from code)

- `patients/{uid}/scans/{scanId}`: `photoUrl`, `symptoms[]`, `scanDate`, `uploadStatus`
  (`processing` | `ai_analyzed` | `ai_failed`), `doctorNote`, `aiAnalysis{aiSeverityHint, confidence,
  findings, homeCareSteps, finalSeverity}`
- Rules also reference `users`, `milestones`, `clinics`, `appointments`, `notifications` — none of
  which the apps write yet.

---

## 3. Problems found in the existing code (to fix in Phase 0)

| # | Problem | Why it matters |
|---|---|---|
| P1 | `firestore.rules` lets a patient `create` a scan with **any fields** — e.g. a pre-set `aiAnalysis.finalSeverity` | Patient can bypass the doctor gate |
| P2 | Patients can read their own whole scan doc, including `aiSeverityHint` | "Never show the AI hint" is enforced only by UI, not by data access |
| P3 | Photos are on Cloudinary with **public, unauthenticated URLs** (unsigned preset) | Medical images readable by anyone with the link |
| P4 | Gemini **free tier** may use submitted content to improve Google products | Health photos — needs an explicit decision (see D3) |
| P5 | Any clinic user can read **all** patients; no patient consent/grant | Conflicts with "patient chooses who sees their history" |
| P6 | `patient-app/AGENTS.md` says to read **Expo v56** docs; project is pinned to **SDK 54** (commit `03c87eb`) | Wrong-version guidance leads to wrong code |
| P7 | `Home` screen is static placeholder data | Looks real, isn't |
| P8 | `ScanScreen` uses `facing="back"` only and `quality: 0.7`; no flash/lighting/distance handling | Photos won't be comparable over time |
| P9 | Worker has `Access-Control-Allow-Origin: *` and no rate limit; token only proves *who*, not that the scan is theirs/new | Anyone with a valid login can re-trigger Gemini repeatedly |
| P10 | `firestore.rules` comment says the clinic claim is "not built yet" | Stale; claim endpoint exists |
| P11 | Need to confirm the Results screen can't show **AI** `homeCareSteps` that a doctor never approved (`useScan` returns them whenever present) | Possible unreviewed AI text reaching the patient |

---

## 4. Open questions for the owner (answer these first)

Fill in the "Answer" column; these drive scope.

| ID | Question | Why it matters | Answer |
|---|---|---|---|
| Q1 | Which phone(s) will you test on — Android, iPhone, both? (README mentions a Xiaomi.) | Camera APIs, flash, macro behaviour, push notifications differ | _?_ |
| Q2 | What condition(s) are you tracking right now (e.g. conjunctivitis, stye, chalazion, dry eye, post-surgery healing, pterygium…)? | Decides what "better/worse" means and what the AI should look for | _?_ |
| Q3 | Timescale: days (acute, e.g. infection) or months (chronic)? How often would you scan? | Reminder cadence, timeline design | _?_ |
| Q4 | Do real doctors/clinics already agree to use this, or is the clinic side hypothetical for now? | Decides whether to build the clinic view now or ship **export/share link** first | _?_ |
| Q5 | Country/region (for clinic directory, emergency numbers, privacy law)? | Booking data source, emergency copy, GDPR/HIPAA-style obligations | _?_ |
| Q6 | Are you willing to pay anything (e.g. card for Firebase Blaze / storage)? Today everything is $0 by design. | Drives P3/P4 fixes and storage choice | _?_ |
| Q7 | "Booking": should the app **book directly** into a clinic's calendar, or **send a request** the clinic confirms? | Direct booking needs clinic integrations; request-based is feasible | _?_ |
| Q8 | Where do the "suitable doctors" come from — a list you curate, a public directory, clinics who sign up? | There is no doctor data today | _?_ |

---

## 5. Design decisions to settle

Recommendation shown first. Mark the chosen option and log it in §8.

- **D1 — What does the patient see from the AI?** *(Core product + safety decision.)*
  The original build was "patient sees only doctor-confirmed results". For self-monitoring that is
  too restrictive. **Recommended:** the patient sees *observations about change* ("redness looks
  lower than 3 days ago") clearly labelled as AI-generated and non-diagnostic, but **never** a
  severity/diagnosis label unless a doctor confirmed it. Red flags stay rule-based and
  AI-independent. Alternative: keep the strict doctor-only gate.
- **D2 — How do we measure "redness / swelling / healing"?**
  Options: (a) ask Gemini for a fixed rubric score per photo — easy but noisy across time;
  (b) send **pairs** of photos (previous vs. current) and ask for *change*, which is more reliable;
  (c) simple on-device colour metric (redness index in a fixed region) — objective and free, needs
  consistent lighting/framing. **Recommended:** start with (b) + (c), show both, label confidence.
- **D3 — Privacy posture for health photos.** Options: stay on free tiers with explicit consent and
  accept risk for personal use; or move photos to private storage and use a paid Gemini tier /
  zero-retention. **Recommended:** personal use may stay free, but fix P3 (private/signed access)
  before any other person uses the app, and write the consent text accordingly.
- **D4 — Sharing model with doctors.** Options: (a) patient-granted access per clinic stored in
  Firestore and enforced by rules; (b) time-limited **share link / PDF** the patient sends before a
  visit. **Recommended:** ship (b) first (works with no clinic integration), build (a) when real
  clinics exist.
- **D5 — Booking model.** Options: request-based (patient sends request + history, clinic
  confirms) vs. direct calendar booking. **Recommended:** request-based.
- **D6 — AI's role in booking.** **Recommended:** AI suggests *specialty type and urgency wording*
  from the condition history, then the app filters the directory; the **patient** chooses and sends.
  AI never sends a request on its own, and never downgrades a red-flag.

---

## 6. Roadmap

Order reflects "personal use first": get a trustworthy tracker working, then share, then book.
Each step has an acceptance check. `[ ]` = not started.

### Phase 0 — Foundations & safety fixes
*Goal: stop building on a shaky base. No new features.*

- [ ] 0.1 Fix P6: align `AGENTS.md` with SDK 54 (or deliberately upgrade — owner's call).
- [ ] 0.2 Confirm the app builds and runs on the owner's phone today (baseline). *Accept:* full
      Scan → Results flow completes on the real device.
- [ ] 0.3 Fix P1: rules validate scan **create** (allowed keys only; `aiAnalysis`, `doctorNote`,
      `finalSeverity` must be absent/null). *Accept:* a crafted write setting `finalSeverity` is
      rejected (test with Firebase emulator rules tests).
- [ ] 0.4 Fix P2: move AI draft (`aiSeverityHint`, raw `findings`) to a clinic/Worker-only
      location (e.g. `patients/{uid}/scans/{id}/private/ai`). *Accept:* patient SDK read of it is
      denied.
- [ ] 0.5 Fix P11 + P10; verify what `homeCareSteps` the patient can see.
- [ ] 0.6 Worker hardening (P9): only analyse scans in `processing` state owned by the caller;
      limit one analysis per scan; restrict CORS to known origins.
- [ ] 0.7 Resolve D3/P3/P4 as decided; record in §8.

### Phase 1 — Consistent, high-quality capture
*Goal: photos that can be fairly compared. Without this, trend analysis is meaningless.*

Decisions needed first: Q1, Q2.

- [ ] 1.1 Eye-side + condition tag on every scan (left / right / both).
- [ ] 1.2 Capture guidance overlay (framing guide, distance prompt, "look straight ahead").
- [ ] 1.3 Front vs. back camera choice, flash/torch control, fixed capture settings.
- [ ] 1.4 On-device **quality gate**: reject blurry, too dark/bright, too small-eye photos with a
      plain-language reason ("this is where 'if the lens is capable' gets checked").
- [ ] 1.5 Store capture metadata (device model, resolution, flash on/off, timestamp).
      *Accept:* two photos taken on different days with the guide look framed alike; bad photos
      are refused with a reason.

### Phase 2 — Condition profile & timeline
*Goal: the app knows what you are tracking and shows real data.*

Decisions needed first: Q2, Q3.

- [ ] 2.1 Data model: `patients/{uid}/conditions/{id}` (name, eye, start date, notes, status);
      scans link to a `conditionId`.
- [ ] 2.2 Condition setup screen (create / pick / close a condition).
- [ ] 2.3 History/timeline screen (thumbnails by date, filter by condition and eye).
- [ ] 2.4 Replace hard-coded Home (P7) with real day count, last scan, next reminder.
- [ ] 2.5 Daily symptom log (pain, discharge, vision, light sensitivity) alongside photos.
      *Accept:* Home and History reflect real Firestore data; no placeholder values remain.

### Phase 3 — Comparison & trend analysis
*Goal: answer "is it getting better or worse?"*

Decisions needed first: D1, D2.

- [ ] 3.1 Side-by-side + slider comparison of any two scans.
- [ ] 3.2 Redness/swelling metric per D2 (on-device and/or pair-based AI), stored per scan.
- [ ] 3.3 Trend chart over time (per condition, per eye) with confidence indication.
- [ ] 3.4 AI "what changed since last scan" summary, clearly labelled non-diagnostic (per D1).
- [ ] 3.5 Red-flag symptom logic reviewed and unit-tested; independent of AI.
      *Accept:* with a known set of test photos, direction of change (better/same/worse) matches a
      manual judgement; every AI text shows the disclaimer.

### Phase 4 — Share history with a doctor
*Goal: "doctors understand me better at the appointment."*

Decisions needed first: Q4, D4.

- [ ] 4.1 Visit summary: timeline, key photos, symptom log, trend — exportable as PDF and/or a
      time-limited, revocable share link.
- [ ] 4.2 (If D4 = per-clinic access) patient grants/revokes a clinic; rules scoped to granted
      clinics only (fixes P5).
- [ ] 4.3 Clinic dashboard: per-patient **timeline view** (not just a review queue); doctor notes
      attach to the timeline; audit who viewed/changed what.
      *Accept:* a doctor with a share link/grant sees the history; without it, nothing; revoking
      works.

### Phase 5 — AI-assisted doctor matching & booking
*Goal: "AI helps set up the booking."*

Decisions needed first: Q5, Q7, Q8, D5, D6.

- [ ] 5.1 Clinic/doctor directory data model (`clinics`, specialties, location, contact, accepts
      requests) and a way to populate it (per Q8).
- [ ] 5.2 AI suggests specialty + urgency wording from the condition history (per D6).
- [ ] 5.3 Browse/filter doctors; patient picks.
- [ ] 5.4 Booking request: preferred times + attached visit summary → `appointments`.
- [ ] 5.5 Clinic side: see requests, confirm/decline/propose time; patient sees status.
      *Accept:* end-to-end request → confirmation, with the patient always the one who sends.

### Phase 6 — Reminders & notifications

- [ ] 6.1 Scan reminders on the cadence from Q3 (local notifications first).
- [ ] 6.2 Appointment confirmations/reminders. Note: remote push needs a **development build** (not
      Expo Go) on modern SDKs — confirm before promising it.

### Phase 7 — Hardening before anyone else uses it

- [ ] 7.1 Private photo storage and signed access (P3), if not already done.
- [ ] 7.2 Consent text, privacy policy, data export and **delete-my-data**.
- [ ] 7.3 Tests: rules tests, red-flag unit tests, Worker tests.
- [ ] 7.4 Error/offline handling (scan queued when offline; retry AI step — currently a failed AI
      call just leaves `processing`).
- [ ] 7.5 Review regulatory exposure for the target region (Q5) before any wider release.

---

## 7. Risks & honest limits

- A phone photo shows **external** signs (redness, discharge, lid swelling, clouding). It cannot
  assess the retina, eye pressure or vision loss. The app must say so and must never reassure
  where it cannot know.
- LLM "scores" can drift between photos; trend claims need pairs, fixed framing, and confidence.
- Free tiers (Gemini rate limits, Cloudinary, Workers) can change; keep services behind thin
  wrappers (`aiPipelineService`, `cloudinaryService`) so they can be swapped.
- Booking/clinic data does not exist yet and is the biggest unknown (Q4, Q7, Q8).

---

## 8. Decision log

Record every decision here with date and reason. Empty until the owner answers §4–§5.

| Date | Decision | Reason |
|---|---|---|
| 2026-10-25 | Scope is personal-use first; clinics/doctors second; AI assists booking | Owner statement |

---

## 9. Suggested next step

Answer **Q1–Q3** and **D1**, then start **Phase 0** (small, safety-focused) followed by
**Phase 1** (capture quality), because every later feature depends on trustworthy,
comparable photos.
