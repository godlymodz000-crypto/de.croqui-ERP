// Cálculos e textos do Orçamento (Fase 6a). Mesmas fórmulas e textos do arquivo offline
// (revisao-fase6/funcionalidades.md, seção 2.5), com duas mudanças intencionais:
// 1. Arredondamento: cada linha é arredondada em centavos e o total é a soma das linhas arredondadas.
//    No arquivo, só a exibição arredondava, e as parcelas mostradas podiam não somar o total.
// 2. "1 ambiente" no singular também na linha do render (o arquivo escrevia "1 ambientes").
// Módulo puro, sem dependências: o servidor calcula total_cents e a tela monta as folhas com ele.

export interface BudgetRoom {
  nome: string;
  /** Valor da Opção 02, em reais. Nulo é campo vazio e conta como zero. */
  valor: number | null;
}

/** Conteúdo do orçamento, guardado em budgets.data. */
export interface BudgetData {
  op1: boolean;
  op2: boolean;
  cliente: string;
  contatoCliente: string;
  /** AAAA-MM-DD ou vazio. */
  data: string;
  validade: string;
  imovel: string;
  ambientes: BudgetRoom[];
  /** "Aplicar valor a todos" e valor do ambiente novo. */
  op2Todos: number | null;
  /** Render 3D por ambiente (Opção 01). */
  op1Por: number | null;
  /** Executivo geral (Opção 01). */
  op1Exec: number | null;
  nota: boolean;
  cartao: string;
  projetista: string;
  contatoProjetista: string;
  email: string;
  regiao: string;
}

/** Orçamento novo: zerado, sem textos, valores nem exemplos. As duas opções começam marcadas. */
export function emptyBudget(): BudgetData {
  return {
    op1: true,
    op2: true,
    cliente: '',
    contatoCliente: '',
    data: '',
    validade: '',
    imovel: '',
    ambientes: [],
    op2Todos: null,
    op1Por: null,
    op1Exec: null,
    nota: true,
    cartao: '',
    projetista: '',
    contatoProjetista: '',
    email: '',
    regiao: '',
  };
}

export const MAX_TEXT = 2000;
export const MAX_ROOMS = 200;
/** Teto de cada valor: R$ 1 bilhão. Acima disso, o JSON é recusado. */
export const MAX_VALUE = 1_000_000_000;

const STRING_FIELDS = ['cliente', 'contatoCliente', 'data', 'validade', 'imovel', 'cartao', 'projetista', 'contatoProjetista', 'email', 'regiao'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function num(value: unknown): number | null | undefined {
  if (value === null || value === '' || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > MAX_VALUE) return undefined;
  return value;
}

/**
 * Confere e normaliza o JSON recebido da tela. Campos ausentes ficam com o valor do orçamento novo.
 * Devolve nulo quando algum campo tem tipo errado ou passa dos limites.
 */
export function parseBudgetData(input: unknown): BudgetData | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out = emptyBudget();
  for (const key of STRING_FIELDS) {
    const v = src[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string' || v.length > MAX_TEXT) return null;
    out[key] = v;
  }
  for (const key of ['data', 'validade'] as const) {
    if (out[key] && !DATE_RE.test(out[key])) return null;
  }
  for (const key of ['op1', 'op2', 'nota'] as const) {
    const v = src[key];
    if (v === undefined) continue;
    if (typeof v !== 'boolean') return null;
    out[key] = v;
  }
  if (!out.op1 && !out.op2) return null;
  for (const key of ['op2Todos', 'op1Por', 'op1Exec'] as const) {
    if (src[key] === undefined) continue;
    const v = num(src[key]);
    if (v === undefined) return null;
    out[key] = v;
  }
  if (src.ambientes !== undefined) {
    if (!Array.isArray(src.ambientes) || src.ambientes.length > MAX_ROOMS) return null;
    for (const room of src.ambientes as unknown[]) {
      if (!room || typeof room !== 'object') return null;
      const { nome, valor } = room as Record<string, unknown>;
      const v = num(valor);
      if (typeof nome !== 'string' || nome.length > MAX_TEXT || v === undefined) return null;
      out.ambientes.push({ nome, valor: v });
    }
  }
  return out;
}

/**
 * Reais para centavos, com a metade arredondada para longe do zero. O valor é lido em decimal (12
 * algarismos significativos), para que 100,005 vire 10001 e não 10000 por causa do ponto flutuante.
 */
export function toCents(reais: number | null): number {
  if (reais === null || !Number.isFinite(reais)) return 0;
  const scaled = Number((reais * 100).toPrecision(12));
  return Math.sign(scaled) * Math.round(Math.abs(scaled));
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Centavos para "R$ 1.234,56", com o espaço não separável depois de "R$", como no arquivo. */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100);
}

