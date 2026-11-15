import {
  PRESENTATION_MAX_BLOCKS,
  PRESENTATION_MAX_BYTES,
  PRESENTATION_MAX_MATERIALS,
  PRESENTATION_MAX_NOTES,
  PRESENTATION_MAX_SHORT,
  PRESENTATION_MAX_TEXT,
  PRESENTATION_MAX_VISUAL_IMAGES,
  TECHNICAL_COUNT,
  VISUAL_COUNT,
  newDrawing,
  newMaterial,
  newNote,
  newTextBlock,
  newTextImageBlock,
  newVisualImage,
  type PresentationContentPage,
  type PresentationCover,
  type PresentationImageRef,
  type PresentationPageKind,
  type PresentationTechnicalPage,
  type PresentationTextPage,
  type PresentationVisualPage,
} from '../../shared/presentation-data';
import { RIGHTS_MODELS } from '../../presentation/pages';

// Regras da aba Página de cada tipo (Fase 6c, E4; desenhos 6c-15 a 6c-20), sem React, para os testes.
// Campos, composições e listas seguem o arquivo offline (AP_PF, AP_LAYOUTS, AP_LISTS e AP_ITEMF), com os
// limites da E1 (P31). Trocar a composição nunca apaga imagens: as que sobram ficam guardadas e escondidas (P32).

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Nome de cada tipo de página (AP_TYPES do arquivo offline). */
export const PAGE_KIND_LABELS: Record<PresentationPageKind, string> = {
  capa: 'Capa',
  texto: 'Texto & conceito',
  moodboard: 'Moodboard de materiais',
  visual: 'Apresentação visual',
  tecnico: 'Desenho técnico',
  notas: 'Notas técnicas',
  direitos: 'Direitos autorais',
};

/** "Página 02 · Texto & conceito", no topo da aba. */
export const pageKicker = (index: number, tipo: PresentationPageKind) => `Página ${pad2(index + 1)} · ${PAGE_KIND_LABELS[tipo]}`;

/** Título grande da aba: o título da página ou, vazio, o nome do tipo. */
export function pagePanelTitle(page: PresentationContentPage | PresentationCover): string {
  if (page.tipo === 'capa') return 'Capa';
  return page.titulo.trim() || PAGE_KIND_LABELS[page.tipo];
}

// ---------- Capa ----------

export const COVER_LAYOUT_OPTIONS: [PresentationCover['composicao'], string][] = [
  ['arco', 'Imagem em arco'],
  ['foto', 'Imagem lateral inteira'],
  ['tipo', 'Só tipografia'],
];
export const COVER_COLOR_OPTIONS: [PresentationCover['cor'], string][] = [
  ['vinho', 'Vinho'],
  ['noite', 'Noite'],
  ['linho', 'Linho'],
];
export const BRAND_SIZE_OPTIONS: [PresentationCover['marca'], string][] = [
  ['p', 'Pequeno'],
  ['m', 'Médio'],
  ['g', 'Grande'],
];
/** Em "Só tipografia" a imagem escolhida fica guardada e não aparece (P33). */
export const COVER_IMAGE_KEPT_TEXT = 'Nesta composição a capa não tem imagem. A imagem escolhida fica guardada e volta ao trocar a composição.';

// ---------- Composição ----------

export const TEXT_LAYOUT_OPTIONS: [PresentationTextPage['composicao'], string][] = [
  ['diagonal', 'Diagonal · texto e imagens alternados'],
  ['lado', 'Imagens lado a lado'],
  ['coluna', 'Imagens uma abaixo da outra'],
  ['destaque', 'Imagem grande abaixo do texto'],
  ['livre', 'Personalizado · posição por imagem'],
];
export const VISUAL_LAYOUT_OPTIONS: [PresentationVisualPage['composicao'], string][] = [
  ['lado', 'Imagem grande + texto ao lado'],
  ['duo', 'Duas imagens lado a lado'],
  ['principal', 'Principal + duas menores'],
  ['iso', 'Isométrica + ficha técnica'],
  ['grade', 'Várias imagens do ambiente'],
];
export const TECHNICAL_LAYOUT_OPTIONS: [PresentationTechnicalPage['composicao'], string][] = [
  ['1', 'Um desenho'],
  ['2', 'Dois desenhos lado a lado'],
  ['3', 'Principal + dois menores'],
  ['4', 'Quatro desenhos'],
];

