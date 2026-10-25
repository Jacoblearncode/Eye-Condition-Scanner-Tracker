# EyeChecker — Product & Build Plan

Living planning document. **Rule: nothing is built until the phase it belongs to has its
"Decisions" resolved here.** If something isn't written down in this file, it is an assumption
and should be confirmed before coding. Update the checkboxes and the Decision Log as we go.

Last updated: 2026-10-25 · Status: **planning, no new code yet** · Q1–Q17, D1–D3, D5, D6, D8 answered (see §5, §8)

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
4. **Understand and reduce recurrence.** *(Added 2026-10-25.)* The owner has had conjunctivitis
   4 times and is building this to monitor it and help prevent frequent recurrence. So the app
   tracks **episodes over the long run** (not just one), records possible triggers, and helps
   notice the start of the next one early. It cannot promise prevention — it gives the owner
   and the clinic better information to work out patterns.

### Non-goals (until explicitly changed)

- The app does **not diagnose**. It is a progress/recording aid.
- AI never decides urgency on its own. Emergency (red-flag) detection stays **rule-based**.
- No public launch / app-store release in the first iterations (personal use first).

### Principles (from owner decisions, 2026-10-25)

- **Local-first.** Health data and photos live on the owner's phone by default. Anything that
  leaves the phone (AI analysis, sharing with a clinic, a booking request, contributing to
  training) happens only when the owner chooses it, and each is a separate, explicit consent.
- **$0 by default.** Free tiers and on-device storage. Any paid service needs the owner's
  explicit OK first (Q6).
- **Built for light sensitivity and pain.** During an episode the owner *can* open their eyes
  but it **hurts** (light sensitivity), so capture and UI must be quick, dim and gentle, with an
  eyes-closed option, and must not rely on photos alone (see Phase 1, D2).
- **Multilingual-ready from the start.** All user-facing text is externalised so languages can
  be added without rewriting screens (Q16).
- **Clear descriptions.** Because photos will be limited at the worst moments, the written
  condition description must be detailed and clear for the patient and for a doctor (Q17).
- **AI assists, doctors confirm, rules protect.** (D1.)

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

### 2.1 Owner's episode history (seed data, as told by the owner 2026-10-25)

| # | When | Diagnosis told by clinic | Treatment |
|---|---|---|---|
| 1 | Jan 2025 | Conjunctivitis | Cream, antibiotics, tablets for reduced irritation and inflammation |
| 2 | Aug 2025 | Conjunctivitis | Same |
| 3 | Feb 2026 | Conjunctivitis | Same |
| 4 | First week of Sep 2026 | Conjunctivitis | Same |

Notes (facts only, no conclusions):
- Episodes were roughly **6–7 months apart**. That is a pattern worth showing the clinic; it does
  not by itself say why. Months don't line up with a single season (Jan, Aug, Feb, Sep).
- The owner reported "conjunctivitis" each time; **no type (viral / bacterial / allergic) was
  recorded here.** Antibiotics being prescribed must **not** be read by the app or by us as
  proof of a bacterial type — only the doctor can state the type, so it stays blank unless the
  doctor confirms it.
- Both eyes. Exact dates, durations, drug names and doses are not recorded yet; the app should
  accept **month-level dates** and mark details "unknown" rather than forcing guesses.
- Last episode was ~7 weeks before today (2026-10-25), so the app should start in **healthy /
  weekly-baseline mode**, switching to daily scanning when a new episode begins.

### Current data model (from code)

- `patients/{uid}/scans/{scanId}`: `photoUrl`, `symptoms[]`, `scanDate`, `uploadStatus`
  (`processing` | `ai_analyzed` | `ai_failed`), `doctorNote`, `aiAnalysis{aiSeverityHint, confidence,
  findings, homeCareSteps, finalSeverity}`
- Rules also reference `users`, `milestones`, `clinics`, `appointments`, `notifications` — none of
  which the apps write yet.

### 2.2 Architecture direction: local-first (decided via D3, 2026-10-25)

**Today** every scan is uploaded to Cloudinary and written to Firestore immediately
(`patient-app/src/services/scanService.ts`). **That changes.**

| Concern | New direction |
|---|---|
| Where records live | On the phone: SQLite (`expo-sqlite`) for records, app-private files (`expo-file-system`) for photos. Note: React Native has **no `localStorage`**, and `AsyncStorage` is unsuitable for photos or large data. |
| Photo upload | **Removed from the default scan path.** Cloudinary/Firestore code stays only for the explicit "share" path. |
| AI analysis | **Opt-in per use** ("Analyse with AI" shows what is sent and to whom). The Worker should receive the photo, return the structured result, and **not store it**; the result is saved on the phone. Google's own retention of free-tier inputs (P4) still applies and must be stated in the consent text. |
| Sharing with a clinic | Owner-initiated export (PDF/file via the Android share sheet = no server, $0), later optional short-lived link or per-clinic grant (D4). |
| Booking | Owner-initiated request; sends only what the owner attaches (Phase 5). |
| Training contribution | Separate, optional, revocable consent (D8). |
| Accounts / login | Currently required (Firebase Auth). Only truly needed for sharing/booking. **Open: Q15.** |

**Costs of going local-first (accepted trade-offs, must be handled):**
- **Phone lost, reset or replaced = history gone** unless there is a backup/export (Phase 7).
- Doctors can't see anything unless the owner shares it, so the clinic dashboard only shows
  shared records.
- A doctor's **confirmation must get back to the phone** somehow (open: Phase 4.4).
- P1/P2 (Firestore rules) now protect only the *shared* path, not personal tracking.

