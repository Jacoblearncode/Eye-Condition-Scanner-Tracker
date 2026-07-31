'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type ClinicRole = 'clinic' | 'admin' | null;

type AuthState = {
  user: User | null;
  role: ClinicRole;
  initializing: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, role: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, role: null, initializing: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, initializing: false });
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      setState({ user, role: (tokenResult.claims.role as ClinicRole) ?? null, initializing: false });
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  return useContext(AuthContext);
}
