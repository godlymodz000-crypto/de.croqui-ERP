import { request } from './http';

export interface Notification {
  id: string;
  type: 'deletion.requested' | 'deletion.approved' | 'deletion.rejected' | 'drive.failed';
  title: string;
  body: string;
  /** Caminho dentro do ERP para o item. */
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsState {
  items: Notification[];
  unread: number;
  /** Pedidos de exclusão pendentes; null para quem não decide pedidos. */
  pendingDeletionRequests: number | null;
}

export const notificationsApi = {
  list: () => request<NotificationsState>('GET', '/notifications'),
  read: (id: string) => request<void>('POST', `/notifications/${id}/read`),
  readAll: () => request<void>('POST', '/notifications/read-all'),
};