---

## 3. Problems found in the existing code (to fix in Phase 0)

| # | Problem | Why it matters |
|---|---|---|
| P1 | `firestore.rules` lets a patient `create` a scan with **any fields** — e.g. a pre-set `aiAnalysis.finalSeverity` | Patient can bypass the doctor gate |
| P2 | Patients can read their own whole scan doc, including `aiSeverityHint` | "Never show the AI hint" is enforced only by UI, not by data access |
| P3 | Photos are on Cloudinary with **public, unauthenticated URLs** (unsigned preset) | Medical images readable by anyone with the link. **Largely resolved by D3 (local-first, no automatic upload); still applies to anything shared.** |
| P4 | Gemini **free tier** may use submitted content to improve Google products | Health photos. **Handled by per-use consent text (D3).** |
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
| Q1 | Which phone(s) will you test on — Android, iPhone, both? (README mentions a Xiaomi.) | Camera APIs, flash, macro behaviour, push notifications differ | **Android, Xiaomi** (2026-10-25) |
| Q2 | What condition(s) are you tracking right now (e.g. conjunctivitis, stye, chalazion, dry eye, post-surgery healing, pterygium…)? | Decides what "better/worse" means and what the AI should look for | **Conjunctivitis** (2026-10-25) |
| Q3 | Timescale: days (acute, e.g. infection) or months (chronic)? How often would you scan? | Reminder cadence, timeline design | **Daily scans.** Conjunctivitis is an acute episode (days to a few weeks), so a condition has a start and an end ("resolved"). (2026-10-25) |
| Q4 | Do real doctors/clinics already agree to use this, or is the clinic side hypothetical for now? | Decides whether to build the clinic view now or ship **export/share link** first | **Partly answered (2026-10-25):** no clinic is signed up to use the app, but there is a real clinic the owner already visits that is experienced with conjunctivitis and has the medication. Treat it as the first pilot via share link/PDF (D4); no integration assumed. |
| Q5 | Country/region (for clinic directory, emergency numbers, privacy law)? | Booking data source, emergency copy, GDPR/HIPAA-style obligations | **Malaysia** (2026-10-25). Consequences to check (not legal advice): emergency copy should use Malaysian numbers (**999**, and 112 from mobiles — to confirm); health data is "sensitive personal data" under Malaysia's **PDPA 2010** (explicit consent needed — fits D3/D8); software that diagnoses or advises can fall under the **Medical Device Authority (MDA)** — another reason to stay non-diagnostic (D1). |
| Q6 | Are you willing to pay anything (e.g. card for Firebase Blaze / storage)? Today everything is $0 by design. | Drives P3/P4 fixes and storage choice | **Free if possible** (2026-10-25): store on the patient's device; use somewhere else only when something must be shared. Any paid service needs the owner's explicit approval first. |
| Q7 | "Booking": should the app **book directly** into a clinic's calendar, or **send a request** the clinic confirms? | Direct booking needs clinic integrations; request-based is feasible | **Both acceptable** (2026-10-25): a request the clinic confirms, **or** direct calendar booking handled by the clinic's admins/doctors. Plan: build request-based first; add calendar booking where a clinic's admins support it. Implies separate **doctor** and **clinic-admin** roles (Phase 5.6). |
| Q8 | Where do the "suitable doctors" come from — a list you curate, a public directory, clinics who sign up? | There is no doctor data today | **Specific clinics / hospitals / medical centers** (2026-10-25) — the directory lists *facilities* (each with its doctors and specialties), starting with a hand-curated list that includes the owner's own clinic. Facility details (address, hours, booking contact) must be verified by the owner; the app doesn't scrape or guess them. |
| Q9 | Confirm the D1 interpretation: AI says "features consistent with these reference items" but does **not** name viral/bacterial/allergic until a doctor does. OK? | Defines the line between assistance and diagnosis | **Yes (2026-10-25).** The AI never names viral / bacterial / allergic; a doctor confirms the type. "Allergic" is also person-specific (triggers differ per person), which makes a personal trigger log valuable. |
| Q10 | Do you wear contact lenses, and is this your first episode / recurring? Is it one eye or both? | Contact-lens-related infection is a red-flag context; affects the symptom checklist | **Normal spectacles, no contact lenses. Recurring: 4 episodes so far.** One eye vs. both: not yet answered (see Q12). (2026-10-25) |
| Q11 | Do you have access to an eye clinician (even informally) who could review the symptom reference in D7? | Reference quality is the foundation of the "verifiable" design | **No dedicated reviewer yet**, but the owner visits an experienced clinic. Plan: ask that clinic to review the reference/pilot the visit summary (see Phase 4). Until reviewed, the reference is shown as "sourced from public guidance, not yet clinician-reviewed". (2026-10-25) |
| Q12 | In your past episodes, was it one eye, both, or did it switch sides? | Decides whether the data model tracks per-eye or per-person, and affects reading of results | **Both eyes** (2026-10-25). Data model is per-eye (left and right each get their own photo and symptoms per scan) so each eye's course can be compared. |
| Q13 | When you're healthy, do you want a light check-in (e.g. weekly baseline photo) so we can catch the *start* of the next episode early? | Early detection depends on a personal "normal" baseline; adds scans when healthy | **Yes — weekly baseline** (2026-10-25). Daily during an episode, weekly when healthy. |
| Q14 | Can you recall for past episodes: dates, what the doctor said it was (viral / bacterial / allergic), and medication given? | Lets us seed history and look for patterns behind the 4 recurrences | **Answered in part (2026-10-25)** — see §2.1 "Owner's episode history". Still unknown: exact dates, which eye(s) each time, medication names, and whether the doctor named a type. |
| Q15 | Keep the login/account for personal tracking, or make it optional and only ask for it when you share or book? | Local-first means personal tracking doesn't need a server account; login also gates AI use (abuse protection) | **Only when sharing or booking** (2026-10-25). Personal tracking works with no account. *Follow-up (confirmed 2026-10-25):* AI analysis isn't sharing or booking but still needs abuse protection on the Worker — use Firebase **anonymous sign-in** (silent, no email) the first time AI is used, and upgrade it to a full account (keeping the same user id) when the owner shares or books. |
| Q16 | App language: English only, or also Bahasa Malaysia (or other)? | Affects all screen text, symptom wording and consent text | **Multilingual-compatible** (2026-10-25). Build the app so languages can be added; the specific list isn't chosen yet. **Confirmed:** start with **English + Bahasa Malaysia**, add others (e.g. Chinese, Tamil) later. Medical wording in each language needs review; symptom-reference ids stay language-neutral with translated text per language. |
| Q17 | During an episode, can you open your eyes for a second or two in a dim room, or never? Is a photo with eyes closed (swollen/crusted lids) acceptable to record? | Decides the capture design for light sensitivity (Phase 1.6) | **Can open them, but it hurts; an eyes-closed photo is acceptable** (2026-10-25). The owner also asked that the patient's condition be **described with better clarity** — read as: because photos will be limited, the structured/written description must carry more weight and be easy to understand (**confirmed 2026-10-25**). See Phase 2.5–2.7. |
| Q18 | You get pain and light sensitivity in every episode, and NHS lists both as **urgent-contact** signs (NEI/MedlinePlus are more conditional). What should the app do when you log them — e.g. "contact your clinic today" plus a one-tap share/booking? | The draft rule `rule.contact_urgently` would fire every episode; needs your preference and the clinic's thresholds | _?_ (needs owner + clinic) |
| Q19 | NHS text comes with attribution/adaptation conditions (translation counts as adapting). Agree with: link to NHS pages rather than copy them, and base patient-facing wording on the NIH sources? | Affects how sources are shown and the Bahasa Malaysia plan (see `reference/conjunctivitis/README.md`) | _?_ |

