import { Fragment, type ReactNode } from 'react';
import logo from '../../design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
import {
  GOOGLE_PERMISSIONS_URL,
  POLICY_INTRO,
  POLICY_SECTIONS,
  POLICY_TITLE,
  POLICY_UPDATED,
  SUPPORT_EMAIL,
} from './policy';

/** O e-mail e o endereço do Google viram links; o texto continua o mesmo. */
function withLinks(text: string): ReactNode {
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escape(SUPPORT_EMAIL)}|${escape(GOOGLE_PERMISSIONS_URL)})`));
  return parts.map((part, i) => {
    if (part === SUPPORT_EMAIL) return <a key={i} href={`mailto:${SUPPORT_EMAIL}`}>{part}</a>;
    if (part === GOOGLE_PERMISSIONS_URL) return <a key={i} href={GOOGLE_PERMISSIONS_URL} rel="noopener noreferrer">{part}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Página pública da Política de Privacidade, aberta sem sessão (o Google a consulta na verificação do app). */
export function PrivacyPage() {
  return (
    <main className="privacy">
      <article className="privacy__content">
        <img className="privacy__logo" src={logo} alt="De.Croqui" />
        <h1 className="privacy__title">{POLICY_TITLE}</h1>
        <p className="privacy__updated">{POLICY_UPDATED}</p>
        <p className="privacy__intro">{POLICY_INTRO}</p>
        {POLICY_SECTIONS.map((s) => (
          <section key={s.heading} className="privacy__section">
            <h2 className="privacy__heading">{s.heading}</h2>
            {s.text && <p className="privacy__text">{withLinks(s.text)}</p>}
            {s.items && (
              <ul className="privacy__list">
                {s.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </main>
  );
}
