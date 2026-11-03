import { and, eq, ne, sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { deletionRequests, notifications, projectFiles, projects, users, type DeletionRequest, type NotificationType } from './db/schema.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Writer = Db | Tx;

/** Tipos de notificação (seção 7). O texto vai pronto; a tela só mostra. Comunicados saem de routes/notifications.ts. */
interface Notice {
  type: Exclude<NotificationType, 'announcement'>;
  title: string;
  body: string;
  /** Caminho dentro do ERP para o item. */
  link: string | null;
}

export async function notify(db: Writer, userIds: (string | null)[], notice: Notice) {
  const to = [...new Set(userIds.filter((x): x is string => !!x))];
  if (!to.length) return;
  await db.insert(notifications).values(to.map((userId) => ({ userId, ...notice })));
}

/** Avisa os administradores ativos, menos `except` (quem fez a ação não se notifica). */
export async function notifyAdmins(db: Writer, notice: Notice, except?: string | null) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, 'admin'), eq(users.status, 'active'), ...(except ? [ne(users.id, except)] : [])));
  await notify(
    db,
    rows.map((r) => r.id),
    notice,
  );
}

async function displayName(db: Writer, id: string | null) {
  if (!id) return 'Alguém';
  const [u] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, id));
  return u ? (u.name ?? u.email) : 'Alguém';
}

/** Como o item aparece no texto: "de planta.pdf", "de uma nota", "do projeto Casa Alecrim". */
async function describe(db: Writer, req: DeletionRequest) {
  const [p] = await db.select({ name: projects.name, deletedAt: projects.deletedAt }).from(projects).where(eq(projects.id, req.projectId));
  const projectName = p?.name ?? 'projeto removido';
  const link = !p || p.deletedAt ? '/projetos' : `/projetos/${req.projectId}`;
  if (req.itemType === 'file') {
    const [f] = await db.select({ name: projectFiles.name }).from(projectFiles).where(eq(projectFiles.id, req.itemId));
    const name = f?.name ?? 'um arquivo';
    return { of: `de ${name}`, Item: name, where: ` em ${projectName}`, link };
  }
  if (req.itemType === 'note') return { of: 'de uma nota', Item: 'A nota', where: ` em ${projectName}`, link };
  return { of: `do projeto ${projectName}`, Item: `O projeto ${projectName}`, where: '', link };
}

/** Administração: chegou um pedido novo. */
export async function noticeNewRequest(db: Writer, req: DeletionRequest) {
  const who = await displayName(db, req.requestedBy);
  const d = await describe(db, req);
  await notifyAdmins(
    db,
    { type: 'deletion.requested', title: 'Novo pedido de exclusão', body: `${who} pediu a exclusão ${d.of}${d.where}.`, link: '/pedidos-de-exclusao' },
    req.requestedBy,
  );
}

/** Quem pediu: o pedido foi aprovado ou recusado. Quem decidiu não se notifica. */
export async function noticeDecision(db: Writer, req: DeletionRequest, status: 'approved' | 'rejected', actorId: string) {
  if (!req.requestedBy || req.requestedBy === actorId) return;
  const d = await describe(db, req);
  let body: string;
  if (status === 'rejected') body = `${d.Item} continua${req.itemType === 'project' ? ' no ERP' : d.where}.`;
  else if (req.itemType === 'file') body = `${d.Item}${d.where} foi para a lixeira do Google Drive.`;
  else if (req.itemType === 'note') body = `${d.Item}${d.where} foi excluída.`;
  else body = `${d.Item} foi excluído, e a pasta foi para a lixeira do Google Drive.`;
  await notify(db, [req.requestedBy], {
    type: status === 'approved' ? 'deletion.approved' : 'deletion.rejected',
    title: status === 'approved' ? 'Pedido de exclusão aprovado' : 'Pedido de exclusão recusado',
    body,
    link: d.link,
  });
}

/** Fecha como aprovados os pedidos pendentes de um item excluído direto, e avisa quem pediu. */
export async function closePending(tx: Tx, type: DeletionRequest['itemType'], itemId: string, actorId: string) {
  const closed = await tx
    .update(deletionRequests)
    .set({ status: 'approved', decidedBy: actorId, decidedAt: new Date() })
    .where(and(eq(deletionRequests.itemType, type), eq(deletionRequests.itemId, itemId), eq(deletionRequests.status, 'pending')))
    .returning();
  for (const req of closed) await noticeDecision(tx, req, 'approved', actorId);
}

/** Pedidos pendentes, para o contador do menu do avatar. */
export async function pendingRequestCount(db: Writer) {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(deletionRequests).where(eq(deletionRequests.status, 'pending'));
  return Number(row?.n ?? 0);
}
