import { useState } from 'react';
import { Button, Dialog } from '../../ui/ds';
import type { AgendaEvent } from '../../api/events';

/** Confirmação com um botão de ação e o erro, se a gravação falhar. */
function Confirm({
  eyebrow,
  title,
  text,
  action,
  failure,
  onClose,
  onConfirm,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action: string;
  failure: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function confirm() {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await onConfirm();
    } catch {
      setError(true);
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      width={480}
      eyebrow={eyebrow}
      title={title}
      footer={
        <>
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" onClick={confirm} aria-busy={saving || undefined}>
            {action}
          </Button>
        </>
      }
    >
      <p>{text}</p>
      {error && (
        <p className="dialog-error" role="alert">
          {failure}
        </p>
      )}
    </Dialog>
  );
}

export function RemoveEventDialog({ event, onClose, onRemove }: { event: AgendaEvent; onClose: () => void; onRemove: () => Promise<void> }) {
  return (
    <Confirm
      eyebrow="Remover evento"
      title={`Remover ${event.title}?`}
      text="O evento sai da Agenda do ERP e vai para a lixeira do Google Agenda, onde fica por 30 dias. A remoção fica registrada no histórico."
      action="Remover"
      failure="Não foi possível remover o evento. Tente de novo."
      onClose={onClose}
      onConfirm={onRemove}
    />
  );
}

export function DisconnectDialog({ onClose, onDisconnect }: { onClose: () => void; onDisconnect: () => Promise<void> }) {
  return (
    <Confirm
      eyebrow="Google Agenda"
      title="Desconectar o Google Agenda?"
      text="A sincronização para e o ERP esquece o calendário De.Croqui ERP. Seu acesso ao Google não é revogado: o Drive continua funcionando. Os eventos continuam no ERP e voltam a sincronizar quando você conectar de novo."
      action="Desconectar"
      failure="Não foi possível desconectar. Tente de novo."
      onClose={onClose}
      onConfirm={onDisconnect}
    />
  );
}