/** Seletor de composição da página, ou nulo nos tipos sem composição. */
export function compositionField(page: PresentationContentPage): { label: string; options: [string, string][] } | null {
  if (page.tipo === 'texto') return { label: 'Composição das imagens', options: TEXT_LAYOUT_OPTIONS };
  if (page.tipo === 'visual') return { label: 'Composição', options: VISUAL_LAYOUT_OPTIONS };
  if (page.tipo === 'tecnico') return { label: 'Composição', options: TECHNICAL_LAYOUT_OPTIONS };
  return null;
}

const layoutLabel = (options: [string, string][], value: string) => options.find(([v]) => v === value)?.[1] ?? value;

/**
 * Troca a composição. Visual e técnico ganham espaços vazios até o mínimo da composição nova; os que sobram
 * de uma composição com mais imagens continuam guardados e escondidos (P32). Nada é apagado.
 */
export function setComposition(page: PresentationContentPage, composicao: string, newId: () => string): PresentationContentPage {
  if (page.tipo === 'texto') {
    const c = composicao as PresentationTextPage['composicao'];
    return c === page.composicao ? page : { ...page, composicao: c };
  }
  if (page.tipo === 'visual') {
    const c = composicao as PresentationVisualPage['composicao'];
    if (c === page.composicao) return page;
    const imagens = [...page.imagens];
    while (imagens.length < VISUAL_COUNT[c]) imagens.push(newVisualImage(newId));
    return { ...page, composicao: c, imagens };
  }
  if (page.tipo === 'tecnico') {
    const c = composicao as PresentationTechnicalPage['composicao'];
    if (c === page.composicao) return page;
    const desenhos = [...page.desenhos];
    while (desenhos.length < TECHNICAL_COUNT[c]) desenhos.push(newDrawing(newId));
    return { ...page, composicao: c, desenhos };
  }
  return page;
}

// ---------- Campos da página ----------

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  /** Texto longo (até 2000 caracteres), em caixa de várias linhas. */
  long?: boolean;
}

export const fieldMax = (f: FieldDef) => (f.long ? PRESENTATION_MAX_TEXT : PRESENTATION_MAX_SHORT);

const SOBRETITULO: FieldDef = { key: 'sobretitulo', label: 'Sobretítulo' };

export const PAGE_FIELDS: Record<PresentationContentPage['tipo'], FieldDef[]> = {
  texto: [
    SOBRETITULO,
    { key: 'titulo', label: 'Título da seção' },
    { key: 'introducao', label: 'Texto introdutório', placeholder: 'Apresente o projeto, o contexto e o briefing.', long: true },
  ],
  moodboard: [SOBRETITULO, { key: 'titulo', label: 'Título' }, { key: 'introducao', label: 'Introdução', placeholder: 'Opcional', long: true }],
  visual: [
    SOBRETITULO,
    { key: 'titulo', label: 'Ambiente / título' },
    { key: 'descricao', label: 'Descrição curta', placeholder: 'O que o ambiente resolve, materiais em destaque', long: true },
    { key: 'programas', label: 'Programas utilizados', placeholder: 'Ex.: SketchUp · V-Ray · Photoshop' },
    { key: 'observacoes', label: 'Observações técnicas', placeholder: 'Opcional', long: true },
  ],
  // Escala e unidade são só texto digitado: sem cálculo, escala gráfica, cota nem carimbo.
  tecnico: [
    SOBRETITULO,
    { key: 'titulo', label: 'Título da prancha' },
    { key: 'observacoes', label: 'Observações', placeholder: 'Opcional · notas de leitura do desenho', long: true },
    { key: 'escala', label: 'Escala', placeholder: 'Ex.: 1:50 · indicada' },
    { key: 'unidade', label: 'Unidade de medida', placeholder: 'Ex.: cm' },
  ],
  notas: [SOBRETITULO, { key: 'titulo', label: 'Título' }, { key: 'introducao', label: 'Introdução', placeholder: 'Opcional', long: true }],
  direitos: [
    SOBRETITULO,
    { key: 'titulo', label: 'Título' },
    { key: 'autoria', label: 'Autoria do projeto', placeholder: RIGHTS_MODELS.autoria, long: true },
    { key: 'escritorio', label: 'Marca / escritório responsável', placeholder: RIGHTS_MODELS.escritorio, long: true },
    { key: 'uso', label: 'Condições de uso', placeholder: RIGHTS_MODELS.uso, long: true },
    { key: 'restricoes', label: 'Restrições de reprodução e compartilhamento', placeholder: RIGHTS_MODELS.restricoes, long: true },
    { key: 'observacoes', label: 'Observações legais', placeholder: RIGHTS_MODELS.observacoes, long: true },
  ],
};

