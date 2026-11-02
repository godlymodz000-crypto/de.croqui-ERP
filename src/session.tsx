import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member' | 'viewer';
}

type SessionState = { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; user: SessionUser };

const SessionContext = createContext<SessionState>({ status: 'loading' });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { credentials: 'same-origin' })
      .then(async (res) => {
        if (cancelled) return;
        setState(res.ok ? { status: 'authenticated', user: await res.json() } : { status: 'anonymous' });
      })
      .catch(() => !cancelled && setState({ status: 'anonymous' }));
    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.assign('/entrar');
}
