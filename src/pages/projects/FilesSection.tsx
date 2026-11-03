import { useState } from 'react';
import { Button, Icon, Tag } from '../../ui/ds';
import { fileKind, filesApi, formatSize, SUBFOLDER_LABEL, type ProjectFile, type Subfolder } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';
import { RowMenu, type RowAction } from '../collaborators/RowMenu';

const FILTERS: Subfolder[] = ['photos', 'contracts', 'files', 'presentations', 'budgets'];

function Thumb({ file }: { file: ProjectFile }) {
  const [failed, setFailed] = useState(false);
  if (file.hasThumbnail && !failed) {
    return (
      <span className="file-thumb file-thumb--image">
        <img src={filesApi.thumbnailUrl(file.id)} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    );
  }
  return <span className={`file-thumb${file.hasThumbnail ? ' file-thumb--image' : ''}`}>{file.hasThumbnail ? null : fileKind(file.name)}</span>;
}

/** Seção Arquivos do projeto aberto (quadro "projeto aberto, arquivos e notas"). */
export function FilesSection({
  files,
  failed,
  driveUrl,
  canUpload,
  actionsFor,
  onUpload,
  onPreview,
}: {
  files: ProjectFile[] | null;
  failed: boolean;
  driveUrl: string;
  canUpload: boolean;
  actionsFor: (f: ProjectFile) => RowAction[];
  onUpload: () => void;
  onPreview: (f: ProjectFile) => void;
}) {
  const [filter, setFilter] = useState<Subfolder | 'all'>('all');
  const list = files ?? [];
  const visible = filter === 'all' ? list : list.filter((f) => f.subfolder === filter);

  return (
    <section className="project-section" aria-labelledby="files-title">
      <div className="project-section__top">
        <div>
          <h2 id="files-title" className="project-section__title">
            Arquivos
          </h2>
          <p className="project-section__intro">Ficam na pasta do projeto no Google Drive.</p>
        </div>
        {canUpload && (
          <Button variant="primary" iconLeft="plus" onClick={onUpload}>
            Enviar arquivo
          </Button>
        )}
      </div>

      {list.length > 0 && (
        <div className="projects-toolbar__filters files-filters" role="group" aria-label="Filtrar por pasta">
          <Tag selected={filter === 'all'} onClick={() => setFilter('all')}>
            Todos · {list.length}
          </Tag>
          {FILTERS.map((s) => (
            <Tag key={s} selected={filter === s} onClick={() => setFilter(s)}>
              {SUBFOLDER_LABEL[s]} · {list.filter((f) => f.subfolder === s).length}
            </Tag>
          ))}
        </div>
      )}

      <div className="files-table" role="table" aria-label="Arquivos do projeto">
        <div className="files-table__head" role="row">
          <span role="columnheader">Arquivo</span>
          <span role="columnheader">Pasta</span>
          <span role="columnheader">Enviado</span>
          <span role="columnheader" aria-label="Ações" />
        </div>
        {failed && <p className="people-table__message">Não foi possível carregar os arquivos. Tente de novo em instantes.</p>}
        {files !== null && list.length === 0 && (
          <p className="people-table__message">
            Nenhum arquivo ainda.{canUpload && ' Use Enviar arquivo para mandar fotos, documentos e arquivos de projeto para a pasta do projeto.'}
          </p>
        )}
        {files !== null && list.length > 0 && visible.length === 0 && <p className="people-table__message">Nenhum arquivo nesta pasta.</p>}
        {visible.map((f) => (
          <div key={f.id} className="files-table__row" role="row">
            <span role="cell" className="file-cell">
              <button type="button" className="file-cell__open" onClick={() => onPreview(f)} aria-label={f.mimeType.startsWith('image/') ? `Visualizar ${f.name}` : `Abrir ${f.name} no Drive`}>
                <Thumb file={f} />
              </button>
              <span className="file-cell__text">
                <button type="button" className="file-cell__name" onClick={() => onPreview(f)}>
                  {f.name}
                </button>
                <span className="file-cell__meta">
                  {fileKind(f.name)} · {formatSize(f.sizeBytes)}
                  {f.source === 'pdf_export' && ' · exportado do editor'}
                  {f.pendingDeletion && <span className="pending-badge">Exclusão pedida</span>}
                </span>
              </span>
            </span>
            <span role="cell" className="files-table__folder" data-label="Pasta">
              {SUBFOLDER_LABEL[f.subfolder]}
            </span>
            <span role="cell" className="files-table__sent">
              <span>{formatLastAccess(f.createdAt)}</span>
              {f.uploadedBy && <span className="projects-table__author">por {f.uploadedBy}</span>}
            </span>
            <span role="cell" className="files-table__actions">
              <RowMenu label={`Ações para ${f.name}`} actions={actionsFor(f)} />
            </span>
          </div>
        ))}
      </div>

      <a className="drive-folder__link files-drive-link" href={driveUrl} target="_blank" rel="noopener noreferrer">
        Abrir pasta no Drive
        <Icon name="arrow-up-right" size={16} />
      </a>
    </section>
  );
}
