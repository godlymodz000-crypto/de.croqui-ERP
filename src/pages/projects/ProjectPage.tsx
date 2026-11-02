import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, Dialog, Icon, Toast } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { projectsApi, type Project } from '../../api/projects';
import { formatLastAccess } from '../collaborators/format';
import { ProjectPanel } from './ProjectPanel';
import { canDeleteProjects, canWriteProjects, folderName, formatDate, SituationBadge } from './shared';

/** Projeto aberto: dados e link para a pasta no Drive. As abas de orçamento e apresentação chegam nas próximas fases. */
export function ProjectPage() {
  const { id = '' } = useParams();
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setProject(await projectsApi.get(id));
      setState('ready');
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? 'not_found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function remove(target: Project) {
    setDeleting(false);
    try {
      await projectsApi.remove(target.id);
      navigate('/projetos', { state: { toast: `${target.name} saiu do ERP. A pasta continua no Google Drive.` } });
    } catch {
      setToast('Não foi possível excluir o projeto. Tente de novo em instantes.');
    }
  }

  const back = (
    <Link to="/projetos" className="back-link">
      <Icon name="arrow-left" size={18} />
      Voltar para Projetos
    </Link>
  );

  if (state !== 'ready' || !project) {
    return (
      <section className="project">
        {back}
        {state === 'not_found' && <p className="people-table__message">Este projeto não existe mais ou foi excluído.</p>}
        {state === 'error' && <p className="people-table__message">Não foi possível abrir o projeto. Tente de novo em instantes.</p>}
      </section>
    );
  }

  const canWrite = canWriteProjects(me);
  const canDelete = canDeleteProjects(me);

  return (
    <section className="project">
      {back}
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Projetos</p>
          <h1 className="page-header__title">{project.name}</h1>
          <p className="page-header__intro">{project.clientName}</p>
        </div>
        {(canWrite || canDelete) && (
          <div className="project__actions">
            {canDelete && (
              <button type="button" className="text-button" onClick={() => setDeleting(true)}>
                Excluir
              </button>
            )}
            {canWrite && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="project-details">
        <h2 className="project-details__title">Dados do projeto</h2>
        <dl className="project-details__list">
          <div>
            <dt>Nome do projeto</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>{project.clientName}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <SituationBadge project={project} />
            </dd>
          </div>
          <div>
            <dt>Prazo</dt>
            <dd className={project.deadline ? undefined : 'project-details__muted'}>
              {project.deadline ? formatDate(project.deadline) : 'Sem prazo definido'}
            </dd>
          </div>
          <div>
            <dt>Última alteração</dt>
            <dd>
              {formatLastAccess(project.updatedAt)}
              {project.updatedBy && <span className="project-details__muted"> · por {project.updatedBy}</span>}
            </dd>
          </div>
        </dl>

        <h2 className="project-details__title">Pasta no Google Drive</h2>
        <div className="drive-folder">
          <span className="drive-folder__icon" aria-hidden>
            <AppIcon name="folder" size={22} />
          </span>
          <div className="drive-folder__text">
            <p className="drive-folder__name">{folderName(project)}</p>
            <p className="drive-folder__path">De.Croqui ERP / Projetos · Orçamentos, Apresentações, Contratos e Fotos</p>
          </div>
          <a className="drive-folder__link" href={project.driveUrl} target="_blank" rel="noopener noreferrer">
            Abrir no Drive
            <Icon name="arrow-up-right" size={16} />
          </a>
        </div>
      </div>

      {editing && (
        <ProjectPanel
          project={project}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setEditing(false);
            setProject(p);
          }}
        />
      )}

      <Dialog
        open={deleting}
        onClose={() => setDeleting(false)}
        width={480}
        eyebrow="Excluir projeto"
        title={`Excluir ${project.name}?`}
        footer={
          <>
            <button type="button" className="text-button" onClick={() => setDeleting(false)}>
              Cancelar
            </button>
            <Button variant="outline" onClick={() => remove(project)}>
              Excluir
            </Button>
          </>
        }
      >
        <p>
          O projeto sai do ERP para todo o estúdio. A pasta {folderName(project)} e os arquivos dela continuam no Google
          Drive: o ERP não apaga nada lá. Se quiser apagar a pasta, faça isso no próprio Drive.
        </p>
      </Dialog>

      {toast && (
        <div className="toast-slot">
          <Toast tone="danger" message={toast} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}
