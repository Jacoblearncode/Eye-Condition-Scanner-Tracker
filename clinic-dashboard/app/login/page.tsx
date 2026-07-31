'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, initializing } = useAuthContext();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initializing && user) router.replace('/dashboard');
  }, [initializing, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>EyeChecker Clinic</h1>
        <p className="subtitle">
          {mode === 'signin' ? 'Sign in to review patient scans' : 'Create a clinic staff account'}
        </p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
        {mode === 'signup' && (
          <p className="hint">
            New accounts aren&apos;t authorized to view patient data until an admin grants clinic
            access — see ../ai-pipeline/README.md.
          </p>
        )}
      </form>
    </main>
  );
}
