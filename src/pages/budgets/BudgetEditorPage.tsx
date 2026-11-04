import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Button, Dialog } from '../../ui/ds';
import { AppIcon } from '../../ui/AppIcon';
import { AppLoading } from '../../ui/AppLoading';
import { LoadError } from '../../ui/LoadError';
import { useIsMobile } from '../../ui/useMediaQuery';
import { useSession } from '../../session';
import { ApiError } from '../../api/http';
import { budgetsApi, type BudgetData, type BudgetWithData } from '../../api/budgets';
import { addRoom, applyToAll, removeRoom, toggleOption } from '../../shared/budget-calc';
import { FittedBudgetSheets, PROPERTY_MAX_LINES, usePropertyLines } from '../../budget/BudgetSheets';
import '../../budget/sheets.css';
import logo from '../../design-system/assets/logo/decroqui-imagotipo-horizontal-escuro.svg';
import { canExportBudgets, canWriteBudgets, clock } from './shared';
import './budgets.css';

/** Espera depois da última digitação antes de salvar. */
const SAVE_DELAY_MS = 800;
/** Nova tentativa automática depois de uma falha ao salvar. */
const RETRY_MS = 10_000;
/** Largura da folha A4 em px (210 mm). */
const SHEET_PX = 794;

type SaveState = { kind: 'saved'; at: Date | null } | { kind: 'saving' } | { kind: 'error' } | { kind: 'conflict' };

/**
 * Editor de orçamento (quadros "ERP · Editor de orçamento"): painel à esquerda, folhas A4 à direita.
 * Cada alteração é salva sozinha no ERP; a barra superior mostra "Salvo às HH:MM".
 */
