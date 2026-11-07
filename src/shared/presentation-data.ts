// Conteúdo da Apresentação (Fase 6b): forma do JSON guardado em presentations.data, documento novo e
// validação (planejamento.md, seção 4.4). Módulo puro, sem dependências: a API valida com ele e a tela
// monta o editor com ele. Na 6b a apresentação tem só a capa; os outros tipos de página entram na 6c.

/** Limite do documento salvo, em bytes do JSON em UTF-8: o salvamento automático envia tudo a cada vez. */
export const PRESENTATION_MAX_BYTES = 512 * 1024;
/** Maior texto aceito em um campo. Bem acima do que a capa usa; impede colar arquivos no JSON. */
export const PRESENTATION_MAX_TEXT = 2000;

export const COVER_LAYOUTS = ['arco', 'foto', 'tipo'] as const;
export const COVER_COLORS = ['vinho', 'noite', 'linho'] as const;
export const BRAND_SIZES = ['p', 'm', 'g'] as const;
export const IMAGE_FITS = ['fit', 'fill'] as const;
export const PAGE_FORMATS = ['a4'] as const;

/** Dados da aba Projeto. Aparecem na capa e nos rodapés. */
export interface PresentationProject {
  nome: string;
  tipo: string;
  cliente: string;
  projetista: string;
  registro: string;
  localizacao: string;
  /** Data de emissão, AAAA-MM-DD ou vazio. Entra no nome do PDF (P7). */
  data: string;
  codigo: string;
  marca: string;
  contato: string;
  formato: (typeof PAGE_FORMATS)[number];
}

/** Imagem colocada num espaço de imagem. Só a referência à biblioteca e o enquadramento. */
export interface PresentationImageRef {
  /** presentation_images.id */
  id: string;
  ajuste: (typeof IMAGE_FITS)[number];
  /** De 1 a 4. */
  zoom: number;
  /** Enquadramento, de 0 a 100%. */
  x: number;
  y: number;
}

export interface PresentationCover {
  id: string;
  tipo: 'capa';
  composicao: (typeof COVER_LAYOUTS)[number];
  cor: (typeof COVER_COLORS)[number];
  marca: (typeof BRAND_SIZES)[number];
  imagem: PresentationImageRef | null;
}

export type PresentationPage = PresentationCover;

export interface PresentationData {
  v: 1;
  projeto: PresentationProject;
  paginas: PresentationPage[];
}

const PROJECT_FIELDS = ['nome', 'tipo', 'cliente', 'projetista', 'registro', 'localizacao', 'data', 'codigo', 'marca', 'contato'] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
/** Arquivo embutido como texto (data URL em base64). Imagem só entra por referência. */
const BASE64_RE = /data:[^,]{0,100};base64,/i;

/**
 * Documento novo: só a capa, todos os campos vazios, salvo os copiados do projeto como texto editável.
 * Mudar o cadastro do projeto depois não altera a apresentação.
 */
export function emptyPresentation(capaId: string, doProjeto: { nome?: string; cliente?: string; localizacao?: string } = {}): PresentationData {
  return {
    v: 1,
    projeto: {
      nome: doProjeto.nome ?? '',
      tipo: '',
      cliente: doProjeto.cliente ?? '',
      projetista: '',
      registro: '',
      localizacao: doProjeto.localizacao ?? '',
      data: '',
      codigo: '',
      marca: '',
      contato: '',
      formato: 'a4',
    },
    paginas: [{ id: capaId, tipo: 'capa', composicao: 'arco', cor: 'vinho', marca: 'p', imagem: null }],
  };
}

/** Tamanho do documento como será gravado, em bytes. */
export function presentationBytes(data: unknown): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

export type PresentationDataError = 'invalid' | 'base64';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);
const inRange = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function parseImage(v: unknown): PresentationImageRef | null | undefined {
  if (v === null || v === undefined) return null;
  if (!isObj(v)) return undefined;
  const { id, ajuste, zoom, x, y } = v;
  if (typeof id !== 'string' || !UUID_RE.test(id) || !oneOf(IMAGE_FITS, ajuste)) return undefined;
  if (!inRange(zoom, 1, 4) || !inRange(x, 0, 100) || !inRange(y, 0, 100)) return undefined;
  return { id: id.toLowerCase(), ajuste, zoom, x, y };
}

/**
 * Confere e normaliza o documento recebido. Campos desconhecidos são descartados; tipo errado, valor
 * fora da lista ou página que não existe na 6b recusam o documento inteiro. O limite de tamanho e as
 * referências de imagem são conferidos na API.
 */
export function parsePresentationData(input: unknown): { data: PresentationData } | { error: PresentationDataError } {
  if (!isObj(input) || input.v !== 1) return { error: 'invalid' };
  const projeto = input.projeto;
  if (!isObj(projeto)) return { error: 'invalid' };
  const out = emptyPresentation('capa');
  for (const key of PROJECT_FIELDS) {
    const v = projeto[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string' || v.length > PRESENTATION_MAX_TEXT) return { error: 'invalid' };
    if (BASE64_RE.test(v)) return { error: 'base64' };
    out.projeto[key] = v;
  }
  if (out.projeto.data && !DATE_RE.test(out.projeto.data)) return { error: 'invalid' };
  if (projeto.formato !== undefined && !oneOf(PAGE_FORMATS, projeto.formato)) return { error: 'invalid' };

  // Na 6b a apresentação tem uma página só: a capa.
  const paginas = input.paginas;
  if (!Array.isArray(paginas) || paginas.length !== 1) return { error: 'invalid' };
  const capa = paginas[0];
  if (!isObj(capa) || capa.tipo !== 'capa' || typeof capa.id !== 'string' || !PAGE_ID_RE.test(capa.id)) return { error: 'invalid' };
  if (!oneOf(COVER_LAYOUTS, capa.composicao) || !oneOf(COVER_COLORS, capa.cor) || !oneOf(BRAND_SIZES, capa.marca)) {
    return { error: 'invalid' };
  }
  const imagem = parseImage(capa.imagem);
  if (imagem === undefined) return { error: 'invalid' };
  out.paginas = [{ id: capa.id, tipo: 'capa', composicao: capa.composicao, cor: capa.cor, marca: capa.marca, imagem }];
  return { data: out };
}

/** Ids das imagens citadas no documento, sem repetição. */
export function presentationImageIds(data: PresentationData): string[] {
  return [...new Set(data.paginas.map((p) => p.imagem?.id).filter((id): id is string => !!id))];
}
