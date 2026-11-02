import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, Dialog, Icon, Toast } from '../../ui/ds';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { projectsApi, type Project } from '../../api/projects';
import { deletionApi, filesApi, notesApi, SUBFOLDER_LABEL, type ProjectFile, type ProjectNote } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';
import type { RowAction } from '../collaborators/RowMenu';
import { ProjectPanel } from './ProjectPanel';
import { FilesSection } from './FilesSection';
import { NotesSection } from './NotesSection';
import { UploadPanel } from './UploadPanel';
import { FilePreview } from './FilePreview';
import { ConfirmDeleteDialog, RequestDeletionDialog } from './DeletionDialogs';
import { canDeleteProjects, canWriteProjects, deadlineLabel, folderName, formatDate, SituationBadge } from './shared';

type Pending =
  | { kind: 'request'; itemType: 'file' | 'note' | 'project'; itemId: string; label: string; keeps: string }
  | { kind: 'delete-file'; file: ProjectFile }
  | { kind: 'delete-note'; note: ProjectNote };

type ToastState = { tone: 'neutral' | 'danger'; message: string } | null;

const REQUEST_ERRORS: Record<string, string> = {
  already_pending: 'Já existe um pedido de exclusão pendente para este item.',
  not_found: 'Este item não está mais no projeto.',
};
const GENERIC_ERROR = 'Não foi possível concluir. Tente de novo em instantes.';

function noteLabel(n: ProjectNote) {
  return `a nota de ${formatLastAccess(n.createdAt)?.toLowerCase() ?? 'hoje'}`;
}

