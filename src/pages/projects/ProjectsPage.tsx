import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArchFrame, Button, Icon, Tag, Toast } from '../../ui/ds';
import { useSession } from '../../session';
import { projectsApi, type Project } from '../../api/projects';
import { formatLastAccess } from '../collaborators/format';
import { ProjectPanel } from './ProjectPanel';
import { LoadError } from '../../ui/LoadError';
import { canWriteProjects, deadlineLabel, SituationBadge } from './shared';

type Filter = 'all' | 'active' | 'done';
type Sort = 'updated' | 'name' | 'deadline';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'updated', label: 'última alteração' },
  { value: 'name', label: 'nome do projeto' },
  { value: 'deadline', label: 'prazo' },
];

const LOAD_ERROR = 'Não foi possível carregar os projetos. Tente de novo em instantes.';

function sortProjects(list: Project[], sort: Sort): Project[] {
  const copy = [...list];
  if (sort === 'name') copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  // Sem prazo vai para o fim.
  if (sort === 'deadline') copy.sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));
  return copy;
}

export function ProjectsPage() {
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const canWrite = canWriteProjects(me);
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState<Project[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('updated');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>((location.state as { toast?: string } | null)?.toast ?? null);

  const load = useCallback(async () => {
    try {
      setList(await projectsApi.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(err);
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

  const counts = useMemo(() => {
    const all = list ?? [];
    return { all: all.length, active: all.filter((p) => p.status === 'active').length, done: all.filter((p) => p.status === 'done').length };
  }, [list]);

  const visible = useMemo(
    () => sortProjects((list ?? []).filter((p) => filter === 'all' || p.status === filter), sort),
    [list, filter, sort],
  );

  const isEmpty = list !== null && list.length === 0;

  return (
    <section className="projects">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Projetos</p>
          <h1 className="page-header__title">Projetos</h1>
          <p className="page-header__intro">Escolha um projeto para ver etapas, orçamentos e apresentações.</p>
        </div>
        {canWrite && (
          <Button variant="primary" iconLeft="plus" onClick={() => setCreating(true)}>
            Novo projeto
          </Button>
        )}
      </header>

      {!isEmpty && list !== null && (
        <div className="projects-toolbar">
          <div className="projects-toolbar__filters" role="group" aria-label="Filtrar projetos">
            <Tag selected={filter === 'all'} onClick={() => setFilter('all')}>
              Todos · {counts.all}
            </Tag>
            <Tag selected={filter === 'active'} onClick={() => setFilter('active')}>
              Em andamento · {counts.active}
            </Tag>
            <Tag selected={filter === 'done'} onClick={() => setFilter('done')}>
              Concluídos · {counts.done}
            </Tag>
          </div>
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
        </div>
      )}

      <div className="projects-table" role="table" aria-label="Projetos">
        <div className="projects-table__head" role="row">
          <span role="columnheader">Projeto</span>
          <span role="columnheader">Cliente</span>
          <span role="columnheader">Situação</span>
          <span role="columnheader">Última alteração</span>
        </div>

        {loadError != null && <LoadError error={loadError} message={LOAD_ERROR} onRetry={load} />}

        {isEmpty ? (
          <div className="people-table__message">
            <p>Nenhum projeto cadastrado ainda.</p>
            {canWrite && <p>Use Novo projeto para criar o primeiro. A pasta dele no Google Drive é criada junto.</p>}
          </div>
        ) : (
          visible.map((p) => (
            <Link key={p.id} to={`/projetos/${p.id}`} className="projects-table__row" role="row">
              <span role="cell" className="project-cell">
                <span className="project-cell__thumb" aria-hidden>
                  <ArchFrame shape="arch" ratio="36 / 46" label="" />
                </span>
                <span className="project-cell__text">
                  <span className="project-cell__name">{p.name}</span>
                  <span className="project-cell__sub">{deadlineLabel(p)}</span>
                </span>
              </span>
              <span role="cell" className="projects-table__client" data-label="Cliente">
                {p.clientName}
              </span>
              <span role="cell" className="projects-table__status">
                <SituationBadge project={p} />
              </span>
              <span role="cell" className="projects-table__updated">
                <span>{formatLastAccess(p.updatedAt)}</span>
                {p.updatedBy && <span className="projects-table__author">por {p.updatedBy}</span>}
              </span>
            </Link>
          ))
        )}

        {list !== null && !isEmpty && visible.length === 0 && (
          <p className="people-table__message">Nenhum projeto nesta situação.</p>
        )}
      </div>

      {creating && (
        <ProjectPanel
          onClose={() => setCreating(false)}
          onSaved={(p) => {
            setCreating(false);
            navigate(`/projetos/${p.id}`);
          }}
        />
      )}

      {toast && (
        <div className="toast-slot">
          <Toast tone="neutral" message={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}