---

## 5. Design decisions to settle

Recommendation shown first. Mark the chosen option and log it in §8.

- **D1 — What does the patient see from the AI?** ✅ **DECIDED 2026-10-25**
  The original build was "patient sees only doctor-confirmed results". For self-monitoring that
  was too restrictive. Decision (owner):
  1. The AI shows **observations and symptom data that can be referenced and verified** against a
     curated symptom reference (see D7), for both patient and professional to read. Everything
     AI-produced is labelled **"AI-assisted · non-diagnostic"**.
  2. **No severity label and no condition/diagnosis label** is shown as fact until a
     doctor/specialist has confirmed it.
  3. Red flags stay rule-based and AI-independent.

  *Interpretation to confirm (see Q9):* "estimate the condition" is read as **"features
  consistent with items on the reference list"**, not "this is bacterial conjunctivitis". Naming a
  type (viral / bacterial / allergic) is a diagnosis and waits for a doctor.
- **D7 — Symptom reference (new, from D1).** 🟡 **Draft v0.1 written 2026-10-25, NOT clinician-reviewed** — see `reference/conjunctivitis/` (data, validator, review guide). The "verify" part needs something to verify
  *against*. **Recommended:** a small, versioned, curated **conjunctivitis reference** stored in the
  repo (e.g. `reference/conjunctivitis.json`): each item has an id, plain-language description,
  what it can look like in a photo vs. what only the patient can report, which clinical
  patterns it's associated with, and a **source citation** (e.g. NHS, American Academy of
  Ophthalmology). The AI must output observations as **references to those ids** (structured
  output), not free medical prose; the UI shows the item and its source so anyone can check it.
  The content must be sourced from reputable published guidance and ideally **reviewed by an
  eye clinician** — I will not invent medical claims.

  **Owner decision (2026-10-25): proper datasets, downloaded, may be used as reference for D7.**
  Done for the one relevant dataset that was reachable: the Mendeley eye-disease set
  (CC BY 4.0) is fetched by `reference/datasets/fetch_mendeley.py`; findings, limits, credit
  line and what could not be fetched are in `reference/datasets/README.md`. How they may be used:
  as *visual examples and a sanity-check set* — **not** as a clinical authority and **not** for
  training (D8). The main limits found: labels come from web searches and are unverified per
  image; its "Normal" photos are tiny 56 × 56 px crops (useless as a healthy baseline); images
  belong to third parties, so they stay out of the repo and the app. Every D7 item still needs
  a citation to published guidance.
