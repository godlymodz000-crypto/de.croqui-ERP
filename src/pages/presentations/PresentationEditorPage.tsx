import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { AppIcon } from '../../ui/AppIcon';
import { AppLoading } from '../../ui/AppLoading';
import { LoadError } from '../../ui/LoadError';
import { useIsMobile, useMediaQuery } from '../../ui/useMediaQuery';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { presentationsApi, type PresentationWithData } from '../../api/presentations';
import {
  presentationBytes,
  presentationImageIds,
  type AddablePageKind,
  type PresentationContentPage,
  type PresentationCover,
  type PresentationData,
  type PresentationImageRef,
  type PresentationProject,
} from '../../shared/presentation-data';
import { fitZoom, pageNavLabel, zoomCss, zoomIn, zoomLabel, zoomOut } from '../../shared/presentation-calc';
import { CoverSheet } from '../../presentation/CoverSheet';
import { PageSheet } from '../../presentation/PageSheet';
import { coverLook, type CoverMode, type CoverOptions } from '../../presentation/cover';
import '../../presentation/sheets.css';
import logo from '../../design-system/assets/logo/decroqui-imagotipo-horizontal-claro.svg';
import logoDark from '../../design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
import isotipo from '../../design-system/assets/logo/decroqui-isotipo-escuro.svg';
import { CoverImageField, CoverImageLayers, ImageTools, useCoverImage, useImageDrag, type CoverImage } from './CoverImageField';
import {
  backTarget,
  cleanPresentationName,
  clock,
  coverNotice,
  invalidMessage,
  isTooLarge,
  pageKindLabel,
  PDF_ERROR_TEXTS,
  pdfFailure,
  pdfOverflowText,
  pdfSavedLabel,
  pdfUnchangedText,
  presentationNameError,
  projectTabHelp,
  refusedSize,
  SAVE_MESSAGES,
  saveFailure,
  saveLabel,
  tooLargeMessage,
  type PdfState,
  type SaveState,
} from './editor';
import { canWritePresentations } from './list';
import { PAGE_HELP, PageTab, READONLY_HELP, Select } from './PageTab';
import {
  BRAND_SIZE_OPTIONS,
  COVER_COLOR_OPTIONS,
  COVER_IMAGE_KEPT_TEXT,
  COVER_LAYOUT_OPTIONS,
  itemImage,
  NEAR_LIMIT_TEXT,
  PAGE_KIND_LABELS,
  pageItems,
  setItemField,
  sizeLevel,
} from './pageEditor';
import { PagesTab, RemovePageDialog } from './PagesTab';
import { addPage, canStep, currentAfterMove, currentAfterRemove, movePage, removePage, stepPage } from './pagesList';
import { LinkProjectDialog } from './LinkProjectDialog';
import { ExportPdfDialog } from './ExportPdfDialog';
import '../budgets/budgets.css';
import './editor.css';
import './pdf.css';

/** Espera depois da última digitação antes de salvar. */
const SAVE_DELAY_MS = 800;
/** Nova tentativa automática depois de uma falha ao salvar. */
const RETRY_MS = 10_000;
/** Antes do PDF, espera o salvamento em andamento terminar, como no orçamento. */
const PDF_SAVE_WAIT_MS = 15_000;

type PanelTab = 'projeto' | 'paginas' | 'pagina';

/** Id novo de página ou de item (até 40 caracteres, como a API aceita). */
const newId = () => crypto.randomUUID();

/**
 * Editor de apresentação (desenhos 6b-04, 6b-05 e 6b-12): painel à esquerda, visualização à direita.
 * Cada alteração é salva sozinha. No celular (6b-13) não há edição: só a folha como sai no PDF.
 */
