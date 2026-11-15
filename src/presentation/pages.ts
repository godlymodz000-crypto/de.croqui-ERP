import type {
  PresentationContentPage,
  PresentationProject,
  PresentationTechnicalPage,
  PresentationVisualPage,
  TechnicalDrawing,
  VisualImage,
} from '../shared/presentation-data.js';
import { footerLeft } from '../shared/presentation-calc.js';
import { issueDateLabel } from './cover.js';

// Regras das páginas internas da apresentação (Fase 6c, E3; desenhos 6c-12 a 6c-20), sem React: a folha da
// tela e, na E6, a do PDF usam as mesmas. Mesmas composições e textos do arquivo offline
// (templates/apresentacao/Apresentacao.dc.html), sem carimbo, escala gráfica nem cota no desenho técnico.

/** Seção no topo da folha (AP_SEC do arquivo offline). */
export const PAGE_SECTIONS: Record<PresentationContentPage['tipo'], string> = {
  texto: 'Conceito',
  moodboard: 'Materiais',
  visual: 'Projeto',
  tecnico: 'Documentação técnica',
  notas: 'Notas e diretrizes',
  direitos: 'Propriedade intelectual',
  // A prancha não tem seção no topo: a imagem ocupa a folha inteira (6d).
  prancha: '',
};

/** Textos mostrados em cinza no lugar do que falta, só com a Prévia desligada. Não saem no PDF. */
export const PLACEHOLDERS = {
  sobretitulo: 'Sobretítulo',
  tituloSecao: 'Título da seção',
  titulo: 'Título',
  ambiente: 'Ambiente',
  peca: 'Peça ou ambiente',
  introducaoTexto: 'Texto introdutório — apresente o projeto, o contexto e o briefing.',
  introducaoMood: 'Introdução (opcional) — a ideia por trás da paleta.',
  introducaoNotas: 'Introdução (opcional).',
  descricaoLado: 'Descrição curta do ambiente e das soluções de marcenaria.',
  descricaoCurta: 'Descrição curta.',
  descricaoGrade: 'Descrição curta do ambiente.',
  descricaoIso: 'Descrição técnica da peça: módulos, aberturas, ferragens, acabamentos.',
  observacoesTecnico: 'Observações (opcional)',
  tituloBloco: 'Título do bloco',
  textoBloco: 'Escreva o texto deste bloco.',
  legenda: 'Legenda (opcional)',
  tituloDesenho: 'Título do desenho',
  nomeMaterial: 'Nome do material',
  metaVazia: '—',
  categoria: 'Categoria',
  tituloNota: 'Título da nota',
  textoNota: 'Texto da nota — escreva aqui as orientações do seu projeto.',
  programas: 'Ex.: SketchUp · V-Ray · Photoshop',
  observacoesVisual: 'Observações técnicas (opcional)',
  imagemPrincipal: 'Identificação da imagem (opcional)',
  escala: 'Ex.: 1:50 · indicada',
  unidade: 'Ex.: cm',
} as const;

/** Textos-modelo dos direitos autorais: só aparecem em cinza, como exemplo, e nunca saem no PDF. */
export const RIGHTS_MODELS = {
  autoria: 'Modelo · Projeto de autoria de [nome], [registro profissional].',
  escritorio: 'Modelo · [Marca / escritório], responsável pelo desenvolvimento deste material.',
  uso: 'Modelo · Material destinado ao cliente para avaliação e execução deste projeto.',
  restricoes: 'Modelo · Reprodução, compartilhamento ou uso em outros projetos dependem de autorização por escrito.',
  observacoes: 'Opcional · observações legais adicionais.',
} as const;

export const RIGHTS_ROWS: { key: keyof typeof RIGHTS_MODELS; label: string }[] = [
  { key: 'autoria', label: 'Autoria' },
  { key: 'escritorio', label: 'Responsável' },
  { key: 'uso', label: 'Condições de uso' },
  { key: 'restricoes', label: 'Restrições' },
  { key: 'observacoes', label: 'Observações legais' },
];

