// Conteúdo da Apresentação: forma do JSON guardado em presentations.data, documento novo, página nova de
// cada tipo e validação. Módulo puro, sem dependências: a API valida com ele e a tela monta o editor com ele.
// 6b: só a capa (revisao-fase6b/planejamento.md, seção 4.4).
// 6c: os seis tipos de página, a capa única em primeiro e os limites de texto, de itens e de páginas
// (revisao-fase6c/planejamento.md, seção 2, e decisoes.md, respostas P30 a P33). O formato continua v: 1,
// e o documento salvo na 6b continua válido sem conversão. A prancha de detalhamento fica para a 6d.

/**
 * Limite do documento salvo, em bytes do JSON em UTF-8: o salvamento automático envia tudo a cada vez.
 * Era 512 KB na 6b; passou a 1 MiB na 6c (E2, decisão de 2026-11-08), com o aviso de 80% no editor (E4).
 */
export const PRESENTATION_MAX_BYTES = 1024 * 1024;
/** Maior texto aceito num campo longo (introdução, texto do bloco, observações). Impede colar arquivos no JSON. */
export const PRESENTATION_MAX_TEXT = 2000;
/** Maior texto aceito num campo curto (sobretítulo, título, categoria, legenda, escala). */
export const PRESENTATION_MAX_SHORT = 200;
/** Páginas por apresentação, com a capa (P31). */
export const PRESENTATION_MAX_PAGES = 40;
/**
 * Itens por lista (P31). Desde a E6 da 6c, 6 em cada lista: blocos de texto (decisão de 2026-11-08), porque com
 * 12 só cabia uma linha em cada bloco e, na composição Coluna, 12 blocos não cabiam nem vazios; materiais e
 * notas (decisão de 2026-11-15), pelo mesmo motivo e para seguir o limite dos blocos.
 */
export const PRESENTATION_MAX_BLOCKS = 6;
export const PRESENTATION_MAX_MATERIALS = 6;
export const PRESENTATION_MAX_NOTES = 6;
/**
 * Fotos diferentes numa apresentação, contando a capa e as guardadas e escondidas (decisão de 2026-11-15). Com
 * mais, o PDF pode não ser gerado: 50 fotos geram em cerca de 40 s no Edge local e 120 passam do prazo.
 */
export const PRESENTATION_MAX_PHOTOS = 50;
/** "Várias imagens do ambiente": de 4 a 8 imagens (P31). É também o máximo guardado em qualquer composição. */
export const PRESENTATION_GRID_MIN = 4;
export const PRESENTATION_MAX_VISUAL_IMAGES = 8;

export const COVER_LAYOUTS = ['arco', 'foto', 'tipo'] as const;
export const COVER_COLORS = ['vinho', 'noite', 'linho'] as const;
export const BRAND_SIZES = ['p', 'm', 'g'] as const;
export const IMAGE_FITS = ['fit', 'fill'] as const;
/** Formato das páginas da apresentação: A4, A3 e Tela 16:9 (`AP_FORMATS` do arquivo offline; 6d, E2). */
export const PAGE_FORMATS = ['a4', 'a3', 'wide'] as const;
/** Folha da prancha: só A4 ou A3 paisagem, independente do formato da apresentação (6d, P38). */
export const PRANCHA_SHEETS = ['a4', 'a3'] as const;
/** Versão da moldura gravada na prancha quando a imagem é importada (M8). Só existe a v1. */
export const PRANCHA_FRAME_VERSION = 1 as const;

/** Tipos de página aceitos na 6c, na ordem do menu de adicionar (6c-21, P36), depois da capa. */
export const PAGE_TYPES = ['capa', 'texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos', 'prancha'] as const;
/** Tipos que a aba Páginas adiciona: todos, menos a capa (6c-21, P36). */
export const ADDABLE_PAGE_TYPES = ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'] as const;

export const TEXT_LAYOUTS = ['diagonal', 'lado', 'coluna', 'destaque', 'livre'] as const;
export const TEXT_IMAGE_SHAPES = ['arco', 'retangular'] as const;
export const TEXT_IMAGE_POSITIONS = ['auto', 'esquerda', 'direita', 'largura'] as const;
export const TEXT_IMAGE_HEIGHTS = ['p', 'm', 'g'] as const;
export const VISUAL_LAYOUTS = ['lado', 'duo', 'principal', 'iso', 'grade'] as const;
export const TECHNICAL_LAYOUTS = ['1', '2', '3', '4'] as const;

