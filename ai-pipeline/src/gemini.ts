import type { Env } from './env';

export type AiAnalysis = {
  aiSeverityHint: 'normal' | 'follow-up' | 'hospital';
  confidence: number;
  findings: string;
  homeCareSteps: string[];
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    aiSeverityHint: { type: 'STRING', enum: ['normal', 'follow-up', 'hospital'] },
    confidence: { type: 'NUMBER' },
    findings: { type: 'STRING' },
    homeCareSteps: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['aiSeverityHint', 'confidence', 'findings', 'homeCareSteps'],
};

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// aiSeverityHint is the AI's raw internal guess. It is stored under aiAnalysis for the
// clinic dashboard to see alongside the photo, but must never be read by the patient
// app as finalSeverity - only a doctor's explicit finalSeverity should reach the patient.
export async function analyzeEyePhoto(
  photoUrl: string,
  symptoms: string[],
  env: Env
): Promise<AiAnalysis> {
  const photoRes = await fetch(photoUrl);
  if (!photoRes.ok) throw new Error(`Failed to fetch scan photo: ${photoRes.status}`);
  const mimeType = photoRes.headers.get('content-type') ?? 'image/jpeg';
  const imageBytes = new Uint8Array(await photoRes.arrayBuffer());

  const prompt =
    'You are drafting a preliminary triage note for a clinician reviewing a patient-submitted ' +
    'eye photo. This is not a diagnosis and will always be reviewed by a doctor before the ' +
    'patient sees any result. Patient-reported symptoms: ' +
    (symptoms.length ? symptoms.join(', ') : 'none reported') +
    '. Assess the photo and return your best preliminary severity hint (normal, follow-up, or ' +
    'hospital), a confidence score from 0 to 1, a short clinical-style findings note, and 2-4 ' +
    'general home-care suggestions appropriate for the apparent condition.';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, { inlineData: { mimeType, data: toBase64(imageBytes) } }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');

  return JSON.parse(text) as AiAnalysis;
}
