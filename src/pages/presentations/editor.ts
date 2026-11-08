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

// ---------- Nome da apresentação (aba Projeto) ----------

/** Mesmo limite da API. */
export const PRESENTATION_NAME_MAX = 120;

/** Nome como a API grava: sem espaços nas pontas nem repetidos. */
export const cleanPresentationName = (v: string) => v.trim().replace(/\s+/g, ' ');

/** Erro do campo "Nome da apresentação", ou nulo. Enquanto houver erro, o nome anterior continua valendo. */
export function presentationNameError(v: string): string | null {
  const name = cleanPresentationName(v);
  if (!name) return 'Dê um nome à apresentação. Até lá, fica o nome anterior.';
  if (name.length > PRESENTATION_NAME_MAX) return `Use um nome com até ${PRESENTATION_NAME_MAX} caracteres. Até lá, fica o nome anterior.`;
  return null;
}

// ---------- Imagem da capa (6b-06 a 6b-09) ----------

/** "2,4 MB", "412 KB". */
export function imageSize(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Linha de baixo do espaço de imagem com a imagem colocada: "2,4 MB · na biblioteca do projeto". */
export const imagePlacedLine = (bytes: number, hasProject: boolean) =>
  `${imageSize(bytes)} · ${hasProject ? 'na biblioteca do projeto' : 'na biblioteca desta apresentação'}`;

/** "62% · enviando ao Drive". */
export const uploadProgressLine = (sent: number, total: number) =>
  `${total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0}% · enviando ao Drive`;

/** Aviso de 6b-08 para o arquivo recusado antes do envio, ou nulo quando ele pode seguir. */
export function uploadRefusal(file: { name: string; type: string; size: number }, accepted: readonly string[], maxBytes: number): string | null {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  const byExt: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };
  const type = file.type || byExt[ext] || '';
  if (!accepted.includes(type)) return `“${file.name}” não é um formato aceito. Use PNG, JPG ou WebP. Nada foi enviado.`;
  if (file.size > maxBytes) {
    return `“${file.name}” tem ${Math.round(file.size / 1048576)} MB. O limite é ${Math.round(maxBytes / 1048576)} MB; exporte a imagem em resolução menor.`;
  }
  return null;
}

/** Aviso de 6b-08 quando chegam vários arquivos para o único espaço da capa. */
export function extraFilesNotice(extras: number): string {
  return extras === 1
    ? 'A capa tem um espaço de imagem. A primeira foi usada; a outra ficou na biblioteca.'
    : `A capa tem um espaço de imagem. A primeira foi usada; as outras ${extras} ficaram na biblioteca.`;
}

/** Legenda de cada imagem da biblioteca (6b-09). */
export function libraryCaption(opts: { selected: boolean; usedBy: number; hasProject: boolean }): string {
  if (!opts.hasProject) return opts.selected ? 'Selecionada' : 'Enviada nesta apresentação';
  const uses = opts.usedBy === 1 ? 'usada em 1 apresentação' : `usada em ${opts.usedBy} apresentações`;
  if (opts.selected) return opts.usedBy > 0 ? `Selecionada · ${uses}` : 'Selecionada';
  return opts.usedBy > 0 ? uses.charAt(0).toUpperCase() + uses.slice(1) : 'Sem uso no momento';
}

/** Zoom da imagem no espaço: de 1 a 4, em passos de 0,25. */
export const IMAGE_ZOOM_STEP = 0.25;
export const imageZoomIn = (z: number) => Math.min(4, Math.round((z + IMAGE_ZOOM_STEP) * 100) / 100);
export const imageZoomOut = (z: number) => Math.max(1, Math.round((z - IMAGE_ZOOM_STEP) * 100) / 100);

/** Arrastar a imagem: a imagem segue o ponteiro, então o enquadramento anda ao contrário, de 0 a 100%. */
export function dragFrame(start: { x: number; y: number }, dx: number, dy: number, box: { width: number; height: number }, zoom: number) {
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 10) / 10));
  return {
    x: clamp(start.x - (dx / box.width) * (100 / zoom)),
    y: clamp(start.y - (dy / box.height) * (100 / zoom)),
  };
}

/** Aviso de 6b-07 quando a imagem perde o último uso ao sair da capa (remover ou trocar). */
export const LAST_USE_TEXT = 'Esta imagem não é usada em nenhuma outra apresentação. Ela vai para a lixeira ao sair da capa.';

/**
 * A imagem da capa não é usada em outra apresentação? `usedBy` conta os usos já salvos, inclusive o desta
 * apresentação; zero quer dizer que a imagem acabou de ser colocada e ainda não foi salva.
 */
export const isLastUse = (img: { usedBy: number } | null | undefined) => !!img && img.usedBy <= 1;

/** Texto da confirmação de remover (6b-07). */
export function removeImageText(lastUse: boolean, hasProject: boolean): string {
  if (lastUse) return LAST_USE_TEXT;
  return `Ela continua na biblioteca ${hasProject ? 'do projeto' : 'desta apresentação'} e pode ser usada de novo. Só vai para a lixeira do Drive quando nenhuma apresentação a usar.`;
}

// ---------- Vincular a um projeto (6b-10) ----------

