import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Tag, Toast } from '../../ui/ds';
import { ApiError } from '../../api/http';
import { deletionApi, SUBFOLDER_LABEL, type DeletionRequest, type RequestStatus, type Subfolder } from '../../api/files';
import { formatLastAccess } from '../collaborators/format';
import { useNotifications } from '../../layout/NotificationBell';

const STATUS: { value: RequestStatus; label: string }[] = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Recusados' },
];

const ERRORS: Record<string, string> = {
  own_request: 'Este pedido é seu. Outra pessoa da administração precisa decidir.',
  not_pending: 'Este pedido já foi decidido.',
  drive_failed: 'Não foi possível mover para a lixeira do Google Drive. O pedido continua pendente.',
  not_found: 'Este pedido não existe mais.',
};
const GENERIC_ERROR = 'Não foi possível concluir. Tente de novo em instantes.';

function excerpt(text: string, max = 48) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Nome do item e a linha de detalhe, como no quadro "Pedidos de exclusão". */
function describe(r: DeletionRequest) {
  if (r.itemType === 'file') {
    const folder = r.itemDetail ? SUBFOLDER_LABEL[r.itemDetail as Subfolder] : null;
    return { label: r.itemLabel ?? 'Arquivo', detail: ['Arquivo', folder, 'vai para a lixeira do Drive'].filter(Boolean).join(' · ') };
  }
  if (r.itemType === 'note') {
    const when = r.itemDetail ? formatLastAccess(r.itemDetail) : null;
    return { label: when ? `Nota de ${when.toLowerCase()}` : 'Nota', detail: `Nota · “${excerpt(r.itemLabel ?? '')}”` };
  }
  return { label: r.itemLabel ?? 'Projeto', detail: 'Projeto · a pasta vai para a lixeira do Drive' };
}

/** Pedidos de exclusão, só para a administração (mesmo padrão de Colaboradores). */
export function DeletionRequestsPage() {
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [data, setData] = useState<{ requests: DeletionRequest[]; counts: Record<RequestStatus, number> } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'neutral' | 'danger'; message: string } | null>(null);
  const { refresh: refreshCounters } = useNotifications();

  const load = useCallback(async () => {
    try {
      setData(await deletionApi.list(status));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function decide(r: DeletionRequest, action: 'approve' | 'reject') {
    setBusy(r.id);
    try {
      await (action === 'approve' ? deletionApi.approve(r.id) : deletionApi.reject(r.id));
      const { label } = describe(r);
      setToast({
        tone: 'neutral',
        message:
          action === 'reject'
            ? `Pedido recusado. ${label} continua no projeto.`
            : r.itemType === 'file'
              ? `${label} foi para a lixeira do Google Drive.`
              : r.itemType === 'project'
                ? `${label} saiu do ERP. A pasta foi para a lixeira do Google Drive.`
                : `${label} saiu do ERP.`,
      });
    } catch (err) {
      setToast({ tone: 'danger', message: (err instanceof ApiError && ERRORS[err.code]) || GENERIC_ERROR });
    } finally {
      setBusy(null);
    }
    load();
    // O contador do menu do avatar acompanha a decisão, sem esperar o próximo ciclo do sino.
    refreshCounters();
  }

  const requests = data?.requests ?? [];

  return (
    <section className="deletion-requests">
      <header className="page-header">
        <div>
          <p className="page-header__eyebrow">Administração</p>
          <h1 className="page-header__title">Pedidos de exclusão</h1>
          <p className="page-header__intro page-header__intro--wide">
            Colaboradores pedem, a administração decide. Aprovar um arquivo ou um projeto manda o arquivo ou a pasta para a
            lixeira do Google Drive, onde fica por 30 dias. Notas saem só do ERP.
          </p>
        </div>
      </header>

      <div className="projects-toolbar__filters requests-filters" role="group" aria-label="Filtrar pedidos">
        {STATUS.map((s) => (
          <Tag key={s.value} selected={status === s.value} onClick={() => setStatus(s.value)}>
            {s.label} · {data?.counts[s.value] ?? 0}
          </Tag>
        ))}
      </div>

      <div className="requests-table" role="table" aria-label="Pedidos de exclusão">
        <div className="requests-table__head" role="row">
          <span role="columnheader">Item</span>
          <span role="columnheader">Projeto</span>
          <span role="columnheader">Pedido por</span>
          <span role="columnheader">Motivo</span>
          <span role="columnheader" aria-label={status === 'pending' ? 'Ações' : 'Decisão'} />
        </div>

        {loadFailed && <p className="people-table__message">{GENERIC_ERROR}</p>}
        {data && requests.length === 0 && (
          <p className="people-table__message">
            {status === 'pending' ? 'Nenhum pedido esperando decisão.' : status === 'approved' ? 'Nenhum pedido aprovado.' : 'Nenhum pedido recusado.'}
          </p>
        )}

        {requests.map((r) => {
          const { label, detail } = describe(r);
          return (
            <div key={r.id} className="requests-table__row" role="row">
              <span role="cell" className="request-item">
                <span className="request-item__label">{label}</span>
                <span className="request-item__detail">{r.itemDeleted && status === 'pending' ? 'Já excluído por outro caminho' : detail}</span>
              </span>
              <span role="cell" className="requests-table__project" data-label="Projeto">
                {r.project.name ? <Link to={`/projetos/${r.project.id}`}>{r.project.name}</Link> : '—'}
              </span>
              <span role="cell" className="requests-table__who">
                <span>{r.requestedBy ?? 'Conta removida'}</span>
                <span className="projects-table__author">{formatLastAccess(r.createdAt)}</span>
              </span>
              <span role="cell" className={`requests-table__reason${r.reason ? '' : ' is-empty'}`} data-label="Motivo">
                {r.reason ?? 'Sem motivo informado'}
              </span>
              <span role="cell" className="requests-table__actions">
                {r.status === 'pending' ? (
                  <>
                    <button type="button" className="text-button" disabled={busy === r.id} onClick={() => decide(r, 'reject')}>
                      Recusar
                    </button>
                    <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => decide(r, 'approve')}>
                      Aprovar
                    </Button>
                  </>
                ) : (
                  <span className="requests-table__decision">
                    {r.status === 'approved' ? 'Aprovado' : 'Recusado'}
                    {r.decidedBy && ` por ${r.decidedBy}`}
                    {r.decidedAt && <span className="projects-table__author">{formatLastAccess(r.decidedAt)}</span>}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="toast-slot">
          <Toast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}
    </section>
  );
}
