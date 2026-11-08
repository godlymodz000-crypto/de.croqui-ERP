import { useEffect, useState } from 'react';
import { AppIcon } from '../../ui/AppIcon';
import { presentationsApi, type PresentationWithData } from '../../api/presentations';
import { projectsApi, type Project } from '../../api/projects';
import { LINK_MOVING_TEXT, linkFailureText, linkMoveLines } from './editor';

type Step = { kind: 'choose' } | { kind: 'moving' } | { kind: 'error'; message: string };

/**
 * "Vincular a um projeto" (desenho 6b-10), para a apresentação avulsa. As imagens da avulsa e o PDF mudam de
 * pasta no Drive pela API da E5, numa chamada só: o andamento não tem contagem.
 */
export function LinkProjectDialog({
  presentation,
  images,
  beforeLink,
  onClose,
  onLinked,
}: {
  presentation: PresentationWithData;
  /** Quantas imagens estão na biblioteca da avulsa. */
  images: number;
  /** Salva o que estiver pendente antes de mexer nas pastas. */
  beforeLink: () => Promise<void>;
  onClose: () => void;
  onLinked: () => void;
}) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [projectId, setProjectId] = useState('');
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const moving = step.kind === 'moving';

  useEffect(() => {
    projectsApi.list().then(setProjects, () => setProjects([]));
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !moving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moving, onClose]);

  const active = (projects ?? []).filter((p) => p.status === 'active');
  const project = active.find((p) => p.id === projectId) ?? null;

  async function link() {
    if (!project) return;
    setStep({ kind: 'moving' });
    try {
      await beforeLink();
      await presentationsApi.link(presentation.id, project.id);
      onLinked();
    } catch (err) {
      // Sem resposta, o vínculo pode ter sido feito mesmo assim: confere antes de mostrar o erro.
      const now = await presentationsApi.get(presentation.id).catch(() => null);
      if (now?.projectId) return onLinked();
      setStep({ kind: 'error', message: linkFailureText(err) });
    }
  }

  return (
    <div className="pveil" onMouseDown={(e) => e.target === e.currentTarget && !moving && onClose()}>
      <div className="plink" role="dialog" aria-modal="true" aria-labelledby="plink-title">
        <div className="plibrary__top">
          <div className="plibrary__titles">
            <span className="plibrary__eyebrow">Apresentação nº {presentation.number} · Sem projeto</span>
            <h2 id="plink-title" className="plibrary__title">
              Vincular a um projeto
            </h2>
            <p className="plibrary__text">
              A apresentação passa a ficar no projeto e em Apresentações, na aba Por projeto. Os arquivos mudam de pasta no Drive;
              nada é copiado nem apagado.
            </p>
          </div>
          <button type="button" className="plibrary__close" aria-label="Fechar" disabled={moving} onClick={onClose}>
            ×
          </button>
        </div>

        <label className="plink__field">
          <span className="plink__label">Projeto · obrigatório</span>
          <span className="plink__select-wrap">
            <select className="plink__select" value={projectId} disabled={moving || projects === null} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">{projects === null ? 'Carregando projetos' : 'Escolha o projeto'}</option>
              {active.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.clientName}
                </option>
              ))}
            </select>
            <AppIcon name="chevron-down" size={16} />
          </span>
        </label>

        {step.kind === 'moving' ? (
          <div className="plink__box plink__box--info" role="status">
            <p>{LINK_MOVING_TEXT}</p>
            <span className="plink__progress" aria-hidden>
              <span />
            </span>
          </div>
        ) : step.kind === 'error' ? (
          <div className="plink__box plink__box--danger" role="alert">
            <p>{step.message}</p>
          </div>
        ) : (
          project && (
            <div className="plink__box plink__box--info">
              <span className="plink__box-title">O que muda de pasta</span>
              {linkMoveLines({ projectName: project.name, images, pdfVersion: presentation.pdf?.version ?? null }).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )
        )}

        <div className="plink__actions">
          {moving ? (
            <button type="button" className="pbtn pbtn--solid pbtn--lg plink__busy" disabled>
              Movendo arquivos
            </button>
          ) : (
            <>
              <button type="button" className="pbtn pbtn--text pbtn--lg" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="pbtn pbtn--solid pbtn--lg" disabled={!project} onClick={() => void link()}>
                {step.kind === 'error' ? 'Tentar de novo' : 'Vincular ao projeto'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