export function PresentationEditorPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const canWrite = canWritePresentations(me);
  const isMobile = useIsMobile();
  const [presentation, setPresentation] = useState<PresentationWithData | null>(null);
  const [data, setData] = useState<PresentationData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [loadError, setLoadError] = useState<unknown>(null);
  const [save, setSave] = useState<SaveState>({ kind: 'saved', at: null });
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState<PanelTab>('pagina');
  const [nameDraft, setNameDraft] = useState('');
  const [linking, setLinking] = useState(false);
  const [pdf, setPdf] = useState<PdfState>({ kind: 'idle' });
  const [exporting, setExporting] = useState(false);
  /** Página mostrada na visualização e editada na aba Página (0 é a capa). */
  const [current, setCurrent] = useState(0);
  /** Item aberto na aba Página: o espaço de imagem dele usa a biblioteca. */
  const [openItem, setOpenItem] = useState<string | null>(null);
  /** Página à espera da confirmação de remover (P34). */
  const [removingPage, setRemovingPage] = useState<number | null>(null);

  const dataRef = useRef<PresentationData | null>(null);
  const baseRef = useRef('');
  const dirtyRef = useRef(false);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedRef = useRef(false);
  /** Nome válido ainda não salvo; nulo quando não há nome para enviar. */
  const nameRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await presentationsApi.get(id);
      setPresentation(p);
      setData(p.data);
      setNameDraft(p.name);
      nameRef.current = null;
      dataRef.current = p.data;
      baseRef.current = p.updatedAt;
      dirtyRef.current = false;
      blockedRef.current = false;
      setSave({ kind: 'saved', at: new Date(p.updatedAt) });
      setState('ready');
    } catch (err) {
      setLoadError(err);
      setState(err instanceof ApiError && err.status === 404 ? 'not_found' : 'error');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (inFlightRef.current || blockedRef.current || !dirtyRef.current || !dataRef.current) return;
    // Acima de 1 MB nem envia: o aviso pede para remover conteúdo, e a próxima alteração tenta de novo.
    // O que foi escrito continua na tela e em dataRef.
    if (isTooLarge(dataRef.current)) {
      setSave({ kind: 'too_large', size: presentationBytes(dataRef.current) });
      return;
    }
    inFlightRef.current = true;
    dirtyRef.current = false;
    let tooLarge = false;
    const sentName = nameRef.current;
    setSave({ kind: 'saving' });
    try {
      const saved = await presentationsApi.save(id, {
        data: dataRef.current,
        baseUpdatedAt: baseRef.current,
        ...(sentName !== null ? { name: sentName } : {}),
      });
      if (nameRef.current === sentName) nameRef.current = null;
      baseRef.current = saved.updatedAt;
      setPresentation((p) => (p ? { ...p, ...saved, data: p.data } : saved));
      setSave({ kind: 'saved', at: new Date() });
    } catch (err) {
      dirtyRef.current = true;
      const failure = saveFailure(err);
      if (failure === 'conflict') {
        // Outra aba ou outra pessoa gravou antes: nada é sobrescrito até recarregar.
        blockedRef.current = true;
        setSave({ kind: 'conflict' });
      } else if (failure === 'too_large') {
        tooLarge = true;
        setSave({ kind: 'too_large', size: refusedSize(err) });
      } else if (failure === 'invalid') {
        // A API disse o motivo; tentar de novo daria no mesmo. Espera a próxima alteração.
        tooLarge = true;
        setSave({ kind: 'invalid', message: invalidMessage(err) });
      } else {
        setSave({ kind: 'error' });
        timerRef.current = setTimeout(() => flush(), RETRY_MS);
      }
    } finally {
      inFlightRef.current = false;
    }
    // Algo mudou enquanto salvava: salva de novo. Acima do limite, espera a próxima alteração.
    if (dirtyRef.current && !blockedRef.current && !timerRef.current && !tooLarge) {
      timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
    }
  }, [id]);

  const update = useCallback(
    (change: (d: PresentationData) => PresentationData) => {
      if (!dataRef.current || !canWrite || isMobile) return;
      const next = change(dataRef.current);
      if (next === dataRef.current) return;
      dataRef.current = next;
      setData(next);
      dirtyRef.current = true;
      if (blockedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
    },
    [canWrite, isMobile, flush],
  );

  /** Nome da apresentação: salva junto com o documento; vazio ou longo demais, fica o nome anterior. */
  const changeName = useCallback(
    (value: string) => {
      if (!canWrite || isMobile) return;
      setNameDraft(value);
      if (presentationNameError(value)) {
        nameRef.current = null;
        return;
      }
      nameRef.current = cleanPresentationName(value);
      dirtyRef.current = true;
      if (blockedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
    },
    [canWrite, isMobile, flush],
  );

  const pageCount = data?.paginas.length ?? 1;
  const at = Math.min(current, pageCount - 1);
  const currentPage = data?.paginas[at];

  /** Altera a página `index` do documento. */
  const updatePage = useCallback(
    (index: number, change: (p: PresentationContentPage) => PresentationContentPage) =>
      update((d) => {
        const pg = d.paginas[index];
        if (!pg || pg.tipo === 'capa') return d;
        const next = change(pg);
        if (next === pg) return d;
        return { ...d, paginas: d.paginas.map((x, i) => (i === index ? next : x)) as PresentationData['paginas'] };
      }),
    [update],
  );
  /** Muda a página atual (visualização, aba Página e lista da aba Páginas). */
  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setOpenItem(null);
  }, []);
  /** Ações da aba Páginas: mudam só o documento e passam pelo salvamento automático. */
  const addPageAfter = useCallback(
    (tipo: AddablePageKind) => {
      if (!dataRef.current) return;
      const added = addPage(dataRef.current, tipo, at, newId);
      if (added.data === dataRef.current) return;
      update(() => added.data);
      goTo(added.index);
    },
    [at, update, goTo],
  );
  const movePageBy = useCallback(
    (index: number, dir: -1 | 1) => {
      if (!dataRef.current) return;
      const total = dataRef.current.paginas.length;
      update((d) => movePage(d, index, dir));
      setCurrent(currentAfterMove(at, index, dir, total));
    },
    [at, update],
  );
  const confirmRemovePage = useCallback(() => {
    const index = removingPage;
    setRemovingPage(null);
    if (index === null || !dataRef.current) return;
    const total = dataRef.current.paginas.length;
    update((d) => removePage(d, index));
    goTo(currentAfterRemove(at, index, total));
  }, [removingPage, at, update, goTo]);
  const updateCover = useCallback(
    (change: Partial<PresentationCover>) =>
      update((d) => ({ ...d, paginas: d.paginas.map((pg, i) => (i === 0 ? { ...pg, ...change } : pg)) as PresentationData['paginas'] })),
    [update],
  );

  // Espaço de imagem ativo: o da capa na página 1; nas outras, o do item aberto.
  const slotItem = currentPage && currentPage.tipo !== 'capa' && openItem ? openItem : null;
  const slotImage =
    currentPage?.tipo === 'capa' ? currentPage.imagem : slotItem && currentPage ? (itemImage(currentPage, slotItem) ?? null) : null;
  const setSlotImage = useCallback(
    (imagem: PresentationImageRef | null) => {
      if (at === 0) updateCover({ imagem });
      else if (slotItem) updatePage(at, (p) => setItemField(p, slotItem, 'imagem', imagem));
    },
    [at, slotItem, updateCover, updatePage],
  );
  // A mesma imagem em outro espaço desta apresentação: tirá-la deste não a manda para a lixeira.
  const usedElsewhere = useMemo(() => {
    if (!data || !slotImage) return false;
    const others = {
      ...data,
      paginas: data.paginas.map((pg, i) => {
        if (i !== at) return pg;
        if (pg.tipo === 'capa') return { ...pg, imagem: null };
        return slotItem ? setItemField(pg, slotItem, 'imagem', null) : pg;
      }),
    } as PresentationData;
    return presentationImageIds(others).includes(slotImage.id);
  }, [data, slotImage, at, slotItem]);
  const cover = useCoverImage({
    presentationId: id,
    hasProject: !!presentation?.projectId,
    imagem: slotImage ?? null,
    setImagem: setSlotImage,
    enabled: state === 'ready' && canWrite && !isMobile,
    where: at === 0 ? 'capa' : 'item',
    usedElsewhere,
  });
  const size = useMemo(() => (data ? presentationBytes(data) : 0), [data]);

  // Fechar ou recarregar com alteração ainda não salva: o navegador pergunta antes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || inFlightRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Sair do editor pelo "Voltar" salva o que estiver pendente.
  useEffect(() => () => void flush(), [flush]);

  /**
   * Depois do diálogo (6b-11): salva o que estiver pendente e pede o PDF ao servidor, que gera com o que está
   * gravado. O editor continua livre enquanto isso: só o botão mostra "Gerando PDF".
   */
  const exportPdf = useCallback(async () => {
    setExporting(false);
    setPdf({ kind: 'working' });
    const started = Date.now();
    while (inFlightRef.current && Date.now() - started < PDF_SAVE_WAIT_MS) await new Promise((r) => setTimeout(r, 150));
    await flush();
    if (dirtyRef.current || inFlightRef.current || blockedRef.current) {
      setPdf({ kind: 'error', reason: 'unsaved' });
      return;
    }
    try {
      const { presentation: saved } = await presentationsApi.exportPdf(id);
      setPresentation((p) => (p ? { ...p, pdf: saved.pdf } : p));
      setPdf({ kind: 'idle' });
    } catch (err) {
      setPdf(pdfFailure(err));
    }
  }, [flush, id]);

  const back = backTarget(location.state);

  if (state === 'loading') return <AppLoading />;
  if (state !== 'ready' || !presentation || !data) {
    return (
      <div className="beditor beditor--message">
        <Link to={back.to} className="back-link">
          <AppIcon name="arrow-left" size={18} />
          {back.label}
        </Link>
        {state === 'not_found' ? (
          <p className="people-table__message">Esta apresentação não existe ou o projeto dela foi excluído.</p>
        ) : (
          <LoadError error={loadError} message="Não foi possível abrir a apresentação. Tente de novo em instantes." onRetry={load} />
        )}
      </div>
    );
  }

  const hasProject = !!presentation.projectId;

  const readOnly = !canWrite;
  const nameError = readOnly || isMobile ? null : presentationNameError(nameDraft);
  const shownName = nameError || readOnly || isMobile ? presentation.name : cleanPresentationName(nameDraft);
  const pdfWorking = pdf.kind === 'working';
  const pdfDialog = exporting && (
    <ExportPdfDialog
      presentation={presentation}
      name={shownName}
      issueDate={data.projeto.data}
      onCancel={() => setExporting(false)}
      onConfirm={() => void exportPdf()}
    />
  );
  const pdfAlert = (pdf.kind === 'error' || pdf.kind === 'unchanged') && (
    // No celular não há edição: o aviso não leva à página.
    <PdfAlert pdf={pdf} onRetry={() => void exportPdf()} onClose={() => setPdf({ kind: 'idle' })} onGoTo={isMobile ? undefined : goTo} />
  );

  if (isMobile) {
    return (
      <MobileView
        presentation={presentation}
        data={data}
        back={back}
        save={save}
        canExport={canWrite}
        cover={cover}
        working={pdfWorking}
        onExport={() => setExporting(true)}
      >
        {pdfAlert && <div className="toast-slot beditor__toast pmobile__toast">{pdfAlert}</div>}
        {pdfDialog}
      </MobileView>
    );
  }

  const mode: CoverMode = readOnly || preview ? 'print' : 'edit';
  const setProject = (key: keyof PresentationProject, value: string) =>
    update((d) => ({ ...d, projeto: { ...d.projeto, [key]: value } }));

  return (
    <div className="beditor peditor">
      <header className="beditor__bar">
        <div className="peditor__left">
          <Link to={back.to} className="beditor__back">
            <AppIcon name="arrow-left" size={18} />
            <span>{back.label}</span>
          </Link>
          {!readOnly && !hasProject && (
            <button type="button" className="peditor__link" onClick={() => setLinking(true)}>
              Vincular a um projeto
            </button>
          )}
        </div>
        <div className="beditor__title">
          <span className="beditor__eyebrow peditor__eyebrow">
            Apresentação nº {presentation.number}
            {hasProject ? '' : ' · Sem projeto'}
          </span>
          <span className="beditor__name">{shownName}</span>
        </div>
        <div className="beditor__actions peditor__actions">
          {readOnly ? (
            presentation.pdf && (
              <a className="peditor__outline" href={presentation.pdf.url} target="_blank" rel="noreferrer" title={presentation.pdf.name ?? undefined}>
                Abrir PDF v{presentation.pdf.version}
              </a>
            )
          ) : (
            <>
              <SaveIndicator save={save} />
              {presentation.pdf && (
                <a className="peditor__pdf" href={presentation.pdf.url} target="_blank" rel="noreferrer" title={presentation.pdf.name ?? undefined}>
                  {pdfSavedLabel(presentation.pdf)}
                </a>
              )}
              <button
                type="button"
                className={`peditor__toggle${preview ? ' is-on' : ''}`}
                aria-pressed={preview}
                onClick={() => setPreview((v) => !v)}
              >
                <span className="peditor__switch" aria-hidden>
                  <span className="peditor__knob" />
                </span>
                Prévia
              </button>
              <button type="button" className="peditor__primary" disabled={pdfWorking} aria-busy={pdfWorking} onClick={() => setExporting(true)}>
                {pdfWorking ? 'Gerando PDF' : 'Salvar em PDF'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="peditor__body">
        <aside className="ppanel" aria-label="Painel de edição">
          <div className="ppanel__top">
            <span className="ppanel__eyebrow">Kit de apresentações</span>
            <span className="ppanel__title">Monte a apresentação</span>
            <div className="ppanel__tabs" role="tablist" aria-label="Painel">
              {(
                [
                  ['projeto', 'Projeto'],
                  ['paginas', 'Páginas'],
                  ['pagina', 'Página'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  className={`ppanel__tab${tab === value ? ' is-active' : ''}`}
                  onClick={() => setTab(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ppanel__content">
            {tab === 'projeto' && (
              <ProjectTab
                name={readOnly ? presentation.name : nameDraft}
                nameError={nameError}
                onName={changeName}
                projeto={data.projeto}
                readOnly={readOnly}
                hasProject={hasProject}
                onChange={setProject}
                onBlur={() => void flush()}
              />
            )}
            {tab === 'paginas' && (
              <PagesTab
                data={data}
                current={at}
                readOnly={readOnly}
                onSelect={goTo}
                onMove={movePageBy}
                onAskRemove={setRemovingPage}
                onAdd={addPageAfter}
              />
            )}
            {tab === 'pagina' &&
              (currentPage && currentPage.tipo !== 'capa' ? (
                <PageTab
                  key={currentPage.id}
                  page={currentPage}
                  index={at}
                  readOnly={readOnly}
                  onChange={(change) => updatePage(at, change)}
                  newId={newId}
                  openItem={openItem && pageItems(currentPage).some((it) => it.id === openItem) ? openItem : null}
                  onOpenItem={setOpenItem}
                  image={readOnly ? null : cover}
                  onBlur={() => void flush()}
                />
              ) : (
                <CoverTab
                  readOnly={readOnly}
                  hasProject={hasProject}
                  cover={cover}
                  options={coverOptions(data.paginas[0])}
                  onOptions={(change) => updateCover(change)}
                />
              ))}
          </div>
        </aside>

        <Preview
          data={data}
          index={at}
          onIndex={goTo}
          mode={mode}
          kind={readOnly ? 'readonly' : mode}
          cover={cover}
          tools={!readOnly && !preview && at === 0}
        />
      </div>

      {!readOnly && <CoverImageLayers cover={cover} projectName={presentation.project?.name ?? null} />}
      {linking && (
        <LinkProjectDialog
          presentation={presentation}
          images={cover.library?.length ?? 0}
          beforeLink={flush}
          onClose={() => setLinking(false)}
          onLinked={() => {
            setLinking(false);
            void load();
          }}
        />
      )}

      {pdfDialog}
      {!readOnly && removingPage !== null && data.paginas[removingPage] && (
        <RemovePageDialog data={data} index={removingPage} onCancel={() => setRemovingPage(null)} onConfirm={confirmRemovePage} />
      )}

      {(save.kind === 'error' || save.kind === 'conflict' || save.kind === 'too_large' || save.kind === 'invalid' || pdfAlert || (!readOnly && sizeLevel(size) === 'near')) && (
        <div className="toast-slot beditor__toast">
          {pdfAlert}
          {/* Perto do limite (80% de 1 MB): só avisa; o salvamento continua. */}
          {!readOnly && sizeLevel(size) === 'near' && save.kind !== 'too_large' && (
            <div className="save-alert save-alert--warning" role="status">
              <p>{NEAR_LIMIT_TEXT}</p>
            </div>
          )}
          {save.kind === 'saved' || save.kind === 'saving' ? null : save.kind === 'conflict' ? (
            <div className="save-alert save-alert--warning" role="alert">
              <p>{SAVE_MESSAGES.conflict}</p>
              <button type="button" className="link-button" onClick={() => void load()}>
                Recarregar apresentação
              </button>
            </div>
          ) : (
            <div className="save-alert save-alert--danger" role="alert">
              <p>{save.kind === 'too_large' ? tooLargeMessage(save.size) : save.kind === 'invalid' ? save.message : SAVE_MESSAGES[save.kind]}</p>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  dirtyRef.current = true;
                  void flush();
                }}
              >
                Tentar agora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Avisos do PDF (6b-11): sem alterações (ardósia) e erro (terracota), no canto, como os de 6b-05. */
function PdfAlert({ pdf, onRetry, onClose, onGoTo }: { pdf: PdfState; onRetry: () => void; onClose: () => void; onGoTo?: (index: number) => void }) {
  if (pdf.kind === 'unchanged') {
    return (
      <div className="save-alert save-alert--info palert" role="status">
        <p>{pdfUnchangedText(pdf.version)}</p>
        <div className="palert__actions">
          <a className="link-button" href={pdf.url} target="_blank" rel="noreferrer" title={pdf.name ?? undefined}>
            Abrir PDF atual
          </a>
          <span aria-hidden>·</span>
          <button type="button" className="link-button" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    );
  }
  if (pdf.kind !== 'error') return null;
  return (
    <div className="save-alert save-alert--danger palert" role="alert">
      <p>{pdf.reason === 'overflow' ? pdfOverflowText(pdf.overflow) : PDF_ERROR_TEXTS[pdf.reason]}</p>
      <div className="palert__actions">
        {/* Além do limite, tentar de novo daria no mesmo: leva à primeira folha que passou, ou só fecha. */}
        {pdf.reason === 'overflow' && pdf.overflow.length > 0 && onGoTo && (
          <>
            <button type="button" className="link-button" onClick={() => onGoTo(pdf.overflow[0].page)}>
              {pdf.overflow[0].page === 0 ? 'Ver a capa' : `Ver a página ${String(pdf.overflow[0].page + 1).padStart(2, '0')}`}
            </button>
            <span aria-hidden>·</span>
          </>
        )}
        {pdf.reason !== 'overflow' && (
          <>
            <button type="button" className="link-button" onClick={onRetry}>
              Tentar de novo
            </button>
            <span aria-hidden>·</span>
          </>
        )}
        <button type="button" className="link-button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function SaveIndicator({ save }: { save: SaveState }) {
  const tone = save.kind === 'error' || save.kind === 'too_large' ? 'danger' : save.kind === 'conflict' ? 'warning' : 'ok';
  return (
    <span className={`peditor__status is-${tone}`} role="status">
      <span className="peditor__dot" aria-hidden />
      {saveLabel(save)}
    </span>
  );
}

/** Área da visualização: barra com página e zoom, e a folha reduzida para caber (zoom de ajuste em A4). */
function Preview({
  data,
  index,
  onIndex,
  mode,
  kind,
  cover,
  tools,
}: {
  data: PresentationData;
  /** Página mostrada (0 é a capa). */
  index: number;
  onIndex: (index: number) => void;
  mode: CoverMode;
  kind: CoverMode | 'readonly';
  cover: CoverImage;
  /** Ferramentas e arrastar só com a Prévia desligada. */
  tools: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState<number | null>(null);
  const compact = useMediaQuery('(max-width: 1279px)');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFit(fitZoom(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const z = zoom ?? fit;
  const drag = useImageDrag(cover);
  const page = data.paginas[index] ?? data.paginas[0];
  const options = coverOptions(data.paginas[0]);
  const showTools = tools && !!cover.src && page.tipo === 'capa' && coverLook(options).hasImageArea;
  const total = data.paginas.length;
  return (
    <section className="ppreview" aria-label="Visualização">
      <div className="ppreview__bar">
        <button type="button" className="ppreview__step" aria-label="Página anterior" disabled={!canStep(index, -1, total)} onClick={() => onIndex(stepPage(index, -1, total))}>
          ‹
        </button>
        <span className="ppreview__page">{pageNavLabel(index, total)}</span>
        <button type="button" className="ppreview__step" aria-label="Próxima página" disabled={!canStep(index, 1, total)} onClick={() => onIndex(stepPage(index, 1, total))}>
          ›
        </button>
        <span className="ppreview__kind">{pageKindLabel(kind, compact, page.tipo)}</span>
        <button type="button" className="ppreview__zoom" aria-label="Diminuir zoom" onClick={() => setZoom(zoomOut(z))}>
          −
        </button>
        <span className="ppreview__zoom-value">{zoomLabel(z)}</span>
        <button type="button" className="ppreview__zoom" aria-label="Aumentar zoom" onClick={() => setZoom(zoomIn(z))}>
          +
        </button>
      </div>
      <div ref={ref} className="ppreview__area">
        <div className="ppreview__sheet" style={{ zoom: zoomCss(z) }}>
          {page.tipo === 'capa' ? (
            <CoverSheet
              projeto={data.projeto}
              mode={mode}
              logoSrc={logo}
              logoDarkSrc={logoDark}
              options={options}
              image={coverImage(page, cover)}
              onImageError={cover.imageFailed}
              archProps={showTools ? drag : undefined}
              overlay={
                showTools ? (
                  // No canto de baixo do espaço de imagem, no tamanho real, qualquer que seja o zoom da visualização.
                  <ImageTools
                    cover={cover}
                    className="pimgtools--sheet"
                    style={{ zoom: 1 / z, right: (options.composicao === 'arco' ? 68 : 16) * z, bottom: 16 * z }}
                  />
                ) : undefined
              }
            />
          ) : (
            <PageSheet page={page} projeto={data.projeto} mode={mode} index={index} total={total} imageSrc={cover.imageSrc} isotipoSrc={isotipo} />
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Painel ----------

const PROJECT_FIELDS: { key: Exclude<keyof PresentationProject, 'formato'>; label: string; placeholder?: string; type?: 'date' }[] = [
  { key: 'nome', label: 'Nome do projeto' },
  { key: 'tipo', label: 'Tipo de apresentação', placeholder: 'Ex.: Apresentação de projeto' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'projetista', label: 'Projetista / responsável técnico', placeholder: 'Nome da pessoa responsável' },
  { key: 'registro', label: 'Registro profissional', placeholder: 'Opcional · ex.: CAU, CREA, ABD' },
  { key: 'localizacao', label: 'Localização' },
  { key: 'data', label: 'Data de emissão', type: 'date' },
  { key: 'codigo', label: 'Código do projeto', placeholder: 'Opcional · ex.: DC-2026-014' },
  { key: 'marca', label: 'Marca / escritório', placeholder: 'Ex.: nome do escritório' },
  { key: 'contato', label: 'Contato', placeholder: 'Opcional · e-mail e telefone' },
];

function ProjectTab({
  name,
  nameError,
  onName,
  projeto,
  readOnly,
  hasProject,
  onChange,
  onBlur,
}: {
  name: string;
  nameError: string | null;
  onName: (value: string) => void;
  projeto: PresentationProject;
  readOnly: boolean;
  hasProject: boolean;
  onChange: (key: keyof PresentationProject, value: string) => void;
  onBlur: () => void;
}) {
  return (
    <>
      <label className={`pfield${nameError ? ' has-error' : ''}`}>
        <span className="pfield__label">Nome da apresentação</span>
        <input
          className="pfield__input"
          value={name}
          maxLength={200}
          disabled={readOnly}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'pname-error' : undefined}
          onChange={(e) => onName(e.target.value)}
          onBlur={onBlur}
        />
        {nameError && (
          <span id="pname-error" className="pfield__error">
            {nameError}
          </span>
        )}
      </label>
      <div className="ppanel__section">
        <h2 className="ppanel__section-title">Dados do projeto</h2>
        <p className="ppanel__help">{projectTabHelp(hasProject)}</p>
      </div>
      {PROJECT_FIELDS.map((f) => (
        <label key={f.key} className="pfield">
          <span className="pfield__label">{f.label}</span>
          <input
            className="pfield__input"
            type={f.type ?? 'text'}
            value={projeto[f.key]}
            placeholder={f.placeholder}
            disabled={readOnly}
            onChange={(e) => onChange(f.key, e.target.value)}
            onBlur={onBlur}
          />
        </label>
      ))}
      <div className="ppanel__section">
        <h2 className="ppanel__section-title">Documento</h2>
      </div>
      <div className="pfield">
        <span className="pfield__label">Formato da página</span>
        <span className="pselect pselect--fixed">A4 paisagem · 297 × 210 mm (único formato)</span>
      </div>
      <p className="ppanel__help">Logotipo, cores e tipografia vêm do Brand Kit De.Croqui. A cor da capa é escolhida na página da capa.</p>
    </>
  );
}

/** Opções da capa guardadas no documento. */
function coverOptions(page: PresentationData['paginas'][0]): CoverOptions {
  return { composicao: page.composicao, cor: page.cor, marca: page.marca };
}

/**
 * Imagem da capa para a folha. O gancho de imagem segue o espaço ativo: na capa, é a imagem dela. Fora da capa
 * (celular, leitor), a imagem guardada no documento, pelo endereço da biblioteca.
 */
function coverImage(page: PresentationCover, cover: CoverImage): { src: string; ref: PresentationImageRef } | null {
  if (!page.imagem) return null;
  if (cover.imagem?.id === page.imagem.id) return cover.src ? { src: cover.src, ref: page.imagem } : null;
  return { src: cover.imageSrc(page.imagem.id), ref: page.imagem };
}

/** Seletores da capa (6c, E4): composição, cor e marca, como nos desenhos 6c-01 a 6c-11. */
function CoverTab({
  readOnly,
  hasProject,
  cover,
  options,
  onOptions,
}: {
  readOnly: boolean;
  hasProject: boolean;
  cover: CoverImage;
  options: CoverOptions;
  onOptions: (change: Partial<CoverOptions>) => void;
}) {
  const hasImage = coverLook(options).hasImageArea;
  return (
    <>
      <div className="ppanel__head">
        <span className="ppanel__kicker">Página 01 · Capa</span>
        <h2 className="ppanel__page-title">Capa</h2>
        <p className="ppanel__help">{readOnly ? READONLY_HELP : PAGE_HELP}</p>
      </div>
      <p className="ppanel__notice">{readOnly ? 'Para editar, peça acesso de colaborador a quem administra o estúdio.' : coverNotice(hasProject)}</p>
      <Select
        label="Composição"
        value={options.composicao}
        options={COVER_LAYOUT_OPTIONS}
        disabled={readOnly}
        onChange={(v) => onOptions({ composicao: v as CoverOptions['composicao'] })}
      />
      <Select label="Cor da capa" value={options.cor} options={COVER_COLOR_OPTIONS} disabled={readOnly} onChange={(v) => onOptions({ cor: v as CoverOptions['cor'] })} />
      <Select
        label="Tamanho da marca"
        value={options.marca}
        options={BRAND_SIZE_OPTIONS}
        disabled={readOnly}
        onChange={(v) => onOptions({ marca: v as CoverOptions['marca'] })}
      />
      {!readOnly && (hasImage ? <CoverImageField cover={cover} /> : <p className="ppanel__help">{COVER_IMAGE_KEPT_TEXT}</p>)}
    </>
  );
}

// ---------- Celular (6b-13) ----------

function MobileView({
  presentation,
  data,
  back,
  save,
  canExport,
  cover,
  working,
  onExport,
  children,
}: {
  presentation: PresentationWithData;
  data: PresentationData;
  back: { to: string; label: string };
  save: SaveState;
  canExport: boolean;
  cover: CoverImage;
  /** O PDF está sendo gerado: o botão mostra "Gerando PDF". */
  working: boolean;
  /** Abre o diálogo de exportar, o mesmo do computador. */
  onExport: () => void;
  /** Avisos do PDF e o diálogo. */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState(0.32);
  const [index, setIndex] = useState(0);
  const total = data.paginas.length;
  const at = Math.min(index, total - 1);
  const page = data.paginas[at];
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setZ(el.clientWidth / 1123);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sub = [`Nº ${presentation.number}`, presentation.project?.name, save.kind === 'saved' && save.at ? `Salvo às ${clock(save.at)}` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="beditor pmobile">
      <header className="pmobile__bar">
        <Link to={back.to} className="pmobile__back" aria-label={back.label}>
          <AppIcon name="arrow-left" size={18} />
        </Link>
        <div className="pmobile__title">
          <span className="pmobile__name">{presentation.name}</span>
          <span className="pmobile__sub">{sub}</span>
        </div>
      </header>
      <div className="pmobile__body">
        <p className="pmobile__intro">Edição só no computador. Aqui você vê a apresentação como vai sair no PDF.</p>
        <div ref={ref} className="pmobile__sheet">
          <div className="ppreview__sheet" style={{ zoom: zoomCss(z) }}>
            {page.tipo === 'capa' ? (
              <CoverSheet
                projeto={data.projeto}
                mode="print"
                logoSrc={logo}
                logoDarkSrc={logoDark}
                options={coverOptions(page)}
                image={coverImage(page, cover)}
                onImageError={cover.imageFailed}
              />
            ) : (
              <PageSheet page={page} projeto={data.projeto} mode="print" index={at} total={total} imageSrc={cover.imageSrc} isotipoSrc={isotipo} />
            )}
          </div>
        </div>
        {/* Navega entre as páginas sem editar (E5). */}
        <div className="pmobile__nav">
          <button type="button" className="pmobile__step" aria-label="Página anterior" disabled={!canStep(at, -1, total)} onClick={() => setIndex(stepPage(at, -1, total))}>
            ‹
          </button>
          <p className="pmobile__label">
            {pageNavLabel(at, total)} · {PAGE_KIND_LABELS[page.tipo]}
          </p>
          <button type="button" className="pmobile__step" aria-label="Próxima página" disabled={!canStep(at, 1, total)} onClick={() => setIndex(stepPage(at, 1, total))}>
            ›
          </button>
        </div>
      </div>
      {(presentation.pdf || canExport) && (
        <div className="pmobile__foot">
          {/* PDF salvo: quem só lê também abre no Drive. */}
          {presentation.pdf && (
            <div className="pmobile__pdf">
              <span>{pdfSavedLabel(presentation.pdf, true)}</span>
              <a href={presentation.pdf.url} target="_blank" rel="noreferrer" title={presentation.pdf.name ?? undefined}>
                Abrir no Drive
              </a>
            </div>
          )}
          {canExport && (
            <div className="pmobile__bottom">
              <button type="button" className="peditor__primary peditor__primary--full" disabled={working} aria-busy={working} onClick={onExport}>
                {working ? 'Gerando PDF' : 'Salvar em PDF'}
              </button>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