/** Altera um campo de texto da página. Campos que o tipo não tem não mudam nada. */
export function setPageField(page: PresentationContentPage, key: string, value: string): PresentationContentPage {
  if (!PAGE_FIELDS[page.tipo].some((f) => f.key === key)) return page;
  if ((page as unknown as Record<string, unknown>)[key] === value) return page;
  return { ...page, [key]: value } as PresentationContentPage;
}

// ---------- Listas de itens ----------

export type ItemKind = 'texto' | 'imagem' | 'material' | 'desenho' | 'nota';
type ListKey = 'blocos' | 'materiais' | 'imagens' | 'desenhos' | 'notas';

export interface ListDef {
  key: ListKey;
  title: string;
  adds: { kind: ItemKind; label: string }[];
}

export const PAGE_LISTS: Record<PresentationContentPage['tipo'], ListDef | null> = {
  texto: {
    key: 'blocos',
    title: 'Blocos de conteúdo',
    adds: [
      { kind: 'texto', label: '+ Bloco de texto' },
      { kind: 'imagem', label: '+ Imagem' },
    ],
  },
  moodboard: { key: 'materiais', title: 'Materiais', adds: [{ kind: 'material', label: '+ Material' }] },
  visual: { key: 'imagens', title: 'Imagens', adds: [{ kind: 'imagem', label: '+ Imagem' }] },
  // Desenhos: a quantidade vem da composição (arquivo offline), sem "+ item".
  tecnico: { key: 'desenhos', title: 'Desenhos', adds: [] },
  notas: { key: 'notas', title: 'Notas', adds: [{ kind: 'nota', label: '+ Nota' }] },
  direitos: null,
};

export const itemCountLabel = (n: number) => (n === 1 ? '1 item' : `${n} itens`);

type AnyItem = { id: string } & Record<string, unknown>;

export function pageItems(page: PresentationContentPage): AnyItem[] {
  const def = PAGE_LISTS[page.tipo];
  if (!def) return [];
  return (page as unknown as Record<ListKey, AnyItem[]>)[def.key];
}

function withItems(page: PresentationContentPage, items: AnyItem[]): PresentationContentPage {
  const def = PAGE_LISTS[page.tipo];
  if (!def) return page;
  return { ...page, [def.key]: items } as PresentationContentPage;
}

/** Quantos itens da lista aparecem na folha. Os outros ficam guardados e escondidos (P32). */
export function shownItemCount(page: PresentationContentPage): number {
  if (page.tipo === 'visual') return page.composicao === 'grade' ? page.imagens.length : VISUAL_COUNT[page.composicao];
  if (page.tipo === 'tecnico') return TECHNICAL_COUNT[page.composicao];
  return pageItems(page).length;
}

export const isHiddenItem = (page: PresentationContentPage, index: number) => index >= shownItemCount(page);

export const HIDDEN_ITEM_TEXT = 'Guardada · não aparece nesta composição';

/** Linha do item na lista: tipo, título (ou "(vazio)") e se está guardado e escondido. */
export function itemSummary(page: PresentationContentPage, index: number): { kind: string; title: string; empty: boolean; hidden: boolean } {
  const item = pageItems(page)[index] as Record<string, unknown>;
  let kind = 'Item';
  let title = '';
  switch (page.tipo) {
    case 'texto':
      kind = item.tipo === 'imagem' ? 'Imagem' : 'Texto';
      title = String(item.tipo === 'imagem' ? item.legenda : item.titulo);
      break;
    case 'moodboard':
      kind = 'Material';
      title = String(item.nome);
      break;
    case 'visual':
      kind = 'Imagem';
      title = String(item.legenda);
      break;
    case 'tecnico':
      kind = 'Desenho';
      title = String(item.titulo);
      break;
    case 'notas':
      kind = 'Nota';
      title = String(item.titulo).trim() || String(item.categoria);
      break;
  }
  const t = title.trim();
  return { kind, title: t || '(vazio)', empty: !t, hidden: isHiddenItem(page, index) };
}

const plural = (n: number, one: string, many: string) => (n === 1 ? `${n} ${one}` : `${n} ${many}`);

