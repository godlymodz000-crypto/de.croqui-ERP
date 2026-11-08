import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { AppIcon } from '../../ui/AppIcon';
import { AppLoading } from '../../ui/AppLoading';
import { LoadError } from '../../ui/LoadError';
import { useIsMobile, useMediaQuery } from '../../ui/useMediaQuery';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { presentationsApi, type PresentationWithData } from '../../api/presentations';
import type { PresentationData, PresentationImageRef, PresentationProject } from '../../shared/presentation-data';
import { fitZoom, pageNavLabel, zoomCss, zoomIn, zoomLabel, zoomOut } from '../../shared/presentation-calc';
import { CoverSheet } from '../../presentation/CoverSheet';
import type { CoverMode } from '../../presentation/cover';
import '../../presentation/sheets.css';
import logo from '../../design-system/assets/logo/decroqui-imagotipo-horizontal-claro.svg';
import { CoverImageField, CoverImageLayers, ImageTools, useCoverImage, useImageDrag, type CoverImage } from './CoverImageField';
import {
  backTarget,
  cleanPresentationName,
  clock,
  coverNotice,
  isTooLarge,
  pageKindLabel,
  presentationNameError,
  projectTabHelp,
  SAVE_MESSAGES,
  saveFailure,
  saveLabel,
  type SaveState,
} from './editor';
import { canWritePresentations } from './list';
import { LinkProjectDialog } from './LinkProjectDialog';
import '../budgets/budgets.css';
import './editor.css';

/** Espera depois da última digitação antes de salvar. */
const SAVE_DELAY_MS = 800;
/** Nova tentativa automática depois de uma falha ao salvar. */
const RETRY_MS = 10_000;