export const LINK_MOVING_TEXT = 'Movendo arquivos para o projeto';

/** Erro do vínculo: as mensagens da E5, conforme os arquivos já movidos voltaram ou não. */
export function linkFailureText(err: unknown): string {
  const body = err instanceof ApiError ? err.body : {};
  if (err instanceof ApiError && err.code === 'drive_failed' && body.rolledBack === false) {
    return 'Não foi possível vincular. Alguns arquivos ficaram na pasta do projeto, e a apresentação continua abrindo normalmente.';
  }
  // Volta confirmada, ou recusa antes de mexer no Drive: os arquivos estão na pasta anterior. Sem resposta do
  // servidor, a tela confere a apresentação antes de mostrar o erro (se o vínculo chegou a ser feito, segue).
  return 'Não foi possível vincular. Os arquivos voltaram para a pasta anterior.';
}

/** Linhas de "O que muda de pasta". */
export function linkMoveLines(opts: { projectName: string; images: number; pdfVersion: number | null }): string[] {
  const lines: string[] = [];
  const { projectName, images, pdfVersion } = opts;
  if (images > 0) {
    lines.push(
      images === 1
        ? `1 imagem: de Avulsos/Imagens para ${projectName}/Apresentações/Imagens. Passa a fazer parte da biblioteca do projeto.`
        : `${images} imagens: de Avulsos/Imagens para ${projectName}/Apresentações/Imagens. Passam a fazer parte da biblioteca do projeto.`,
    );
  }
  if (pdfVersion === 1) lines.push(`PDF v1: de Avulsos para ${projectName}/Apresentações. Aparece em Arquivos.`);
  else if (pdfVersion) lines.push(`PDF v${pdfVersion} e versões antigas: de Avulsos para ${projectName}/Apresentações. Aparecem em Arquivos.`);
  lines.push('Nome, cliente e textos da capa continuam como estão.');
  return lines;
}

// ---------- Salvar em PDF (desenho 6b-11 e faixa do celular em 6b-13) ----------

/** Situação da exportação: o botão mostra "Gerando PDF"; os avisos ficam no canto, como os de 6b-05. */
export type PdfState =
  | { kind: 'idle' }
  | { kind: 'working' }
  | { kind: 'unchanged'; version: number; url: string; name: string | null }
  | { kind: 'error'; reason: 'failed' | 'unsaved' | 'overflow' };

/** Aviso de Tamanho real, no diálogo de exportar de qualquer apresentação (P25). */
export const PDF_REAL_SIZE_TITLE = 'Tamanho real';
export const PDF_REAL_SIZE_TEXT =
  'Para imprimir, escolha Tamanho real ou Escala 100% na janela de impressão, nunca Ajustar à página. Assim as medidas das folhas saem como estão no PDF.';

/** Para onde vai o PDF e o nome do arquivo, no diálogo. A avulsa vai para Avulsos e não tem Arquivos de projeto. */
export function pdfDialogLines(opts: { projectName: string | null; fileName: string }): string[] {
  return [
    opts.projectName
      ? `O PDF vai para o Drive, em ${opts.projectName}/Apresentações, e aparece em Arquivos do projeto.`
      : 'O PDF vai para o Drive, em De.Croqui ERP/Avulsos.',
    `Nome do arquivo: ${opts.fileName}`,
  ];
}

/** Versão que a próxima exportação vai receber, para o nome mostrado no diálogo. */
export const nextPdfVersion = (pdf: { version: number } | null | undefined) => (pdf?.version ?? 0) + 1;

/** "PDF v1 às 10:45", na barra do editor. No celular: "PDF v1 salvo às 10:45". */
export const pdfSavedLabel = (pdf: { version: number; exportedAt: string | null }, mobile = false) =>
  `PDF v${pdf.version}${mobile ? ' salvo' : ''}${pdf.exportedAt ? ` às ${clock(new Date(pdf.exportedAt))}` : ''}`;

export const pdfUnchangedText = (version: number) => `Nenhuma alteração desde o último PDF. O PDF v${version} continua no Drive.`;

export const PDF_ERROR_TEXTS: Record<'failed' | 'unsaved' | 'overflow', string> = {
  failed: 'Não foi possível salvar o PDF no Drive. A apresentação continua salva; tente de novo em instantes.',
  unsaved: 'O PDF não foi gerado porque as últimas alterações ainda não foram salvas. Tente de novo quando aparecer "Salvo".',
  overflow: 'O PDF não foi gerado: o texto da capa passou do limite da página. Encurte os textos mais longos e tente de novo.',
};

/** Resposta do servidor para o aviso: sem mudança (409), além do limite (422) ou falha. */
export function pdfFailure(err: unknown): PdfState {
  if (err instanceof ApiError && err.code === 'no_changes') {
    const file = err.body.file as { version?: number; url?: string; name?: string | null } | undefined;
    if (file?.url) return { kind: 'unchanged', version: file.version ?? 1, url: file.url, name: file.name ?? null };
  }
  if (err instanceof ApiError && err.code === 'content_overflow') return { kind: 'error', reason: 'overflow' };
  return { kind: 'error', reason: 'failed' };
}
