import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, IconButton, Input, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { ApiError, ROLE_DESCRIPTION, ROLE_LABEL, usersApi, type Collaborator, type Role } from '../../api/users';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    required: 'Informe o e-mail do Google.',
    invalid: 'Confira o e-mail: ele precisa ser um endereço válido.',
    taken: 'Este e-mail já está na lista de colaboradores.',
  },
  name: {
    required: 'Informe o nome.',
    too_long: 'Use um nome com até 120 caracteres.',
  },
};

const ROLE_OPTIONS = (['member', 'viewer', 'admin'] as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }));

export function InvitePanel({ onClose, onInvited }: { onClose: () => void; onInvited: (c: Collaborator) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveFailed, setSaveFailed] = useState(false);
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
    const e = email.trim();
    if (!e) next.email = 'required';
    else if (!EMAIL_RE.test(e)) next.email = 'invalid';
    if (!name.trim()) next.name = 'required';
    return next;
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;

    setSaving(true);
    setSaveFailed(false);
    try {
      const created = await usersApi.invite({ email: email.trim(), name: name.trim(), role });
      onInvited(created);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields);
      else setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const message = (field: string) => (errors[field] ? FIELD_MESSAGES[field]?.[errors[field]] : undefined);

  return (
    <aside className="side-panel" aria-labelledby="invite-title">
      <form ref={formRef} className="side-panel__form" onSubmit={submit} noValidate>
        <div className="side-panel__top">
          <h2 id="invite-title" className="side-panel__title">
            Convidar colaborador
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
        </div>
        <p className="side-panel__intro">Quem você cadastrar aqui passa a entrar no ERP com esta conta Google.</p>

        <Input
          label="E-mail do Google · obrigatório"
          type="email"
          variant="box"
          value={email}
          error={message('email')}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Nome · obrigatório"
          variant="box"
          value={name}
          error={message('name')}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Select
            label="Papel"
            variant="box"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          />
          <p className="side-panel__hint">{ROLE_DESCRIPTION[role]}</p>
        </div>

        <div className="side-panel__spacer" />

        <p className="side-panel__note">Depois de salvar, compartilhe a pasta do projeto no Google Drive com este e-mail.</p>

        {saveFailed && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>Não foi possível salvar o colaborador. Os dados preenchidos continuam aqui.</p>
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
          <Button variant="outline" type="submit" disabled={saving}>
            Salvar
          </Button>
        </div>
      </form>
    </aside>
  );
}