/** Projeto aberto: arquivos no Drive, notas e dados (quadros "ERP · Projeto aberto"). */
export function ProjectPage() {
  const { id = '' } = useParams();
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [files, setFiles] = useState<ProjectFile[] | null>(null);
  const [filesFailed, setFilesFailed] = useState(false);
  const [notes, setNotes] = useState<ProjectNote[] | null>(null);
  const [notesFailed, setNotesFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState<ProjectFile | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const isAdmin = me?.role === 'admin';
  const canWrite = canWriteProjects(me);
  const canRequest = me?.role === 'member';

  const load = useCallback(async () => {
    try {
      setProject(await projectsApi.get(id));
      setState('ready');
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? 'not_found' : 'error');
    }
  }, [id]);

  const loadFiles = useCallback(async () => {
    try {
      setFiles(await filesApi.list(id));
      setFilesFailed(false);
    } catch {
      setFilesFailed(true);
    }
  }, [id]);

  const loadNotes = useCallback(async () => {
    try {
      setNotes(await notesApi.list(id));
      setNotesFailed(false);
    } catch {
      setNotesFailed(true);
    }
  }, [id]);

  useEffect(() => {
    load();
    loadFiles();
    loadNotes();
  }, [load, loadFiles, loadNotes]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const fail = (err: unknown) =>
    setToast({ tone: 'danger', message: (err instanceof ApiError && REQUEST_ERRORS[err.code]) || (err instanceof ApiError && err.code === 'drive_failed' ? 'Não foi possível mover o arquivo para a lixeira do Google Drive. Nada foi alterado.' : GENERIC_ERROR) });

  async function run(p: Pending, reason = '') {
    setPending(null);
    try {
      if (p.kind === 'request') {
        await deletionApi.request(p.itemType, p.itemId, reason);
        setToast({ tone: 'neutral', message: 'Pedido enviado para a administração.' });
      } else if (p.kind === 'delete-file') {
        await filesApi.remove(p.file.id);
        setToast({ tone: 'neutral', message: `${p.file.name} foi para a lixeira do Google Drive.` });
      } else {
        await notesApi.remove(p.note.id);
        setToast({ tone: 'neutral', message: 'Nota excluída.' });
      }
    } catch (err) {
      fail(err);
    }
    loadFiles();
    loadNotes();
  }

  function fileActions(f: ProjectFile): RowAction[] {
    const actions: RowAction[] = [
      { label: 'Visualizar', onSelect: () => setPreviewing(f) },
      { label: 'Abrir no Drive', onSelect: () => window.open(f.driveUrl, '_blank', 'noopener') },
    ];
    if (isAdmin) actions.push({ label: 'Excluir', danger: true, onSelect: () => setPending({ kind: 'delete-file', file: f }) });
    else if (canRequest && !f.pendingDeletion)
      actions.push({
        label: 'Pedir exclusão',
        onSelect: () => setPending({ kind: 'request', itemType: 'file', itemId: f.id, label: f.name, keeps: 'o arquivo continua no projeto e no Google Drive' }),
      });
    return actions;
  }

  function noteActions(n: ProjectNote): RowAction[] {
    if (isAdmin) return [{ label: 'Excluir', danger: true, onSelect: () => setPending({ kind: 'delete-note', note: n }) }];
    if (canRequest && !n.pendingDeletion)
      return [{ label: 'Pedir exclusão', onSelect: () => setPending({ kind: 'request', itemType: 'note', itemId: n.id, label: noteLabel(n), keeps: 'a nota continua no projeto' }) }];
    return [];
  }

  async function removeProject(target: Project) {
    setDeletingProject(false);
    try {
      await projectsApi.remove(target.id);
      navigate('/projetos', { state: { toast: `${target.name} saiu do ERP. A pasta continua no Google Drive.` } });
    } catch {
      setToast({ tone: 'danger', message: 'Não foi possível excluir o projeto. Tente de novo em instantes.' });
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

  return (
    <section className="project">
      {back}
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Estúdio · Projetos</p>
          <h1 className="page-header__title">{project.name}</h1>
          <p className="page-header__intro">
            {project.clientName} · {deadlineLabel(project)}
          </p>
        </div>
        {(canWrite || canDeleteProjects(me)) && (
          <div className="project__actions">
            {canDeleteProjects(me) && (
              <button type="button" className="text-button" onClick={() => setDeletingProject(true)}>
                Excluir projeto
              </button>
            )}
            {canRequest && (
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setPending({ kind: 'request', itemType: 'project', itemId: project.id, label: project.name, keeps: 'o projeto continua no ERP' })
                }
              >
                Pedir exclusão
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

      <div className="project-layout">
        <FilesSection
          files={files}
          failed={filesFailed}
          driveUrl={project.driveUrl}
          canUpload={canWrite}
          actionsFor={fileActions}
          onUpload={() => setUploading(true)}
          onPreview={setPreviewing}
        />

        <div className="project-layout__side">
          <NotesSection
            projectId={project.id}
            notes={notes}
            failed={notesFailed}
            canWrite={canWrite}
            actionsFor={noteActions}
            onCreated={loadNotes}
            onError={(message) => setToast({ tone: 'danger', message })}
          />

          <section className="project-section" aria-labelledby="data-title">
            <h2 id="data-title" className="project-section__title">
              Dados do projeto
            </h2>
            <dl className="project-facts">
              <div>
                <dt>Situação</dt>
                <dd>
                  <SituationBadge project={project} />
                </dd>
              </div>
              <div>
                <dt>Prazo</dt>
                <dd>{project.deadline ? formatDate(project.deadline) : 'Sem prazo definido'}</dd>
              </div>
              <div>
                <dt>Última alteração</dt>
                <dd>
                  {formatLastAccess(project.updatedAt)}
                  {project.updatedBy && ` · por ${project.updatedBy}`}
                </dd>
              </div>
            </dl>
          </section>
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

      {uploading && (
        <UploadPanel
          projectId={project.id}
          onClose={() => setUploading(false)}
          onUploaded={(f) => {
            setUploading(false);
            setToast({ tone: 'neutral', message: `${f.name} foi enviado para ${SUBFOLDER_LABEL[f.subfolder]}.` });
            loadFiles();
          }}
        />
      )}

      {previewing && <FilePreview file={previewing} onClose={() => setPreviewing(null)} />}

      {pending?.kind === 'request' && (
        <RequestDeletionDialog itemLabel={pending.label} keepsText={pending.keeps} onClose={() => setPending(null)} onSend={(reason) => run(pending, reason)} />
      )}
      {pending?.kind === 'delete-file' && (
        <ConfirmDeleteDialog
          eyebrow="Excluir arquivo"
          title={`Excluir ${pending.file.name}?`}
          text="O arquivo sai do projeto e vai para a lixeira do Google Drive, onde fica por 30 dias antes de ser apagado de vez."
          onClose={() => setPending(null)}
          onConfirm={() => run(pending)}
        />
      )}
      {pending?.kind === 'delete-note' && (
        <ConfirmDeleteDialog
          eyebrow="Excluir nota"
          title={`Excluir ${noteLabel(pending.note)}?`}
          text="A nota sai do projeto para todo o estúdio. O registro continua no histórico do ERP."
          onClose={() => setPending(null)}
          onConfirm={() => run(pending)}
        />
      )}

      <Dialog
        open={deletingProject}
        onClose={() => setDeletingProject(false)}
        width={480}
        eyebrow="Excluir projeto"
        title={`Excluir ${project.name}?`}
        footer={
          <>
            <button type="button" className="text-button" onClick={() => setDeletingProject(false)}>
              Cancelar
            </button>
            <Button variant="outline" onClick={() => removeProject(project)}>
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
          <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}
