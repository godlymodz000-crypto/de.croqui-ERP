import { useState } from 'react';
import { Button, Input } from '../../ui/ds';
import { notesApi, type ProjectNote } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';
import { RowMenu, type RowAction } from '../collaborators/RowMenu';
import { LoadError } from '../../ui/LoadError';

/** Seção Notas do projeto aberto. Notas ficam só no banco do ERP. */
export function NotesSection({
  projectId,
  notes,
  failed,
  onRetry,
  canWrite,
  actionsFor,
  onCreated,
  onError,
}: {
  projectId: string;
  notes: ProjectNote[] | null;
  /** Erro da última carga, ou null. */
  failed: unknown;
  onRetry: () => void;
  canWrite: boolean;
  actionsFor: (n: ProjectNote) => RowAction[];
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await notesApi.create(projectId, text.trim());
      setText('');
      onCreated();
    } catch {
      onError('Não foi possível salvar a nota. O texto continua no campo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="project-section" aria-labelledby="notes-title">
      <h2 id="notes-title" className="project-section__title">
        Notas
      </h2>
      <p className="project-section__intro">Ficam no ERP, visíveis para todo o estúdio.</p>

      {canWrite && (
        <div className="note-form">
          <label className="visually-hidden" htmlFor="nova-nota">
            Nova nota
          </label>
          <Input
            id="nova-nota"
            variant="box"
            multiline
            rows={3}
            placeholder="Escreva uma nota para o estúdio"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button variant="outline" disabled={!text.trim() || saving} aria-busy={saving} onClick={add}>
            Adicionar nota
          </Button>
        </div>
      )}

      {failed != null && <LoadError error={failed} message="Não foi possível carregar as notas." onRetry={onRetry} />}
      {notes !== null && notes.length === 0 && <p className="people-table__message">Nenhuma nota ainda.</p>}
      <ul className="note-list">
        {(notes ?? []).map((n) => {
          const actions = actionsFor(n);
          return (
            <li key={n.id} className="note">
              <div className="note__head">
                <p className="note__who">
                  {n.author ?? 'Sem autor'} <span className="note__when">· {formatLastAccess(n.createdAt)}</span>
                  {n.pendingDeletion && <span className="pending-badge">Exclusão pedida</span>}
                </p>
                {actions.length > 0 && <RowMenu label="Ações da nota" actions={actions} />}
              </div>
              <p className="note__body">{n.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
