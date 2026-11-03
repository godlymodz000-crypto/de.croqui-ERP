import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Button, IconButton, Select } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { useIsMobile } from '../../ui/useMediaQuery';
import { formatSize, SUBFOLDER_LABEL, uploadFile, UploadError, type ProjectFile } from '../../api/files';

type Target = 'photos' | 'contracts' | 'files';

const TARGETS: Record<Target, string> = {
  photos: 'Imagens do projeto, da obra e de referência.',
  contracts: 'Contratos e documentos assinados. Para imagens, use Fotos.',
  files: 'Qualquer tipo de arquivo, como plantas em CAD, modelos do SketchUp e PDFs.',
};

/** Extensões de CAD e modelagem que vão direto para Arquivos. */
const PROJECT_FILE_EXT = /\.(dwg|dxf|skp|rvt|rfa|ifc|3dm|pln|max|blend|obj|fbx)$/i;

type State = { phase: 'idle' } | { phase: 'sending'; sent: number } | { phase: 'failed'; sent: number };

/** Painel "Enviar arquivo": o arquivo vai direto do navegador para a subpasta do projeto no Drive. */
export function UploadPanel({ projectId, onClose, onUploaded }: { projectId: string; onClose: () => void; onUploaded: (f: ProjectFile) => void }) {
  const [target, setTarget] = useState<Target>('photos');
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [dragging, setDragging] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const sending = state.phase === 'sending';

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !abort.current && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  useEffect(() => () => abort.current?.abort(), []);

  function pick(f: File | undefined) {
    if (!f || sending) return;
    setFile(f);
    setState({ phase: 'idle' });
    if (f.type.startsWith('image/')) setTarget('photos');
    else if (PROJECT_FILE_EXT.test(f.name)) setTarget('files');
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  async function send() {
    if (!file) return;
    const controller = new AbortController();
    abort.current = controller;
    setState({ phase: 'sending', sent: 0 });
    try {
      const created = await uploadFile(projectId, file, target, (sent) => setState({ phase: 'sending', sent }), controller.signal);
      abort.current = null;
      onUploaded(created);
    } catch (err) {
      abort.current = null;
      if (err instanceof UploadError && err.reason === 'aborted') setState({ phase: 'idle' });
      else setState((s) => ({ phase: 'failed', sent: 'sent' in s ? s.sent : 0 }));
    }
  }

  function cancel() {
    if (abort.current) abort.current.abort();
    else onClose();
  }

  const sent = state.phase === 'idle' ? 0 : state.sent;
  const percent = file ? Math.min(100, Math.floor((sent / Math.max(file.size, 1)) * 100)) : 0;

  return (
    <aside className="side-panel" aria-labelledby="upload-title">
      <div className="side-panel__form">
        <div className="side-panel__top">
          <h2 id="upload-title" className="side-panel__title">
            Enviar arquivo
          </h2>
          <IconButton icon="x" label="Fechar" variant="ghost" size={isMobile ? 'md' : 'sm'} onClick={cancel} />
        </div>
        <p className="side-panel__intro">O arquivo vai direto do seu computador para a pasta do projeto no Google Drive.</p>

        <div>
          <Select
            label="Pasta · obrigatório"
            variant="box"
            options={(['photos', 'contracts', 'files'] as Target[]).map((t) => ({ value: t, label: SUBFOLDER_LABEL[t] }))}
            value={target}
            disabled={sending}
            onChange={(e) => setTarget(e.target.value as Target)}
          />
          <p className="side-panel__hint">{TARGETS[target]}</p>
        </div>

        <label
          className={`dropzone${dragging ? ' is-dragging' : ''}${sending ? ' is-disabled' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={input} type="file" className="visually-hidden" disabled={sending} onChange={(e) => pick(e.target.files?.[0])} />
          <span className="dropzone__title">{isMobile ? 'Escolher arquivo' : 'Arraste o arquivo para cá'}</span>
          <span className="dropzone__hint">{isMobile ? 'Toque para abrir seus arquivos' : 'ou clique para escolher'}</span>
        </label>

        {file && (
          <div className={`upload-card${state.phase === 'failed' ? ' is-failed' : ''}`} aria-live="polite">
            <div className="upload-card__row">
              <span className="upload-card__name">{file.name}</span>
              <span className="upload-card__percent">
                {state.phase === 'failed' ? `Parou em ${percent}%` : state.phase === 'sending' ? `${percent}%` : formatSize(file.size)}
              </span>
            </div>
            {state.phase !== 'idle' && (
              <div className="upload-card__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progresso do envio">
                <span style={{ width: `${percent}%` }} />
              </div>
            )}
            <p className="upload-card__meta">
              {state.phase === 'idle'
                ? `Vai para ${SUBFOLDER_LABEL[target]}`
                : `${formatSize(sent)} de ${formatSize(file.size)} · para ${SUBFOLDER_LABEL[target]}`}
            </p>
          </div>
        )}

        <div className="side-panel__spacer" />

        {sending && <p className="side-panel__note">Mantenha esta tela aberta até o envio terminar. Se cancelar, nada fica salvo no projeto.</p>}

        {state.phase === 'failed' && file && (
          <div className="alert alert--danger" role="alert">
            <span className="alert__icon">
              <AppIcon name="circle-alert" size={18} />
            </span>
            <div>
              <p>O envio de {file.name} não terminou. Nada foi salvo no projeto nem no Google Drive.</p>
              <button type="button" className="link-button" onClick={send}>
                Tentar de novo
              </button>
            </div>
          </div>
        )}

        <div className="side-panel__footer">
          <button type="button" className="text-button" onClick={cancel}>
            {sending ? 'Cancelar envio' : 'Cancelar'}
          </button>
          <Button variant="outline" disabled={!file || sending} aria-busy={sending} onClick={send}>
            {sending ? 'Enviando' : 'Enviar'}
          </Button>
        </div>
      </div>
    </aside>
  );
}
