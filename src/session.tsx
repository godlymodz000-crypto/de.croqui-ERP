import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, cached, clearCache, fetchWithTimeout } from './api/http';
import { loadErrorText } from './ui/LoadError';

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
  // Falha que não é "sem sessão" (tempo máximo, sem rede, erro do servidor): não manda para a tela de entrada.
  const [failure, setFailure] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Uma busca por carga da página; a sessão não muda sem recarregar (entrar e sair recarregam).
    cached(
      'me',
      Infinity,
      async (): Promise<SessionState> => {
        const res = await fetchWithTimeout('/api/me', { credentials: 'same-origin' });
        if (res.status === 401) return { status: 'anonymous' };
        if (!res.ok) throw new ApiError(res.status, 'unknown');
        return { status: 'authenticated', user: await res.json() };
      },
      { force: attempt > 0 },
    )
      .then((next) => !cancelled && setState(next))
      .catch((err) => !cancelled && setFailure(err ?? new Error('unknown')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (failure) {
    return (
      <section className="recovery recovery--page" role="alert">
        <h1 className="recovery__title">Não foi possível abrir o ERP</h1>
        <p className="recovery__text">{loadErrorText(failure, 'O servidor não respondeu como esperado.')} Nada foi perdido.</p>
        <button
          type="button"
          className="recovery__button"
          onClick={() => {
            setFailure(null);
            setAttempt((n) => n + 1);
          }}
        >
          Tentar de novo
        </button>
      </section>
    );
  }

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
