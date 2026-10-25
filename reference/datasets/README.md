# Reference datasets (reference use only — not for training)

Owner decision (see `PLAN.md` D7/D8): public eye-image datasets may be downloaded and used as
**reference**. They are **not** used to train a model, and the images are **never committed to
this repo or shipped inside the app** (`data/` is git-ignored). Reasons are below.

Reference use means:

1. **Looking at examples** of how conjunctivitis-labelled photos can differ (redness pattern,
   crusting, discharge, lid swelling) to help design the symptom reference (D7) and the guided
   questions (Phase 2.6).
2. A small **sanity-check set** for AI observations (does the observation text match what a
   person sees?).

It does **not** mean the datasets are a clinical authority. D7 items still need citations to
published guidance and, ideally, review by the pilot clinic.

## What is here

### 1. Mendeley — Image Dataset on Eye Diseases Classification (downloaded and inspected)

- Link: <https://data.mendeley.com/datasets/n9zp473wfw> · DOI 10.17632/n9zp473wfw.2 (v2, 12 Dec 2024)
- Authors: Marzia Ahmed, Abu Kowshir Bitto — Daffodil International University
- License: **CC BY 4.0** (credit required). The license text itself notes that further permission
  may be needed for content that belongs to a third party.
- Fetch: `python fetch_mendeley.py` (this folder; stdlib only; resumable; verifies SHA-256).
  ~46 MB for everything; `--classes Conjunctivitis Normal` for a subset.
- Credit line to keep with any use: *Marzia Ahmed, Abu Kowshir Bitto. "Image Dataset on Eye
  Diseases Classification (Uveitis, Conjunctivitis, Cataract, Eyelid) with Symptoms and SMOTE
  Validation", Mendeley Data, V2, doi:10.17632/n9zp473wfw.2 — CC BY 4.0.*

What I measured after downloading (2026-10-25; all 2,298 images matched their published checksums):

| Class | Images | Median size (px) | Images under 300 px wide | Files named `aug_…` |
|---|---|---|---|---|
| Conjunctivitis | 357 | 349 × 252 | 45 | 39 |
| Normal | 649 | **56 × 56** | 649 | 0 |
| Cataract | 544 | 256 × 189 | 382 | 187 |
| Eyelid | 525 | 197 × 162 | 487 | 84 |
| Uveitis | 223 | 265 × 193 | 131 | 30 |

Findings, plainly:

- The authors say the images were **collected from Google searches**, de-duplicated, and
  "checked and corrected" by a professor at an eye hospital. The page also says SMOTE was used to
  balance classes to 649 each; the downloadable files hold the pre-balancing counts (357
  conjunctivitis, etc.), but some files are named `aug_…` (augmented), so a few images are
  not original.
- **Labels are unverified for any individual photo.** Web-sourced images can be mislabelled; I
  am not a clinician and did not re-label anything. Visually the conjunctivitis folder is
  varied: some close-ups of red eyes, some with lids held open or turned out, some with visible
  crusting or discharge, many from clinical settings.
- **The "Normal" class is unusable as a healthy baseline:** tiny 56 × 56 px cropped eye patches
  next to larger, uncropped "conjunctivitis" photos. Any model trained on this would learn image
  size and framing, not disease.
- **Domain mismatch:** these are web/clinic photos, not close-up phone photos taken by the
  patient under home lighting, so they don't predict how the app's photos will look.
- The dataset's symptom text is one line per disease (e.g. conjunctivitis: redness, itching,
  tearing, discharge, crusting of the eyelids). That is a **hint for the reference, not a
  citation** — it needs a proper published source.

### 2. Mendeley — Eye Disease Image Dataset (not downloaded)

- <https://data.mendeley.com/datasets/s9bfhswzjb> · DOI 10.17632/s9bfhswzjb.1 · CC BY 4.0 ·
  Mohammad Riadur Rashid, Shayla Sharmin, Tania Khatun, Md Zahid Hasan, Mohammad Shorif Uddin.
- Mostly **retinal/fundus-type disease images** collected at two eye hospitals (retinitis
  pigmentosa, retinal detachment, glaucoma, diabetic retinopathy… plus pterygium and myopia);
  5,335 originals + 16,242 augmented. Two zips: 1.7 GB original, 2.3 GB augmented.
- A phone camera can't produce those images, so it is **not relevant** to this app and is left
  out. Revisit only if pterygium (external) becomes a tracked condition.

### 3. Not reachable from here (owner can download manually if wanted)

| Dataset | What it is | Why I couldn't fetch it | Notes |
|---|---|---|---|
| Kaggle "Conjunctivitis Dataset" (AliSofiya) | 181 healthy + 177 "infected" external-eye images | Kaggle needs a signed-in account | Check its license on the page before use. "Infected" is not the same as a conjunctivitis type. |
| Roboflow "conjunctivitis" (eyezSmartDet) | 344 images, object-detection boxes | Roboflow Universe returned HTTP 403 from this environment | CC BY 4.0 per its page; boxes, not diagnoses. |
| Figshare "Infectious Keratitis" (slit-lamp) | 3.75 GB clinical slit-lamp images | Not attempted | Not a phone-camera input; not relevant. |
| Kaggle "Ocular Disease" (fundus) | 10,449 retina images | Not attempted | Retina, not external eye; not relevant. |

Download any of these by hand into `data/<name>/` (git-ignored), and add a section here with its
source, license, credit line and what you checked.

## Rules for anyone using this folder

- Keep images out of git, out of the app bundle, and out of any upload to AI services unless
  the license, the images' own rights, and the consent rules in `PLAN.md` allow it.
- Always keep the credit line with anything derived from a CC BY dataset.
- Never present a dataset label as a diagnosis.
