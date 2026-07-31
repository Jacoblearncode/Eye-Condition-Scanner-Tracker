'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, role, initializing } = useAuthContext();

  useEffect(() => {
    if (!initializing && !user) router.replace('/login');
  }, [initializing, user, router]);

  if (initializing) return <main className="center">Loading…</main>;
  if (!user) return null;

  if (role !== 'clinic' && role !== 'admin') {
    return (
      <main className="center">
        <div>
          <h1>Access pending</h1>
          <p>
            {user.email} hasn&apos;t been granted clinic access yet. Ask an admin to run the
            bootstrap step in ../ai-pipeline/README.md, then sign out and back in.
          </p>
          <button onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <h1>EyeChecker Clinic Dashboard</h1>
        <div>
          <span className="email">{user.email}</span>
          <button onClick={() => signOut(auth)}>Sign out</button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
