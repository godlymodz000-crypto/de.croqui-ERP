import { useState } from 'react';
import { Button, Dialog, Select } from '../../ui/ds';
import { ApiError } from '../../api/http';
import type { BoardCard, Stage } from '../../api/board';
import { projectList } from './cards';

/**
 * Remover etapa (quadro "remover etapa com projetos"). Com projetos, exige a etapa de destino;
 * o servidor recusa a remoção sem destino de qualquer forma.
 */
export function RemoveStageDialog({
  stage,
  stages,
  cards,
  onClose,
  onRemove,
}: {
  stage: Stage;
  stages: Stage[];
  cards: BoardCard[];
  onClose: () => void;
  onRemove: (destinationStageId: string | null) => Promise<void>;
}) {
  const others = stages.filter((s) => s.id !== stage.id);
  const [destination, setDestination] = useState(others[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const count = cards.length;
  const destName = others.find((s) => s.id === destination)?.name ?? '';

  async function confirm() {
    if (saving) return;
    if (count && !destination) {
      setError('Escolha para qual etapa os projetos vão.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onRemove(count ? destination : null);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(
        code === 'destination_required'
          ? 'Esta etapa recebeu projetos agora há pouco. O quadro foi atualizado: escolha para qual etapa eles vão.'
          : code === 'invalid_destination'
            ? 'A etapa de destino não existe mais. Escolha outra.'
            : code === 'last_stage'
              ? 'O quadro precisa de pelo menos uma etapa.'
              : 'Não foi possível remover a etapa. Tente de novo.',
      );
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      width={480}
      eyebrow="Remover etapa"
      title={`Remover a etapa ${stage.name}?`}
      footer={
        <>
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" onClick={confirm} aria-busy={saving || undefined}>
            Remover etapa
          </Button>
        </>
      }
    >
      {count ? (
        <>
          <p>
            Esta etapa tem {count === 1 ? '1 projeto' : `${count} projetos`}. Escolha para qual etapa{' '}
            {count === 1 ? 'ele vai' : 'eles vão'}.
          </p>
          <div className="dialog-field">
            <Select
              label="Etapa de destino"
              variant="box"
              value={destination}
              options={others.map((s) => ({ value: s.id, label: s.name }))}
              onChange={(e) => setDestination(e.target.value)}
              hint={`${projectList(cards.map((c) => c.name))} ${count === 1 ? 'vai' : 'vão'} para ${destName}.`}
            />
          </div>
        </>
      ) : (
        <p>A etapa não tem projetos. Ela sai do quadro, e o histórico dos projetos que passaram por ela continua guardado.</p>
      )}
      {error && (
        <p className="dialog-error" role="alert">
          {error}
        </p>
      )}
    </Dialog>
  );
}