- **D8 — Public eye-image datasets (new, 2026-10-25).** The owner found three: a Mendeley
  eye-disease image set, a Kaggle "Eye disease dataset", and a Roboflow conjunctivitis
  object-detection set (344 images). **Recommended: do not train a classifier on them; use them,
  at most, as a small sanity-check test set.** Reasons, all from the dataset pages:
  - The Mendeley set ([n9zp473wfw](https://data.mendeley.com/datasets/n9zp473wfw)) was gathered
    from **Google image searches**, and its classes are balanced to 649 images each using
    **SMOTE**, i.e. partly *synthetic* images — poor for judging real-world accuracy, and the
    photos' copyright/labelling quality is unknown. I could not confirm its license; check the
    "Licence" box on its page before any use.
  - The Roboflow set ([eyezSmartDet/conjunctivitis](https://universe.roboflow.com/eyezsmartdet/conjunctivitis))
    is CC BY 4.0 (needs attribution), but it is **object detection** (boxes), has no description,
    and 344 images is small.
  - A model trained to say "this is conjunctivitis" **is a diagnosis**, which D1/Q9 rule out.
  - These are mostly web photos, not close-up phone photos from a Xiaomi under home lighting, so
    results won't transfer.
  - **Better ground truth is the owner's own data:** daily photos plus the doctor's confirmed
    diagnosis per episode. Over time that is a verified, personal dataset (see Phase 3.6 / 4).
  Kaggle set: not examined yet; the same checks (source, labels, license) apply.

  **Owner decision (2026-10-25), replaces the recommendation above as the rule:**
  *No training on the public datasets by default.* Revisit **only if** (1) there is a concrete
  need — a case where a probable condition can't be handled without training — **and** (2) the
  patients whose data is used have given **explicit opt-in consent** for training use. Even then:
  - Any model that suggests a probable disease is still bound by D1: non-diagnostic labelling,
    doctor confirmation, and a regulatory check (MDA, Phase 7.5) **before** it ships.
  - Training use of patients' data needs its own separate, revocable consent (PDPA; health data
    is sensitive), not folded into general terms.
  - Dataset relevance per the Google summary in the owner's screenshot (not independently
    verified by me): the **Kaggle "Conjunctivitis Dataset" (AliSofiya, 181 healthy + 177
    "infected")** and the **Roboflow** set are external-eye photos; the **Figshare infectious
    keratitis** set (slit-lamp, 3.75 GB) and the **Kaggle fundus** set (10,449 retina images) are
    clinical imaging that a phone camera can't produce, so they don't match this app's input.
- **D2 — How do we measure "redness / swelling / healing"?** ✅ **DECIDED 2026-10-25 (owner: yes
  to the proposal below).** Fact (2026-10-25): during an episode the owner can open their eyes
  but it **hurts** (light sensitivity), so open-eye photos will often be painful, brief or
  unreliable exactly when it matters most. Public datasets don't fix this (they are
  open-eye web photos). **Decision: measure with several signals, so photos are one input, not
  the only one:**
  1. **Self-ratings every scan** (simple 0–3 or 0–10 scales for redness, pain, light sensitivity,
     discharge, itching), including "could not open eyes" as a recorded fact — light sensitivity
     itself is a trackable measure of how the episode is going.
  2. **Photo when possible:** eyes-open photo if the owner can, otherwise an **eyes-closed
     eyelid photo** (swelling, crusting, discharge are visible even closed).
  3. **Opt-in AI pair comparison** (previous vs. current, per D3 consent) → structured
     observations referencing D7; more reliable than scoring one photo alone.
  4. **On-device colour metric** only for eyes-open photos that pass the quality gate — free,
     private, objective.
  Show whichever signals exist, label confidence, never blend them into one "score".
- **D3 — Privacy posture for health photos.** ✅ **DECIDED 2026-10-25 (owner):** data stays on the
  owner's phone by default; shared only when the owner allows it within the app, or at doctor
  meetups to help diagnosis. This is the **local-first** direction in §2.2. Consent screens are
  required for each outward flow (AI analysis, sharing, booking, training). Because the owner
  also wants to avoid cost (Q6), any shared copy must use a free mechanism (file/PDF via the
  share sheet first).
- **D4 — Sharing model with doctors.** Revised for D3. Options: (a) patient-granted access per
  clinic stored in Firestore and enforced by rules; (b) **owner-initiated share** — a PDF/file
  sent through the Android share sheet (no server, no cost), optionally a time-limited link
  later. **Recommended:** (b) first; (a) when real clinics onboard. Sharing is always an
  explicit owner action.
- **D5 — Booking model.** ✅ **DECIDED 2026-10-25 (via Q7):** both are acceptable — a request the
  clinic confirms, or direct calendar booking via the clinic's admins/doctors. Build the
  request-based one first.
- **D6 — AI's role in booking.** ✅ **DECIDED 2026-10-25 (owner):** the AI **recommends the kind of
  doctor** based on the patient's specific condition; the **patient still decides** (and sends
  the request). Rules that follow from this and from D1:
  - The recommendation is shown **with its reasons** drawn from the patient's own record (e.g.
    "4 episodes in 20 months, both eyes, doctor-confirmed type: none yet") so it can be checked.
  - The mapping from condition to kind of doctor comes from published guidance / the pilot
    clinic, not from the model's invention; the AI helps phrase and explain it.
  - It is a *suggestion of where to go*, not a diagnosis, and it never lowers a red-flag:
    emergency routing stays rule-based and independent of AI.
  - The AI never sends a booking request itself.
  - *Wording confirmed 2026-10-25:* "No" meant the AI does **not** decide urgency wording
    itself; it recommends the kind of doctor, and the patient decides.

---

## 6. Roadmap

Order reflects "personal use first": get a trustworthy tracker working, then share, then book.
Each step has an acceptance check. `[ ]` = not started.

### Phase 0 — Foundations & safety fixes
*Goal: stop building on a shaky base. No new features.*

