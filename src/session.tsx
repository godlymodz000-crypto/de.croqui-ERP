import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cached, clearCache } from './api/http';

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
    // Uma busca por carga da página; a sessão não muda sem recarregar (entrar e sair recarregam).
    cached('me', Infinity, async () => {
      const res = await fetch('/api/me', { credentials: 'same-origin' });
      return res.ok ? ({ status: 'authenticated', user: await res.json() } as const) : ({ status: 'anonymous' } as const);
    })
      .then((next) => !cancelled && setState(next))
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
  clearCache();
  window.location.assign('/entrar');
}