/** Imagens que cada composição mostra. Em "grade", o mínimo; o máximo é PRESENTATION_MAX_VISUAL_IMAGES. */
export const VISUAL_COUNT: Record<(typeof VISUAL_LAYOUTS)[number], number> = { lado: 1, duo: 2, principal: 3, iso: 1, grade: PRESENTATION_GRID_MIN };
/** Desenhos que cada composição do desenho técnico mostra. */
export const TECHNICAL_COUNT: Record<(typeof TECHNICAL_LAYOUTS)[number], number> = { '1': 1, '2': 2, '3': 3, '4': 4 };

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
  /** Em "Só tipografia", fica guardada e não aparece na folha nem no PDF (P33). */
  imagem: PresentationImageRef | null;
}

/**
 * Só a capa tem uma imagem própria no nível da página. Nas outras, as imagens ficam nos itens, e o campo
 * `imagem` não existe: a declaração opcional `never` mantém compilando, até a E3 e a E6, o código da 6b que
 * lê `pagina.imagem` de cada página.
 */
interface NoPageImage {
  imagem?: never;
}

export interface TextBlockText {
  id: string;
  tipo: 'texto';
  titulo: string;
  texto: string;
}

export interface TextBlockImage {
  id: string;
  tipo: 'imagem';
  imagem: PresentationImageRef | null;
  legenda: string;
  formato: (typeof TEXT_IMAGE_SHAPES)[number];
  /** Só vale na composição "livre"; nas outras fica guardada e não muda a folha. */
  posicao: (typeof TEXT_IMAGE_POSITIONS)[number];
  /** Só vale na composição "livre". */
  altura: (typeof TEXT_IMAGE_HEIGHTS)[number];
}

export type TextBlock = TextBlockText | TextBlockImage;

export interface PresentationTextPage extends NoPageImage {
  id: string;
  tipo: 'texto';
  sobretitulo: string;
  titulo: string;
  introducao: string;
  composicao: (typeof TEXT_LAYOUTS)[number];
  blocos: TextBlock[];
}

export interface MoodboardMaterial {
  id: string;
  imagem: PresentationImageRef | null;
  nome: string;
  fabricante: string;
  codigo: string;
  acabamento: string;
  ambiente: string;
  observacoes: string;
}

export interface PresentationMoodboardPage extends NoPageImage {
  id: string;
  tipo: 'moodboard';
  sobretitulo: string;
  titulo: string;
  introducao: string;
  materiais: MoodboardMaterial[];
}

export interface VisualImage {
  id: string;
  imagem: PresentationImageRef | null;
  legenda: string;
}

export interface PresentationVisualPage extends NoPageImage {
  id: string;
  tipo: 'visual';
  sobretitulo: string;
  titulo: string;
  descricao: string;
  programas: string;
  observacoes: string;
  composicao: (typeof VISUAL_LAYOUTS)[number];
  /** As que sobram da composição ficam guardadas e escondidas (P32). */
  imagens: VisualImage[];
}

export interface TechnicalDrawing {
  id: string;
  imagem: PresentationImageRef | null;
  titulo: string;
}

export interface PresentationTechnicalPage extends NoPageImage {
  id: string;
  tipo: 'tecnico';
  sobretitulo: string;
  titulo: string;
  observacoes: string;
  /** Texto livre, sem cálculo de escala, escala gráfica, cota ou carimbo. */
  escala: string;
  unidade: string;
  composicao: (typeof TECHNICAL_LAYOUTS)[number];
  /** Os que sobram da composição ficam guardados e escondidos (P32). */
  desenhos: TechnicalDrawing[];
}

export interface TechnicalNote {
  id: string;
  categoria: string;
  titulo: string;
  texto: string;
}

export interface PresentationNotesPage extends NoPageImage {
  id: string;
  tipo: 'notas';
  sobretitulo: string;
  titulo: string;
  introducao: string;
  notas: TechnicalNote[];
}