/** O "+ item" pode ser usado? Quando não, o motivo aparece escrito ao lado. */
export function addState(page: PresentationContentPage): { enabled: boolean; reason: string | null } {
  const n = pageItems(page).length;
  const full = (max: number, reason: string) => (n >= max ? { enabled: false, reason } : { enabled: true, reason: null });
  switch (page.tipo) {
    case 'texto':
      return full(PRESENTATION_MAX_BLOCKS, `Limite de ${PRESENTATION_MAX_BLOCKS} blocos nesta página, contando os de imagem. Com mais, os textos não cabem na folha do PDF.`);
    case 'moodboard':
      return full(PRESENTATION_MAX_MATERIALS, `Limite de ${PRESENTATION_MAX_MATERIALS} materiais nesta página. Com mais, os textos não cabem na folha do PDF.`);
    case 'notas':
      return full(PRESENTATION_MAX_NOTES, `Limite de ${PRESENTATION_MAX_NOTES} notas nesta página. Com mais, os textos não cabem na folha do PDF.`);
    case 'visual': {
      if (page.composicao === 'grade') return full(PRESENTATION_MAX_VISUAL_IMAGES, `Limite de ${PRESENTATION_MAX_VISUAL_IMAGES} imagens nesta página.`);
      const shown = VISUAL_COUNT[page.composicao];
      return {
        enabled: false,
        reason: `A composição “${layoutLabel(VISUAL_LAYOUT_OPTIONS, page.composicao)}” mostra ${plural(shown, 'imagem', 'imagens')}. Para mais imagens, escolha “Várias imagens do ambiente”.`,
      };
    }
    default:
      return { enabled: false, reason: null };
  }
}

/** O × do item pode ser usado? Visual e técnico não ficam com menos itens do que a composição mostra. */
export function removeState(page: PresentationContentPage): { enabled: boolean; reason: string | null } {
  const n = pageItems(page).length;
  if (page.tipo === 'visual' && n <= VISUAL_COUNT[page.composicao]) {
    const min = VISUAL_COUNT[page.composicao];
    return {
      enabled: false,
      reason: `A composição “${layoutLabel(VISUAL_LAYOUT_OPTIONS, page.composicao)}” usa ${plural(min, 'imagem', 'imagens')}. Para usar menos, troque a composição.`,
    };
  }
  if (page.tipo === 'tecnico' && n <= TECHNICAL_COUNT[page.composicao]) {
    const min = TECHNICAL_COUNT[page.composicao];
    return {
      enabled: false,
      reason: `A composição “${layoutLabel(TECHNICAL_LAYOUT_OPTIONS, page.composicao)}” usa ${plural(min, 'desenho', 'desenhos')}. Para usar menos, troque a composição.`,
    };
  }
  return { enabled: true, reason: null };
}

/** Acrescenta um item vazio no fim da lista. No limite, a página fica como está. */
export function addItem(page: PresentationContentPage, kind: ItemKind, newId: () => string): PresentationContentPage {
  if (!addState(page).enabled) return page;
  const def = PAGE_LISTS[page.tipo];
  if (!def?.adds.some((a) => a.kind === kind)) return page;
  const make: Record<ItemKind, () => AnyItem> = {
    texto: () => newTextBlock(newId) as unknown as AnyItem,
    imagem: () => (page.tipo === 'texto' ? newTextImageBlock(newId) : newVisualImage(newId)) as unknown as AnyItem,
    material: () => newMaterial(newId) as unknown as AnyItem,
    desenho: () => newDrawing(newId) as unknown as AnyItem,
    nota: () => newNote(newId) as unknown as AnyItem,
  };
  return withItems(page, [...pageItems(page), make[kind]()]);
}

/** ↑ e ↓: troca o item de lugar com o vizinho. Nas pontas, nada muda. */
export function moveItem(page: PresentationContentPage, index: number, delta: -1 | 1): PresentationContentPage {
  const items = [...pageItems(page)];
  const to = index + delta;
  if (index < 0 || index >= items.length || to < 0 || to >= items.length) return page;
  [items[index], items[to]] = [items[to], items[index]];
  return withItems(page, items);
}

/** ×: tira o item da lista, sem confirmação (P34). A imagem dele continua na biblioteca. */
export function removeItem(page: PresentationContentPage, index: number): PresentationContentPage {
  const items = pageItems(page);
  if (index < 0 || index >= items.length || !removeState(page).enabled) return page;
  return withItems(
    page,
    items.filter((_, i) => i !== index),
  );
}

