'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeToPendingScans, type ScanDetail } from '@/lib/scans';

const STATUS_LABEL: Record<string, string> = {
  processing: 'Processing',
  ai_analyzed: 'Ready for review',
  ai_failed: 'AI analysis failed — needs manual review',
};

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanDetail[] | null>(null);

  useEffect(() => subscribeToPendingScans(setScans), []);

  if (scans === null) return <p>Loading scans…</p>;
  if (scans.length === 0) return <p>No scans waiting for review.</p>;

  return (
    <ul className="scan-list">
      {scans.map((scan) => (
        <li key={`${scan.patientId}/${scan.id}`}>
          <Link href={`/dashboard/${scan.patientId}/${scan.id}`} className="scan-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scan.photoUrl} alt="Scan thumbnail" />
            <div>
              <p className="status">{STATUS_LABEL[scan.uploadStatus] ?? scan.uploadStatus}</p>
              <p className="symptoms">
                {scan.symptoms.length ? scan.symptoms.join(', ') : 'No symptoms reported'}
              </p>
              {scan.aiAnalysis?.aiSeverityHint && (
                <p className="ai-hint">AI hint: {scan.aiAnalysis.aiSeverityHint}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