- [ ] 0.1 Fix P6: align `AGENTS.md` with SDK 54 (or deliberately upgrade — owner's call).
- [ ] 0.2 Confirm the app builds and runs on the owner's phone today (baseline). *Accept:* full
      Scan → Results flow completes on the real device.
- [ ] 0.3 **Local-first storage layer (D3, §2.2):** `expo-sqlite` for records + app-private
      files for photos, behind a small repository interface so screens don't depend on Firestore.
      *Accept:* a scan (photo + symptoms) saves and reloads after an app restart with airplane
      mode on.
- [ ] 0.4 **Stop automatic upload:** remove Cloudinary + Firestore writes from the default scan
      path (`scanService.ts`). Upload/AI/share become explicit actions behind consent screens.
      Keep that code for the share path. *Accept:* a normal scan sends **no** network request
      (verify with a network inspector).
- [ ] 0.5 Fix P1 (**shared path**): rules validate scan **create** (allowed keys only;
      `aiAnalysis`, `doctorNote`, `finalSeverity` must be absent/null). *Accept:* a crafted write
      setting `finalSeverity` is rejected (Firebase emulator rules tests).
- [ ] 0.6 Fix P2 (**shared path**): move AI draft (`aiSeverityHint`, raw `findings`) to a
      clinic/Worker-only location (e.g. `patients/{uid}/scans/{id}/private/ai`). *Accept:*
      patient SDK read of it is denied.
- [ ] 0.7 Fix P11 + P10; verify what `homeCareSteps` the patient can see.
- [ ] 0.8 Worker hardening (P9) and **make AI analysis stateless** for the personal path:
      receive photo → return structured result, store nothing; CORS restricted; rate-limited.
      Protection without a full login: Firebase anonymous sign-in (Q15 follow-up, to confirm).
- [ ] 0.9 Write the per-use **consent text** for AI analysis (names Google/Gemini, free-tier
      retention caveat from P4); record the wording in §8.
- [ ] 0.10 **Optional login (Q15):** the app opens straight to Home after onboarding; the Auth
      screen appears only when the owner shares or books (anonymous → full account upgrade keeps
      the same user id). *Accept:* a fresh install can scan and view history with no account.
- [ ] 0.11 **Multilingual foundation (Q16):** move all user-facing strings (screens, red-flag
      messages, consent text, disclaimers) into language files behind an i18n library (e.g.
      `expo-localization` + `i18next`), English first, Bahasa Malaysia next; language
      switcher in settings. Doing this now is far cheaper than retrofitting. *Accept:* no
      hard-coded user-visible text left in screens; switching language changes every screen.

### Phase 1 — Consistent, high-quality capture
*Goal: photos that can be fairly compared. Without this, trend analysis is meaningless.*

Decisions needed first: ~~Q1~~, ~~Q2~~ (answered). Xiaomi-specific notes: test on the real device;
check which physical camera `expo-camera` selects (some Xiaomi phones expose wide/macro lenses
separately and the default may not be the sharpest at close range); MIUI/HyperOS can restrict
camera/background behaviour, so verify permissions early.

- [ ] 1.1 Eye-side + condition tag on every scan (left / right / both).
- [ ] 1.2 Capture guidance overlay (framing guide, distance prompt, "look straight ahead").
- [ ] 1.3 Front vs. back camera choice, flash/torch control (**off by default, never on in
      episode mode** — see 1.6), fixed capture settings.
- [ ] 1.4 On-device **quality gate**: reject blurry, too dark/bright, too small-eye photos with a
      plain-language reason ("this is where 'if the lens is capable' gets checked").
- [ ] 1.5 Store capture metadata (device model, resolution, flash on/off, timestamp).
      *Accept:* two photos taken on different days with the guide look framed alike; bad photos
      are refused with a reason.
- [ ] 1.6 **Light-sensitive capture mode (opening the eyes hurts during an episode, Q17):**
      dark theme and minimum screen brightness on the scan screens; no flash and no bright white
      overlay; hands-free shutter (countdown timer and/or volume-button) so the owner doesn't need
      to look at the screen; a **short optional "open on the beep" attempt** — the owner opens
      only for the instant of capture, can skip or cancel at any time, and is never pushed to
      keep trying if it hurts; **eyes-closed capture is always acceptable** (eyelid swelling,
      crusting, discharge still visible); one-tap "too painful to open" with a pain /
      light-sensitivity rating recorded alongside.
- [ ] 1.7 Two quality-gate profiles: **eyes-open** (baseline/healthy: strict framing, sharpness,
      lighting) and **eyes-closed** (episode: only blur/size checks). The gate must never block
      a scan the owner can barely take — it can warn, not refuse, in episode mode.
      *Accept:* an owner in a dim room with eyes closed can complete a scan in a few taps.

### Phase 2 — Condition profile & timeline
*Goal: the app knows what you are tracking and shows real data.*

Decisions needed first: ~~Q2~~, ~~Q3~~ (answered), Q10.

- [ ] 2.1 Data model (**local SQLite tables**, mirrored to Firestore only when the owner shares):
      conditions (name, start date, notes, status `active` | `resolved`, optional
      doctor-confirmed type); episodes; scans (per eye, linked to a condition/episode). The
      condition's **type is empty until a doctor confirms it** (D1).
- [ ] 2.2 Condition setup screen (create / pick / mark resolved). Defaults to "Conjunctivitis"
      with start date and which eye(s).
- [ ] 2.3 History/timeline screen — **daily** view (one row per day, missed days visible),
      filter by condition and eye.
- [ ] 2.4 Replace hard-coded Home (P7) with real day count since onset, last scan, whether
      today's scan is done.
- [ ] 2.2b **Episodes:** a condition can have several episodes (this is the 4th+). Let the owner
      add **past episodes** (month-level dates allowed, doctor-confirmed type if known,
      medication, outcome), pre-filled with the four in §2.1. Timeline can show episodes side by
      side and the gap between them.
- [ ] 2.2f **Per-eye records:** each scan stores a left and a right entry (Q12), so one eye can
      be "clearer" than the other and that is visible in trends.
- [ ] 2.2c **Trigger journal** (optional, quick): possible exposures/habits per day, e.g. contact
      with someone who has red eyes, eye rubbing, new cosmetics, dust/pollen, poor sleep, long
      screen time, seasonal change. Lists to be chosen with the owner/clinic, not assumed — a sourced candidate list of 10 now exists in the reference (`riskFactorsAndTriggers`) for the owner/clinic to prune or extend. Goal is
      pattern-spotting for the clinic, not claiming a cause.
- [ ] 2.2d **Medication log:** what the clinic prescribed, start/stop dates, doses taken —
      recorded as the owner enters it; the app gives no medication advice.
- [ ] 2.2e **Two modes (Q13 = yes):** *healthy* = **weekly** baseline photo + short symptom
      check; *episode* = **daily** scans. The owner switches to episode mode when symptoms
      start, and the app can suggest it (never decide it) if a baseline scan or symptom check
      looks different from the owner's normal. Starts today in healthy mode.
- [ ] 2.5 Daily symptom log alongside the photo, using the D7 reference ids (discharge, itching,
      grittiness, light sensitivity, pain, vision change, crusting on waking, contact-lens use,
      one eye vs. both), with simple severity ratings (scale to agree, D2) and a "too painful
      to open" flag. Structured so it can be charted and shown to a doctor.
      *Accept:* Home and History reflect real stored data (on the device); no placeholder
      values remain.
- [ ] 2.6 **Guided, descriptive symptom entry (Q17 "better clarity"):** instead of one tick-box
      list, short guided questions with plain-language options and a free-text note, e.g.
      pain (how bad 0–10, when — at rest / when opening / in light), light sensitivity (how bad;
      can open easily / with pain / not at all), discharge (none / watery / sticky / thick; how
      much), lids stuck on waking, swelling, itching/burning/grittiness, vision (clear / blurry),
      which eye(s), and what changed since yesterday. **Exact options and wording come from the D7
      sources / pilot clinic, not from me** (a draft set now exists in the reference, e.g. discharge colour white / yellow / green from NEI), and are neutral — they describe, they never name a
      condition type.
- [ ] 2.7 **Plain-language condition summary:** generated from the logged data by fixed
      templates (not free AI prose), in the owner's chosen language, readable by the owner and a
      doctor: what is happening in each eye, since when, how it changed, what was taken. It is
      the main content of the visit summary (4.1) and the basis for the doctor-type
      recommendation (5.2). *Accept:* a non-expert can read it and a clinician finds it unambiguous.

### Phase 3 — Comparison & trend analysis
*Goal: answer "is it getting better or worse?"*

Decisions needed first: ~~D1~~, ~~D2~~, ~~Q9~~ (all decided), D7 (reference content still to be sourced).

- [~] 3.0 **Draft v0.1 written** (`reference/conjunctivitis/`); still needs clinical review. Build the D7 conjunctivitis reference (sourced, versioned) and have it clinically
      reviewed if possible (Q11). Everything below cites it. Datasets in
      `reference/datasets/` serve as visual examples and a sanity-check set only.
- [ ] 3.1 Side-by-side + slider comparison of any two scans.
- [ ] 3.2 Measures per D2: self-ratings, eyes-closed/eyes-open photo features, opt-in AI pair
      comparison, and on-device colour metric for qualifying eyes-open photos — each shown
      separately with its confidence, stored per scan/eye.
- [ ] 3.3 Trend chart over time (per condition, per eye) with confidence indication.
- [ ] 3.4 AI "what changed since last scan" output as **structured references to D7 items**
      (observation, which photos/day, confidence), shown to the patient *and* in the clinician
      view, always labelled **AI-assisted · non-diagnostic**. No severity or diagnosis label until
      a doctor confirms (D1). Runs **only when the owner taps "Analyse"** and accepts the consent
      text (D3); never automatically.
- [ ] 3.5 Red-flag logic reviewed and unit-tested; independent of AI. Expand beyond today's five
      to cover conjunctivitis-relevant warning signs (e.g. significant pain, reduced vision,
      marked light sensitivity, contact-lens wearer with a red painful eye, a newborn) — **exact
      list to be taken from the D7 sources / clinician, not decided by me**. The draft reference covers pain, light sensitivity, vision changes and very red eye (NHS/NEI/MedlinePlus) but **not** the five emergency flags already in the code (chemical exposure, injury, sudden vision loss…) — those still need sources.
- [ ] 3.6 Doctor-confirmation flow: when a doctor confirms the condition type/severity, it appears
      as "Confirmed by Dr X on date" and is visually distinct from AI-assisted content.
      *Accept:* with a known set of test photos, direction of change (better/same/worse) matches a
      manual judgement; every AI text shows the disclaimer.

### Phase 4 — Share history with a doctor
*Goal: "doctors understand me better at the appointment."*

Decisions needed first: ~~Q4~~ (partly), ~~D4~~ (owner-initiated sharing; file/PDF first).

- [ ] 4.0 **Pilot with the owner's clinic:** take the visit summary (PDF/link) to the next real
      appointment and ask the clinician what they'd actually want on it, whether the D7
      reference reads correctly, and whether the doctor-confirmation step (3.6) fits how they
      work. Record their feedback in §8 before building more.
- [ ] 4.1 Visit summary: timeline, key photos, symptom log, trend — generated **on the phone**
      and sent as a PDF/file via the Android share sheet (no server, $0). Optional later: a
      time-limited, revocable link. The owner chooses what goes in (e.g. leave out photos).
- [ ] 4.2 (If D4 = per-clinic access) patient grants/revokes a clinic; rules scoped to granted
      clinics only (fixes P5).
- [ ] 4.3 Clinic dashboard: per-patient **timeline view** (not just a review queue); doctor notes
      attach to the timeline; audit who viewed/changed what.
      *Accept:* a doctor with a share link/grant sees the history; without it, nothing; revoking
      works.
- [ ] 4.4 **Return path for a doctor's confirmation (open design question):** how does "Confirmed
      by Dr X" reach the phone? Option A: the owner records it in the app (clinic name, date,
      what was said) → shown as *"entered by patient"*. Option B: confirmed through the clinic
      dashboard on a shared record → shown as *"verified by clinic"*. The two must look
      different. Decide with the pilot clinic (4.0).

