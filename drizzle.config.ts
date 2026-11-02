import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile('.env');
} catch {
  // Sem .env: usa as variáveis já definidas no ambiente.
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './api/_app/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