type PanelTab = 'projeto' | 'paginas' | 'pagina';

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
    // Acima de 512 KB nem envia: o aviso pede para encurtar, e a próxima alteração tenta de novo.
    if (isTooLarge(dataRef.current)) {
      setSave({ kind: 'too_large' });
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
        setSave({ kind: 'too_large' });
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

  const setCoverImage = useCallback(
    (imagem: PresentationImageRef | null) =>
      update((d) => ({ ...d, paginas: d.paginas.map((pg, i) => (i === 0 ? { ...pg, imagem } : pg)) as PresentationData['paginas'] })),
    [update],
  );
  const cover = useCoverImage({
    presentationId: id,
    hasProject: !!presentation?.projectId,
    imagem: data?.paginas[0]?.imagem ?? null,
    setImagem: setCoverImage,
    enabled: state === 'ready' && canWrite && !isMobile,
  });

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

  if (isMobile) {
    return <MobileView presentation={presentation} data={data} back={back} save={save} canExport={canWrite} cover={cover} />;
  }

  const readOnly = !canWrite;
  const mode: CoverMode = readOnly || preview ? 'print' : 'edit';
  const setProject = (key: keyof PresentationProject, value: string) =>
    update((d) => ({ ...d, projeto: { ...d.projeto, [key]: value } }));
  const nameError = readOnly ? null : presentationNameError(nameDraft);
  const shownName = nameError || readOnly ? presentation.name : cleanPresentationName(nameDraft);

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
              {/* O PDF chega na etapa E9: até lá o botão fica no lugar, desativado. */}
              <button type="button" className="peditor__primary" disabled title="Disponível em breve">
                Salvar em PDF
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
            {tab === 'paginas' && <PagesTab onOpen={() => setTab('pagina')} />}
            {tab === 'pagina' && <CoverTab readOnly={readOnly} hasProject={hasProject} cover={cover} />}
          </div>
        </aside>

        <Preview data={data} mode={mode} kind={readOnly ? 'readonly' : mode} cover={cover} tools={!readOnly && !preview} />
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

      {(save.kind === 'error' || save.kind === 'conflict' || save.kind === 'too_large') && (
        <div className="toast-slot beditor__toast">
          {save.kind === 'conflict' ? (
            <div className="save-alert save-alert--warning" role="alert">
              <p>{SAVE_MESSAGES.conflict}</p>
              <button type="button" className="link-button" onClick={() => void load()}>
                Recarregar apresentação
              </button>
            </div>
          ) : (
            <div className="save-alert save-alert--danger" role="alert">
              <p>{SAVE_MESSAGES[save.kind]}</p>
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
  mode,
  kind,
  cover,
  tools,
}: {
  data: PresentationData;
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
  const showTools = tools && !!cover.src;
  return (
    <section className="ppreview" aria-label="Visualização">
      <div className="ppreview__bar">
        <button type="button" className="ppreview__step" aria-label="Página anterior" disabled>
          ‹
        </button>
        <span className="ppreview__page">{pageNavLabel(0, data.paginas.length)}</span>
        <button type="button" className="ppreview__step" aria-label="Próxima página" disabled>
          ›
        </button>
        <span className="ppreview__kind">{pageKindLabel(kind, compact)}</span>
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
          <CoverSheet
            projeto={data.projeto}
            mode={mode}
            logoSrc={logo}
            image={cover.src && cover.imagem ? { src: cover.src, ref: cover.imagem } : null}
            onImageError={cover.imageFailed}
            archProps={showTools ? drag : undefined}
            overlay={
              showTools ? (
                // No canto de baixo do arco, no tamanho real, qualquer que seja o zoom da visualização.
                <ImageTools cover={cover} className="pimgtools--sheet" style={{ zoom: 1 / z, right: 68 * z, bottom: 16 * z }} />
              ) : undefined
            }
          />
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

function PagesTab({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <div className="ppanel__section ppanel__section--row">
        <h2 className="ppanel__section-title">Páginas</h2>
        <span className="ppanel__count">1 página</span>
      </div>
      <button type="button" className="ppage is-active" onClick={onOpen}>
        <span className="ppage__number">01</span>
        <span className="ppage__text">
          <span className="ppage__kind">Capa · Imagem em arco</span>
          <span className="ppage__name">Capa</span>
        </span>
      </button>
      <div className="ppanel__section">
        <h2 className="ppanel__section-title">Outras páginas</h2>
        <p className="ppanel__help">Nesta versão, a apresentação tem só a capa. A capa não pode ser movida, duplicada nem excluída.</p>
      </div>
    </>
  );
}

/** Na E7 cada menu tem uma opção só: arco, vinho e marca pequena (as outras ainda não têm desenho aprovado). */
function CoverTab({ readOnly, hasProject, cover }: { readOnly: boolean; hasProject: boolean; cover: CoverImage }) {
  const select = (label: string, value: string) => (
    <label className="pfield">
      <span className="pfield__label">{label}</span>
      <span className="pselect-wrap">
        <select className="pselect" value={value} disabled={readOnly} onChange={() => {}}>
          <option value={value}>{value}</option>
        </select>
        <AppIcon name="chevron-down" size={16} />
      </span>
    </label>
  );
  return (
    <>
      <div className="ppanel__head">
        <span className="ppanel__kicker">Página 01 · Capa</span>
        <h2 className="ppanel__page-title">Capa</h2>
        <p className="ppanel__help">
          {readOnly
            ? 'Somente leitura. Você pode ver a apresentação e abrir o PDF salvo, mas não pode alterar nem gerar um PDF novo.'
            : 'Edite os campos aqui. Com a Prévia desligada, o que falta preencher aparece em cinza e não sai no PDF.'}
        </p>
      </div>
      <p className="ppanel__notice">{readOnly ? 'Para editar, peça acesso de colaborador a quem administra o estúdio.' : coverNotice(hasProject)}</p>
      {select('Composição', 'Imagem em arco')}
      {select('Cor da capa', 'Vinho')}
      {select('Tamanho da marca', 'Pequeno')}
      {!readOnly && <CoverImageField cover={cover} />}
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
}: {
  presentation: PresentationWithData;
  data: PresentationData;
  back: { to: string; label: string };
  save: SaveState;
  canExport: boolean;
  cover: CoverImage;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [z, setZ] = useState(0.32);
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
            <CoverSheet
              projeto={data.projeto}
              mode="print"
              logoSrc={logo}
              image={cover.src && cover.imagem ? { src: cover.src, ref: cover.imagem } : null}
              onImageError={cover.imageFailed}
            />
          </div>
        </div>
        <p className="pmobile__label">{pageNavLabel(0, data.paginas.length)} · Capa</p>
      </div>
      {canExport && (
        <div className="pmobile__bottom">
          {/* O PDF chega na etapa E9: até lá o botão fica no lugar, desativado. */}
          <button type="button" className="peditor__primary peditor__primary--full" disabled title="Disponível em breve">
            Salvar em PDF
          </button>
        </div>
      )}
    </div>
  );
}
