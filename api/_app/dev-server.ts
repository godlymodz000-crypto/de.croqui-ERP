import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDb } from './db/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // Sem .env: usa as variáveis já definidas no ambiente.
}

const config = loadConfig();
const app = await buildApp({ config, db: createDb(config.databaseUrl), logger: true });
await app.listen({ port: 3001, host: 'localhost' });
