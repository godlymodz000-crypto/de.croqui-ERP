import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Dialog, Icon, Input, Select, Toast } from '../../ui/ds';
import { useSession } from '../../session';
import {
  ApiError,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  STATUS_LABEL,
  usersApi,
  type Collaborator,
  type Role,
  type Status,
} from '../../api/users';
import { formatLastAccess, initialsOf, normalize } from './format';
import { InvitePanel } from './InvitePanel';
import { RowMenu, type RowAction } from './RowMenu';

const ACTION_ERRORS: Record<string, string> = {
  last_admin: 'O estúdio precisa de pelo menos um administrador ativo.',
  self: 'Você não pode alterar a sua própria conta por aqui.',
  invalid_status: 'Desative a conta antes de remover.',
  not_found: 'Este colaborador não está mais na lista.',
};
const GENERIC_ERROR = 'Não foi possível concluir. Tente de novo em instantes.';

const ROLE_FILTER = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: ROLE_LABEL.admin },
  { value: 'member', label: ROLE_LABEL.member },
  { value: 'viewer', label: ROLE_LABEL.viewer },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === 'active') {
    return (
      <Badge tone="success" style={{ color: 'var(--text-primary)' }}>
        {STATUS_LABEL.active}
      </Badge>
    );
  }
  return <Badge tone={status === 'invited' ? 'neutral' : 'slate'}>{STATUS_LABEL[status]}</Badge>;
}

export function CollaboratorsPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const [list, setList] = useState<Collaborator[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Collaborator | null>(null);
  const [changingRole, setChangingRole] = useState<Collaborator | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await usersApi.list());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (err) {
      setToast((err instanceof ApiError && ACTION_ERRORS[err.code]) || GENERIC_ERROR);
    }
    await load();
  }

  const others = list?.filter((c) => c.id !== me?.id) ?? [];
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return (list ?? []).filter(
      (c) =>
        (roleFilter === 'all' || c.role === roleFilter) &&
        (!q || normalize(`${c.name ?? ''} ${c.email}`).includes(q)),
    );
  }, [list, query, roleFilter]);

  function actionsFor(c: Collaborator): RowAction[] {
    const actions: RowAction[] = [{ label: 'Alterar papel', onSelect: () => setChangingRole(c) }];
    if (c.status !== 'disabled') actions.push({ label: 'Desativar', onSelect: () => run(() => usersApi.disable(c.id)) });
    if (c.status !== 'active') actions.push({ label: 'Remover', danger: true, onSelect: () => setRemoving(c) });
    return actions;
  }

  const isEmpty = list !== null && others.length === 0;

  return (
    <section className="collaborators">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Administração</p>
          <h1 className="page-header__title">Colaboradores</h1>
          <p className="page-header__intro">Só quem está nesta lista consegue entrar no ERP com a conta Google.</p>
        </div>
        <Button variant="primary" iconLeft="plus" onClick={() => setInviting(true)}>
          Convidar colaborador
        </Button>
      </header>

      {!isEmpty && (
        <div className="toolbar">
          <Input
            variant="box"
            type="search"
            iconLeft="search"
            placeholder="Buscar por nome ou e-mail"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 360 }}
          />
          <label className="filter-chip">
            <span className="filter-chip__label">Papel</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {ROLE_FILTER.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="filter-chip__chevron" aria-hidden>
              <Icon name="chevron-down" size={16} />
            </span>
          </label>
        </div>
      )}

      <div className="people-table" role="table" aria-label="Colaboradores">
        <div className="people-table__head" role="row">
          <span role="columnheader">Nome</span>
          <span role="columnheader">E-mail do Google</span>
          <span role="columnheader">Papel</span>
          <span role="columnheader">Situação</span>
          <span role="columnheader">Último acesso</span>
          <span role="columnheader" aria-label="Ações" />
        </div>

        {loadFailed && <p className="people-table__message">{GENERIC_ERROR}</p>}

        {isEmpty ? (
          <div className="people-table__message">
            <p>Nenhum colaborador cadastrado. Por enquanto, só você tem acesso.</p>
            <p>Use Convidar colaborador para dar acesso a mais alguém do estúdio.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const access = formatLastAccess(c.lastLoginAt);
            return (
              <div key={c.id} className="people-table__row" role="row">
                <span role="cell" className="person">
                  <span className="person__avatar" aria-hidden>
                    {initialsOf(c.name, c.email)}
                  </span>
                  <span className="person__name">{c.name ?? c.email}</span>
                </span>
                <span role="cell" className="people-table__email">
                  {c.email}
                </span>
                <span role="cell">{ROLE_LABEL[c.role]}</span>
                <span role="cell">
                  <StatusBadge status={c.status} />
                </span>
                <span role="cell" className={access ? undefined : 'people-table__muted'}>
                  {access ?? 'Ainda não entrou'}
                </span>
                <span role="cell">
                  {c.id !== me?.id && <RowMenu label={`Ações para ${c.name ?? c.email}`} actions={actionsFor(c)} />}
                </span>
              </div>
            );
          })
        )}

        {list !== null && !isEmpty && filtered.length === 0 && (
          <p className="people-table__message">Nenhum colaborador encontrado com essa busca.</p>
        )}
      </div>

      {inviting && (
        <InvitePanel
          onClose={() => setInviting(false)}
          onInvited={() => {
            setInviting(false);
            load();
          }}
        />
      )}

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        width={480}
        eyebrow="Remover colaborador"
        title={`Remover ${removing?.name ?? removing?.email ?? ''}?`}
        footer={
          <>
            <button type="button" className="text-button" onClick={() => setRemoving(null)}>
              Cancelar
            </button>
            <Button
              variant="outline"
              onClick={() => {
                const target = removing!;
                setRemoving(null);
                run(() => usersApi.remove(target.id));
              }}
            >
              Remover
            </Button>
          </>
        }
      >
        {removing && (
          <p>
            {removing.name ?? removing.email} perde o acesso ao ERP e sai desta lista. Os projetos, orçamentos e eventos
            criados por essa pessoa continuam no sistema.
            {removing.status === 'invited' && ' Para pausar o acesso sem remover, use Desativar.'}
          </p>
        )}
      </Dialog>

      {changingRole && (
        <RoleDialog
          person={changingRole}
          onClose={() => setChangingRole(null)}
          onSave={(role) => {
            const target = changingRole;
            setChangingRole(null);
            run(() => usersApi.changeRole(target.id, role));
          }}
        />
      )}

      {toast && (
        <div className="toast-slot">
          <Toast tone="danger" message={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}

function RoleDialog({ person, onClose, onSave }: { person: Collaborator; onClose: () => void; onSave: (r: Role) => void }) {
  const [role, setRole] = useState<Role>(person.role);
  return (
    <Dialog
      open
      onClose={onClose}
      width={480}
      eyebrow="Alterar papel"
      title={person.name ?? person.email}
      footer={
        <>
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" disabled={role === person.role} onClick={() => onSave(role)}>
            Salvar
          </Button>
        </>
      }
    >
      <Select
        label="Papel"
        variant="box"
        options={(['admin', 'member', 'viewer'] as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
        value={role}
        onChange={(e) => setRole(e.target.value as Role)}
      />
      <p className="side-panel__hint">{ROLE_DESCRIPTION[role]}</p>
    </Dialog>
  );
}
