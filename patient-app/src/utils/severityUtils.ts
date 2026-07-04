// Rule-based, client-side detection of emergency symptoms.
// Runs BEFORE the AI pipeline — never rely on the AI model to catch these.
// See build guide Section 9.2.

export type RedFlagSymptom =
  | 'sudden_vision_loss'
  | 'flashing_lights_floaters'
  | 'severe_pain_after_injury'
  | 'chemical_exposure'
  | 'sharp_object_injury';

export const RED_FLAG_SYMPTOMS: Record<RedFlagSymptom, { label: string; message: string }> = {
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
};

export function getRedFlagMatch(selectedSymptoms: RedFlagSymptom[]) {
  return selectedSymptoms.find((symptom) => symptom in RED_FLAG_SYMPTOMS) ?? null;
}
