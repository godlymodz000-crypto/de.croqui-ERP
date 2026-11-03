import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { ApiError } from '../../api/http';
import { projectsApi, type Project } from '../../api/projects';
import type { AgendaEvent, EventInput } from '../../api/events';
import { emptyForm, FIELD_MESSAGES, formFrom, formToInput, KINDS, NO_KIND_LABEL, type EventForm } from './agenda';

/** Painel de novo evento e de edição (quadro "novo evento", sem participantes e com dia inteiro). */
export function EventFormPanel({
  event,
  day,
  onClose,
  onSave,
}: {
  event?: AgendaEvent;
  day: Date;
  onClose: () => void;
  onSave: (input: EventInput) => Promise<void>;
}) {
  const editing = !!event;
  const [form, setForm] = useState<EventForm>(() => (event ? formFrom(event) : emptyForm(day)));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isMobile = useIsMobile();
  // Dia inteiro de vários dias (vindo do Google): mostra também o último dia.
  const multiDay = form.allDay && form.endDate !== form.date;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    formRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  // Projetos só quando o painel abre (a lista fica no cache da tela de Projetos).
  useEffect(() => {
    projectsApi.list().then(setProjects, () => setProjects([]));
  }, []);

  const set = <K extends keyof EventForm>(field: K, value: EventForm[K]) => setForm((f) => ({ ...f, [field]: value }));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const parsed = formToInput(form);
    if ('errors' in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setFailed(false);
    setSaving(true);
    try {
      await onSave(parsed.input);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFailed(true);
      setSaving(false);
    }
  }

  const message = (field: string) => (errors[field] ? FIELD_MESSAGES[field]?.[errors[field]] : undefined);
  const projectOptions = [
    { value: '', label: projects ? 'Nenhum' : 'Carregando projetos' },
    ...(projects ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.clientName}` })),
  ];
  // Projeto vinculado que não está mais na lista (excluído): continua como opção para não sumir ao salvar.
  if (event?.projectId && projects && !projects.some((p) => p.id === event.projectId)) {
    projectOptions.push({ value: event.projectId, label: event.projectName ?? 'Projeto vinculado' });
  }

  return (
    <aside className="side-panel" aria-labelledby="event-form-title">
      <form ref={formRef} className="side-panel__form event-form" onSubmit={submit} noValidate>
        <div className="side-panel__top">
          <h2 id="event-form-title" className="side-panel__title">
            {editing ? 'Editar evento' : 'Novo evento'}
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>
        <p className="side-panel__intro">O evento também vai para o Google Agenda do estúdio, sem convite para ninguém.</p>

        <Input label="Título" variant="box" value={form.title} error={message('title')} onChange={(e) => set('title', e.target.value)} />
        <Select
          label="Tipo"
          variant="box"
          value={form.kind}
          options={[{ value: '', label: NO_KIND_LABEL }, ...KINDS]}
          onChange={(e) => set('kind', e.target.value as EventForm['kind'])}
        />
        <Input
          label={multiDay ? 'De' : 'Data'}
          type="date"
          variant="box"
          value={form.date}
          error={message('startsAt')}
          onChange={(e) => {
            const date = e.target.value;
            // Mudar o começo leva o fim junto quando o evento era de um dia só.
            setForm((f) => ({ ...f, date, endDate: f.endDate === f.date || f.endDate < date ? date : f.endDate }));
          }}
        />
        {multiDay && <Input label="Até" type="date" variant="box" value={form.endDate} error={message('endsAt')} onChange={(e) => set('endDate', e.target.value)} />}
        <label className="event-form__check">
          <input type="checkbox" checked={form.allDay} onChange={(e) => set('allDay', e.target.checked)} />
          Dia inteiro
        </label>
        {!form.allDay && (
          <div className="event-form__times">
            <Input label="Horário" type="time" variant="box" value={form.start} onChange={(e) => set('start', e.target.value)} />
            <span className="event-form__until">até</span>
            <Input type="time" variant="box" value={form.end} error={message('endsAt')} onChange={(e) => set('end', e.target.value)} />
          </div>
        )}
        <Input
          label="Local"
          variant="box"
          placeholder="Endereço ou link da reunião"
          value={form.location}
          error={message('location')}
          onChange={(e) => set('location', e.target.value)}
        />
        <Input
          label="Descrição"
          variant="box"
          multiline
          rows={3}
          placeholder="O que levar, o que conferir"
          value={form.description}
          error={message('description')}
          onChange={(e) => set('description', e.target.value)}
        />
        <Select label="Projeto vinculado" variant="box" value={form.projectId} options={projectOptions} onChange={(e) => set('projectId', e.target.value)} />
        {message('projectId') && <p className="event-form__error">{message('projectId')}</p>}

        <div className="side-panel__spacer" />

        {failed && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>Não foi possível salvar o evento. Os dados preenchidos continuam aqui.</p>
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
            {saving ? 'Salvando' : editing ? 'Salvar' : 'Criar evento'}
          </Button>
        </div>
      </form>
    </aside>
  );
}
