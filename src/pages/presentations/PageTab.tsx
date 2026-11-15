import type { ReactNode } from 'react';
import { AppIcon } from '../../ui/AppIcon';
import type { PresentationContentPage } from '../../shared/presentation-data';
import { CoverImageField, type CoverImage } from './CoverImageField';
import {
  addItem,
  addState,
  compositionField,
  fieldMax,
  HIDDEN_ITEM_TEXT,
  itemCountLabel,
  itemFields,
  itemSummary,
  moveItem,
  PAGE_FIELDS,
  PAGE_LISTS,
  pageItems,
  pageKicker,
  pagePanelTitle,
  removeItem,
  removeState,
  setComposition,
  setItemField,
  setPageField,
  type FieldDef,
} from './pageEditor';
import './pageEditor.css';

const pad2 = (n: number) => String(n).padStart(2, '0');

export const PAGE_HELP = 'Edite os campos aqui. Com a Prévia desligada, o que falta preencher aparece em cinza e não sai no PDF.';
export const READONLY_HELP = 'Somente leitura. Você pode ver a apresentação e abrir o PDF salvo, mas não pode alterar nem gerar um PDF novo.';

/**
 * Aba Página das páginas internas (desenhos 6c-15 a 6c-20): campos do tipo, seletor de composição, lista de
 * itens com ↑ ↓ × e "+ item". Clicar num item abre os campos dele logo abaixo; só um fica aberto por vez, e é
 * o espaço de imagem dele que usa a biblioteca (`image`). Itens guardados e escondidos pela composição (P32)
 * continuam na lista, com o aviso.
 */
