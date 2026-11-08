import { useCallback, useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactElement, type PointerEvent as ReactPointerEvent } from 'react';
import { ApiError } from '../../api/http';
import { presentationImagesApi, uploadPresentationImage, type LibraryImage } from '../../api/presentationImages';
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from '../../shared/presentation-calc';
import type { PresentationImageRef } from '../../shared/presentation-data';
import { prepareImage } from '../../presentation/imageReduce';
import {
  dragFrame,
  extraFilesNotice,
  imagePlacedLine,
  imageZoomIn,
  imageZoomOut,
  uploadProgressLine,
  uploadRefusal,
} from './editor';
import { ImageLibraryDialog } from './ImageLibraryDialog';
import './images.css';

// Imagem da capa no editor (Fase 6b, E8; desenhos 6b-06 a 6b-09). O estado fica num gancho só, porque o
// painel e a visualização mostram a mesma imagem e as mesmas ferramentas.

const ACCEPT = IMAGE_TYPES.join(',');

type Upload = { kind: 'idle' } | { kind: 'sending'; name: string; sent: number; total: number } | { kind: 'error'; name: string; file: File };
type Notice = { tone: 'danger' | 'info'; message: string; action: 'pick' | 'close' };

export interface CoverImage {
  /** Imagem colocada na capa, ou nula. */
  imagem: PresentationImageRef | null;
  /** Dados da imagem colocada, quando a biblioteca já carregou. */
  placed: LibraryImage | null;
  /** A imagem colocada não está mais no Drive (ou na biblioteca). */
  missing: boolean;
  /** Endereço para a folha: a cópia local logo depois do envio (R3), senão a de 1600 px. */
  src: string | null;
  upload: Upload;
  library: LibraryImage[] | null;
  notice: Notice | null;
  libraryOpen: boolean;
  removing: boolean;
  hasProject: boolean;
  pickFiles: () => void;
  handleFiles: (files: File[]) => void;
  retry: () => void;
  openLibrary: () => void;
  closeLibrary: () => void;
  place: (img: LibraryImage) => void;
  setFrame: (change: Partial<PresentationImageRef>) => void;
  askRemove: (open: boolean) => void;
  remove: () => void;
  imageFailed: () => void;
  closeNotice: () => void;
  /** Miniatura da biblioteca: a cópia local logo depois do envio, senão a do Drive. */
  thumbSrc: (id: string) => string;
  /** Entrada de arquivo escondida: a tela a coloca uma vez. */
  input: ReactElement;
}

