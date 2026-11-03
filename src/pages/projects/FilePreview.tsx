import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from '../../ui/ds';
import { useIsMobile } from '../../ui/useMediaQuery';
import { fileKind, filesApi, formatSize, SUBFOLDER_LABEL, type ProjectFile } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';

/** Imagens abrem dentro do ERP; PDF, CAD e o resto abrem no Drive. */
export function isImage(file: ProjectFile) {
  return file.mimeType.startsWith('image/');
}

/**
 * Visualização da imagem dentro do ERP (quadro "visualizar arquivo"). A imagem vem do servidor do ERP,
 * em tamanho grande, e não depende do login Google no navegador.
 */
export function FilePreview({ file, onClose }: { file: ProjectFile; onClose: () => void }) {
  const closeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [image, setImage] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    closeRef.current?.querySelector('button')?.focus();
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const when = formatLastAccess(file.createdAt)?.toLowerCase();

  return (
    <div className="preview" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <div className="preview__veil" onClick={onClose} aria-hidden />
      <div className="preview__window">
        <header className="preview__bar">
          <div className="preview__who">
            <h2 id="preview-title" className="preview__title">
              {file.name}
            </h2>
            <p className="preview__meta">
              {fileKind(file.name)} · {formatSize(file.sizeBytes)} · {SUBFOLDER_LABEL[file.subfolder]}
              {when && ` · enviado ${when}`}
              {file.uploadedBy && `, por ${file.uploadedBy}`}
            </p>
          </div>
          <a className="preview__link" href={file.driveUrl} target="_blank" rel="noopener noreferrer">
            Abrir no Drive
            <Icon name="arrow-up-right" size={16} />
          </a>
          <div ref={closeRef}>
            <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={onClose} />
          </div>
        </header>
        <div className="preview__stage">
          {image === 'failed' ? (
            <p className="preview__message">Não foi possível carregar a imagem. Use Abrir no Drive para ver o arquivo original.</p>
          ) : (
            <img
              className={`preview__image${image === 'loading' ? ' is-loading' : ''}`}
              src={filesApi.imageUrl(file.id)}
              alt={file.name}
              onLoad={() => setImage('ready')}
              onError={() => setImage('failed')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
