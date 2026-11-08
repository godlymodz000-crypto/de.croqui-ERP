// Fase 6b, etapa E9: textos e regras da tela "Salvar em PDF" (desenho 6b-11 e faixa do celular em 6b-13).
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api/http';
import {
  nextPdfVersion,
  PDF_ERROR_TEXTS,
  PDF_REAL_SIZE_TEXT,
  pdfDialogLines,
  pdfFailure,
  pdfSavedLabel,
  pdfUnchangedText,
} from '../src/pages/presentations/editor';
import { presentationPdfName } from '../src/shared/file-names';

describe('diálogo de exportar', () => {
  it('de projeto: pasta Apresentações do projeto e Arquivos, como no desenho', () => {
    const fileName = presentationPdfName({ name: 'Apresentação do anteprojeto', number: 3, issueDate: '2026-11-07', version: nextPdfVersion(null) });
    expect(pdfDialogLines({ projectName: 'Projeto Teste', fileName })).toEqual([
      'O PDF vai para o Drive, em Projeto Teste/Apresentações, e aparece em Arquivos do projeto.',
      'Nome do arquivo: Apresentacao-3-Apresentacao-do-anteprojeto-2026-11-07.pdf',
    ]);
  });

  it('avulsa: só a pasta Avulsos', () => {
    expect(pdfDialogLines({ projectName: null, fileName: 'Apresentacao-1-Estudo-2026-11-07.pdf' })[0]).toBe('O PDF vai para o Drive, em De.Croqui ERP/Avulsos.');
  });

  it('o nome mostrado leva a próxima versão', () => {
    expect(nextPdfVersion({ version: 2 })).toBe(3);
    expect(presentationPdfName({ name: 'Estudo', number: 1, issueDate: '2026-11-07', version: nextPdfVersion({ version: 1 }) })).toBe('Apresentacao-1-Estudo-2026-11-07-v2.pdf');
  });

  it('aviso de Tamanho real', () => {
    expect(PDF_REAL_SIZE_TEXT).toBe(
      'Para imprimir, escolha Tamanho real ou Escala 100% na janela de impressão, nunca Ajustar à página. Assim as medidas das folhas saem como estão no PDF.',
    );
  });
});

describe('estados do PDF', () => {
  it('PDF salvo na barra e no celular', () => {
    const at = new Date(2026, 10, 7, 10, 45).toISOString();
    expect(pdfSavedLabel({ version: 1, exportedAt: at })).toBe('PDF v1 às 10:45');
    expect(pdfSavedLabel({ version: 2, exportedAt: at }, true)).toBe('PDF v2 salvo às 10:45');
  });

  it('sem alterações (409) traz o PDF atual', () => {
    const err = new ApiError(409, 'no_changes', {}, { file: { version: 1, url: 'https://drive.google.com/file/d/x/view', name: 'a.pdf' } });
    expect(pdfFailure(err)).toEqual({ kind: 'unchanged', version: 1, url: 'https://drive.google.com/file/d/x/view', name: 'a.pdf' });
    expect(pdfUnchangedText(1)).toBe('Nenhuma alteração desde o último PDF. O PDF v1 continua no Drive.');
  });

  it('além do limite (422) e falhas', () => {
    expect(pdfFailure(new ApiError(422, 'content_overflow'))).toEqual({ kind: 'error', reason: 'overflow' });
    expect(pdfFailure(new ApiError(502, 'drive_failed'))).toEqual({ kind: 'error', reason: 'failed' });
    expect(pdfFailure(new ApiError(502, 'pdf_failed'))).toEqual({ kind: 'error', reason: 'failed' });
    expect(pdfFailure(new TypeError('Failed to fetch'))).toEqual({ kind: 'error', reason: 'failed' });
  });

  it('textos aprovados, em pt-BR, sem exclamação', () => {
    expect(PDF_ERROR_TEXTS.failed).toBe('Não foi possível salvar o PDF no Drive. A apresentação continua salva; tente de novo em instantes.');
    expect(PDF_ERROR_TEXTS.overflow).toBe('O PDF não foi gerado: o texto da capa passou do limite da página. Encurte os textos mais longos e tente de novo.');
    expect(PDF_ERROR_TEXTS.unsaved).toBe('O PDF não foi gerado porque as últimas alterações ainda não foram salvas. Tente de novo quando aparecer "Salvo".');
    for (const t of [...Object.values(PDF_ERROR_TEXTS), PDF_REAL_SIZE_TEXT, pdfUnchangedText(3)]) expect(t).not.toContain('!');
  });
});