### Phase 5 — AI-assisted doctor matching & booking
*Goal: "AI helps set up the booking."*

Decisions needed first: ~~Q5~~ (Malaysia), ~~Q7~~, ~~Q8~~, ~~D5~~, ~~D6~~ (all decided).

- [ ] 5.1 Facility directory data model (clinics, hospitals, medical centers; their doctors and
      specialties, address, contact, how they accept bookings) populated from an
      owner-curated, owner-verified list (Q8), starting with the owner's own clinic.
- [ ] 5.2 **Doctor-type recommendation (D6):** from the patient's own record (2.7 summary,
      episode count, doctor-confirmed info) → suggested kind of doctor/facility, shown **with
      reasons**; mapping from published guidance / pilot clinic; patient can ignore it and pick
      anyone. Emergency routing is separate and rule-based.
- [ ] 5.3 Browse/filter doctors; patient picks.
- [ ] 5.4 Booking request: preferred times + attached visit summary → `appointments`.
- [ ] 5.5 Clinic side: see requests, confirm/decline/propose time; patient sees status.
- [ ] 5.6 **Roles and calendar booking (Q7):** separate **doctor** (can confirm a diagnosis, D1)
      from **clinic admin** (manages requests and the booking calendar) in the custom claims;
      calendar booking only for clinics whose admins opt in.
      *Accept:* end-to-end request → confirmation, with the patient always the one who sends.

