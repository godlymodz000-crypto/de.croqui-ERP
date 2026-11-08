import { useEffect } from 'react';
import type { PresentationWithData } from '../../api/presentations';
import { pdfIssueDate, presentationPdfName } from '../../shared/file-names';
import { nextPdfVersion, PDF_REAL_SIZE_TEXT, PDF_REAL_SIZE_TITLE, pdfDialogLines } from './editor';

/**
 * Diálogo de exportar (desenho 6b-11): para onde vai o PDF, o nome do arquivo e o aviso de Tamanho real.
 * "Salvar em PDF" fecha o diálogo e a barra mostra "Gerando PDF". No celular, o mesmo diálogo na largura da tela.
 */
export function ExportPdfDialog({
  presentation,
  name,
  issueDate,
  onCancel,
  onConfirm,
}: {
  presentation: PresentationWithData;
  /** Nome mostrado na barra: o que está sendo salvo. */
  name: string;
  /** Data de emissão da aba Projeto (AAAA-MM-DD ou vazio). */
  issueDate: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const project = presentation.project;
  const fileName = presentationPdfName({
    name,
    number: presentation.number,
    issueDate: pdfIssueDate(issueDate, new Date()),
    version: nextPdfVersion(presentation.pdf),
  });
  const [where, file] = pdfDialogLines({ projectName: project?.name ?? null, fileName });

  return (
    <div className="pveil" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="plink pexport" role="dialog" aria-modal="true" aria-labelledby="pexport-title">
        <div className="plibrary__top">
          <div className="plibrary__titles">
            <span className="plibrary__eyebrow">
              Apresentação nº {presentation.number} · {project ? project.name : 'Sem projeto'}
            </span>
            <h2 id="pexport-title" className="plibrary__title">
              Salvar em PDF
            </h2>
            <p className="plibrary__text pexport__text">
              {where}
              <br />
              {file}
            </p>
          </div>
          <button type="button" className="plibrary__close" aria-label="Fechar" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="pexport__box">
          <span className="pexport__box-title">{PDF_REAL_SIZE_TITLE}</span>
          <p>{PDF_REAL_SIZE_TEXT}</p>
        </div>

        <div className="plink__actions pexport__actions">
          <button type="button" className="pbtn pbtn--text pbtn--lg" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="pbtn pbtn--solid pbtn--lg" onClick={onConfirm}>
            Salvar em PDF
          </button>
        </div>
      </div>
    </div>
  );
}