export interface PresentationRightsPage extends NoPageImage {
  id: string;
  tipo: 'direitos';
  sobretitulo: string;
  titulo: string;
  autoria: string;
  escritorio: string;
  uso: string;
  restricoes: string;
  observacoes: string;
}

/**
 * Prancha de detalhamento (6d): uma imagem exportada do LayOut que ocupa a folha inteira. Os valores do rodapé
 * são escritos pela página por cima da imagem quando `rodape` está ligado (revisao-fase6d/planejamento.md, seção 2).
 */
export interface PresentationPranchaPage {
  id: string;
  tipo: 'prancha';
  folha: (typeof PRANCHA_SHEETS)[number];
  /** "Ambiente / título da prancha", vai para a célula AMBIENTE. */
  titulo: string;
  /** Célula FASE. A página nova começa com "Executivo". */
  fase: string;
  /** true: a página escreve os valores do rodapé; false: os dados já estão na imagem. */
  rodape: boolean;
  imagem: PresentationImageRef | null;
  /** Versão da moldura, gravada quando a imagem é importada. Obrigatória com imagem; sem imagem, pode faltar. */
  moldura?: typeof PRANCHA_FRAME_VERSION;
}

export type PresentationContentPage =
  | PresentationTextPage
  | PresentationMoodboardPage
  | PresentationVisualPage
  | PresentationTechnicalPage
  | PresentationNotesPage
  | PresentationRightsPage
  | PresentationPranchaPage;

export type PresentationPage = PresentationCover | PresentationContentPage;
export type PresentationPageKind = PresentationPage['tipo'];
/** Tipos de página do menu de adicionar. A prancha entra no menu na E4 da 6d. */
export type AddablePageKind = (typeof ADDABLE_PAGE_TYPES)[number];
export type ContentPageKind = PresentationContentPage['tipo'];

