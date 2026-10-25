// Rule-based, client-side detection of emergency symptoms.
// Runs BEFORE the AI pipeline — never rely on the AI model to catch these.
// See build guide Section 9.2.
//
// The text shown for each flag is in src/i18n/locales/*.ts under redFlags.<id> (label, message).
// These ids are the only thing code depends on.

export const RED_FLAG_SYMPTOMS = [
  'sudden_vision_loss',
  'flashing_lights_floaters',
  'severe_pain_after_injury',
  'chemical_exposure',
  'sharp_object_injury',
] as const;

export type RedFlagSymptom = (typeof RED_FLAG_SYMPTOMS)[number];

export function getRedFlagMatch(selectedSymptoms: RedFlagSymptom[]) {
  return selectedSymptoms.find((symptom) => RED_FLAG_SYMPTOMS.includes(symptom)) ?? null;
}
