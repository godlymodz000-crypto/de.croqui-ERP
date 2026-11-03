import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { ROLE_LABEL } from '../../api/users';
import { projectsApi, type Project } from '../../api/projects';
import { broadcastsApi, type Audience, type AudienceInfo, type LinkTarget } from '../../api/notifications';

const TITLE_MAX = 120;
const BODY_MAX = 1000;

/** Telas que o comunicado pode abrir. As da administração só valem para envios só a administradores (o servidor confere). */
const PAGES: { value: string; label: string }[] = [
  { value: 'projetos', label: 'Projetos' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'processos', label: 'Processos' },
  { value: 'orcamentos', label: 'Orçamentos' },
  { value: 'apresentacoes', label: 'Apresentação' },
  { value: 'pedidos-de-exclusao', label: 'Pedidos de exclusão' },
  { value: 'colaboradores', label: 'Colaboradores' },
];

const MESSAGES: Record<string, Record<string, string>> = {
  title: { required: 'Informe o título.', too_long: `Use um título com até ${TITLE_MAX} caracteres.` },
  body: { required: 'Escreva o texto do comunicado.', too_long: `Use um texto com até ${BODY_MAX} caracteres.` },
  recipients: {
    required: 'Marque pelo menos uma pessoa.',
    none: 'Ninguém deste grupo está ativo. Escolha outro destino.',
    invalid: 'Alguém da lista não está mais ativo. Feche o painel e abra de novo para atualizar.',
  },
  link: {
    invalid: 'Este item não existe mais. Escolha outro link.',
    admin_only: 'Esta tela é só da administração. Escolha outro link ou envie só para administradores.',
  },
};

const people = (n: number) => (n === 0 ? 'Ninguém' : n === 1 ? '1 pessoa' : `${n} pessoas`);

