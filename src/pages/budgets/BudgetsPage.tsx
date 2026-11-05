import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button, Tag } from '../../ui/ds';
import { useSession } from '../../session';
import { useIsMobile } from '../../ui/useMediaQuery';
import { LoadError } from '../../ui/LoadError';
import { budgetsApi, type Budget } from '../../api/budgets';
import { formatCents } from '../../shared/budget-calc';
import { formatLastAccess } from '../collaborators/format';
import { canWriteBudgets } from './shared';
import { NewBudgetPanel } from './NewBudgetPanel';
import './budgets.css';

type Tab = 'todos' | 'projeto' | 'sem-projeto';
const TABS: { value: Tab; label: string; short: string }[] = [
  { value: 'todos', label: 'Todos', short: 'Todos' },
  { value: 'projeto', label: 'Por projeto', short: 'Projetos' },
  { value: 'sem-projeto', label: 'Sem projeto', short: 'Sem projeto' },
];

const LOAD_ERROR = 'Não foi possível carregar os orçamentos. Tente de novo em instantes.';

/** Orçamentos (quadros "ERP · Orçamentos · 1440 · aba Sem projeto" e "· 390"). */
export function BudgetsPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const canWrite = canWriteBudgets(me);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = (TABS.find((t) => t.value === params.get('aba'))?.value ?? 'todos') as Tab;
  const [list, setList] = useState<Budget[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await budgetsApi.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const all = list ?? [];
    return { todos: all.length, projeto: all.filter((b) => b.projectId).length, 'sem-projeto': all.filter((b) => !b.projectId).length };
  }, [list]);

  const visible = useMemo(
    () => (list ?? []).filter((b) => tab === 'todos' || (tab === 'projeto' ? !!b.projectId : !b.projectId)),
    [list, tab],
  );

  const setTab = (value: Tab) => setParams(value === 'todos' ? {} : { aba: value }, { replace: true });
  const isEmpty = list !== null && list.length === 0;

  return (
    <section className="budgets">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Orçamentos</p>
          <h1 className="page-header__title">Orçamentos</h1>
          <p className="page-header__intro">Propostas dos projetos e orçamentos avulsos, ainda sem projeto.</p>
        </div>
        {canWrite && (
          <Button variant="primary" iconLeft="plus" onClick={() => setCreating(true)}>
            Novo orçamento
          </Button>
        )}
      </header>

      {!isEmpty && list !== null &&
        (isMobile ? (
          <div className="budget-tabs" role="tablist" aria-label="Filtrar orçamentos">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                className={`budget-tabs__tab${tab === t.value ? ' is-active' : ''}`}
                onClick={() => setTab(t.value)}
              >
                {t.short} · {counts[t.value]}
              </button>
            ))}
          </div>
        ) : (
          <div className="projects-toolbar">
            <div className="projects-toolbar__filters" role="group" aria-label="Filtrar orçamentos">
              {TABS.map((t) => (
                <Tag key={t.value} selected={tab === t.value} onClick={() => setTab(t.value)}>
                  {t.label} · {counts[t.value]}
                </Tag>
              ))}
            </div>
          </div>
        ))}

      <div className="projects-table budgets-table" role="table" aria-label="Orçamentos">
        <div className="projects-table__head" role="row">
          <span role="columnheader">Orçamento</span>
          <span role="columnheader">Cliente</span>
          <span role="columnheader">Total</span>
          <span role="columnheader">Última alteração</span>
        </div>

        {loadError != null && <LoadError error={loadError} message={LOAD_ERROR} onRetry={load} />}

        {isEmpty ? (
          <div className="people-table__message">
            <p>Nenhum orçamento ainda.</p>
            {canWrite && <p>Use Novo orçamento para criar o primeiro, dentro de um projeto ou avulso.</p>}
          </div>
        ) : (
          visible.map((b) => (
            <Link key={b.id} to={`/orcamentos/${b.id}`} className="projects-table__row budgets-table__row" role="row">
              <span role="cell" className="project-cell">
                <span className="project-cell__text">
                  <span className="project-cell__name">{b.name}</span>
                  <span className="project-cell__sub">
                    {/* No celular a coluna Cliente some; o cliente vem nesta linha, como no quadro de 390. */}
                    Nº {b.number} · {isMobile ? (b.clientName ?? (b.project ? b.project.name : 'Sem projeto')) : b.project ? b.project.name : 'Sem projeto'}
                  </span>
                </span>
              </span>
              <span role="cell" className="projects-table__client" data-label="Cliente">
                {b.clientName ?? '—'}
              </span>
              <span role="cell" className="budgets-table__total">
                {formatCents(b.totalCents)}
              </span>
              <span role="cell" className="projects-table__updated">
                <span>{formatLastAccess(b.updatedAt)}</span>
                {b.updatedBy && <span className="projects-table__author">por {b.updatedBy}</span>}
              </span>
            </Link>
          ))
        )}

        {list !== null && !isEmpty && visible.length === 0 && (
          <p className="people-table__message">{tab === 'sem-projeto' ? 'Nenhum orçamento avulso.' : 'Nenhum orçamento de projeto.'}</p>
        )}
      </div>

      {creating && (
        <NewBudgetPanel
          onClose={() => setCreating(false)}
          onCreated={(b) => {
            setCreating(false);
            navigate(`/orcamentos/${b.id}`);
          }}
        />
      )}
    </section>
  );
}
