// English is the source language. Every other language must have exactly these keys
// (enforced by the compiler through `typeof en`, and by tests/i18n.test.ts).
// Symptom ids and red-flag ids are stored/used in code; only the text here is shown.
export const en = {
  common: {
    done: 'Done',
    back: 'Back',
  },
  disclaimer:
    "This app is a recovery progress aid and does not replace medical diagnosis. Always follow your doctor's advice.",
  onboarding: {
    title: 'Before you start',
    languageLabel: 'Language',
    // PLACEHOLDER consent wording: accurate for the on-device design (PLAN.md D3) but NOT yet
    // reviewed against Malaysia's PDPA and no privacy policy exists yet (PLAN.md 0.9, 7.2).
    body:
      "EyeChecker keeps your eye photos, symptom reports and recovery timeline on this phone. Nothing is sent to anyone unless you choose to share it. This is a progress aid only — it does not replace your doctor's diagnosis or advice.",
    consent: 'I understand how my information is kept and I agree to continue',
    continue: 'Continue',
  },
  home: {
    greeting: 'Hello',
    // PLACEHOLDER values: still hard-coded, to be replaced with real data (PLAN.md P7 / 2.4).
    statusLabel: 'Recovery Status',
    status: 'On Track',
    statusDetail: 'Day 12 · Expected recovery: 2 weeks remaining',
    scan: 'Scan',
    settings: 'Settings',
  },
  scan: {
    permission: 'We need camera access to take your eye photo.',
    grant: 'Grant Permission',
    retake: 'Retake',
    usePhoto: 'Use Photo',
  },
  symptoms: {
    title: 'How are you feeling today?',
    subtitle: 'Select all that apply',
    emergency: 'Emergency symptoms',
    next: 'Next',
    saveFailed: 'Could not save your scan. Please try again.',
    items: {
      redness: 'Redness or pink colouring',
      watering: 'Watery or teary eyes',
      discharge_crusting: 'Thick discharge or crusting',
      itching_burning: 'Itching or burning sensation',
      light_sensitivity: 'Sensitivity to light',
      blurred_vision: 'Blurred or hazy vision',
      lid_swelling: 'Swelling of eyelid',
      foreign_body: 'Foreign body sensation',
    },
  },
  redFlags: {
    sudden_vision_loss: {
      label: 'Sudden loss of vision (partial or full)',
      message: 'Go to the nearest hospital emergency department immediately. Do not wait for an app response.',
    },
    flashing_lights_floaters: {
      label: 'Flashing lights or sudden increase in floaters',
      message: 'Possible retinal detachment — emergency care required.',
    },
    severe_pain_after_injury: {
      label: 'Severe eye pain after injury or impact',
      message: 'Do not rub or press the eye. Seek emergency care.',
    },
    chemical_exposure: {
      label: 'Chemical exposure to the eye',
      message: 'Flush with water for 15 minutes. Call emergency services.',
    },
    sharp_object_injury: {
      label: 'Sharp object injury to the eye',
      message: 'Do not touch or rub. Go to emergency room immediately.',
    },
  },
  redFlagAlert: {
    headline: 'Seek Emergency Care Now',
    call: 'Call Emergency Services',
    hospital: 'Find Nearest Hospital',
    dismiss: 'I understand, continue to app',
  },
  saved: {
    title: 'Scan saved on this phone',
    body: 'Your photo and symptoms were stored only on this device. Nothing was uploaded or sent to anyone.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    languageSystem: 'Use phone language',
  },
};

export type Translations = typeof en;