export function BudgetEditorPage() {
  const { id = '' } = useParams();
  const session = useSession();
  const me = session.status === 'authenticated' ? session.user : null;
  const canWrite = canWriteBudgets(me);
  const isMobile = useIsMobile();
  const [budget, setBudget] = useState<BudgetWithData | null>(null);
  const [data, setData] = useState<BudgetData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading');
  const [loadError, setLoadError] = useState<unknown>(null);
  const [save, setSave] = useState<SaveState>({ kind: 'saved', at: null });
  const [mobileTab, setMobileTab] = useState<'fill' | 'sheets'>('fill');
  const [removing, setRemoving] = useState<number | null>(null);

  const dataRef = useRef<BudgetData | null>(null);
  const baseRef = useRef<string>('');
  const dirtyRef = useRef(false);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedRef = useRef(false);

  const load = useCallback(async () => {
    try {
      const b = await budgetsApi.get(id);
      setBudget(b);
      setData(b.data);
      dataRef.current = b.data;
      baseRef.current = b.updatedAt;
      dirtyRef.current = false;
      blockedRef.current = false;
      setSave({ kind: 'saved', at: new Date(b.updatedAt) });
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
    inFlightRef.current = true;
    dirtyRef.current = false;
    setSave({ kind: 'saving' });
    try {
      const saved = await budgetsApi.save(id, { data: dataRef.current, baseUpdatedAt: baseRef.current });
      baseRef.current = saved.updatedAt;
      setBudget((b) => (b ? { ...b, ...saved, data: b.data } : saved));
      setSave({ kind: 'saved', at: new Date() });
    } catch (err) {
      dirtyRef.current = true;
      if (err instanceof ApiError && err.status === 409) {
        // Outra aba ou outra pessoa gravou antes: nada é sobrescrito até recarregar.
        blockedRef.current = true;
        setSave({ kind: 'conflict' });
      } else {
        setSave({ kind: 'error' });
        timerRef.current = setTimeout(() => flush(), RETRY_MS);
      }
    } finally {
      inFlightRef.current = false;
    }
    if (dirtyRef.current && !blockedRef.current && !timerRef.current) timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
  }, [id]);

  const update = useCallback(
    (change: (d: BudgetData) => BudgetData) => {
      if (!dataRef.current || !canWrite) return;
      const next = change(dataRef.current);
      if (next === dataRef.current) return;
      dataRef.current = next;
      setData(next);
      dirtyRef.current = true;
      if (blockedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
    },
    [canWrite, flush],
  );

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

  if (state === 'loading') return <AppLoading />;
  if (state !== 'ready' || !budget || !data) {
    return (
      <div className="beditor beditor--message">
        <Link to="/orcamentos" className="back-link">
          <AppIcon name="arrow-left" size={18} />
          Voltar para Orçamentos
        </Link>
        {state === 'not_found' ? (
          <p className="people-table__message">Este orçamento não existe ou o projeto dele foi excluído.</p>
        ) : (
          <LoadError error={loadError} message="Não foi possível abrir o orçamento. Tente de novo em instantes." onRetry={load} />
        )}
      </div>
    );
  }

  const back = budget.project
    ? { to: `/projetos/${budget.project.id}`, label: 'Voltar para o projeto' }
    : { to: '/orcamentos?aba=sem-projeto', label: 'Voltar para Orçamentos' };
  const eyebrow = `Orçamento nº ${budget.number} · ${budget.project ? budget.project.name : 'Sem projeto'}`;

  const status = canWrite ? <SaveStatus save={save} /> : <span className="beditor__status">Somente leitura</span>;
  const pdfButton = canExportBudgets(me) ? (
    // A geração do PDF entra no passo seguinte, depois da aprovação das bibliotecas.
    <Button variant="primary" disabled fullWidth={isMobile}>
      Salvar em PDF
    </Button>
  ) : null;

  const panel = (
    <BudgetPanel
      data={data}
      readOnly={!canWrite}
      onChange={update}
      onRemoveRoom={(i) => setRemoving(i)}
      onBlur={() => void flush()}
    />
  );
  const sheets = <SheetsPreview data={data} />;

  return (
    <div className={`beditor${isMobile ? ' beditor--mobile' : ''}`}>
      <header className="beditor__bar">
        <Link to={back.to} className="beditor__back" aria-label={isMobile ? back.label : undefined}>
          <AppIcon name="arrow-left" size={18} />
          {!isMobile && <span>{back.label}</span>}
        </Link>
        <div className="beditor__title">
          {!isMobile && <span className="beditor__eyebrow">{eyebrow}</span>}
          <span className="beditor__name">{budget.name}</span>
          {isMobile && (
            <span className="beditor__sub">
              Nº {budget.number} · {status}
            </span>
          )}
        </div>
        {!isMobile && (
          <div className="beditor__actions">
            {status}
            {pdfButton}
          </div>
        )}
      </header>

      {isMobile && (
        <div className="beditor__tabs" role="tablist" aria-label="Editor">
          <button type="button" role="tab" aria-selected={mobileTab === 'fill'} className={`budget-tabs__tab${mobileTab === 'fill' ? ' is-active' : ''}`} onClick={() => setMobileTab('fill')}>
            Preencher
          </button>
          <button type="button" role="tab" aria-selected={mobileTab === 'sheets'} className={`budget-tabs__tab${mobileTab === 'sheets' ? ' is-active' : ''}`} onClick={() => setMobileTab('sheets')}>
            Ver folhas
          </button>
        </div>
      )}

      <div className="beditor__body">
        {(!isMobile || mobileTab === 'fill') && panel}
        {(!isMobile || mobileTab === 'sheets') && sheets}
      </div>

      {isMobile && pdfButton && <div className="beditor__bottom">{pdfButton}</div>}

      {save.kind === 'error' && (
        <div className="toast-slot beditor__toast">
          <div className="save-alert save-alert--danger" role="alert">
            <p>Não foi possível salvar as últimas alterações. Elas continuam aqui e o ERP tenta de novo sozinho.</p>
            <button type="button" className="link-button" onClick={() => void flush()}>
              Tentar agora
            </button>
          </div>
        </div>
      )}
      {save.kind === 'conflict' && (
        <div className="toast-slot beditor__toast">
          <div className="save-alert save-alert--warning" role="alert">
            <p>Este orçamento foi alterado em outra aba ou por outra pessoa. Recarregue para ver a versão atual antes de continuar.</p>
            <button type="button" className="link-button" onClick={() => void load()}>
              Recarregar orçamento
            </button>
          </div>
        </div>
      )}

      {removing !== null && data.ambientes[removing] && (
        <Dialog
          open
          onClose={() => setRemoving(null)}
          width={440}
          eyebrow="Ambientes"
          title="Remover este ambiente?"
          footer={
            <>
              <button type="button" className="text-button" onClick={() => setRemoving(null)}>
                Cancelar
              </button>
              <Button
                variant="outline"
                onClick={() => {
                  const index = removing;
                  setRemoving(null);
                  update((d) => removeRoom(d, index));
                }}
              >
                Remover
              </Button>
            </>
          }
        >
          <p>
            {data.ambientes[removing].nome.trim() ? `“${data.ambientes[removing].nome.trim()}”` : 'O ambiente sem nome'} sai do orçamento e dos totais.
          </p>
        </Dialog>
      )}
    </div>
  );
}

function SaveStatus({ save }: { save: SaveState }) {
  if (save.kind === 'saving') return <span className="beditor__status">Salvando</span>;
  if (save.kind === 'error') return <span className="beditor__status is-danger">Não salvo</span>;
  if (save.kind === 'conflict') return <span className="beditor__status is-warning">Alterado em outra aba</span>;
  return <span className="beditor__status">{save.at ? `Salvo às ${clock(save.at)}` : 'Salvo'}</span>;
}

/** Folhas reduzidas para caber na área, como no arquivo: zoom = (largura − 56) / 794, entre 0,4 e 1. */
function SheetsPreview({ data }: { data: BudgetData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setZoom(Math.min(1, Math.max(0.4, (el.clientWidth - 56) / SHEET_PX)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="beditor__preview" style={{ ['--sheet-zoom' as string]: zoom }} aria-label="Folhas do orçamento">
      <FittedBudgetSheets data={data} logoSrc={logo} />
    </div>
  );
}

// ---------- Painel ----------

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="bpanel__section">
      <div className="bpanel__section-head">
        <h2 className="bpanel__section-title">{title}</h2>
        {aside && <span className="bpanel__label">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  multiline,
  type = 'text',
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  multiline?: boolean;
  type?: 'text' | 'date' | 'email' | 'tel';
  onBlur: () => void;
}) {
  return (
    <label className="bfield">
      <span className="bpanel__label">{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
      ) : (
        <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
      )}
    </label>
  );
}

/** Aviso quando o imóvel passa de três linhas na folha: só as três primeiras aparecem nas folhas e no PDF. */
function PropertyLinesHint({ text }: { text: string }) {
  const lines = usePropertyLines(text);
  if (lines <= PROPERTY_MAX_LINES) return null;
  return (
    <span className="bpanel__hint bpanel__hint--warning" role="status">
      O texto do imóvel ocupa {lines} linhas na folha. Só as três primeiras aparecem no orçamento; resuma o texto.
    </span>
  );
}

/** Campo de valor em reais. Vazio conta como zero, como no arquivo. */
function MoneyInput({
  value,
  onChange,
  disabled,
  label,
  onBlur,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled: boolean;
  label: string;
  onBlur: () => void;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      aria-label={label}
      placeholder="0"
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        const n = raw === '' ? null : Number(raw);
        onChange(n === null || Number.isFinite(n) ? n : null);
      }}
      onBlur={onBlur}
    />
  );
}

