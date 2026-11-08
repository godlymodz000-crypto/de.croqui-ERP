/** Nome e impressão digital do PDF da apresentação (Fase 6b, E9), no padrão do orçamento (budget-files.ts). */
import { sha256 } from './crypto.js';
import { canonicalJson } from './budget-files.js';

export { presentationPdfName, pdfIssueDate } from '../../src/shared/file-names.js';

/**
 * Impressão digital do que entra no PDF: conteúdo da apresentação (textos, capa e as referências das imagens,
 * com o enquadramento), nome, projeto e número. Igual ao da última exportação, o PDF sairia igual, e a rota
 * não gera outro. A imagem guardada não muda depois de enviada: trocar de imagem muda a referência.
 */
export function presentationSourceHash(input: { data: unknown; name: string; projectId: string | null; number: number }): string {
  return sha256(canonicalJson({ data: input.data, name: input.name, projectId: input.projectId, number: input.number }));
}
