import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** O que aparece no lugar do trecho que quebrou. */
  fallback: (error: Error) => ReactNode;
  /** Quando muda (por exemplo, a rota), o trecho tenta renderizar de novo. */
  resetKey?: unknown;
  children: ReactNode;
}

/** Segura um erro de renderização para ele não deixar a aplicação inteira em branco. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Erro de renderização', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

/**
 * Tela de recuperação. "Voltar ao início" recarrega a aplicação do zero em /, sem o estado que quebrou.
 * Não usa os componentes do design system: precisa aparecer mesmo se o erro vier deles.
 */
export function RecoveryScreen({ error, fullPage = false }: { error: Error; fullPage?: boolean }) {
  return (
    <section className={`recovery${fullPage ? ' recovery--page' : ''}`} role="alert">
      <h1 className="recovery__title">Algo deu errado</h1>
      <p className="recovery__text">Esta tela não pôde ser exibida. O que já estava salvo no ERP continua salvo.</p>
      <button type="button" className="recovery__button" onClick={() => window.location.assign('/')}>
        Voltar ao início
      </button>
      <details className="recovery__details">
        <summary>Detalhes do erro</summary>
        <code>{error.message || error.name}</code>
      </details>
    </section>
  );
}