function BudgetPanel({
  data,
  readOnly,
  onChange,
  onRemoveRoom,
  onBlur,
}: {
  data: BudgetData;
  readOnly: boolean;
  onChange: (change: (d: BudgetData) => BudgetData) => void;
  onRemoveRoom: (index: number) => void;
  onBlur: () => void;
}) {
  const set =
    <K extends keyof BudgetData>(key: K) =>
    (value: BudgetData[K]) =>
      onChange((d) => ({ ...d, [key]: value }));
  const text = (key: 'cliente' | 'contatoCliente' | 'data' | 'validade' | 'imovel' | 'cartao' | 'projetista' | 'contatoProjetista' | 'email' | 'regiao') => ({
    value: data[key],
    onChange: set(key),
    disabled: readOnly,
    onBlur,
  });

  return (
    <div className="bpanel">
      <div className="bpanel__intro">
        <span className="bpanel__eyebrow">Kit de orçamento</span>
        <span className="bpanel__title">Preencha a proposta</span>
        <span className="bpanel__text">Os valores e totais se atualizam sozinhos. Cada alteração é salva automaticamente no ERP.</span>
      </div>

      <Section title="Opções no orçamento">
        {(['op1', 'op2'] as const).map((key) => (
          <label key={key} className="bcheck">
            <input type="checkbox" checked={data[key]} disabled={readOnly} onChange={() => onChange((d) => toggleOption(d, key))} />
            {key === 'op1' ? 'Opção 01 · Com parceria em marcenaria' : 'Opção 02 · Projeto completo'}
          </label>
        ))}
        <span className="bpanel__hint">Marque uma ou as duas. Só as marcadas entram no PDF.</span>
      </Section>

      <Section title="Cliente">
        <TextField label="Nome do cliente" {...text('cliente')} />
        <TextField label="Contato do cliente" type="tel" {...text('contatoCliente')} />
        <div className="bpanel__pair">
          <TextField label="Data" type="date" {...text('data')} />
          <TextField label="Válida até" type="date" {...text('validade')} />
        </div>
        <TextField label="Imóvel" multiline {...text('imovel')} />
        <PropertyLinesHint text={data.imovel} />
      </Section>

      <Section title="Ambientes" aside="Valor · opção 02">
        {data.ambientes.length === 0 && <p className="bpanel__empty">Nenhum ambiente ainda. Adicione o primeiro abaixo.</p>}
        {data.ambientes.map((a, i) => (
          <div key={i} className="broom">
            <input
              aria-label={`Nome do ambiente ${i + 1}`}
              value={a.nome}
              disabled={readOnly}
              onChange={(e) => onChange((d) => ({ ...d, ambientes: d.ambientes.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)) }))}
              onBlur={onBlur}
            />
            <MoneyInput
              label={`Valor do ambiente ${i + 1}`}
              value={a.valor}
              disabled={readOnly}
              onChange={(v) => onChange((d) => ({ ...d, ambientes: d.ambientes.map((x, j) => (j === i ? { ...x, valor: v } : x)) }))}
              onBlur={onBlur}
            />
            {!readOnly && (
              <button type="button" className="broom__remove" aria-label={`Remover ${a.nome || 'ambiente'}`} onClick={() => onRemoveRoom(i)}>
                ×
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button type="button" className="bpanel__add" onClick={() => onChange(addRoom)}>
            Adicionar ambiente
          </button>
        )}
        <div className="bfield">
          <span className="bpanel__label">Aplicar valor a todos (opção 02)</span>
          <div className="bpanel__apply">
            <MoneyInput label="Valor para todos os ambientes" value={data.op2Todos} disabled={readOnly} onChange={set('op2Todos')} onBlur={onBlur} />
            {!readOnly && (
              <button type="button" className="bpanel__apply-button" onClick={() => onChange(applyToAll)} disabled={data.ambientes.length === 0}>
                Aplicar
              </button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Opção 01 · marcenaria parceira">
        <div className="bpanel__pair">
          <label className="bfield">
            <span className="bpanel__label">Render 3D / ambiente</span>
            <MoneyInput label="Render 3D por ambiente" value={data.op1Por} disabled={readOnly} onChange={set('op1Por')} onBlur={onBlur} />
          </label>
          <label className="bfield">
            <span className="bpanel__label">Executivo geral</span>
            <MoneyInput label="Executivo geral" value={data.op1Exec} disabled={readOnly} onChange={set('op1Exec')} onBlur={onBlur} />
          </label>
        </div>
        <label className="bcheck">
          <input type="checkbox" checked={data.nota} disabled={readOnly} onChange={(e) => set('nota')(e.target.checked)} />
          Mostrar nota da marcenaria parceira
        </label>
      </Section>

      <Section title="Pagamento">
        <TextField label="Cartão" {...text('cartao')} />
      </Section>

      <Section title="Estúdio">
        <TextField label="Projetista" {...text('projetista')} />
        <TextField label="Contato da projetista" type="tel" {...text('contatoProjetista')} />
        <TextField label="E-mail" type="email" {...text('email')} />
        <TextField label="Região" {...text('regiao')} />
      </Section>
    </div>
  );
}
