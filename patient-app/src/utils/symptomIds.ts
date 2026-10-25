// Language-neutral ids for the routine symptom choices. These ids are what gets stored with a
// scan (never the displayed text), so a record reads correctly in any language. Text lives in
// src/i18n/locales/*.ts under symptoms.items. Phase 2.6 replaces this list with the structured
// entries tied to the reference (reference/conjunctivitis).
export const ROUTINE_SYMPTOM_IDS = [
  'redness',
  'watering',
  'discharge_crusting',
  'itching_burning',
  'light_sensitivity',
  'blurred_vision',
  'lid_swelling',
  'foreign_body',
] as const;

export type RoutineSymptomId = (typeof ROUTINE_SYMPTOM_IDS)[number];
