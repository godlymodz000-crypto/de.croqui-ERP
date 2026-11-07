import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Badge, Button, Icon, Tag } from '../../ui/ds';
import { useSession } from '../../session';
import { useIsMobile } from '../../ui/useMediaQuery';
import { LoadError } from '../../ui/LoadError';
import { presentationsApi, type Presentation } from '../../api/presentations';
import { formatLastAccess } from '../collaborators/format';
import {
  canWritePresentations,
  countByTab,
  emptyTabMessage,
  mobileSubLine,
  pagesLabel,
  sortFrom,
  SORTS,
  subLine,
  tabFrom,
  TABS,
  visiblePresentations,
  type Sort,
  type Tab,
} from './list';
import { NewPresentationPanel } from './NewPresentationPanel';
import '../budgets/budgets.css';
import './presentations.css';

const LOAD_ERROR = 'Não foi possível carregar as apresentações. Tente de novo em instantes.';

/**
 * Apresentações (desenhos 6b-01 "Todas" e "estado vazio", em 1440 e 1024, e 6b-13 "lista de apresentações",
 * em 390). No celular não há criação nem edição: a tela só lista.
 */
export function PresentationsPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const isMobile = useIsMobile();
  const canWrite = canWritePresentations(me) && !isMobile;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = tabFrom(params.get('aba'));
  const sort = sortFrom(params.get('ordem'));
  const [list, setList] = useState<Presentation[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await presentationsApi.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => countByTab(list ?? []), [list]);
  const visible = useMemo(() => visiblePresentations(list ?? [], tab, sort), [list, tab, sort]);

  function setParam(key: 'aba' | 'ordem', value: string, fallback: string) {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }
  const setTab = (value: Tab) => setParam('aba', value, 'todas');
  const setSort = (value: Sort) => setParam('ordem', value, 'updated');
  const isEmpty = list !== null && list.length === 0;

  return (
    <section className="budgets presentations">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">{isMobile ? 'Estúdio' : 'Estúdio · Apresentações'}</p>
          <h1 className="page-header__title">Apresentações</h1>
          <p className="page-header__intro">
            {isMobile
              ? 'No celular você vê as apresentações e salva o PDF. Para criar e editar, use o computador.'
              : 'Apresentações dos projetos e apresentações avulsas, ainda sem projeto.'}
          </p>
        </div>
        {canWrite && (
          <Button variant="primary" iconLeft="plus" onClick={() => setCreating(true)}>
            Nova apresentação
          </Button>
        )}
      </header>

      {list !== null &&
        (isMobile ? (
          <div className="budget-tabs" role="tablist" aria-label="Filtrar apresentações">
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
            <div className="projects-toolbar__filters" role="group" aria-label="Filtrar apresentações">
              {TABS.map((t) => (
                <Tag key={t.value} selected={tab === t.value} onClick={() => setTab(t.value)}>
                  {t.label} · {counts[t.value]}
                </Tag>
              ))}
            </div>
            {!isEmpty && (
              <label className="sort-select">
                <span>Ordenar por</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  {SORTS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="sort-select__chevron" aria-hidden>
                  <Icon name="chevron-down" size={16} />
                </span>
              </label>
            )}
          </div>
        ))}

      <div className="projects-table presentations-table" role="table" aria-label="Apresentações">
        <div className="projects-table__head" role="row">
          <span role="columnheader">Apresentação</span>
          <span role="columnheader">Cliente</span>
          <span role="columnheader">Projeto</span>
          <span role="columnheader">Última alteração</span>
        </div>

        {loadError != null && <LoadError error={loadError} message={LOAD_ERROR} onRetry={load} />}

        {isEmpty ? (
          <div className="presentations-empty">
            <p className="presentations-empty__title">Nenhuma apresentação ainda.</p>
            {canWrite && (
              <p className="presentations-empty__text">
                Crie uma em Nova apresentação, ou a partir de um projeto. Ela começa só com a capa, sem textos nem imagens de exemplo.
              </p>
            )}
          </div>
        ) : (
          visible.map((p) => (
            <Link key={p.id} to={`/apresentacoes/${p.id}`} className="projects-table__row presentations-table__row" role="row">
              <span role="cell" className="project-cell">
                <span className="project-cell__text">
                  <span className="project-cell__name">{p.name}</span>
                  <span className="project-cell__sub">{isMobile ? mobileSubLine(p) : subLine(p)}</span>
                  {isMobile && (
                    <span className="project-cell__sub">
                      {pagesLabel(p.pageCount)} · {formatLastAccess(p.updatedAt)}
                    </span>
                  )}
                </span>
              </span>
              <span role="cell" className="projects-table__client">
                {p.clientName ?? '—'}
              </span>
              <span role="cell" className="presentations-table__project">
                {p.project ? (
                  p.project.name
                ) : (
                  <Badge tone="neutral" style={{ background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--border-default)' }}>
                    Sem projeto
                  </Badge>
                )}
              </span>
              <span role="cell" className="projects-table__updated">
                <span>{formatLastAccess(p.updatedAt)}</span>
                {p.updatedBy && <span className="projects-table__author">por {p.updatedBy}</span>}
              </span>
            </Link>
          ))
        )}

        {list !== null && !isEmpty && visible.length === 0 && <p className="people-table__message">{emptyTabMessage(tab)}</p>}
      </div>

      {creating && (
        <NewPresentationPanel
          onClose={() => setCreating(false)}
          onCreated={(p) => {
            setCreating(false);
            navigate(`/apresentacoes/${p.id}`);
          }}
        />
      )}
    </section>
  );
}
