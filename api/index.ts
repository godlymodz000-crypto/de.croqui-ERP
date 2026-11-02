import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from './_app/app.js';
import { loadConfig } from './_app/config.js';
import { createDb } from './_app/db/client.js';

// Função serverless da Vercel. O vercel.json reescreve /api/* para cá; o Fastify
// registra as rotas sem o prefixo, então ele é removido antes de repassar.
let appPromise: ReturnType<typeof start> | null = null;

async function start() {
  const config = loadConfig();
  const app = await buildApp({ config, db: createDb(config.databaseUrl), logger: true });
  await app.ready();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  appPromise ??= start().catch((err) => {
    appPromise = null;
    throw err;
  });
  const app = await appPromise;
  req.url = (req.url ?? '/').replace(/^\/api(?=\/|\?|$)/, '') || '/';
  app.server.emit('request', req, res);
}
