import type { Db } from './db/client.js';
import { auditLog } from './db/schema.js';

type Executor = Pick<Db, 'insert'>;

/** `userId` nulo: mudança que veio de fora, sem pessoa do ERP por trás (ex.: evento alterado no Google). */
export async function audit(
  db: Executor,
  entry: { userId: string | null; action: string; entity: string; entityId: string; payload?: Record<string, unknown> },
): Promise<void> {
  await db.insert(auditLog).values({ ...entry, payload: entry.payload ?? {} });
}
