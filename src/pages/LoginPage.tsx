import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../ui/ds';
import { AppIcon } from '../ui/AppIcon';
import logo from '../design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
import googleG from '../assets/google-g.svg';

const ERRORS: Record<string, string> = {
  'sem-acesso': 'Esta conta não tem acesso ao sistema. Fale com a administração.',
  falha: 'Não conseguimos concluir a entrada. Tente de novo em instantes.',
  cancelado: 'A entrada com Google foi cancelada. Tente de novo quando quiser.',
};

export function LoginPage() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = loading ? null : ERRORS[params.get('erro') ?? ''];

  // Ao voltar pelo histórico do navegador, a página pode vir do cache ainda em "Entrando...".
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => e.persisted && setLoading(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  function signIn() {
    setLoading(true);
    window.location.assign('/api/auth/google');
  }

  return (
    <main className="login">
      <section className="login__art" aria-hidden>
        <InteriorPlaceholder />
      </section>

      <section className="login__panel">
        <div className="login__content">
          <img className="login__logo" src={logo} alt="De.Croqui" />
          <h1 className="login__title">Seu espaço de trabalho</h1>

          {error && (
            <div className="alert alert--danger" role="alert">
              <span className="alert__icon">
                <AppIcon name="circle-alert" size={18} />
              </span>
              <p>{error}</p>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            disabled={loading}
            aria-busy={loading}
            onClick={signIn}
            style={{ height: 48, ...(loading ? { opacity: 0.62, cursor: 'progress' } : null) }}
          >
            <span className="login__button-label">
              {loading ? <span className="spinner" aria-hidden /> : <img className="login__google" src={googleG} alt="" />}
              {loading ? 'Entrando...' : 'Entrar com Google'}
            </span>
          </Button>

          <p className="login__hint">O acesso é feito apenas por contas autorizadas.</p>
        </div>
      </section>
    </main>
  );
}

/** Ilustração provisória do desenho aprovado, até a foto definitiva. */
function InteriorPlaceholder() {
  return (
    <svg className="login__arch" viewBox="0 0 420 600" role="presentation">
      <defs>
        <clipPath id="arch">
          <path d="M0 210 A210 210 0 0 1 420 210 V600 H0 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#arch)">
        <rect width="420" height="600" style={{ fill: 'var(--linho-200)' }} />
        <rect y="470" width="420" height="130" style={{ fill: 'var(--linho-300)' }} />
      </g>
      <g style={{ stroke: 'var(--latao-500)', strokeWidth: 1, fill: 'var(--linho-100)' }}>
        <path d="M110 360 V190 A100 100 0 0 1 310 190 V360 Z" />
        <path d="M210 90 V360 M110 240 H310" fill="none" />
      </g>
      <rect x="80" y="392" width="220" height="44" rx="1" style={{ fill: 'var(--ardosia-300)' }} />
      <rect x="70" y="436" width="240" height="34" rx="1" style={{ fill: 'var(--ardosia-500)' }} />
      <rect x="332" y="424" width="48" height="3" style={{ fill: 'var(--latao-500)' }} />
      <rect x="354" y="427" width="4" height="43" style={{ fill: 'var(--latao-500)' }} />
      <text x="210" y="522" textAnchor="middle" className="login__art-label">
        Imagem a definir
      </text>
      <text x="210" y="550" textAnchor="middle" className="login__art-caption">
        Ambiente de interior
      </text>
    </svg>
  );
}