/** Painel "Novo comunicado" (quadros "ERP · Notificações · 1440 · novo comunicado" e "· 390"). Só administração. */
export function BroadcastPanel({ onClose, onSent }: { onClose: () => void; onSent: (count: number) => void }) {
  const session = useSession();
  const myName = session.status === 'authenticated' ? (session.user.name ?? session.user.email) : '';
  const isMobile = useIsMobile();
  const [info, setInfo] = useState<AudienceInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [audience, setAudience] = useState<Audience>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    broadcastsApi.audience().then(setInfo, () => setFailed(true));
    projectsApi.list().then(setProjects, () => {});
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    formRef.current?.querySelector('input')?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const count = useMemo(() => {
    if (!info) return 0;
    return audience === 'people' ? selected.length : info.counts[audience];
  }, [info, audience, selected]);

  const linkOptions = [
    { value: '', label: 'Nenhum' },
    ...PAGES.map((p) => ({ value: `page:${p.value}`, label: `Tela · ${p.label}` })),
    ...projects.map((p) => ({ value: `project:${p.id}`, label: `Projeto · ${p.name}` })),
  ];
  const linkLabel = linkOptions.find((o) => o.value === link && o.value)?.label.split(' · ')[1];

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'required';
    else if (title.trim().length > TITLE_MAX) next.title = 'too_long';
    if (!body.trim()) next.body = 'required';
    else if (body.trim().length > BODY_MAX) next.body = 'too_long';
    if (audience === 'people' && !selected.length) next.recipients = 'required';
    else if (info && count === 0) next.recipients = 'none';
    return next;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;
    const [kind, value] = link.split(':');
    const target: LinkTarget = !link ? null : kind === 'project' ? { kind: 'project', projectId: value } : { kind: 'page', page: value };
    setSending(true);
    setFailed(false);
    try {
      const res = await broadcastsApi.send({
        audience,
        ...(audience === 'people' ? { userIds: selected } : {}),
        title: title.trim(),
        body: body.trim(),
        link: target,
      });
      onSent(res.recipientCount);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setFailed(true);
    } finally {
      setSending(false);
    }
  }

  const message = (field: string) => (errors[field] ? MESSAGES[field]?.[errors[field]] : undefined);
  const options: { value: Audience; label: string; hint: string }[] = [
    { value: 'all', label: 'Todos os usuários ativos', hint: info ? `${people(info.counts.all)}, sem contar você` : '' },
    { value: 'members', label: 'Só colaboradores', hint: info ? people(info.counts.members) : '' },
    { value: 'viewers', label: 'Só leitores', hint: info ? people(info.counts.viewers) : '' },
    {
      value: 'people',
      label: 'Pessoas específicas',
      hint: audience === 'people' && selected.length ? `${selected.length} ${selected.length === 1 ? 'selecionada' : 'selecionadas'}` : 'Escolha na lista de usuários ativos',
    },
  ];

  return (
    <aside className="side-panel broadcast-panel" aria-labelledby="broadcast-title">
      <form ref={formRef} className="broadcast-panel__form" onSubmit={submit} noValidate>
        <div className="broadcast-panel__top">
          <h2 id="broadcast-title" className="side-panel__title">
            Novo comunicado
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>

        <div className="broadcast-panel__body">
          <p className="side-panel__intro">Aparece nas notificações de quem você escolher, dentro do ERP. Ninguém recebe e-mail.</p>

          <fieldset className="choice-group">
            <legend className="field-label">Destinatários</legend>
            {options.map((o) => (
              <label key={o.value} className="choice">
                <input type="radio" name="audience" value={o.value} checked={audience === o.value} onChange={() => setAudience(o.value)} />
                <span className="choice__box choice__box--radio" aria-hidden />
                <span className="choice__text">
                  <span className="choice__label">{o.label}</span>
                  {o.hint && <span className="choice__hint">{o.hint}</span>}
                </span>
              </label>
            ))}
            {audience === 'people' && info && (
              <div className="people-pick" role="group" aria-label="Usuários ativos">
                {[...info.people].sort((a, b) => Number(b.me) - Number(a.me)).map((p) => (
                  <label key={p.id} className="choice people-pick__item">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                    <span className="choice__box choice__box--check" aria-hidden>
                      <AppIcon name="check" size={13} />
                    </span>
                    <span className="choice__text">
                      <span className="choice__label">
                        {p.name}
                        {p.me && ' · você'}
                      </span>
                      <span className="choice__hint">{ROLE_LABEL[p.role]}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {message('recipients') && (
              <p className="field-error" role="alert">
                {message('recipients')}
              </p>
            )}
          </fieldset>

          <Input label="Título · obrigatório" variant="box" value={title} error={message('title')} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Texto" variant="box" multiline rows={4} value={body} error={message('body')} onChange={(e) => setBody(e.target.value)} />
          <div>
            <Select label="Link · opcional" variant="box" options={linkOptions} value={link} onChange={(e) => setLink(e.target.value)} />
            {message('link') ? (
              <p className="field-error" role="alert">
                {message('link')}
              </p>
            ) : (
              <p className="side-panel__hint">Leva a pessoa a um projeto ou a uma tela do ERP, como Pedidos de exclusão.</p>
            )}
          </div>

          <div className="broadcast-preview">
            <p className="field-label">Prévia · {count === 1 ? '1 pessoa recebe' : `${count} pessoas recebem`}</p>
            <div className="broadcast-preview__card">
              <span className="notification is-unread" aria-hidden>
                <span className="notification__mark" />
                <span className="notification__text">
                  <span className="notification__title">{title.trim() || 'Título do comunicado'}</span>
                  <span className="notification__body">{body.trim() || 'O texto aparece aqui.'}</span>
                  <span className="notification__when">
                    Agora · Comunicado de {myName}
                    {linkLabel && ` · abre ${linkLabel}`}
                  </span>
                </span>
              </span>
            </div>
          </div>

          <p className="side-panel__note">Você não recebe o próprio comunicado quando envia para todos ou para um grupo.</p>

          {failed && (
            <div className="alert alert--danger" role="alert">
              <span className="alert__icon">
                <AppIcon name="circle-alert" size={18} />
              </span>
              <div>
                <p>Não foi possível enviar o comunicado. O que você escreveu continua aqui.</p>
                <button type="button" className="link-button" onClick={() => submit()}>
                  Tentar de novo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="broadcast-panel__footer">
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" type="submit" disabled={sending || !info}>
            Enviar comunicado
          </Button>
        </div>
      </form>
    </aside>
  );
}
