import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import { Button } from '../../ui/ds';

const NAME_MESSAGES: Record<string, string> = {
  required: 'Informe o nome da etapa.',
  too_long: 'Use um nome com até 40 caracteres.',
  taken: 'Já existe uma etapa com esse nome.',
};

/** Campo de nome da etapa, aberto no lugar do cabeçalho (renomear) ou no fim do quadro (nova etapa). */
export function StageForm({
  label,
  initial = '',
  submitLabel,
  onCancel,
  onSubmit,
}: {
  label: string;
  initial?: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = `etapa-${label.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError(NAME_MESSAGES.required);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      const field = err instanceof ApiError ? err.fields.name : undefined;
      setError(field ? (NAME_MESSAGES[field] ?? NAME_MESSAGES.required) : 'Não foi possível salvar a etapa. Tente de novo.');
      setSaving(false);
    }
  }

  return (
    <form
      className="stage-form"
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
        }
      }}
    >
      <label className="stage-form__label" htmlFor={id}>
        {label}
      </label>
      <input
        ref={input}
        id={id}
        className="stage-form__input"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
      />
      {error && (
        <p id={`${id}-erro`} className="stage-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="stage-form__actions">
        <button type="button" className="text-button" onClick={onCancel}>
          Cancelar
        </button>
        <Button variant="outline" size="sm" type="submit" aria-busy={saving || undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
