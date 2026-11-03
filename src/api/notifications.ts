import { cached, mutate, prime, request, TTL } from './http';

export type NotificationType = 'deletion.requested' | 'deletion.approved' | 'deletion.rejected' | 'drive.failed' | 'announcement';
/** Opções do seletor "Tipo" da página. */
export type TypeFilter = 'all' | 'requests' | 'announcements' | 'drive';
export type View = 'all' | 'unread';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Caminho dentro do ERP para o item. */
  link: string | null;
  /** Quem enviou, só nos comunicados. */
  senderName: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsState {
  items: Notification[];
  unread: number;
  total: number;
  page: number;
  pageSize: number;
  /** Pedidos de exclusão pendentes; null para quem não decide pedidos. */
  pendingDeletionRequests: number | null;
}

export type Audience = 'all' | 'members' | 'viewers' | 'people';
export type LinkTarget = { kind: 'project'; projectId: string } | { kind: 'page'; page: string } | null;

export interface AudienceInfo {
  people: { id: string; name: string; role: 'admin' | 'member' | 'viewer'; me: boolean }[];
  /** Quantos recebem em cada grupo, sem contar quem envia. */
  counts: { all: number; members: number; viewers: number };
}

export interface SentBroadcast {
  id: string;
  title: string;
  body: string;
  link: string | null;
  audience: Audience;
  /** Nomes de quem recebeu, só em "Pessoas específicas". */
  recipients: string[] | null;
  senderName: string | null;
  recipientCount: number;
  readCount: number;
  createdAt: string;
}

export interface BroadcastInput {
  audience: Audience;
  userIds?: string[];
  title: string;
  body: string;
  link: LinkTarget;
}

/** Itens por página na página de Notificações. */
export const PAGE_SIZE = 20;
/** O sino mostra só as últimas. */
export const BELL_SIZE = 5;

export const TYPE_LABEL: Record<NotificationType, string> = {
  'deletion.requested': 'Pedido',
  'deletion.approved': 'Pedido',
  'deletion.rejected': 'Pedido',
  'drive.failed': 'Drive',
  announcement: 'Comunicado',
};

/** Rótulo do tipo. Um tipo que a interface ainda não conhece vira "Aviso" em vez de sumir. */
export function typeLabel(type: string | null | undefined) {
  return (type && TYPE_LABEL[type as NotificationType]) || 'Aviso';
}

const BELL_KEY = `notifications?limit=${BELL_SIZE}`;

export const notificationsApi = {
  /** `force` ignora o cache, para quando se sabe que mudou (o sino trouxe outra contagem, por exemplo). */
  list: (q: { view?: View; type?: TypeFilter; page?: number; limit?: number } = {}, opts: { force?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (q.view && q.view !== 'all') qs.set('view', q.view);
    if (q.type && q.type !== 'all') qs.set('type', q.type);
    if (q.page && q.page > 1) qs.set('page', String(q.page));
    if (q.limit) qs.set('limit', String(q.limit));
    const s = qs.toString();
    const key = `notifications${s ? `?${s}` : ''}`;
    return cached(
      key,
      TTL.notifications,
      async () => {
        const data = await request<NotificationsState>('GET', `/${key}`);
        // A primeira página de "Todas" já tem tudo o que o sino mostra: o sino não precisa buscar de novo.
        if (!s) prime<NotificationsState>(BELL_KEY, { ...data, items: data.items.slice(0, BELL_SIZE), pageSize: BELL_SIZE });
        return data;
      },
      opts,
    );
  },
  read: (id: string) => mutate(request<void>('POST', `/notifications/${id}/read`), 'notifications'),
  readAll: () => mutate(request<void>('POST', '/notifications/read-all'), 'notifications'),
};

export const broadcastsApi = {
  audience: () => cached('broadcasts/audience', TTL.audience, () => request<AudienceInfo>('GET', '/broadcasts/audience')),
  send: (input: BroadcastInput) =>
    mutate(request<{ id: string; recipientCount: number }>('POST', '/broadcasts', input), 'notifications', 'broadcasts?'),
  list: (page = 1) =>
    cached(`broadcasts?page=${page}`, TTL.broadcasts, () =>
      request<{ items: SentBroadcast[]; total: number; page: number; pageSize: number }>('GET', `/broadcasts${page > 1 ? `?page=${page}` : ''}`),
    ),
};