/** AAAA-MM-DD para DD/MM/AAAA; vazio vira "—". */
export function formatDate(iso: string): string {
  if (!iso || !DATE_RE.test(iso)) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function rooms(n: number): string {
  return n === 1 ? '1 ambiente' : `${n} ambientes`;
}

const SUBTITLE = 'Orçamento design de interiores residencial';

export interface BudgetTotals {
  rooms: number;
  /** Render por ambiente, já em centavos. */
  op1PerCents: number;
  /** Linha do render: n × valor por ambiente, arredondada em centavos. */
  op1RenderCents: number;
  op1ExecCents: number;
  /** Soma das linhas arredondadas. */
  op1TotalCents: number;
  /** Cada ambiente em centavos. */
  op2LineCents: number[];
  op2TotalCents: number;
  /** n > 0 e todos os valores iguais. */
  op2Uniform: boolean;
}

export function budgetTotals(d: BudgetData): BudgetTotals {
  const n = d.ambientes.length;
  const op1RenderCents = toCents(n * (d.op1Por ?? 0));
  const op1ExecCents = toCents(d.op1Exec ?? 0);
  const op2LineCents = d.ambientes.map((a) => toCents(a.valor));
  const first = d.ambientes[0]?.valor ?? 0;
  return {
    rooms: n,
    op1PerCents: toCents(d.op1Por),
    op1RenderCents,
    op1ExecCents,
    op1TotalCents: op1RenderCents + op1ExecCents,
    op2LineCents,
    op2TotalCents: op2LineCents.reduce((s, c) => s + c, 0),
    op2Uniform: n > 0 && d.ambientes.every((a) => (a.valor ?? 0) === first),
  };
}

/** Total guardado em budgets.total_cents: o maior total entre as opções marcadas. */
export function budgetHeadlineCents(d: BudgetData): number {
  const t = budgetTotals(d);
  return Math.max(d.op1 ? t.op1TotalCents : 0, d.op2 ? t.op2TotalCents : 0);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Quantos ambientes cabem na folha da Opção 02 e nas folhas de continuação (ver budgetSheets). */
export interface RoomsPerSheet {
  first: number;
  next: number;
}
/**
 * Valores provisórios. Com 10 ambientes o arquivo passou de 297 mm (329 mm), então a primeira folha fica
 * com até 8. Os números finais são medidos na folha A4 do editor, no passo da tela.
 */
export const ROOMS_PER_SHEET: RoomsPerSheet = { first: 8, next: 22 };

/** Divide a lista de ambientes da Opção 02 em folhas A4, para nenhuma folha passar de 297 mm. */
export function splitRooms<T>(list: T[], cap: RoomsPerSheet = ROOMS_PER_SHEET): T[][] {
  const out: T[][] = [list.slice(0, cap.first)];
  for (let i = cap.first; i < list.length; i += cap.next) out.push(list.slice(i, i + cap.next));
  return out;
}

/** Textos e números das folhas, como aparecem no documento. */
export function budgetView(d: BudgetData, cap: RoomsPerSheet = ROOMS_PER_SHEET) {
  const t = budgetTotals(d);
  const both = d.op1 && d.op2;
  const roomSheets = d.op2 ? splitRooms(d.ambientes.map((a, i) => ({ nome: a.nome, valor: formatCents(t.op2LineCents[i]) })), cap) : [];
  const totalPages = 1 + (d.op1 ? 1 : 0) + roomSheets.length;
  const op1Page = d.op1 ? 2 : null;
  const op2Page = d.op2 ? (d.op1 ? 3 : 2) : null;
  const page = (p: number) => `${pad(p)} / ${pad(totalPages)}`;
  const brl = formatCents;

  const op1Card = {
    etiqueta: both ? 'Opção 01' : 'Sua proposta',
    nome: 'Com parceria em marcenaria',
    total: brl(t.op1TotalCents),
    descricao: `${brl(t.op1PerCents)} por ambiente em 3D + ${brl(t.op1ExecCents)} do executivo detalhado geral`,
  };
  const uniformValue = brl(t.op2LineCents[0] ?? 0);
  const op2Card = {
    etiqueta: both ? 'Opção 02' : 'Sua proposta',
    nome: 'Projeto completo',
    total: brl(t.op2TotalCents),
    descricao: t.op2Uniform
      ? `${uniformValue} por ambiente, com detalhamento completo incluso em todos`
      : `Valor por ambiente com detalhamento completo incluso — ver página ${pad(op2Page ?? 0)}`,
  };

  return {
    totals: t,
    totalPages,
    resumo: {
      tituloInvestimento: both ? 'Opções de investimento' : 'Investimento',
      contagem: rooms(t.rooms),
      cartoes: [...(d.op1 ? [op1Card] : []), ...(d.op2 ? [op2Card] : [])],
      data: formatDate(d.data),
      validade: `Esta proposta é válida até ${formatDate(d.validade)}.`,
      pagina: page(1),
    },
    opcao01: d.op1
      ? {
          sobretitulo: both ? `Opção 01 · ${SUBTITLE}` : SUBTITLE,
          porAmbiente: `${brl(t.op1PerCents)} por ambiente`,
          linhaRender: `Render 3D (${rooms(t.rooms)} × ${brl(t.op1PerCents)})`,
          valorRender: brl(t.op1RenderCents),
          executivo: `${brl(t.op1ExecCents)} para o projeto`,
          total: brl(t.op1TotalCents),
          nota: d.nota,
          pagina: page(op1Page!),
        }
      : null,
    opcao02: d.op2
      ? {
          sobretitulo: both ? `Opção 02 · ${SUBTITLE}` : SUBTITLE,
          porAmbiente: t.op2Uniform ? `${uniformValue} por ambiente` : 'Conforme o ambiente',
          contagem: `${rooms(t.rooms)} no total`,
          folhas: roomSheets.map((list, i) => ({ ambientes: list, pagina: page(op2Page! + i), ultima: i === roomSheets.length - 1 })),
          total: brl(t.op2TotalCents),
          pagina: page(op2Page!),
        }
      : null,
  };
}

// Ações do painel, iguais às do arquivo (casos orc-20 a orc-23).

export function applyToAll(d: BudgetData): BudgetData {
  return { ...d, ambientes: d.ambientes.map((a) => ({ ...a, valor: d.op2Todos })) };
}

export function addRoom(d: BudgetData): BudgetData {
  return { ...d, ambientes: [...d.ambientes, { nome: 'Novo ambiente', valor: d.op2Todos }] };
}

export function removeRoom(d: BudgetData, index: number): BudgetData {
  return { ...d, ambientes: d.ambientes.filter((_, i) => i !== index) };
}

/** Liga ou desliga uma opção. A única opção marcada não desmarca. */
export function toggleOption(d: BudgetData, option: 'op1' | 'op2'): BudgetData {
  const other = option === 'op1' ? 'op2' : 'op1';
  if (d[option] && !d[other]) return d;
  return { ...d, [option]: !d[option] };
}
