import { useEffect, useRef } from 'react';
import type { AddablePageKind, PresentationData } from '../../shared/presentation-data';
import {
  ADD_PAGE_OPTIONS,
  addPageHelp,
  addPageState,
  canMoveDown,
  canMoveUp,
  canRemove,
  DUPLICATE_NOTICE,
  DUPLICATE_TITLE,
  pageNumber,
  pageRowKind,
  pageRowName,
  pagesCountLabel,
  removePageDialog,
} from './pagesList';
import './pagesTab.css';

/**
 * Aba Páginas (desenho 6c-21): lista das páginas com ↑ ↓, Duplicar e ×, e o menu de adicionar. Clicar numa
 * linha muda a página atual, a da visualização. Quem só lê vê a lista sem ações e sem o menu.
 */
export function PagesTab({
  data,
  current,
  readOnly,
  onSelect,
  onMove,
  onAskRemove,
  onAdd,
}: {
  data: PresentationData;
  current: number;
  readOnly: boolean;
  onSelect: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onAskRemove: (index: number) => void;
  onAdd: (tipo: AddablePageKind) => void;
}) {
  const total = data.paginas.length;
  const add = addPageState(data);
  return (
    <>
      <div className="ppanel__section ppanel__section--row">
        <h2 className="ppanel__section-title">Páginas</h2>
        <span className="ppanel__count">{pagesCountLabel(total)}</span>
      </div>
      <ol className="ppages" aria-label="Páginas da apresentação">
        {data.paginas.map((page, i) => {
          const n = pageNumber(i);
          return (
            <li key={page.id} className={`ppages__row${i === current ? ' is-active' : ''}`}>
              <button type="button" className="ppages__open" aria-current={i === current ? 'page' : undefined} onClick={() => onSelect(i)}>
                <span className="ppages__number">{n}</span>
                <span className="ppages__text">
                  <span className="ppages__kind">{pageRowKind(page)}</span>
                  <span className="ppages__name">{pageRowName(page)}</span>
                </span>
              </button>
              {!readOnly && i > 0 && (
                <span className="ppages__actions">
                  <button type="button" aria-label={`Subir página ${n}`} disabled={!canMoveUp(i)} onClick={() => onMove(i, -1)}>
                    ↑
                  </button>
                  <button type="button" aria-label={`Descer página ${n}`} disabled={!canMoveDown(i, total)} onClick={() => onMove(i, 1)}>
                    ↓
                  </button>
                  {/* Proposta (P29): fica desligado até a cópia ser aprovada. */}
                  <button type="button" className="ppages__dup" disabled title={DUPLICATE_TITLE} aria-describedby="ppages-note">
                    Duplicar
                  </button>
                  <button type="button" aria-label={`Remover página ${n}`} disabled={!canRemove(i)} onClick={() => onAskRemove(i)}>
                    ×
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!readOnly && (
        <>
          <p id="ppages-note" className="ppanel__notice">
            {DUPLICATE_NOTICE}
          </p>
          <div className="ppanel__section">
            <h2 className="ppanel__section-title">Adicionar página</h2>
            <p className="ppanel__help">{addPageHelp(current)}</p>
          </div>
          <div className="ppages__add" role="group" aria-label="Adicionar página">
            {ADD_PAGE_OPTIONS.map((o) => (
              <button
                key={o.tipo}
                type="button"
                className="ppages__type"
                disabled={!add.enabled}
                aria-describedby={add.reason ? 'ppages-limit' : undefined}
                onClick={() => onAdd(o.tipo)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {add.reason && (
            <p id="ppages-limit" className="padd__reason">
              {add.reason}
            </p>
          )}
        </>
      )}
    </>
  );
}

/** Confirmação de remover página (P34), no padrão da de remover imagem (6b-07). */
export function RemovePageDialog({
  data,
  index,
  onCancel,
  onConfirm,
}: {
  data: PresentationData;
  index: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  const d = removePageDialog(data, index);
  return (
    <div className="pveil" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pconfirm" role="dialog" aria-modal="true" aria-labelledby="ppremove-title" aria-describedby="ppremove-text">
        <h2 id="ppremove-title" className="pconfirm__title">
          {d.title}
        </h2>
        <div id="ppremove-text" className="pconfirm__body">
          <p className="pconfirm__text">{d.text}</p>
          {d.images && <p className="pconfirm__text">{d.images}</p>}
        </div>
        <div className="pconfirm__actions">
          <button ref={cancelRef} type="button" className="pbtn pbtn--text" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="pbtn pbtn--outline" onClick={onConfirm}>
            Remover página
          </button>
        </div>
      </div>
    </div>
  );
}
