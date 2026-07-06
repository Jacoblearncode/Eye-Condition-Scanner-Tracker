import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import type { FinalSeverity } from '../screens/ResultsScreen';

type ScanData = {
  finalSeverity: FinalSeverity;
  doctorNote?: string;
  homeCareSteps?: string[];
};

export function useScan(scanId: string): ScanData {
  const { user } = useAuth();
  const [data, setData] = useState<ScanData>({ finalSeverity: null });

  useEffect(() => {
    if (!user) return;
    const scanRef = doc(db, 'patients', user.uid, 'scans', scanId);
    return onSnapshot(scanRef, (snapshot) => {
      const scan = snapshot.data();
      setData({
        finalSeverity: (scan?.aiAnalysis?.finalSeverity as FinalSeverity) ?? null,
        doctorNote: scan?.doctorNote ?? undefined,
        homeCareSteps: scan?.aiAnalysis?.homeCareSteps ?? undefined,
      });
    });
  }, [user, scanId]);

  return data;
}
