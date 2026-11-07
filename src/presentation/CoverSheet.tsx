import type { PresentationProject } from '../shared/presentation-data';
import { coverFields, coverTexts, type CoverMode } from './cover';

/**
 * Capa da apresentação, em A4 deitado (1123 × 794 px), composição "Imagem em arco" na cor vinho
 * (desenhos 6b-04 e 6b-12). Com a Prévia desligada (`edit`), o que falta preencher aparece em cinza e o
 * arco mostra onde vai a imagem; com a Prévia ligada (`print`), a folha fica como sai no PDF.
 * `logoSrc` vem de quem usa: a tela passa o arquivo do Vite; o PDF (E9) passará o arquivo embutido.
 */
export function CoverSheet({ projeto, mode, logoSrc }: { projeto: PresentationProject; mode: CoverMode; logoSrc: string }) {
  const texts = coverTexts(projeto, mode);
  const fields = coverFields(projeto, mode);
  return (
    <div className="pcover" data-mode={mode}>
      <div className="pcover__arch">
        {mode === 'edit' && (
          <>
            <svg className="pcover__window" viewBox="0 0 256.03 883.914" fill="none" aria-hidden>
              <g stroke="currentColor" strokeWidth="1.829" strokeLinecap="round" strokeLinejoin="round">
                <path d="M0 883.914L0 128.015C0 57.314 57.314 0 128.015 0C198.716 0 256.03 57.314 256.03 128.015L256.03 883.914" />
                <path transform="translate(18.288 18.288)" d="M0 865.626L0 109.727C0 49.127 49.127 0 109.727 0C170.328 0 219.454 49.127 219.454 109.727L219.454 865.626" />
                <path transform="translate(18.288 128.015)" d="M0 0L219.454 0M0 10.668L219.454 10.668" />
                <path transform="translate(91.439 91.439)" d="M0 36.576C0 16.376 16.376 0 36.576 0C56.776 0 73.151 16.376 73.151 36.576" />
                <path
                  transform="translate(32.979 18.288)"
                  d="M63.367 91.439L0 54.864M76.748 78.059L40.172 14.691M95.036 73.151L95.036 0M113.324 78.059L149.9 14.691M126.704 91.439L190.072 54.864"
                />
                <path d="M128.015 138.683L128.015 883.914" />
                <path transform="translate(36.576 164.591)" d="M0 176.783L0 9.144C0 3.048 3.048 0 9.144 0L64.008 0C70.103 0 73.151 3.048 73.151 9.144L73.151 176.783Z" />
                <path transform="translate(146.303 164.591)" d="M0 176.783L0 9.144C0 3.048 3.048 0 9.144 0L64.008 0C70.103 0 73.151 3.048 73.151 9.144L73.151 176.783Z" />
                <path transform="translate(36.576 371.853)" d="M0 140.207L0 9.144C0 3.048 3.048 0 9.144 0L64.008 0C70.103 0 73.151 3.048 73.151 9.144L73.151 140.207Z" />
                <path transform="translate(146.303 371.853)" d="M0 140.207L0 9.144C0 3.048 3.048 0 9.144 0L64.008 0C70.103 0 73.151 3.048 73.151 9.144L73.151 140.207Z" />
                <path transform="translate(117.347 335.278)" d="M0 0L0 48.768M21.336 0L21.336 48.768" />
              </g>
            </svg>
            <span className="pcover__dashed" aria-hidden />
            <span className="pcover__pending-image">
              <span className="pcover__pending-title">Imagem da capa pendente</span>
              <span className="pcover__pending-sub">Insira pelo painel · não sai no PDF</span>
            </span>
          </>
        )}
      </div>

      <img className="pcover__logo" src={logoSrc} alt="De.Croqui" />

      <div className="pcover__heading">
        <span className="pcover__type">{texts.tipo}</span>
        {texts.nome && <span className={`pcover__name${texts.nome.pending ? ' is-pending' : ''}`}>{texts.nome.text}</span>}
      </div>
      <span className="pcover__rule" aria-hidden />

      {fields.length > 0 && (
        <dl className="pcover__data">
          {fields.map((f) => (
            <div key={f.key} className="pcover__field">
              <dt>{f.label}</dt>
              <dd className={f.pending ? 'is-pending' : undefined}>{f.text}</dd>
            </div>
          ))}
        </dl>
      )}
      {texts.contato && <span className={`pcover__contact${texts.contato.pending ? ' is-pending' : ''}`}>{texts.contato.text}</span>}
    </div>
  );
}