### Phase 6 — Reminders & notifications

- [ ] 6.1 **Daily** scan reminder in episode mode, **weekly** in healthy mode (local
      notifications first). Xiaomi/HyperOS battery
      optimisation often delays or kills scheduled notifications — needs a test on the real
      phone, and possibly an in-app prompt guiding the user to allow background/autostart.
- [ ] 6.2 Appointment confirmations/reminders. Note: remote push needs a **development build** (not
      Expo Go) on modern SDKs — confirm before promising it.

### Phase 7 — Hardening before anyone else uses it

- [ ] 7.1 Private storage and signed/expiring access for anything that *is* shared (P3).
- [ ] 7.1b **Backup / restore / device migration** (local-first risk): an encrypted export file
      the owner can save wherever they choose, and import on a new phone. *Accept:* wipe the app,
      restore, history intact.
- [ ] 7.2 Consent text, privacy policy, data export and **delete-my-data**; a **separate,
      revocable training consent** (D8) that is off by default.
- [ ] 7.3 Tests: rules tests, red-flag unit tests, Worker tests.
- [ ] 7.4 Error/offline handling (scan queued when offline; retry AI step — currently a failed AI
      call just leaves `processing`).
- [ ] 7.5 Review regulatory exposure in **Malaysia** (Q5) before any wider release: PDPA 2010
      for health data, and whether the Medical Device Authority treats this as a medical device.
      Needs a qualified source/adviser — not decided here.

---

## 7. Risks & honest limits

- A phone photo shows **external** signs (redness, discharge, lid swelling, clouding). It cannot
  assess the retina, eye pressure or vision loss. The app must say so and must never reassure
  where it cannot know.
- LLM "scores" can drift between photos; trend claims need pairs, fixed framing, and confidence.
- Free tiers (Gemini rate limits, Cloudinary, Workers) can change; keep services behind thin
  wrappers (`aiPipelineService`, `cloudinaryService`) so they can be swapped.
- Booking/clinic data does not exist yet and is the biggest unknown (Q4, Q8).
- **Light sensitivity and pain limit photos:** exactly when an episode is worst, opening the eyes
  hurts, so photo-based comparison will have gaps. Self-ratings, eyelid photos and the clear
  written description fill them (D2, 2.6–2.7). The app must never make the owner keep
  trying to take a photo that hurts.
- **Severe light sensitivity may itself be a warning sign** (alongside pain or reduced vision).
  The exact rule must come from the D7 sources / clinician, and the app must not just keep
  asking for scans when that rule fires — it should point the owner to the clinic.
- **Local-first = single copy.** Without a backup (7.1b), a lost or reset phone loses the history.

---

## 8. Decision log

Record every decision here with date and reason. Empty until the owner answers §4–§5.

