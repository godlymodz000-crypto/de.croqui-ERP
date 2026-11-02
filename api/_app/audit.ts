import type { Db } from './db/client.js';
import { auditLog } from './db/schema.js';

type Executor = Pick<Db, 'insert'>;

export async function audit(
  db: Executor,
  entry: { userId: string; action: string; entity: string; entityId: string; payload?: Record<string, unknown> },
): Promise<void> {
  await db.insert(auditLog).values({ ...entry, payload: entry.payload ?? {} });
}
