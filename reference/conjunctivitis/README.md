# Conjunctivitis symptom reference — DRAFT v0.1 (not clinician-reviewed)

**Status: draft, drafted by an AI from four public web pages, accessed 2026-10-25. No clinician
has reviewed any item.** It must not be shown to a patient as medical guidance until the pilot
clinic (or another clinician) has reviewed it. This is `PLAN.md` **D7**.

What it is for:

- A list the AI must point to. Under D1, AI observations are expressed as references to item
  ids here (e.g. "`sym.redness` looks lower than 3 days ago"), so a person can open the item and
  see which published source it comes from.
- The source for the guided symptom questions (Phase 2.6), the trigger journal (2.2c), the
  hygiene/self-care tips, and the candidate "contact your clinic" rules.

What it is **not**: a diagnosis tool. It never names viral / bacterial / allergic and never
assigns a severity (D1/Q9). Rules only produce an advice-to-contact message.

Files: `conjunctivitis.json` (the data) · `validate.py` (structure check) · this README.
Run `python validate.py` — it confirms every entry has a source and that no rule or label drifts
into diagnosis. It **cannot** tell whether a claim is medically right; a human must.

## Sources used

| Id | Source | Date on page | Reuse terms |
|---|---|---|---|
| S1 | [NHS — Conjunctivitis](https://www.nhs.uk/conditions/conjunctivitis/) | reviewed 23 Apr 2024, next review 23 Apr 2027 | Open Government Licence v3.0 **with NHS conditions** (see below) |
| S2 | [NEI (NIH) — Pink Eye](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/pink-eye) | updated 5 Nov 2025 | US government page; confirm reuse notice before copying |
| S3 | [MedlinePlus Medical Encyclopedia — Conjunctivitis or pink eye](https://medlineplus.gov/ency/article/001010.htm) | review date 9 Jul 2024 | A.D.A.M. content; cite and paraphrase only |
| S4 | [MedlinePlus — Pink Eye](https://medlineplus.gov/pinkeye.html) | — | NIH summary; confirm reuse notice |

Everything in the JSON is **paraphrase plus very short quotes (validator limit: 15 words)**.
These are patient-information pages, not clinical guidelines.

### Sources I wanted but could not use

| Source | Why not |
|---|---|
| CDC conjunctivitis pages | The site blocks automated access (HTTP 403); I did not try to work around it |
| NICE CKS (clinician guidance) | Same (403) |
| StatPearls (NCBI Bookshelf) | Captcha |
| American Academy of Ophthalmology pages | The site states its content may not be copied or put into AI systems without permission, so I used none of it |
| Any Malaysian source | None gathered — see gaps |

These are the most useful additions: **clinician-level** criteria (when to refer, how types
differ) are missing. The clinic can supply them or point to the guidance they follow.

## Reading guide: what is in each section of the JSON

- `items` — symptoms and context (17). Each has a language-neutral id, English label, the plain
  question the app would ask (`askEn`), who can report it (`reportedBy`), and
  `photoVisibleByApp` (**my design judgement**, not from a source: only redness, watering,
  discharge, crusting, lid swelling, very red eye, and laterality can plausibly be seen in a
  photo; the AI may only comment on those).
- `riskFactorsAndTriggers` — candidate trigger-journal entries (10), all from sources.
- `courseAndDuration`, `selfCareAndHygiene` — typical course; non-medication tips (hands, linen,
  glasses, makeup, lid cleaning, compresses). **No drug advice anywhere.**
- `actionRulesCandidates` — six proposed "contact your clinic" rules, all marked
  `proposed-needs-clinician-decision`.
- `gapsAndOpenQuestions` — what is missing or unsure, in the file itself so it can't be missed.

## Things the sources disagree on (kept, not smoothed over)

1. **Pain and light sensitivity.** NHS lists *any* eye pain or sensitivity to light as **urgent**
   ("ask for an urgent GP appointment or get help from NHS 111… can be signs of a more serious
   eye problem"). NEI and MedlinePlus are more conditional (a lot of / severe / worsening pain;
   blurry vision or light sensitivity that **doesn't improve after wiping away discharge**).
2. **How long to wait.** NHS: see a GP if not cleared **within 7 days**. NEI: not better **after a
   few days** or getting worse. MedlinePlus: symptoms **longer than 3 or 4 days**. Typical
   course: NHS "a couple of weeks"; NEI "7 to 10 days".
3. **Compresses.** NHS: cold flannel to cool the eyes. MedlinePlus: *warm* compress for crusty
   lids, *cool* for allergic. Both kept with their stated purpose.

## Why this matters for the owner specifically

- You get light sensitivity and pain on opening your eyes during episodes. Under NHS wording
  that is an **urgent-contact** sign, so `rule.contact_urgently` would fire in every episode.
  The app should therefore say something like "contact your clinic today" and offer to share
  your summary or request a booking, and not stay silent or just keep asking for scans. **What
  exactly it says and when is for your clinic to decide.**
- The sources say nothing about **recurrence** (four episodes, roughly 6–7 months apart). The
  reference deliberately makes **no claim** about why it keeps coming back or how to stop it.
  That is the most valuable question to take to the clinic.
- S2 says the cause is hard to tell from symptoms because they're usually the same, which is
  why the app never infers the type.

## How to review (for the clinic)

For each section ask:

1. **Is each item correct for how you see conjunctivitis in practice here?** Mark wrong, missing
   or misleading ones.
2. **The six rules:** what should the app tell a patient with pain / light sensitivity, and
   after how many days of no improvement? Which should be "contact today" vs "contact soon"?
3. **Wording and options:** is the discharge colour list (white / yellow / green), the pain and
   light-sensitivity questions, and the self-care tips acceptable to show to patients?
4. **Gaps:** recurrence advice, signs that need an eye specialist, anything missing for
   Malaysia.
5. **Sign-off:** record reviewer, date and changes below; only then change `meta.status` in the
   JSON.

### Review log

| Date | Reviewer | Scope | Outcome |
|---|---|---|---|
| — | — | — | Not yet reviewed |

## Licence notes (not legal advice — settle before anyone beyond the owner uses the app)

- **NHS content (S1)** is under the Open Government Licence v3.0, but the NHS's own terms add
  conditions. Unchanged copies need the attribution "Information from the NHS website" and
  must be kept fresh. **Adapted** content must instead carry "Contains public sector information
  licensed under the Open Government Licence v3.0" and the terms say not to credit the NHS as the
  source of adapted text. They also say **translation counts as an adaptation**, and that an
  adaptation may invalidate the content's clinical approval, with the risk on the user. This
  sits awkwardly with D7's aim of showing a verifiable source, and with the Bahasa Malaysia plan.
  Options: (a) link to the NHS page instead of reproducing it, (b) base patient-facing text on the
  NIH sources and use the NHS only to cross-check, or (c) ask the NHS for permission.
  **Recommended: (a) + (b).** The terms also say not to imply NHS endorsement.
- **NEI/NIH, MedlinePlus (S2–S4)**: US government sites, but S3's text comes from A.D.A.M.
  Confirm each site's reuse notice before reproducing sentences; this draft only paraphrases.
- The reference is information, not a medical device. Under D1 it must stay that way (see
  `PLAN.md` 7.5 for the Malaysian regulatory check).