/** Altera um campo de um item, pelo id. */
export function setItemField(page: PresentationContentPage, itemId: string, key: string, value: unknown): PresentationContentPage {
  const items = pageItems(page);
  const i = items.findIndex((it) => it.id === itemId);
  if (i < 0 || key === 'id' || key === 'tipo' || !(key in items[i]) || items[i][key] === value) return page;
  const next = [...items];
  next[i] = { ...items[i], [key]: value };
  return withItems(page, next);
}

/** Imagem do item (nula se o item não tem espaço de imagem). */
export function itemImage(page: PresentationContentPage, itemId: string): PresentationImageRef | null | undefined {
  const item = pageItems(page).find((it) => it.id === itemId);
  if (!item || !('imagem' in item)) return undefined;
  return item.imagem as PresentationImageRef | null;
}

// ---------- Campos de cada item ----------

export const TEXT_IMAGE_SHAPE_OPTIONS: [string, string][] = [
  ['arco', 'Em arco'],
  ['retangular', 'Retangular'],
];
export const TEXT_IMAGE_POSITION_OPTIONS: [string, string][] = [
  ['auto', 'Automática'],
  ['esquerda', 'À esquerda'],
  ['direita', 'À direita'],
  ['largura', 'Largura inteira'],
];
export const TEXT_IMAGE_HEIGHT_OPTIONS: [string, string][] = [
  ['p', 'Pequena'],
  ['m', 'Média'],
  ['g', 'Grande'],
];

export interface ItemSelectDef {
  key: string;
  label: string;
  options: [string, string][];
}

/** Campos do item aberto (AP_ITEMF do arquivo offline). */
export function itemFields(page: PresentationContentPage, item: Record<string, unknown>): { image: string | null; fields: FieldDef[]; selects: ItemSelectDef[] } {
  switch (page.tipo) {
    case 'texto':
      if (item.tipo === 'imagem') {
        const selects: ItemSelectDef[] = [{ key: 'formato', label: 'Formato da imagem', options: TEXT_IMAGE_SHAPE_OPTIONS }];
        // Posição e altura só valem no "Personalizado"; nas outras composições ficam guardadas.
        if (page.composicao === 'livre') {
          selects.push({ key: 'posicao', label: 'Posição', options: TEXT_IMAGE_POSITION_OPTIONS }, { key: 'altura', label: 'Altura', options: TEXT_IMAGE_HEIGHT_OPTIONS });
        }
        return { image: 'Imagem de referência', fields: [{ key: 'legenda', label: 'Legenda', placeholder: 'Opcional' }], selects };
      }
      return { image: null, fields: [{ key: 'titulo', label: 'Título do bloco' }, { key: 'texto', label: 'Texto', long: true }], selects: [] };
    case 'moodboard':
      return {
        image: 'Textura / material',
        fields: [
          { key: 'nome', label: 'Material' },
          { key: 'fabricante', label: 'Fabricante / fornecedor' },
          { key: 'codigo', label: 'Código / referência' },
          { key: 'acabamento', label: 'Cor / acabamento' },
          { key: 'ambiente', label: 'Ambiente / aplicação' },
          { key: 'observacoes', label: 'Observações', long: true },
        ],
        selects: [],
      };
    case 'visual':
      return { image: 'Render do ambiente', fields: [{ key: 'legenda', label: 'Legenda / identificação', placeholder: 'Opcional' }], selects: [] };
    case 'tecnico':
      return { image: 'Planta, vista ou detalhe', fields: [{ key: 'titulo', label: 'Título do desenho', placeholder: 'Ex.: Planta baixa · layout' }], selects: [] };
    case 'notas':
      return {
        image: null,
        fields: [
          { key: 'categoria', label: 'Categoria' },
          { key: 'titulo', label: 'Título' },
          { key: 'texto', label: 'Texto', long: true },
        ],
        selects: [],
      };
    default:
      return { image: null, fields: [], selects: [] };
  }
}

// ---------- Tamanho do documento ----------

/** A partir de 80% do limite de 1 MB, o editor avisa sem bloquear o salvamento. */
export const NEAR_LIMIT_RATIO = 0.8;
export const NEAR_LIMIT_TEXT = 'O documento está perto do limite de tamanho. Remova conteúdo ou divida a apresentação.';

export function sizeLevel(bytes: number, limit = PRESENTATION_MAX_BYTES): 'ok' | 'near' | 'over' {
  if (bytes > limit) return 'over';
  return bytes > limit * NEAR_LIMIT_RATIO ? 'near' : 'ok';
}
