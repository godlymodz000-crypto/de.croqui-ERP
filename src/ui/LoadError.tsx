import { ApiError } from '../api/http';

/** Texto da falha de carga: quando o servidor estoura o tempo máximo, diz isso em vez da mensagem genérica. */
export function loadErrorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.code === 'timeout') return 'O ERP demorou demais para responder.';
  if (error instanceof ApiError && error.code === 'network') return 'Sem conexão com o ERP. Confira a internet.';
  return fallback;
}

/** Falha ao carregar uma lista ou tela, com "Tentar de novo". */
export function LoadError({ error, message, onRetry }: { error?: unknown; message: string; onRetry: () => void }) {
  return (
    <div className="people-table__message load-error" role="alert">
      <p>{loadErrorText(error, message)}</p>
      <button type="button" className="link-button" onClick={onRetry}>
        Tentar de novo
      </button>
    </div>
  );
}
