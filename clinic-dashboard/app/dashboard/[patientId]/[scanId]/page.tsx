'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToScan, submitReview, type FinalSeverity, type ScanDetail } from '@/lib/scans';

const SEVERITIES: FinalSeverity[] = ['normal', 'follow-up', 'hospital'];

export default function ScanReviewPage() {
  const { patientId, scanId } = useParams<{ patientId: string; scanId: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [finalSeverity, setFinalSeverity] = useState<FinalSeverity>('normal');
  const [doctorNote, setDoctorNote] = useState('');
  const [homeCareSteps, setHomeCareSteps] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToScan(patientId, scanId, (data) => {
      setScan(data);
      if (data?.aiAnalysis?.finalSeverity) setFinalSeverity(data.aiAnalysis.finalSeverity);
      else if (data?.aiAnalysis?.aiSeverityHint) setFinalSeverity(data.aiAnalysis.aiSeverityHint);
      setDoctorNote((prev) => prev || data?.doctorNote || '');
      setHomeCareSteps((prev) => prev || (data?.aiAnalysis?.homeCareSteps ?? []).join('\n'));
    });
  }, [patientId, scanId]);

  if (!scan) return <p>Loading scan…</p>;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(
        patientId,
        scanId,
        scan.aiAnalysis,
        finalSeverity,
        doctorNote,
        homeCareSteps
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      );
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={scan.photoUrl} alt="Scan" className="review-photo" />

      <section>
        <h2>Patient-reported symptoms</h2>
        <p>{scan.symptoms.length ? scan.symptoms.join(', ') : 'None reported'}</p>
      </section>

      {scan.aiAnalysis && (
        <section className="ai-panel">
          <h2>AI draft (internal only — never shown to the patient as-is)</h2>
          <p>Severity hint: {scan.aiAnalysis.aiSeverityHint ?? 'n/a'}</p>
          {scan.aiAnalysis.confidence != null && (
            <p>Confidence: {Math.round(scan.aiAnalysis.confidence * 100)}%</p>
          )}
          {scan.aiAnalysis.findings && <p>{scan.aiAnalysis.findings}</p>}
        </section>
      )}

      <form onSubmit={handleSubmit} className="review-form">
        <label>
          Final severity (shown to patient)
          <select value={finalSeverity} onChange={(e) => setFinalSeverity(e.target.value as FinalSeverity)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Doctor&apos;s note (shown to patient)
          <textarea value={doctorNote} onChange={(e) => setDoctorNote(e.target.value)} rows={4} />
        </label>

        <label>
          Home care steps — one per line (shown to patient)
          <textarea value={homeCareSteps} onChange={(e) => setHomeCareSteps(e.target.value)} rows={4} />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          Confirm & send to patient
        </button>
      </form>
    </div>
  );
}
