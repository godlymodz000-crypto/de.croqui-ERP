// Cálculos da Apresentação na 6b (Fase 6b, etapa E2): numeração das páginas, validação e tamanho de
// redução das imagens, e zoom de ajuste da visualização em A4. Mesmas fórmulas e textos do arquivo
// offline (revisao-fase6/casos-de-teste.json, casos apr-20, apr-21, apr-52 a apr-54, apr-57, apr-58 e
// apr-60), com estas diferenças intencionais, aprovadas nas decisões da 6b:
// 1. Sem carimbo: o desenho técnico não repete "NN / TT" num carimbo de folha (decisoes.md, "Escala e folha").
// 2. O aviso de arquivo acima de 40 MB não usa travessão.
// Módulo puro, sem dependências: serve à tela, ao servidor e aos testes.

/** Tipos de página. Na 6b só existe a capa; os outros entram na 6c e na 6d. */
export type PresentationPageType = 'capa' | 'texto' | 'moodboard' | 'visual' | 'tecnico' | 'notas' | 'direitos' | 'prancha';

// ---------------------------------------------------------------------------------------------------
// Numeração das páginas

const pad2 = (n: number) => String(n).padStart(2, '0');

export interface PageFooter {
  /** "NN / TT". A capa e a prancha não têm rodapé: o valor é nulo. */
  numero: string | null;
  /** Cliente e data separados por " · ", só os que estão preenchidos. Pode ficar vazio. */
  esquerda: string;
}

/** Texto da esquerda do rodapé: cliente e data, ignorando os vazios. */
export function footerLeft(cliente: string | null | undefined, data: string | null | undefined): string {
  return [cliente, data].filter((x): x is string => !!x && !!x.trim()).join(' · ');
}

/** Rodapé de cada página. Todas as páginas contam no total, inclusive a capa, que não mostra número. */
export function pageFooters(
  tipos: PresentationPageType[],
  projeto: { cliente?: string | null; data?: string | null },
): PageFooter[] {
  const total = pad2(tipos.length);
  const esquerda = footerLeft(projeto.cliente, projeto.data);
  return tipos.map((tipo, i) =>
    tipo === 'capa' || tipo === 'prancha' ? { numero: null, esquerda: '' } : { numero: `${pad2(i + 1)} / ${total}`, esquerda },
  );
}

/** Texto da barra da visualização: "Página 01 de 01". */
export function pageNavLabel(atual: number, total: number): string {
  return `Página ${pad2(atual + 1)} de ${pad2(total)}`;
}

// ---------------------------------------------------------------------------------------------------
// Imagens

/** Formatos aceitos no espaço de imagem. GIF e outros são recusados. */
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
/** Tamanho máximo do arquivo escolhido: 40 MB. */
export const IMAGE_MAX_BYTES = 40 * 1048576;
/** Lado maior da imagem guardada. Acima disso, o navegador reduz antes do envio. */
export const IMAGE_MAX_SIDE = 4000;
/** Arquivo acima deste tamanho é recodificado mesmo sem precisar reduzir as medidas. */
export const IMAGE_REENCODE_ABOVE_BYTES = 8 * 1048576;
/** Qualidade do JPEG gerado na redução. */
export const IMAGE_JPEG_QUALITY = 0.9;

const EXT_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

/** Tipo do arquivo: o informado pelo navegador ou, se vazio, o da extensão. */
export function imageType(nome: string, tipo: string | null | undefined): string {
  if (tipo) return tipo;
  const ext = (nome.split('.').pop() ?? '').toLowerCase();
  return EXT_TYPES[ext] ?? '';
}

/** Aviso para o arquivo escolhido, ou nulo quando ele pode ser usado. */
export function imageWarning(arquivo: { nome: string; tipo?: string | null; bytes: number }): string | null {
  const tipo = imageType(arquivo.nome, arquivo.tipo);
  if (!(IMAGE_TYPES as readonly string[]).includes(tipo)) {
    return `“${arquivo.nome}” não é um formato compatível. Use PNG, JPG ou WebP.`;
  }
  if (arquivo.bytes > IMAGE_MAX_BYTES) {
    const mb = Math.round(arquivo.bytes / 1048576);
    return `“${arquivo.nome}” tem ${mb} MB. O limite é 40 MB. Exporte a imagem em resolução menor.`;
  }
  return null;
}

export interface ImageReduction {
  /** Falso: o arquivo é enviado como veio. */
  recodificar: boolean;
  larguraPx: number;
  alturaPx: number;
  /** Tipo enviado: o original, ou na recodificação PNG continua PNG e o resto vira JPEG. */
  tipo: string;
}

/** Medidas e tipo da imagem a enviar, a partir da original (já validada por `imageWarning`). */
export function imageReduction(original: { larguraPx: number; alturaPx: number; tipo: string; bytes: number }): ImageReduction {
  const { larguraPx, alturaPx, tipo, bytes } = original;
  const lado = Math.max(larguraPx, alturaPx);
  if (lado <= IMAGE_MAX_SIDE && bytes <= IMAGE_REENCODE_ABOVE_BYTES) {
    return { recodificar: false, larguraPx, alturaPx, tipo };
  }
  const s = Math.min(1, IMAGE_MAX_SIDE / lado);
  return {
    recodificar: true,
    larguraPx: Math.round(larguraPx * s),
    alturaPx: Math.round(alturaPx * s),
    tipo: tipo === 'image/png' ? 'image/png' : 'image/jpeg',
  };
}

// ---------------------------------------------------------------------------------------------------
// Zoom da visualização

/** Largura da folha A4 deitada na tela, em px CSS (297 mm a 96 px por polegada). */
export const A4_WIDTH_PX = 1123;
/** Folga horizontal da área da visualização, somando os dois lados. */
export const FIT_MARGIN_PX = 64;
export const ZOOM_FIT_MIN = 0.25;
export const ZOOM_FIT_MAX = 1.4;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;

/** Zoom que faz a folha A4 caber na largura útil da área da visualização. */
export function fitZoom(larguraUtilPx: number): number {
  return Math.min(ZOOM_FIT_MAX, Math.max(ZOOM_FIT_MIN, (larguraUtilPx - FIT_MARGIN_PX) / A4_WIDTH_PX));
}

/** Valor de `zoom` no CSS, com 6 algarismos significativos, como o navegador grava. */
export function zoomCss(z: number): string {
  return String(Number(z.toPrecision(6)));
}

/** Rótulo do zoom na barra: "90%". */
export function zoomLabel(z: number): string {
  return `${Math.round(Math.round(z * 100) / 100 * 100)}%`;
}

/** Botão +: soma 0,1 ao zoom mostrado, até 2. */
export function zoomIn(z: number): number {
  return Math.min(ZOOM_MAX, Math.round((Math.round(z * 100) / 100 + 0.1) * 10) / 10);
}

/** Botão −: tira 0,1 do zoom mostrado, até 0,25. */
export function zoomOut(z: number): number {
  return Math.max(ZOOM_MIN, Math.round((Math.round(z * 100) / 100 - 0.1) * 10) / 10);
}
