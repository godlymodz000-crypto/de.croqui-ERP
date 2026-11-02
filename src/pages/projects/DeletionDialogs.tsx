import { useState } from 'react';
import { Button, Dialog, Input } from '../../ui/ds';

/** Colaborador pede a exclusão (quadro "colaborador pede exclusão"). */
export function RequestDeletionDialog({
  itemLabel,
  keepsText,
  onClose,
  onSend,
}: {
  itemLabel: string;
  /** O que continua até a decisão, ex.: "o arquivo continua no projeto e no Google Drive". */
  keepsText: string;
  onClose: () => void;
  onSend: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Dialog
      open
      onClose={onClose}
      width={480}
      eyebrow="Pedir exclusão"
      title={`Pedir a exclusão de ${itemLabel}?`}
      footer={
        <>
          <button type="button" className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <Button variant="outline" onClick={() => onSend(reason.trim())}>
            Enviar pedido
          </Button>
        </>
      }
    >
      <p>A administração recebe o pedido e decide. Até lá, {keepsText}.</p>
      <div className="dialog-field">
        <Input label="Motivo · opcional" variant="box" multiline rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </Dialog>
  );
}

/** Exclusão direta pelo administrador. */
export function ConfirmDeleteDialog({
  eyebrow,
  title,
  text,
  onClose,
  onConfirm,
}: {
  eyebrow: string;
  title: string;
  text: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
          <Button variant="outline" onClick={onConfirm}>
            Excluir
          </Button>
        </>
      }
    >
      <p>{text}</p>
    </Dialog>
  );
}
