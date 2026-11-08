import type { PresentationProject } from '../shared/presentation-data.js';

// Regras da capa (desenhos 6b-04, 6b-12 e 6b-13), sem React: o editor, a visualização no celular e,
// na E9, o PDF usam as mesmas. Na E7 a capa tem só a composição "Imagem em arco", na cor vinho e com a
// marca pequena (decisão de 2026-11-07); as outras opções entram quando houver desenho aprovado.

/** Prévia desligada: o que falta aparece em cinza. Ligada: a folha como sai no PDF. */
export type CoverMode = 'edit' | 'print';

/** Texto da linha acima do nome quando o tipo de apresentação está vazio. */
export const DEFAULT_COVER_TYPE = 'Apresentação de projeto';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-11-07" vira "7 de novembro de 2026". Vazio ou fora do formato: vazio. */
export function issueDateLabel(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const month = MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  if (!month || day < 1 || day > 31) return '';
  return `${day} de ${month} de ${m[1]}`;
}

export interface CoverField {
  key: 'cliente' | 'projetista' | 'registro' | 'localizacao' | 'data' | 'codigo';
  label: string;
  /** Texto mostrado: o valor, ou o texto do que falta (só com a Prévia desligada). */
  text: string;
  pending: boolean;
}

const FIELDS: { key: CoverField['key']; label: string; missing: string }[] = [
  { key: 'cliente', label: 'Cliente', missing: 'Cliente' },
  { key: 'projetista', label: 'Projetista', missing: 'Projetista' },
  { key: 'registro', label: 'Registro', missing: 'Opcional' },
  { key: 'localizacao', label: 'Localização', missing: 'Localização' },
  { key: 'data', label: 'Emissão', missing: 'Data de emissão' },
  { key: 'codigo', label: 'Código', missing: 'Opcional' },
];

const valueOf = (projeto: PresentationProject, key: CoverField['key']) =>
  key === 'data' ? issueDateLabel(projeto.data) : (projeto[key] ?? '').trim();

/**
 * Dados da capa, abaixo da linha. Com a Prévia desligada, os seis aparecem sempre, na mesma ordem, e os
 * vazios em cinza. Com a Prévia ligada, só os preenchidos, um depois do outro.
 */
export function coverFields(projeto: PresentationProject, mode: CoverMode): CoverField[] {
  const all = FIELDS.map((f) => {
    const value = valueOf(projeto, f.key);
    return { key: f.key, label: f.label, text: value || f.missing, pending: !value };
  });
  return mode === 'edit' ? all : all.filter((f) => !f.pending);
}

export interface CoverTexts {
  tipo: string;
  /** Nulo: some da folha (Prévia ligada sem nome). */
  nome: { text: string; pending: boolean } | null;
  contato: { text: string; pending: boolean } | null;
}

export function coverTexts(projeto: PresentationProject, mode: CoverMode): CoverTexts {
  const nome = projeto.nome.trim();
  const contato = projeto.contato.trim();
  return {
    tipo: projeto.tipo.trim() || DEFAULT_COVER_TYPE,
    nome: nome ? { text: nome, pending: false } : mode === 'edit' ? { text: 'Nome do projeto', pending: true } : null,
    contato: contato ? { text: contato, pending: false } : mode === 'edit' ? { text: 'Contato (opcional)', pending: true } : null,
  };
}

/**
 * Estilo da imagem dentro do espaço: "caber inteira" (fit) ou "preencher" (fill), zoom de 1 a 4 e
 * enquadramento de 0 a 100% (o ponto da imagem que fica no ponto equivalente do espaço).
 */
export function coverImageStyle(ref: { ajuste: 'fit' | 'fill'; zoom: number; x: number; y: number }) {
  const origin = `${ref.x}% ${ref.y}%`;
  return {
    objectFit: ref.ajuste === 'fit' ? ('contain' as const) : ('cover' as const),
    objectPosition: origin,
    transform: ref.zoom === 1 ? undefined : `scale(${ref.zoom})`,
    transformOrigin: origin,
  };
}