export const MATERIAL_ROWS = [
  { key: 'fabricante', label: 'Fabricante' },
  { key: 'codigo', label: 'Código' },
  { key: 'acabamento', label: 'Acabamento' },
  { key: 'ambiente', label: 'Ambiente' },
  { key: 'observacoes', label: 'Obs.' },
] as const;

/** Texto do espaço de imagem vazio de cada uso. */
export const SLOT_TITLES = {
  texto: 'Imagem de referência',
  moodboard: 'Textura / material',
  visual: 'Render do ambiente',
  iso: 'Vista isométrica',
  tecnico: 'Planta, vista ou detalhe',
} as const;
export const SLOT_HINT = 'Clique ou arraste · PNG, JPG, WebP';
export const SLOT_MISSING = 'Imagem não encontrada · insira de novo';
/** Aviso da página de direitos, só com a Prévia desligada. */
export const RIGHTS_NOTE =
  'Redação livre. Os textos em cinza são apenas modelos e não são impressos — escreva a redação da sua empresa e revise com assessoria jurídica.';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Cabeçalho e rodapé das páginas internas: marca e projeto; seção; cliente e data; "NN / TT". */
export function pageChrome(projeto: PresentationProject, tipo: PresentationContentPage['tipo'], index: number, total: number) {
  return {
    marca: projeto.marca.trim() || 'De.Croqui',
    projeto: projeto.nome.trim(),
    secao: PAGE_SECTIONS[tipo],
    esquerda: footerLeft(projeto.cliente, issueDateLabel(projeto.data)),
    numero: `${pad2(index + 1)} / ${pad2(total)}`,
  };
}

/** Quantas imagens a composição mostra. Em "grade", todas as guardadas (de 4 a 8). */
export function visualShownCount(page: PresentationVisualPage): number {
  switch (page.composicao) {
    case 'lado':
    case 'iso':
      return 1;
    case 'duo':
      return 2;
    case 'principal':
      return 3;
    case 'grade':
      return page.imagens.length;
  }
}

/**
 * Imagens que aparecem na folha. As que sobram de uma composição com menos imagens ficam guardadas e
 * escondidas (P32): não aparecem na folha nem no PDF.
 */
export function visibleVisualImages(page: PresentationVisualPage): VisualImage[] {
  return page.imagens.slice(0, visualShownCount(page));
}

export function visibleDrawings(page: PresentationTechnicalPage): TechnicalDrawing[] {
  return page.desenhos.slice(0, Number(page.composicao));
}

/** Colunas e linhas da grade de imagens (duas lado a lado, várias imagens, desenho técnico). */
export function gridShape(page: PresentationVisualPage | PresentationTechnicalPage): { cols: string; rows: number } {
  if (page.tipo === 'tecnico') {
    if (page.composicao === '1') return { cols: 'repeat(1, minmax(0, 1fr))', rows: 1 };
    if (page.composicao === '3') return { cols: 'minmax(0, 1.7fr) minmax(0, 1fr)', rows: 2 };
    return { cols: 'repeat(2, minmax(0, 1fr))', rows: page.composicao === '4' ? 2 : 1 };
  }
  const n = visualShownCount(page);
  if (page.composicao !== 'grade') return { cols: 'repeat(2, minmax(0, 1fr))', rows: 1 };
  const c = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
  return { cols: `repeat(${c}, minmax(0, 1fr))`, rows: Math.ceil(n / c) };
}

/** Colunas do moodboard pelo número de materiais (arquivo offline). */
export function moodboardColumns(n: number): number {
  return n <= 4 ? Math.max(n, 1) : n <= 6 ? 3 : n <= 8 ? 4 : n <= 10 ? 5 : 6;
}

/** Texto preenchido: tem algo além de espaços. */
export const filled = (s: string | null | undefined): boolean => !!s && !!s.trim();
