import { useEffect, useRef, useState } from 'react';

export interface RowAction {
  label: string;
  danger?: boolean;
  /** Item que aparece, mas não age (ex.: a etapa atual no "Mover para"). */
  disabled?: boolean;
  onSelect: () => void;
}

/** Título de um grupo de itens, como "Mover para" no menu do cartão do Kanban. */
export interface RowHeading {
  heading: string;
}

export type RowMenuEntry = RowAction | RowHeading;

/** Botão de três pontos com o menu de ações da linha (quadro "ações da linha"). */
export function RowMenu({ label, actions, className }: { label: string; actions: RowMenuEntry[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className={`row-menu${className ? ` ${className}` : ''}${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className={`row-menu__trigger${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="row-menu__popover" role="menu" aria-label={label}>
          <RowMenuItems actions={actions} onPicked={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/** Itens do menu aberto: ações, títulos de grupo e itens sem ação. */
export function RowMenuItems({ actions, onPicked }: { actions: RowMenuEntry[]; onPicked: () => void }) {
  return (
    <>
      {actions.map((a) =>
        'heading' in a ? (
          <p key={`h-${a.heading}`} className="row-menu__heading" role="presentation">
            {a.heading}
          </p>
        ) : (
          <button
            key={a.label}
            type="button"
            role="menuitem"
            className={`row-menu__item${a.danger ? ' is-danger' : ''}`}
            aria-disabled={a.disabled || undefined}
            onClick={() => {
              if (a.disabled) return;
              onPicked();
              a.onSelect();
            }}
          >
            {a.label}
          </button>
        ),
      )}
    </>
  );
}