export interface PresentationData {
  v: 1;
  projeto: PresentationProject;
  /** De 1 a 40 páginas. A capa é a única do tipo "capa" e fica sempre em primeiro. */
  paginas: [PresentationCover, ...PresentationContentPage[]];
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

/**
 * Página nova de cada tipo (P30): os títulos e as categorias do arquivo offline (`apNewPage`), os textos
 * longos vazios e os espaços de imagem da composição inicial, vazios. Nenhum texto de exemplo sai no PDF.
 * `newId` gera os ids da página e dos itens.
 */
export function newPresentationPage(tipo: 'texto', newId: () => string): PresentationTextPage;
export function newPresentationPage(tipo: 'moodboard', newId: () => string): PresentationMoodboardPage;
export function newPresentationPage(tipo: 'visual', newId: () => string): PresentationVisualPage;
export function newPresentationPage(tipo: 'tecnico', newId: () => string): PresentationTechnicalPage;
export function newPresentationPage(tipo: 'notas', newId: () => string): PresentationNotesPage;
export function newPresentationPage(tipo: 'direitos', newId: () => string): PresentationRightsPage;
export function newPresentationPage(tipo: 'prancha', newId: () => string): PresentationPranchaPage;
export function newPresentationPage(tipo: ContentPageKind, newId: () => string): PresentationContentPage;
export function newPresentationPage(tipo: ContentPageKind, newId: () => string): PresentationContentPage {
  const id = newId();
  switch (tipo) {
    case 'texto':
      return {
        id,
        tipo,
        sobretitulo: 'Introdução',
        titulo: 'Conceito do projeto',
        introducao: '',
        composicao: 'diagonal',
        blocos: [
          ...['Conceito', 'Referências', 'Objetivos e premissas'].map((titulo): TextBlockText => ({ id: newId(), tipo: 'texto', titulo, texto: '' })),
          newTextImageBlock(newId),
        ],
      };
    case 'moodboard':
      return {
        id,
        tipo,
        sobretitulo: 'Materiais',
        titulo: 'Moodboard de materiais',
        introducao: '',
        materiais: Array.from({ length: 6 }, () => newMaterial(newId)),
      };
    case 'visual':
      return { id, tipo, sobretitulo: 'Projeto', titulo: '', descricao: '', programas: '', observacoes: '', composicao: 'lado', imagens: [newVisualImage(newId)] };
    case 'tecnico':
      return {
        id,
        tipo,
        sobretitulo: 'Documentação técnica',
        titulo: 'Planta baixa',
        observacoes: '',
        escala: '',
        unidade: '',
        composicao: '1',
        desenhos: [newDrawing(newId)],
      };
    case 'notas':
      return {
        id,
        tipo,
        sobretitulo: 'Notas',
        titulo: 'Notas gerais e diretrizes técnicas',
        introducao: '',
        notas: ['Notas gerais', 'Diretrizes técnicas', 'Orientações de execução', 'Especificações'].map((categoria) => newNote(newId, categoria)),
      };
    case 'direitos':
      return { id, tipo, sobretitulo: 'Propriedade intelectual', titulo: 'Direitos autorais', autoria: '', escritorio: '', uso: '', restricoes: '', observacoes: '' };
    case 'prancha':
      // P44: A4, "Executivo" e rodapé ligado. A moldura só é gravada quando a imagem é importada.
      return { id, tipo, folha: 'a4', titulo: '', fase: 'Executivo', rodape: true, imagem: null };
  }
}

/** Itens novos, vazios, para o "+ item" de cada lista. */
export const newTextBlock = (newId: () => string): TextBlockText => ({ id: newId(), tipo: 'texto', titulo: '', texto: '' });
export const newTextImageBlock = (newId: () => string): TextBlockImage => ({
  id: newId(),
  tipo: 'imagem',
  imagem: null,
  legenda: '',
  formato: 'arco',
  posicao: 'auto',
  altura: 'm',
});
export const newMaterial = (newId: () => string): MoodboardMaterial => ({
  id: newId(),
  imagem: null,
  nome: '',
  fabricante: '',
  codigo: '',
  acabamento: '',
  ambiente: '',
  observacoes: '',
});
export const newVisualImage = (newId: () => string): VisualImage => ({ id: newId(), imagem: null, legenda: '' });
export const newDrawing = (newId: () => string): TechnicalDrawing => ({ id: newId(), imagem: null, titulo: '' });
export const newNote = (newId: () => string, categoria = ''): TechnicalNote => ({ id: newId(), categoria, titulo: '', texto: '' });

/** Tamanho do documento como será gravado, em bytes. */
export function presentationBytes(data: unknown): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

/** Código que a API devolve em `fields.data`. Igual ao da 6b. */
export type PresentationDataError = 'invalid' | 'base64';

/** Motivo da recusa, para o teste e para a mensagem do editor. */
export type PresentationDataReason =
  | 'format'
  | 'project'
  | 'base64'
  | 'no_pages'
  | 'too_many_pages'
  | 'cover_first'
  | 'second_cover'
  | 'page_type'
  | 'page_id'
  | 'field'
  | 'text_too_long'
  | 'image'
  | 'too_many_items'
  | 'too_few_items'
  | 'too_many_photos';

export interface PresentationDataFailure {
  error: PresentationDataError;
  reason: PresentationDataReason;
  /** Posição da página (0 é a capa), quando o problema está numa página. */
  pagina?: number;
  /** Campo ou lista com problema, quando há um. */
  campo?: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Mensagem em pt-BR para o motivo da recusa. */
/** Limite de cada lista, para a recusa dizer quantos itens a página aceita. */
const LIST_LIMITS: Record<string, string> = {
  blocos: `${PRESENTATION_MAX_BLOCKS} blocos, contando os de imagem`,
  materiais: `${PRESENTATION_MAX_MATERIALS} materiais`,
  notas: `${PRESENTATION_MAX_NOTES} notas`,
  imagens: `${PRESENTATION_MAX_VISUAL_IMAGES} imagens`,
};

export function presentationDataMessage(f: Pick<PresentationDataFailure, 'reason' | 'pagina' | 'campo'>): string {
  const onde = f.pagina !== undefined ? ` na página ${pad2(f.pagina + 1)}` : '';
  switch (f.reason) {
    case 'base64':
      return `Há um arquivo colado como texto${onde}. Use o espaço de imagem para enviar imagens.`;
    case 'no_pages':
      return 'A apresentação precisa ter a capa.';
    case 'too_many_pages':
      return `A apresentação pode ter até ${PRESENTATION_MAX_PAGES} páginas, com a capa.`;
    case 'cover_first':
      return 'A capa precisa ser a primeira página.';
    case 'second_cover':
      return `A apresentação só pode ter uma capa. Há outra capa${onde}.`;
    case 'page_type':
      return `Tipo de página não aceito${onde}.`;
    case 'text_too_long':
      return `Um texto${onde} passou do limite de caracteres.`;
    case 'too_many_items': {
      const limit = f.campo ? LIST_LIMITS[f.campo] : undefined;
      if (limit && f.pagina !== undefined) return `A página ${pad2(f.pagina + 1)} pode ter até ${limit}.`;
      return `A lista${onde} passou do limite de itens.`;
    }
    case 'too_many_photos':
      return `A apresentação pode ter até ${PRESENTATION_MAX_PHOTOS} fotos, o limite para gerar o PDF. Remova alguma foto para adicionar outra.`;
    case 'too_few_items':
      return `A composição${onde} tem menos espaços de imagem do que precisa.`;
    case 'image':
      return `Uma imagem${onde} não pôde ser lida.`;
    default:
      return `O documento não pôde ser lido${onde}.`;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);
const inRange = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Recusa dentro da leitura de uma página. É lançada e vira o retorno de parsePresentationData. */
class Refuse {
  constructor(
    readonly reason: PresentationDataReason,
    readonly campo?: string,
  ) {}
}

function parseImage(v: unknown, campo: string): PresentationImageRef | null {
  if (v === null || v === undefined) return null;
  if (!isObj(v)) throw new Refuse('image', campo);
  const { id, ajuste, zoom, x, y } = v;
  if (typeof id !== 'string' || !UUID_RE.test(id) || !oneOf(IMAGE_FITS, ajuste)) throw new Refuse('image', campo);
  if (!inRange(zoom, 1, 4) || !inRange(x, 0, 100) || !inRange(y, 0, 100)) throw new Refuse('image', campo);
  return { id: id.toLowerCase(), ajuste, zoom, x, y };
}

/** Texto obrigatório de uma página ou item: string, dentro do limite e sem base64. */
function text(o: Record<string, unknown>, key: string, max: number): string {
  const v = o[key];
  if (typeof v !== 'string') throw new Refuse('field', key);
  if (v.length > max) throw new Refuse('text_too_long', key);
  if (BASE64_RE.test(v)) throw new Refuse('base64', key);
  return v;
}
const short = (o: Record<string, unknown>, key: string) => text(o, key, PRESENTATION_MAX_SHORT);
const long = (o: Record<string, unknown>, key: string) => text(o, key, PRESENTATION_MAX_TEXT);

function bool(o: Record<string, unknown>, key: string): boolean {
  const v = o[key];
  if (typeof v !== 'boolean') throw new Refuse('field', key);
  return v;
}

function pick<T extends string>(o: Record<string, unknown>, key: string, list: readonly T[]): T {
  const v = o[key];
  if (!oneOf(list, v)) throw new Refuse('field', key);
  return v;
}

/** Lista de itens: array, dentro dos limites, cada item um objeto com id único na lista. */
function list<T>(o: Record<string, unknown>, key: string, min: number, max: number, item: (it: Record<string, unknown>) => T): T[] {
  const v = o[key];
  if (!Array.isArray(v)) throw new Refuse('field', key);
  if (v.length > max) throw new Refuse('too_many_items', key);
  if (v.length < min) throw new Refuse('too_few_items', key);
  const ids = new Set<string>();
  return v.map((it) => {
    if (!isObj(it) || typeof it.id !== 'string' || !PAGE_ID_RE.test(it.id) || ids.has(it.id)) throw new Refuse('field', key);
    ids.add(it.id);
    return item(it);
  });
}

function parseTextBlock(b: Record<string, unknown>): TextBlock {
  const id = b.id as string;
  if (b.tipo === 'texto') return { id, tipo: 'texto', titulo: short(b, 'titulo'), texto: long(b, 'texto') };
  if (b.tipo === 'imagem') {
    return {
      id,
      tipo: 'imagem',
      imagem: parseImage(b.imagem, 'blocos'),
      legenda: short(b, 'legenda'),
      formato: pick(b, 'formato', TEXT_IMAGE_SHAPES),
      posicao: pick(b, 'posicao', TEXT_IMAGE_POSITIONS),
      altura: pick(b, 'altura', TEXT_IMAGE_HEIGHTS),
    };
  }
  throw new Refuse('field', 'blocos');
}

function parsePage(p: Record<string, unknown>, id: string): PresentationPage {
  switch (p.tipo) {
    case 'capa':
      return {
        id,
        tipo: 'capa',
        composicao: pick(p, 'composicao', COVER_LAYOUTS),
        cor: pick(p, 'cor', COVER_COLORS),
        marca: pick(p, 'marca', BRAND_SIZES),
        imagem: parseImage(p.imagem, 'imagem'),
      };
    case 'texto':
      return {
        id,
        tipo: 'texto',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        introducao: long(p, 'introducao'),
        composicao: pick(p, 'composicao', TEXT_LAYOUTS),
        blocos: list(p, 'blocos', 0, PRESENTATION_MAX_BLOCKS, parseTextBlock),
      };
    case 'moodboard':
      return {
        id,
        tipo: 'moodboard',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        introducao: long(p, 'introducao'),
        materiais: list(p, 'materiais', 0, PRESENTATION_MAX_MATERIALS, (m) => ({
          id: m.id as string,
          imagem: parseImage(m.imagem, 'materiais'),
          nome: short(m, 'nome'),
          fabricante: short(m, 'fabricante'),
          codigo: short(m, 'codigo'),
          acabamento: short(m, 'acabamento'),
          ambiente: short(m, 'ambiente'),
          observacoes: long(m, 'observacoes'),
        })),
      };
    case 'visual': {
      const composicao = pick(p, 'composicao', VISUAL_LAYOUTS);
      return {
        id,
        tipo: 'visual',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        descricao: long(p, 'descricao'),
        programas: short(p, 'programas'),
        observacoes: long(p, 'observacoes'),
        composicao,
        imagens: list(p, 'imagens', VISUAL_COUNT[composicao], PRESENTATION_MAX_VISUAL_IMAGES, (i) => ({
          id: i.id as string,
          imagem: parseImage(i.imagem, 'imagens'),
          legenda: short(i, 'legenda'),
        })),
      };
    }
    case 'tecnico': {
      const composicao = pick(p, 'composicao', TECHNICAL_LAYOUTS);
      return {
        id,
        tipo: 'tecnico',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        observacoes: long(p, 'observacoes'),
        escala: short(p, 'escala'),
        unidade: short(p, 'unidade'),
        composicao,
        desenhos: list(p, 'desenhos', TECHNICAL_COUNT[composicao], TECHNICAL_COUNT['4'], (d) => ({
          id: d.id as string,
          imagem: parseImage(d.imagem, 'desenhos'),
          titulo: short(d, 'titulo'),
        })),
      };
    }
    case 'notas':
      return {
        id,
        tipo: 'notas',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        introducao: long(p, 'introducao'),
        notas: list(p, 'notas', 0, PRESENTATION_MAX_NOTES, (n) => ({
          id: n.id as string,
          categoria: short(n, 'categoria'),
          titulo: short(n, 'titulo'),
          texto: long(n, 'texto'),
        })),
      };
    case 'direitos':
      return {
        id,
        tipo: 'direitos',
        sobretitulo: short(p, 'sobretitulo'),
        titulo: short(p, 'titulo'),
        autoria: long(p, 'autoria'),
        escritorio: long(p, 'escritorio'),
        uso: long(p, 'uso'),
        restricoes: long(p, 'restricoes'),
        observacoes: long(p, 'observacoes'),
      };
    case 'prancha': {
      const imagem = parseImage(p.imagem, 'imagem');
      const page: PresentationPranchaPage = {
        id,
        tipo: 'prancha',
        folha: pick(p, 'folha', PRANCHA_SHEETS),
        titulo: short(p, 'titulo'),
        fase: short(p, 'fase'),
        rodape: bool(p, 'rodape'),
        imagem,
      };
      // Com imagem, a versão da moldura é obrigatória; sem imagem, pode faltar. Diferente de 1 é recusada.
      if (p.moldura === undefined && imagem === null) return page;
      if (p.moldura !== PRANCHA_FRAME_VERSION) throw new Refuse('field', 'moldura');
      return { ...page, moldura: PRANCHA_FRAME_VERSION };
    }
    default:
      throw new Refuse('page_type', 'tipo');
  }
}

const fail = (reason: PresentationDataReason, extra: { pagina?: number; campo?: string } = {}): PresentationDataFailure => ({
  error: reason === 'base64' ? 'base64' : 'invalid',
  reason,
  ...extra,
});

/**
 * Confere e normaliza o documento recebido. Campos desconhecidos são descartados; nas páginas, todo campo do
 * tipo é obrigatório (o editor sempre envia a página inteira). Tipo errado, valor fora da lista, texto acima do
 * limite, lista fora dos limites, capa fora do primeiro lugar, segunda capa ou tipo de página que não existe
 * recusam o documento inteiro. O limite de tamanho e as referências de imagem são conferidos na API.
 */
export function parsePresentationData(input: unknown): { data: PresentationData } | PresentationDataFailure {
  if (!isObj(input) || input.v !== 1) return fail('format');
  const projeto = input.projeto;
  if (!isObj(projeto)) return fail('project', { campo: 'projeto' });
  const out = emptyPresentation('capa');
  for (const key of PROJECT_FIELDS) {
    const v = projeto[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== 'string') return fail('project', { campo: key });
    if (v.length > PRESENTATION_MAX_TEXT) return fail('text_too_long', { campo: key });
    if (BASE64_RE.test(v)) return fail('base64', { campo: key });
    out.projeto[key] = v;
  }
  if (out.projeto.data && !DATE_RE.test(out.projeto.data)) return fail('project', { campo: 'data' });
  if (projeto.formato !== undefined) {
    if (!oneOf(PAGE_FORMATS, projeto.formato)) return fail('project', { campo: 'formato' });
    out.projeto.formato = projeto.formato;
  }

  // De 1 a 40 páginas, com a capa, e só ela, em primeiro.
  const paginas = input.paginas;
  if (!Array.isArray(paginas)) return fail('format', { campo: 'paginas' });
  if (paginas.length === 0) return fail('no_pages');
  if (paginas.length > PRESENTATION_MAX_PAGES) return fail('too_many_pages');
  const ids = new Set<string>();
  const parsed: PresentationPage[] = [];
  for (const [i, p] of paginas.entries()) {
    if (!isObj(p)) return fail('format', { pagina: i });
    if (i === 0 && p.tipo !== 'capa') return fail('cover_first', { pagina: 0 });
    if (i > 0 && p.tipo === 'capa') return fail('second_cover', { pagina: i });
    if (typeof p.id !== 'string' || !PAGE_ID_RE.test(p.id) || ids.has(p.id)) return fail('page_id', { pagina: i, campo: 'id' });
    ids.add(p.id);
    try {
      parsed.push(parsePage(p, p.id));
    } catch (err) {
      if (err instanceof Refuse) return fail(err.reason, { pagina: i, ...(err.campo ? { campo: err.campo } : {}) });
      throw err;
    }
  }
  // A primeira é a capa e as outras não são, conferido acima.
  out.paginas = parsed as PresentationData['paginas'];
  return { data: out };
}

/** Imagens de uma página, inclusive as guardadas e escondidas (P32, P33), que também contam para o vínculo. */
function pageImages(p: PresentationPage): (PresentationImageRef | null)[] {
  switch (p.tipo) {
    case 'capa':
      return [p.imagem];
    case 'texto':
      return p.blocos.map((b) => (b.tipo === 'imagem' ? b.imagem : null));
    case 'moodboard':
      return p.materiais.map((m) => m.imagem);
    case 'visual':
      return p.imagens.map((i) => i.imagem);
    case 'tecnico':
      return p.desenhos.map((d) => d.imagem);
    case 'prancha':
      // P41: a imagem da prancha também vai para o PDF, então conta no teto de fotos.
      return [p.imagem];
    default:
      return [];
  }
}

/** Ids das imagens citadas em todas as páginas do documento, sem repetição. */
export function presentationImageIds(data: PresentationData): string[] {
  return [...new Set(data.paginas.flatMap(pageImages).map((img) => img?.id).filter((id): id is string => !!id))];
}
