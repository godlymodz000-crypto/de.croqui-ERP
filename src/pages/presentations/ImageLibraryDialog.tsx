import { useEffect, useState } from 'react';
import type { LibraryImage } from '../../api/presentationImages';
import { LAST_USE_TEXT, libraryCaption } from './editor';

/**
 * "Escolher imagem para a capa" (desenho 6b-09). Mostra a biblioteca do projeto ou, na avulsa, a da própria
 * apresentação. Usar uma imagem não cria cópia no Drive.
 */
export function ImageLibraryDialog({
  images,
  selectedId,
  hasProject,
  projectName,
  thumbSrc,
  currentLastUse,
  onClose,
  onUse,
  onUpload,
}: {
  images: LibraryImage[];
  selectedId: string | null;
  hasProject: boolean;
  projectName: string | null;
  thumbSrc: (id: string) => string;
  /** A imagem atual da capa não é usada em outra apresentação: trocar a manda para a lixeira (6b-07). */
  currentLastUse: boolean;
  onClose: () => void;
  onUse: (img: LibraryImage) => void;
  onUpload: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(selectedId);
  const chosen = images.find((i) => i.id === selected) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="pveil" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="plibrary" role="dialog" aria-modal="true" aria-labelledby="plibrary-title">
        <div className="plibrary__top">
          <div className="plibrary__titles">
            <span className="plibrary__eyebrow">
              {hasProject ? `Biblioteca do projeto · ${projectName ?? ''}` : 'Biblioteca desta apresentação · Sem projeto'}
            </span>
            <h2 id="plibrary-title" className="plibrary__title">
              Escolher imagem para a capa
            </h2>
            <p className="plibrary__text">
              {hasProject
                ? 'Imagens já enviadas nas apresentações deste projeto. Usar uma imagem não cria cópia no Drive. Elas ficam em Apresentações/Imagens e não aparecem em Arquivos.'
                : 'Apresentação avulsa: as imagens ficam em Avulsos/Imagens e só esta apresentação as vê. Ao vincular a um projeto, elas passam para a biblioteca do projeto.'}
            </p>
          </div>
          <button type="button" className="plibrary__close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="plibrary__grid" role="listbox" aria-label="Imagens da biblioteca">
          {images.map((img) => {
            const isSel = img.id === selected;
            return (
              <button
                key={img.id}
                type="button"
                role="option"
                aria-selected={isSel}
                className={`plibrary__item${isSel ? ' is-selected' : ''}`}
                onClick={() => setSelected(img.id)}
                onDoubleClick={() => onUse(img)}
              >
                <span className="plibrary__thumb">
                  <img src={thumbSrc(img.id)} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                </span>
                <span className="plibrary__name">{img.fileName}</span>
                <span className="plibrary__caption">{libraryCaption({ selected: isSel, usedBy: img.usedBy, hasProject })}</span>
              </button>
            );
          })}
        </div>

        {currentLastUse && selected !== selectedId && (
          <p className="plibrary__notice" role="status">
            {LAST_USE_TEXT}
          </p>
        )}

        <div className="plibrary__footer">
          <button type="button" className="pbtn pbtn--outline pbtn--lg" onClick={onUpload}>
            Enviar nova imagem
          </button>
          <div className="plibrary__actions">
            <button type="button" className="pbtn pbtn--text pbtn--lg" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="pbtn pbtn--solid pbtn--lg" disabled={!chosen} onClick={() => chosen && onUse(chosen)}>
              Usar esta imagem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
