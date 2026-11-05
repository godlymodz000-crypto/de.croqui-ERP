import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { ApiError } from '../../api/http';
import { budgetsApi, type BudgetWithData } from '../../api/budgets';
import { projectsApi, type Project } from '../../api/projects';
import './budgets.css';

const NAME_MESSAGES: Record<string, string> = {
  required: 'Dê um nome ao orçamento para criá-lo.',
  too_long: 'Use um nome com até 120 caracteres.',
};

/**
 * Painel "Novo orçamento" (quadros "novo orçamento sem nome (erro)" e "novo orçamento no projeto").
 * Aberto em Orçamentos, deixa escolher o projeto ou "Sem projeto (avulso)"; aberto no projeto, o projeto
 * vem escolhido e não muda. O orçamento nasce zerado.
 */
export function NewBudgetPanel({
  project,
  onClose,
  onCreated,
}: {
  project?: Pick<Project, 'id' | 'name' | 'clientName'>;
  onClose: () => void;
  onCreated: (b: BudgetWithData) => void;
}) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(project?.id ?? '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [failure, setFailure] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    formRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => {
    if (project) return;
    // Sem a lista, o orçamento ainda pode ser criado como avulso.
    projectsApi.list().then(setProjects, () => setProjects([]));
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
      onCreated(await budgetsApi.create({ name: clean, projectId: projectId || null }));
    } catch (err) {
      if (err instanceof ApiError && err.fields.name) setNameError(err.fields.name);
      else setFailure(true);
    } finally {
      setSaving(false);
    }
  }

  const options = [
    { value: '', label: 'Sem projeto (avulso)' },
    ...projects.filter((p) => p.status === 'active').map((p) => ({ value: p.id, label: `${p.name} · ${p.clientName}` })),
  ];

  return (
    <aside className="side-panel" aria-labelledby="budget-panel-title">
      <form ref={formRef} className="side-panel__form" onSubmit={submit} noValidate>
        <div className="side-panel__top">
          <h2 id="budget-panel-title" className="side-panel__title">
            Novo orçamento
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>
        <p className="side-panel__intro">O orçamento começa em branco, sem valores nem exemplos. Você preenche tudo no editor.</p>

        <Input
          label="Nome do orçamento · obrigatório"
          variant="box"
          placeholder="Ex.: Proposta inicial"
          value={name}
          error={nameError ? NAME_MESSAGES[nameError] : undefined}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError && e.target.value.trim()) setNameError(null);
          }}
        />

        {project ? (
          <div className="budget-panel__fixed">
            <span className="budget-panel__label">Projeto</span>
            <span className="budget-panel__value">
              {project.name} · {project.clientName}
            </span>
            <p className="side-panel__hint">Aberto a partir do projeto. O orçamento fica no projeto e em Orçamentos, na aba Por projeto.</p>
          </div>
        ) : (
          <div>
            <Select label="Projeto" variant="box" options={options} value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <p className="side-panel__hint">
              {projectId
                ? 'O orçamento fica no projeto e em Orçamentos, na aba Por projeto.'
                : 'Fica em Orçamentos, na aba Sem projeto. Depois será possível vincular a um projeto.'}
            </p>
          </div>
        )}

        <div className="side-panel__spacer" />

        {failure && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>Não foi possível criar o orçamento. O nome preenchido continua aqui.</p>
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
            {saving ? 'Criando' : 'Criar orçamento'}
          </Button>
        </div>
      </form>
    </aside>
  );
}
