import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { ApiError } from '../../api/http';
import { projectsApi, type Project } from '../../api/projects';
import { folderName } from './shared';

const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  name: {
    required: 'Informe o nome do projeto.',
    too_long: 'Use um nome com até 120 caracteres.',
  },
  clientName: {
    required: 'Informe o nome do cliente.',
    too_long: 'Use um nome com até 120 caracteres.',
  },
  deadline: {
    invalid: 'Confira a data do prazo.',
  },
};

/** Painel lateral de novo projeto e de edição, no mesmo padrão do convite de colaborador. */
export function ProjectPanel({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const editing = !!project;
  const [name, setName] = useState(project?.name ?? '');
  const [clientName, setClientName] = useState(project?.clientName ?? '');
  const [deadline, setDeadline] = useState(project?.deadline ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<'drive' | 'other' | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    formRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'required';
    if (!clientName.trim()) next.clientName = 'required';
    return next;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    setFailure(null);
    const input = { name: name.trim(), clientName: clientName.trim(), deadline: deadline || null };
    try {
      onSaved(editing ? await projectsApi.update(project.id, input) : await projectsApi.create(input));
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFailure(err instanceof ApiError && err.code === 'drive_failed' ? 'drive' : 'other');
    } finally {
      setSaving(false);
    }
  }

  const message = (field: string) => (errors[field] ? FIELD_MESSAGES[field]?.[errors[field]] : undefined);
  const preview = name.trim() && clientName.trim() ? folderName({ name: name.trim(), clientName: clientName.trim() }) : null;

  const failureText =
    failure === 'drive'
      ? editing
        ? 'Não foi possível renomear a pasta no Google Drive, e nada foi alterado. Os dados preenchidos continuam aqui.'
        : 'Não foi possível criar a pasta no Google Drive, e o projeto não foi salvo. Os dados preenchidos continuam aqui.'
      : 'Não foi possível salvar o projeto. Os dados preenchidos continuam aqui.';

  return (
    <aside className="side-panel" aria-labelledby="project-panel-title">
      <form ref={formRef} className="side-panel__form" onSubmit={submit} noValidate>
        <div className="side-panel__top">
          <h2 id="project-panel-title" className="side-panel__title">
            {editing ? 'Editar projeto' : 'Novo projeto'}
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>
        <p className="side-panel__intro">
          {editing
            ? 'Mudar o nome do projeto ou do cliente também renomeia a pasta no Google Drive. Os arquivos continuam nela.'
            : 'Ao salvar, o sistema cria a pasta do projeto no Google Drive, com as subpastas Orçamentos, Apresentações, Contratos e Fotos.'}
        </p>

        <Input
          label="Nome do projeto · obrigatório"
          variant="box"
          placeholder="Ex.: Casa Alecrim"
          value={name}
          error={message('name')}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Nome do cliente · obrigatório"
          variant="box"
          placeholder="Ex.: Helena Prado"
          value={clientName}
          error={message('clientName')}
          onChange={(e) => setClientName(e.target.value)}
        />
        <Input
          label="Prazo"
          type="date"
          variant="box"
          value={deadline}
          error={message('deadline')}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <div className="side-panel__spacer" />

        <p className="side-panel__note">
          {preview ? (
            <>
              Pasta no Google Drive: De.Croqui ERP / Projetos / <strong className="folder-name">{preview}</strong>
            </>
          ) : (
            'A pasta no Google Drive recebe o nome do cliente e do projeto.'
          )}
        </p>

        {failure && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>{failureText}</p>
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
            {saving ? (editing ? 'Salvando' : 'Criando pasta') : 'Salvar'}
          </Button>
        </div>
      </form>
    </aside>
  );
}