export function PageTab({
  page,
  index,
  readOnly,
  onChange,
  newId,
  openItem,
  onOpenItem,
  image,
  onBlur,
}: {
  page: PresentationContentPage;
  /** Posição no documento: 0 é a capa. */
  index: number;
  readOnly: boolean;
  onChange: (change: (p: PresentationContentPage) => PresentationContentPage) => void;
  newId: () => string;
  /** Id do item aberto, ou nulo. */
  openItem: string | null;
  onOpenItem: (id: string | null) => void;
  /** Imagem do item aberto (o mesmo gancho da imagem da capa). Nulo no leitor. */
  image: CoverImage | null;
  onBlur: () => void;
}) {
  const comp = compositionField(page);
  const list = PAGE_LISTS[page.tipo];
  const items = pageItems(page);
  const add = addState(page);
  const remove = removeState(page);
  const values = page as unknown as Record<string, string>;

  return (
    <>
      <div className="ppanel__head">
        <span className="ppanel__kicker">{pageKicker(index, page.tipo)}</span>
        <h2 className="ppanel__page-title">{pagePanelTitle(page)}</h2>
        <p className="ppanel__help">{readOnly ? READONLY_HELP : PAGE_HELP}</p>
      </div>
      {readOnly && <p className="ppanel__notice">Para editar, peça acesso de colaborador a quem administra o estúdio.</p>}

      {comp && (
        <Select
          label={comp.label}
          value={(page as { composicao: string }).composicao}
          options={comp.options}
          disabled={readOnly}
          onChange={(v) => onChange((p) => setComposition(p, v, newId))}
        />
      )}

      {PAGE_FIELDS[page.tipo].map((f) => (
        <Field key={f.key} def={f} value={values[f.key] ?? ''} disabled={readOnly} onBlur={onBlur} onChange={(v) => onChange((p) => setPageField(p, f.key, v))} />
      ))}

      {list && (
        <>
          <div className="ppanel__section ppanel__section--row">
            <h2 className="ppanel__section-title">{list.title}</h2>
            <span className="ppanel__count">{itemCountLabel(items.length)}</span>
          </div>
          <ol className="pitems">
            {items.map((item, i) => {
              const sum = itemSummary(page, i);
              const open = openItem === item.id;
              const n = pad2(i + 1);
              return (
                <li key={item.id} className={`pitem${open ? ' is-open' : ''}${sum.hidden ? ' is-hidden' : ''}`}>
                  <div className="pitem__row">
                    <button
                      type="button"
                      className="pitem__toggle"
                      aria-expanded={open}
                      aria-controls={`pitem-${item.id}`}
                      onClick={() => onOpenItem(open ? null : item.id)}
                    >
                      <span className="pitem__number">{n}</span>
                      <span className="pitem__text">
                        <span className="pitem__kind">{sum.kind}</span>
                        <span className={`pitem__title${sum.empty ? ' is-empty' : ''}`}>{sum.title}</span>
                        {sum.hidden && <span className="pitem__hidden">{HIDDEN_ITEM_TEXT}</span>}
                      </span>
                    </button>
                    {!readOnly && (
                      <span className="pitem__actions">
                        <button type="button" aria-label={`Subir item ${n}`} disabled={i === 0} onClick={() => onChange((p) => moveItem(p, i, -1))}>
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Descer item ${n}`}
                          disabled={i === items.length - 1}
                          onClick={() => onChange((p) => moveItem(p, i, 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover item ${n}`}
                          title={remove.reason ?? undefined}
                          disabled={!remove.enabled}
                          onClick={() => {
                            if (open) onOpenItem(null);
                            onChange((p) => removeItem(p, i));
                          }}
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                  {open && (
                    <ItemBody id={`pitem-${item.id}`} page={page} item={item} readOnly={readOnly} image={image} onBlur={onBlur} onChange={onChange} />
                  )}
                </li>
              );
            })}
          </ol>
          {!readOnly && list.adds.length > 0 && (
            <div className="padd">
              <div className="padd__buttons">
                {list.adds.map((a) => (
                  <button
                    key={a.kind}
                    type="button"
                    className="padd__button"
                    disabled={!add.enabled}
                    aria-describedby={add.reason ? 'padd-reason' : undefined}
                    onClick={() => onChange((p) => addItem(p, a.kind, newId))}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              {add.reason && (
                <p id="padd-reason" className="padd__reason">
                  {add.reason}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function ItemBody({
  id,
  page,
  item,
  readOnly,
  image,
  onBlur,
  onChange,
}: {
  id: string;
  page: PresentationContentPage;
  item: { id: string } & Record<string, unknown>;
  readOnly: boolean;
  image: CoverImage | null;
  onBlur: () => void;
  onChange: (change: (p: PresentationContentPage) => PresentationContentPage) => void;
}) {
  const spec = itemFields(page, item);
  return (
    <div id={id} className="pitem__body">
      {spec.image && !readOnly && image && <CoverImageField cover={image} label={spec.image} emptyTitle={spec.image} />}
      {spec.fields.map((f) => (
        <Field
          key={f.key}
          def={f}
          value={String(item[f.key] ?? '')}
          disabled={readOnly}
          onBlur={onBlur}
          onChange={(v) => onChange((p) => setItemField(p, item.id, f.key, v))}
        />
      ))}
      {spec.selects.map((s) => (
        <Select
          key={s.key}
          label={s.label}
          value={String(item[s.key])}
          options={s.options}
          disabled={readOnly}
          onChange={(v) => onChange((p) => setItemField(p, item.id, s.key, v))}
        />
      ))}
    </div>
  );
}

function Field({ def, value, disabled, onChange, onBlur }: { def: FieldDef; value: string; disabled: boolean; onChange: (v: string) => void; onBlur: () => void }) {
  const common = {
    className: `pfield__input${def.long ? ' pfield__area' : ''}`,
    value,
    placeholder: def.placeholder,
    maxLength: fieldMax(def),
    disabled,
    onBlur,
  };
  return (
    <label className="pfield">
      <span className="pfield__label">{def.label}</span>
      {def.long ? (
        <textarea {...common} rows={2} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Select({
  label,
  value,
  options,
  disabled,
  onChange,
  children,
}: {
  label: string;
  value: string;
  options: [string, string][];
  disabled: boolean;
  onChange: (v: string) => void;
  children?: ReactNode;
}) {
  return (
    <label className="pfield">
      <span className="pfield__label">{label}</span>
      <span className="pselect-wrap">
        <select className="pselect" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <AppIcon name="chevron-down" size={16} />
      </span>
      {children}
    </label>
  );
}