| Date | Decision | Reason |
|---|---|---|
| 2026-10-25 | Scope is personal-use first; clinics/doctors second; AI assists booking | Owner statement |
| 2026-10-25 | Platform: Android (Xiaomi). Condition: conjunctivitis. Cadence: daily scans | Owner answers Q1–Q3 |
| 2026-10-25 | D1: AI shows referenceable/verifiable observations labelled "AI-assisted · non-diagnostic"; no severity or condition label until a doctor/specialist confirms | Owner decision |
| 2026-10-25 | D7 added: AI observations must map to a curated, sourced symptom reference so they can be verified | Follows from D1 |
| 2026-10-25 | Q9 confirmed: AI never names viral/bacterial/allergic; doctor confirms the type | Owner decision |
| 2026-10-25 | Goal 4 added: track recurrence (4 prior episodes), triggers and early signs. No contact lenses (spectacles). | Owner answer Q10 |
| 2026-10-25 | D8 (proposed): public datasets are not used for training; at most a sanity-check test set. Owner's own doctor-confirmed episodes are the real ground truth | Datasets are web-scraped / SMOTE-synthetic / small / not phone photos; training a classifier = diagnosis |
| 2026-10-25 | Q12–Q14: both eyes (per-eye data model); weekly baseline when healthy, daily during an episode; four past episodes recorded in §2.1 (Jan 2025, Aug 2025, Feb 2026, early Sep 2026), all told as conjunctivitis, same treatment each time | Owner answers |
| 2026-10-25 | **D3 decided: local-first.** Data stays on the phone; shared only when the owner allows it in the app or at doctor meetups. Consent per outward flow (AI, sharing, booking, training). See §2.2 | Owner decision |
| 2026-10-25 | Q5 Malaysia; Q6 free / on-device, paid only with explicit OK; Q7 request-based or clinic-calendar booking (request first); Q8 facility directory of specific clinics/hospitals/medical centers (owner's own first) | Owner answers (owner labelled these D5–D8; mapped to Q5–Q8 here) |
| 2026-10-25 | D5 decided via Q7: request-based first, calendar booking where admins support it | Owner answer |
| 2026-10-25 | D8 changed: **no training on public datasets by default**; revisit only for a concrete need that can't be met without training, and only with patients' explicit opt-in consent; still bound by D1 and a regulatory check | Owner decision |
| 2026-10-25 | New fact: owner can't open eyes during light-sensitive episodes → capture must work eyes-closed; D2 becomes multi-signal (self-ratings + photos + opt-in AI + on-device metric). **D2 is a proposal awaiting owner's OK.** | Owner statement |
| 2026-10-25 | **Correction:** the owner can open their eyes during an episode but it hurts (earlier entry said "can't open"). Eyes-closed photos are acceptable. Capture is quick, dim, optional-open | Owner answer Q17 |
| 2026-10-25 | Q15: login only when sharing or booking (proposal: anonymous sign-in for AI use) · Q16: multilingual-compatible from the start (proposal: English + Bahasa Malaysia first) · Q17: clearer, richer condition description (guided entry + plain-language summary) | Owner answers |
| 2026-10-25 | **D2 decided:** multi-signal measurement (self-ratings, photos, opt-in AI pair comparison, on-device metric), shown separately | Owner: yes |
| 2026-10-25 | **D6 decided:** AI recommends the kind of doctor from the patient's specific condition, with reasons; patient decides and sends; emergency routing stays rule-based. ("No" in the answer read as: AI doesn't decide urgency wording itself — to confirm) | Owner answer |
| 2026-10-25 | Confirmed: D6 wording ("No" = AI doesn't decide urgency wording); Q17 reading (richer guided description + plain-language summary); Q15 anonymous sign-in for AI use; Q16 English + Bahasa Malaysia first | Owner answers |
| 2026-10-25 | D7: public datasets may be downloaded and used as **reference** (examples + sanity check), not training and not a clinical authority; images stay out of git/app. Mendeley set `n9zp473wfw` downloaded and inspected; `reference/datasets/` added | Owner decision; inspection findings in `reference/datasets/README.md` |
| 2026-10-25 | **D7 draft v0.1 written** in `reference/conjunctivitis/`: 17 symptom/context items, 10 trigger candidates, 9 self-care tips, 6 candidate contact rules, from four sources (NHS, NEI, two MedlinePlus pages). Not clinician-reviewed. CDC/NICE/StatPearls were unreachable and AAO forbids AI use, so none of those were used | Owner request ("draft the symptom reference first") |
| 2026-10-25 | Owner's existing clinic is the first pilot, via share link/PDF; reference marked "not clinician-reviewed" until that clinic reviews it | Owner answers Q4/Q11 |

---

## 9. Suggested next step

Answered: Q1–Q17, D1, D2, D3, D4 (owner-initiated sharing), D5, D6, D8 (conditional).

All earlier "to confirm" items are confirmed (Q15, Q16, Q17, D6).

Still outstanding (none block starting):
- **D7 clinical review:** the draft reference exists (v0.1); it needs the pilot clinic's review
  (see its README for the checklist and the review log). Open points for the clinic: the
  contact-your-clinic thresholds (Q18), recurrence advice, local (Malaysian) practice, and sources
  for the five existing emergency flags.
- **Q18 / Q19** (urgent-contact behaviour; how NHS text may be used).
- **Other datasets:** Kaggle conjunctivitis and Roboflow need the owner's own login to download
  (see `reference/datasets/README.md`); optional.

**Start Phase 0 in this order** (safety and architecture before features):
1. 0.1–0.2 Align docs with SDK 54; confirm the current app runs on the Xiaomi (baseline).
2. 0.3–0.4 Local-first storage; stop automatic upload.
3. 0.10–0.11 Optional login; multilingual foundation.
4. 0.5–0.9 Rules and Worker fixes for the shared path; stateless AI call; consent text.

Then **Phase 1** (light-sensitive capture on the Xiaomi). The D7 reference (3.0) can be drafted
in parallel since it needs research and ideally clinician review.
