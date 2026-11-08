import {
  ADDABLE_PAGE_TYPES,
  newPresentationPage,
  presentationImageIds,
  PRESENTATION_MAX_PAGES,
  type AddablePageKind,
  type PresentationData,
  type PresentationPage,
} from '../../shared/presentation-data';
import { compositionField, COVER_LAYOUT_OPTIONS, PAGE_KIND_LABELS, pagePanelTitle } from './pageEditor';

// Regras da aba Páginas (Fase 6c, E5; desenho 6c-21), sem React, para os testes.
// A capa fica sempre em primeiro: não sobe, não desce, não é removida nem duplicada. Todas as ações mudam só
// o documento e passam pelo salvamento automático, sem rota nova.

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Tipos do menu "Adicionar página", na ordem de 6c-21 (P36). Sem Capa e sem Prancha de detalhamento. */
export const ADD_PAGE_OPTIONS: { tipo: AddablePageKind; label: string }[] = ADDABLE_PAGE_TYPES.map((tipo) => ({
  tipo,
  label: PAGE_KIND_LABELS[tipo],
}));

/** "7 páginas" no título da lista. */
export const pagesCountLabel = (n: number) => `${n} ${n === 1 ? 'página' : 'páginas'}`;

/** Número da linha: "01". */
export const pageNumber = (index: number) => pad2(index + 1);

/**
 * Linha de cima de cada página: o tipo e, quando há, a composição, como em 6c-21 ("Texto & conceito ·
 * Diagonal", "Desenho técnico · Um desenho"). Do nome da composição fica só a parte antes do " · ".
 */
export function pageRowKind(page: PresentationPage): string {
  const kind = PAGE_KIND_LABELS[page.tipo];
  const field = page.tipo === 'capa' ? { options: COVER_LAYOUT_OPTIONS as [string, string][] } : compositionField(page);
  if (!field) return kind;
  const value = (page as { composicao?: string }).composicao;
  const label = field.options.find(([v]) => v === value)?.[1];
  return label ? `${kind} · ${label.split(' · ')[0]}` : kind;
}

/** Nome da página na lista: o título dela ou, vazio, o nome do tipo. */
export const pageRowName = (page: PresentationPage) => pagePanelTitle(page);

/** Aviso abaixo da lista (6c-21). Duplicar fica desligado como proposta até a aprovação (P29). */
export const DUPLICATE_NOTICE =
  'Duplicar está em proposta: o que acontece com a página copiada ainda não foi decidido. A capa não pode ser movida, duplicada nem excluída.';
export const DUPLICATE_TITLE = 'Duplicar está em proposta e ainda não funciona.';

/** Texto abaixo de "Adicionar página": onde a página nova entra. */
export const addPageHelp = (current: number) => `A nova página entra logo depois da página atual (${pageNumber(current)}).`;

export const PAGES_LIMIT_TEXT = `A apresentação já tem ${PRESENTATION_MAX_PAGES} páginas, o limite com a capa. Remova uma página para adicionar outra.`;

/** O menu de adicionar fica ligado até 40 páginas, com a capa (P31). */
export function addPageState(data: PresentationData): { enabled: boolean; reason: string | null } {
  return data.paginas.length >= PRESENTATION_MAX_PAGES ? { enabled: false, reason: PAGES_LIMIT_TEXT } : { enabled: true, reason: null };
}

/** ↑: não aparece na capa, e a página 02 não sobe acima dela. */
export const canMoveUp = (index: number) => index > 1;
/** ↓: não aparece na capa nem na última página. */
export const canMoveDown = (index: number, total: number) => index > 0 && index < total - 1;
/** ×: toda página menos a capa. */
export const canRemove = (index: number) => index > 0;

const withPages = (data: PresentationData, paginas: PresentationPage[]) => ({ ...data, paginas: paginas as PresentationData['paginas'] });

/**
 * Adiciona uma página do tipo logo depois da página atual (na capa, vira a 02). A página nova começa como no
 * arquivo offline (P30) e passa a ser a atual. No limite de páginas, nada muda.
 */
export function addPage(data: PresentationData, tipo: AddablePageKind, current: number, newId: () => string): { data: PresentationData; index: number } {
  if (!addPageState(data).enabled || !ADDABLE_PAGE_TYPES.includes(tipo)) return { data, index: current };
  const at = Math.min(Math.max(current, 0), data.paginas.length - 1) + 1;
  const paginas = [...data.paginas];
  paginas.splice(at, 0, newPresentationPage(tipo, newId));
  return { data: withPages(data, paginas), index: at };
}

/** Move a página uma posição (`-1` sobe, `1` desce). A capa não se move e nada passa para antes dela. */
export function movePage(data: PresentationData, index: number, dir: -1 | 1): PresentationData {
  const ok = dir === -1 ? canMoveUp(index) : canMoveDown(index, data.paginas.length);
  if (!ok) return data;
  const paginas = [...data.paginas];
  [paginas[index], paginas[index + dir]] = [paginas[index + dir], paginas[index]];
  return withPages(data, paginas);
}

/** Página atual depois de mover `index`: segue a página que estava sendo vista. */
export function currentAfterMove(current: number, index: number, dir: -1 | 1, total: number): number {
  const ok = dir === -1 ? canMoveUp(index) : canMoveDown(index, total);
  if (!ok) return current;
  if (current === index) return index + dir;
  if (current === index + dir) return index;
  return current;
}

/** Remove a página. A capa nunca sai. */
export function removePage(data: PresentationData, index: number): PresentationData {
  if (!canRemove(index) || index >= data.paginas.length) return data;
  return withPages(
    data,
    data.paginas.filter((_, i) => i !== index),
  );
}

/** Página atual depois de remover `index`: a que ficou no lugar dela ou, se era a última, a anterior. */
export function currentAfterRemove(current: number, index: number, total: number): number {
  if (!canRemove(index) || index >= total) return current;
  if (current > index) return current - 1;
  if (current === index) return Math.min(index, total - 2);
  return current;
}

/** ‹ › na visualização e no celular: anda uma página pela ordem da lista, sem passar das pontas. */
export const stepPage = (index: number, dir: -1 | 1, total: number) => Math.min(Math.max(index + dir, 0), Math.max(total - 1, 0));
/** O botão ‹ ou › fica ligado? */
export const canStep = (index: number, dir: -1 | 1, total: number) => stepPage(index, dir, total) !== index;

/** Imagens que só aparecem na página `index`: saem do documento junto com ela. */
export function imagesLeaving(data: PresentationData, index: number): number {
  if (!canRemove(index)) return 0;
  return presentationImageIds(data).length - presentationImageIds(removePage(data, index)).length;
}

/** Diálogo de remover página (P34), no padrão da confirmação de remover imagem (6b-07). */
export function removePageDialog(data: PresentationData, index: number): { title: string; text: string; images: string | null } {
  const page = data.paginas[index];
  const n = imagesLeaving(data, index);
  return {
    title: `Remover a página ${pageNumber(index)}?`,
    text: `“${page ? pageRowName(page) : ''}” sai da apresentação com tudo o que foi escrito nela. Não dá para desfazer.`,
    images:
      n === 0
        ? null
        : `${n === 1 ? 'A imagem que só aparece nesta página sai' : `As ${n} imagens que só aparecem nesta página saem`} da apresentação. Vai para a lixeira do Drive só o que não for usado em nenhuma outra apresentação.`,
  };
}
