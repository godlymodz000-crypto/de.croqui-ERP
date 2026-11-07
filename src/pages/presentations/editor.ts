import { ApiError } from '../../api/http';
import { PRESENTATION_MAX_BYTES, presentationBytes, type PresentationData } from '../../shared/presentation-data';
import type { CoverMode } from '../../presentation/cover';

// Regras do editor de apresentação (desenhos 6b-04, 6b-05, 6b-12 e 6b-13), separadas da tela para os testes.

/** Situação do salvamento automático, mostrada na barra e nos avisos de 6b-05. */
export type SaveState =
  | { kind: 'saved'; at: Date | null }
  | { kind: 'saving' }
  | { kind: 'error' }
  | { kind: 'conflict' }
  | { kind: 'too_large' };

/** O que fazer depois de uma falha ao salvar. */
export function saveFailure(err: unknown): 'conflict' | 'too_large' | 'error' {
  if (err instanceof ApiError && err.status === 409) return 'conflict';
  if (err instanceof ApiError && (err.status === 413 || err.code === 'too_large')) return 'too_large';
  return 'error';
}

/** Antes de enviar: o documento passa do limite de 512 KB? */
export const isTooLarge = (data: PresentationData) => presentationBytes(data) > PRESENTATION_MAX_BYTES;

export const SAVE_MESSAGES = {
  error: 'Não foi possível salvar as últimas alterações. Elas continuam aqui e o ERP tenta de novo sozinho.',
  conflict: 'Esta apresentação foi alterada em outra aba ou por outra pessoa. Recarregue para ver a versão atual antes de continuar.',
  too_large:
    'A apresentação passou do limite de 512 KB e a última alteração não foi salva. Encurte os textos mais longos para voltar a salvar. O que você escreveu continua aqui.',
} as const;

/** "14:32", na hora local. */
export const clock = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Texto do indicador da barra. */
export function saveLabel(s: SaveState): string {
  if (s.kind === 'saving') return 'Salvando';
  if (s.kind === 'error' || s.kind === 'too_large') return 'Não salvo';
  if (s.kind === 'conflict') return 'Alterado em outra aba';
  return s.at ? `Salvo às ${clock(s.at)}` : 'Salvo';
}

/** Por onde a pessoa chegou ao editor: a lista guarda o endereço com a aba; o projeto, o id dele. */
export type EditorOrigin = { from: 'lista'; search?: string } | { from: 'projeto'; projectId: string };

/** "Voltar" volta para onde a pessoa veio. Sem origem (endereço digitado), volta para a lista. */
export function backTarget(origin: unknown): { to: string; label: string } {
  const o = origin as Partial<EditorOrigin> | null | undefined;
  if (o?.from === 'projeto' && typeof (o as { projectId?: unknown }).projectId === 'string') {
    return { to: `/projetos/${(o as { projectId: string }).projectId}`, label: 'Voltar para o projeto' };
  }
  const search = o?.from === 'lista' && typeof (o as { search?: unknown }).search === 'string' ? (o as { search: string }).search : '';
  return { to: `/apresentacoes${search}`, label: 'Voltar para Apresentações' };
}

/** Texto ao lado de "Página 01 de 01". */
export function pageKindLabel(mode: CoverMode | 'readonly', compact = false): string {
  if (compact) return 'Capa';
  if (mode === 'readonly') return 'Capa · somente leitura';
  return mode === 'edit' ? 'Capa · campos pendentes em cinza' : 'Capa · prévia de impressão';
}

/** Aviso da aba Página da capa: a frase sobre o projeto só aparece quando a apresentação veio de um projeto. */
export function coverNotice(hasProject: boolean): string {
  const base = 'Nome do projeto, cliente e demais dados da capa ficam na aba Projeto.';
  return hasProject ? `${base} Nome e cliente vieram do projeto e podem ser editados.` : base;
}

/** Texto de ajuda da aba Projeto, com a mesma regra. */
export function projectTabHelp(hasProject: boolean): string {
  const base = 'Aparecem na capa e nos rodapés das páginas. Campos vazios não saem no PDF.';
  return hasProject ? `${base} Nome e cliente foram copiados do projeto e podem ser editados aqui.` : base;
}
