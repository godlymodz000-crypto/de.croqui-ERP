import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { ApiError } from '../../api/http';
import { presentationsApi, type PresentationWithData } from '../../api/presentations';
import { projectsApi, type Project } from '../../api/projects';
import '../budgets/budgets.css';

export const NAME_MESSAGES: Record<string, string> = {
  required: 'Dê um nome à apresentação para criá-la.',
  too_long: 'Use um nome com até 120 caracteres.',
};

export const HINT_AVULSA =
  'Fica em Apresentações, na aba Sem projeto, com a sua própria biblioteca de imagens. Depois é possível vincular a um projeto; as imagens e o PDF vão junto.';
// Texto do painel aberto no projeto (6b-03), sem a localização: o cadastro do projeto não tem esse campo.
export const HINT_PROJETO =
  'A apresentação fica no projeto e em Apresentações, na aba Por projeto. Nome do projeto e cliente são copiados como texto editável; mudar o cadastro depois não altera a apresentação.';

// Aberto pela página do projeto (6b-03): o projeto vem escolhido e não muda.
export const HINT_DO_PROJETO = `Aberto a partir do projeto. ${HINT_PROJETO}`;

/**
 * Painel "Nova apresentação" (desenho 6b-02). Nome obrigatório; projeto opcional, começando em
 * "Sem projeto (avulsa)". A apresentação nasce só com a capa, sem textos nem imagens de exemplo.
 * Com `project` (página do projeto, 6b-03), o campo Projeto vem preenchido e travado.
 */
export function NewPresentationPanel({
  project,
  onClose,
  onCreated,
}: {
  project?: Pick<Project, 'id' | 'name' | 'clientName'>;
  onClose: () => void;
  onCreated: (p: PresentationWithData) => void;
}) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(project?.id ?? '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    formRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    // Sem a lista, a apresentação ainda pode ser criada como avulsa. Aberto no projeto, a lista não é usada.
    if (!project) projectsApi.list().then(setProjects, () => setProjects([]));
  }, [project]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setNameError('required');
      return;
    }
    setNameError(null);
    setSaving(true);
    setFailure(false);
    try {
      onCreated(await presentationsApi.create({ name: clean, projectId: projectId || null }));
    } catch (err) {
      if (err instanceof ApiError && err.fields.name) setNameError(err.fields.name);
      else if (err instanceof ApiError && err.fields.projectId && !project) {
        // O projeto foi excluído enquanto o painel estava aberto: volta para avulsa e recarrega a lista.
        setProjectId('');
        projectsApi.list().then(setProjects, () => setProjects([]));
        setFailure(true);
      } else setFailure(true);
    } finally {
      setSaving(false);
    }
  }

  const options = [
    { value: '', label: 'Sem projeto (avulsa)' },
    ...projects.filter((p) => p.status === 'active').map((p) => ({ value: p.id, label: `${p.name} · ${p.clientName}` })),
  ];
  const hint = project ? HINT_DO_PROJETO : projectId ? HINT_PROJETO : HINT_AVULSA;

  return (
    <aside className="side-panel" aria-labelledby="presentation-panel-title">
      <form ref={formRef} className="side-panel__form" onSubmit={submit} noValidate>
        <div className="side-panel__top">
          <h2 id="presentation-panel-title" className="side-panel__title">
            Nova apresentação
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <p className="side-panel__intro">
          A apresentação começa só com a capa, sem textos nem imagens de exemplo. Você preenche tudo no editor.
        </p>

        <Input
          label="Nome da apresentação · obrigatório"
          variant="box"
          value={name}
          error={nameError ? NAME_MESSAGES[nameError] : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError && e.target.value.trim()) setNameError(null);
          }}
        />

        {project ? (
          // Mesmo campo fixo do orçamento aberto no projeto (budgets.css).
          <div className="budget-panel__fixed">
            <span className="budget-panel__label">Projeto</span>
            <span className="budget-panel__value">
              {project.name} · {project.clientName}
            </span>
            <p className="side-panel__hint">{hint}</p>
          </div>
        ) : (
          <div>
            <Select label="Projeto" variant="box" options={options} value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <p className="side-panel__hint">{hint}</p>
          </div>
        )}

        <div className="side-panel__spacer" />

        {failure && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>Não foi possível criar a apresentação. O nome preenchido continua aqui.</p>
              <button type="button" className="link-button" onClick={() => submit()}>
                Tentar de novo
              </button>
            </div>
          </div>
        )}

        <div className="side-panel__footer">
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" type="submit" disabled={saving} aria-busy={saving}>
            {saving ? 'Criando' : 'Criar apresentação'}
          </Button>
        </div>
      </form>
    </aside>
  );
}
