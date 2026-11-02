import { useEffect, useRef } from 'react';
import { Icon, IconButton } from '../../ui/ds';
import { useIsMobile } from '../../ui/useMediaQuery';
import { fileKind, formatSize, SUBFOLDER_LABEL, type ProjectFile } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';

/**
 * Visualização dentro do ERP, com o link de pré-visualização do Drive (quadro "visualizar arquivo").
 * O Google só mostra o arquivo para quem está conectado com uma conta que tenha acesso à pasta.
 */
export function FilePreview({ file, onClose }: { file: ProjectFile; onClose: () => void }) {
  const closeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
        <iframe className="preview__frame" src={file.previewUrl} title={`Pré-visualização de ${file.name}`} allow="autoplay" />
      </div>
    </div>
  );
}