export function useCoverImage({
  presentationId,
  hasProject,
  imagem,
  setImagem,
  enabled,
}: {
  presentationId: string;
  hasProject: boolean;
  imagem: PresentationImageRef | null;
  setImagem: (next: PresentationImageRef | null) => void;
  /** Falso no leitor e no celular: nada de biblioteca nem envio. */
  enabled: boolean;
}): CoverImage {
  const [library, setLibrary] = useState<LibraryImage[] | null>(null);
  const [upload, setUpload] = useState<Upload>({ kind: 'idle' });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const setImagemRef = useRef(setImagem);
  setImagemRef.current = setImagem;

  const loadLibrary = useCallback(async () => {
    try {
      setLibrary(await presentationImagesApi.library(presentationId));
    } catch {
      setLibrary((l) => l ?? []);
    }
  }, [presentationId]);

  useEffect(() => {
    if (enabled) void loadLibrary();
  }, [enabled, loadLibrary]);

  // Sair do editor cancela um envio em andamento e libera as cópias locais.
  useEffect(() => () => abortRef.current?.abort(), []);
  const localRef = useRef(local);
  localRef.current = local;
  useEffect(() => () => Object.values(localRef.current).forEach((u) => URL.revokeObjectURL(u)), []);

  const send = useCallback(
    async (file: File, placeIt: boolean): Promise<boolean> => {
      const controller = new AbortController();
      abortRef.current = controller;
      setUpload({ kind: 'sending', name: file.name, sent: 0, total: file.size });
      try {
        const prepared = await prepareImage(file);
        setUpload({ kind: 'sending', name: file.name, sent: 0, total: prepared.blob.size });
        const img = await uploadPresentationImage(
          presentationId,
          prepared,
          (sent) => setUpload({ kind: 'sending', name: file.name, sent, total: prepared.blob.size }),
          controller.signal,
        );
        setLocal((m) => ({ ...m, [img.id]: URL.createObjectURL(prepared.blob) }));
        setLibrary((l) => [img, ...(l ?? []).filter((x) => x.id !== img.id)]);
        if (placeIt) {
          setFailedId(null);
          setImagemRef.current({ id: img.id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
        }
        setUpload({ kind: 'idle' });
        return true;
      } catch (err) {
        if ((err as { reason?: string })?.reason === 'aborted') return false;
        if (err instanceof ApiError && err.status === 0 && controller.signal.aborted) return false;
        setUpload({ kind: 'error', name: file.name, file });
        return false;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [presentationId],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length || upload.kind === 'sending') return;
      setNotice(null);
      const refused = files.map((f) => uploadRefusal(f, IMAGE_TYPES, IMAGE_MAX_BYTES)).find((m) => m);
      const ok = files.filter((f) => !uploadRefusal(f, IMAGE_TYPES, IMAGE_MAX_BYTES));
      if (refused) setNotice({ tone: 'danger', message: refused, action: 'pick' });
      if (!ok.length) return;
      // A capa tem um espaço só: a primeira imagem vai para ele, as outras ficam na biblioteca.
      const placedOk = await send(ok[0], true);
      if (!placedOk) return;
      for (const extra of ok.slice(1)) {
        if (!(await send(extra, false))) return;
      }
      if (ok.length > 1 && !refused) setNotice({ tone: 'info', message: extraFilesNotice(ok.length - 1), action: 'close' });
    },
    [send, upload.kind],
  );

  const pickFiles = useCallback(() => {
    setNotice(null);
    inputRef.current?.click();
  }, []);

  const placed = imagem && library ? (library.find((i) => i.id === imagem.id) ?? null) : null;
  const missing = !!imagem && (failedId === imagem.id || (library !== null && !placed && !local[imagem.id]));
  const src = imagem && !missing ? (local[imagem.id] ?? presentationImagesApi.imageUrl(imagem.id)) : null;

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      multiple
      hidden
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        void handleFiles(files);
      }}
    />
  );

  return {
    imagem,
    placed,
    missing,
    src,
    upload,
    library,
    notice,
    libraryOpen,
    removing,
    hasProject,
    pickFiles,
    handleFiles: (files) => void handleFiles(files),
    retry: () => {
      if (upload.kind === 'error') void send(upload.file, true);
    },
    openLibrary: () => {
      setNotice(null);
      // Sem nada na biblioteca, "escolher" é escolher um arquivo.
      if (library && library.length === 0) inputRef.current?.click();
      else {
        setLibraryOpen(true);
        // Usos e lixeira mudam a cada salvamento: a janela abre com a biblioteca atual.
        void loadLibrary();
      }
    },
    closeLibrary: () => setLibraryOpen(false),
    place: (img) => {
      setLibraryOpen(false);
      if (imagem?.id === img.id && failedId !== img.id) return;
      setFailedId(null);
      setImagem({ id: img.id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
    },
    setFrame: (change) => {
      if (imagem) setImagem({ ...imagem, ...change });
    },
    askRemove: setRemoving,
    remove: () => {
      setRemoving(false);
      setImagem(null);
    },
    imageFailed: () => {
      if (imagem && !local[imagem.id]) setFailedId(imagem.id);
    },
    closeNotice: () => setNotice(null),
    thumbSrc: (id) => local[id] ?? presentationImagesApi.thumbnailUrl(id),
    input,
  };
}

/** Ferramentas sobre a imagem (6b-07): Trocar, Ajustar, − +, Centro e Remover. */
export function ImageTools({ cover, className = '', style }: { cover: CoverImage; className?: string; style?: CSSProperties }) {
  const ref = cover.imagem;
  if (!ref) return null;
  return (
    <div className={`pimgtools ${className}`} style={style} role="toolbar" aria-label="Ferramentas da imagem">
      <button type="button" onClick={cover.openLibrary}>
        Trocar
      </button>
      <button type="button" onClick={() => cover.setFrame({ ajuste: ref.ajuste === 'fill' ? 'fit' : 'fill' })} title={ref.ajuste === 'fill' ? 'Caber inteira' : 'Preencher o espaço'}>
        Ajustar
      </button>
      <button type="button" aria-label="Diminuir zoom da imagem" disabled={ref.zoom <= 1} onClick={() => cover.setFrame({ zoom: imageZoomOut(ref.zoom) })}>
        −
      </button>
      <button type="button" aria-label="Aumentar zoom da imagem" disabled={ref.zoom >= 4} onClick={() => cover.setFrame({ zoom: imageZoomIn(ref.zoom) })}>
        +
      </button>
      <button type="button" onClick={() => cover.setFrame({ x: 50, y: 50 })}>
        Centro
      </button>
      <button type="button" className="pimgtools__remove" onClick={() => cover.askRemove(true)}>
        Remover
      </button>
    </div>
  );
}

/** Arrastar a imagem na visualização muda o enquadramento. */
export function useImageDrag(cover: CoverImage) {
  const start = useRef<{ px: number; py: number; x: number; y: number; w: number; h: number } | null>(null);
  if (!cover.imagem || cover.missing) return undefined;
  const ref = cover.imagem;
  return {
    className: 'pcover__arch is-draggable',
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const box = e.currentTarget.getBoundingClientRect();
      start.current = { px: e.clientX, py: e.clientY, x: ref.x, y: ref.y, w: box.width, h: box.height };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      const s = start.current;
      if (!s) return;
      cover.setFrame(dragFrame({ x: s.x, y: s.y }, e.clientX - s.px, e.clientY - s.py, { width: s.w, height: s.h }, ref.zoom));
    },
    onPointerUp: () => {
      start.current = null;
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

/** Espaço "Imagem da capa" no painel (6b-06), com as ferramentas ao passar o mouse (6b-07). */
export function CoverImageField({ cover }: { cover: CoverImage }) {
  const [dragCount, setDragCount] = useState(0);
  const depth = useRef(0);
  const { upload } = cover;

  const onDrag = (e: DragEvent<HTMLDivElement>, kind: 'enter' | 'leave' | 'over' | 'drop') => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    if (kind === 'enter') {
      depth.current += 1;
      setDragCount(e.dataTransfer.items.length || 1);
    } else if (kind === 'leave') {
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragCount(0);
    } else if (kind === 'drop') {
      depth.current = 0;
      setDragCount(0);
      cover.handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  const dragProps = {
    onDragEnter: (e: DragEvent<HTMLDivElement>) => onDrag(e, 'enter'),
    onDragLeave: (e: DragEvent<HTMLDivElement>) => onDrag(e, 'leave'),
    onDragOver: (e: DragEvent<HTMLDivElement>) => onDrag(e, 'over'),
    onDrop: (e: DragEvent<HTMLDivElement>) => onDrag(e, 'drop'),
  };

  let body: ReactElement;
  if (dragCount > 0 && upload.kind !== 'sending') {
    body = (
      <div className="pdrop is-dragging" {...dragProps}>
        <span className="pdrop__title">Solte para enviar</span>
        <span className="pdrop__sub">{dragCount === 1 ? '1 arquivo' : `${dragCount} arquivos`} · PNG, JPG ou WebP até 40 MB</span>
      </div>
    );
  } else if (upload.kind === 'sending') {
    const pct = upload.total ? Math.min(100, (upload.sent / upload.total) * 100) : 0;
    body = (
      <div className="pdrop is-sending" aria-live="polite">
        <span className="pdrop__title">Enviando {upload.name}</span>
        <span className="pdrop__sub">{uploadProgressLine(upload.sent, upload.total)}</span>
        <span className="pdrop__progress" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </span>
      </div>
    );
  } else if (upload.kind === 'error') {
    body = (
      <div className="pdrop is-error" role="alert" {...dragProps}>
        <span className="pdrop__title">Não foi possível enviar {upload.name}</span>
        <button type="button" className="pdrop__link" onClick={cover.retry}>
          Tentar de novo
        </button>
      </div>
    );
  } else if (cover.imagem && cover.missing) {
    body = (
      <div className="pdrop is-missing" role="button" tabIndex={0} onClick={cover.openLibrary} onKeyDown={(e) => e.key === 'Enter' && cover.openLibrary()} {...dragProps}>
        <span className="pdrop__title">Imagem não encontrada no Drive</span>
        <span className="pdrop__sub">Insira de novo ou escolha na biblioteca</span>
      </div>
    );
  } else if (cover.imagem) {
    body = (
      <div className="pdrop is-placed" {...dragProps}>
        <ImageTools cover={cover} />
        <span className="pdrop__title">{cover.placed?.fileName ?? 'Imagem da capa'}</span>
        {cover.placed && <span className="pdrop__sub">{imagePlacedLine(cover.placed.sizeBytes, cover.hasProject)}</span>}
      </div>
    );
  } else {
    body = (
      <div className="pdrop is-empty" role="button" tabIndex={0} onClick={cover.openLibrary} onKeyDown={(e) => e.key === 'Enter' && cover.openLibrary()} {...dragProps}>
        <span className="pdrop__title">Imagem principal (opcional)</span>
        <span className="pdrop__sub">Clique, arraste ou escolha na biblioteca · PNG, JPG, WebP</span>
      </div>
    );
  }

  return (
    <div className="pfield">
      <span className="pfield__label">Imagem da capa</span>
      {body}
    </div>
  );
}

/** Diálogos e avisos da imagem: biblioteca (6b-09), confirmação de remover (6b-07) e avisos de envio (6b-08). */
export function CoverImageLayers({ cover, projectName }: { cover: CoverImage; projectName: string | null }) {
  useEffect(() => {
    if (!cover.removing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cover.askRemove(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cover]);
  return (
    <>
      {cover.input}
      {cover.libraryOpen && (
        <ImageLibraryDialog
          images={cover.library ?? []}
          selectedId={cover.imagem?.id ?? null}
          hasProject={cover.hasProject}
          projectName={projectName}
          thumbSrc={cover.thumbSrc}
          onClose={cover.closeLibrary}
          onUse={cover.place}
          onUpload={() => {
            cover.closeLibrary();
            cover.pickFiles();
          }}
        />
      )}
      {cover.removing && (
        <div className="pveil" onMouseDown={(e) => e.target === e.currentTarget && cover.askRemove(false)}>
          <div className="pconfirm" role="dialog" aria-modal="true" aria-labelledby="pconfirm-title">
            <h2 id="pconfirm-title" className="pconfirm__title">
              Remover a imagem desta página?
            </h2>
            <p className="pconfirm__text">
              {cover.hasProject
                ? 'Ela continua na biblioteca do projeto e pode ser usada de novo. Só vai para a lixeira do Drive quando nenhuma apresentação a usar.'
                : 'Ela continua na biblioteca desta apresentação e pode ser usada de novo. Só vai para a lixeira do Drive quando nenhuma apresentação a usar.'}
            </p>
            <div className="pconfirm__actions">
              <button type="button" className="pbtn pbtn--text" onClick={() => cover.askRemove(false)}>
                Cancelar
              </button>
              <button type="button" className="pbtn pbtn--outline" onClick={cover.remove}>
                Remover da página
              </button>
            </div>
          </div>
        </div>
      )}
      {cover.notice && (
        <div className="toast-slot pnotice-slot">
          <div className={`pnotice pnotice--${cover.notice.tone}`} role={cover.notice.tone === 'danger' ? 'alert' : 'status'}>
            <span className="pnotice__icon" aria-hidden>
              {cover.notice.tone === 'danger' ? '!' : 'i'}
            </span>
            <div className="pnotice__body">
              <p>{cover.notice.message}</p>
              <button type="button" className="pnotice__action" onClick={cover.notice.action === 'pick' ? cover.pickFiles : cover.closeNotice}>
                {cover.notice.action === 'pick' ? 'Escolher outro arquivo' : 'Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
