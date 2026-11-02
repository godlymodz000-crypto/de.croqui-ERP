# ERP De.Croqui

Sistema de gestão do estúdio. Especificação em `ESPECIFICACAO.md`; desenhos aprovados em `design/`.

- Front: Vite + React + TypeScript (`src/`). Design system copiado em `src/design-system/` (não editar).
- Back-end: Fastify em `api/`, publicado como função serverless da Vercel (`api/index.ts`). Código em `api/_app/`.
- Banco: PostgreSQL do Supabase via Drizzle ORM. Migrações em `drizzle/`.

## Rodar localmente

1. Copie `.env.example` para `.env` e preencha. Em local, `GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback`.
   - `SESSION_SECRET`: pelo menos 32 caracteres aleatórios.
   - `TOKEN_ENCRYPTION_KEY`: 32 bytes em base64. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
   - `DATABASE_URL`: use a string do pooler de transações do Supabase (porta 6543).
2. `npm install`
3. `npm run db:migrate` (aplica as migrações no banco do `DATABASE_URL`)
4. `npm run dev` — front em http://localhost:5173, API em http://localhost:3001

Na primeira execução, se não houver administrador, a conta de `ADMIN_EMAIL` é criada como administradora.

## Testes

`npm test` roda os testes de aceite contra um Postgres em memória (PGlite) e um Google simulado. Não precisa de `.env`.

## Vercel

As mesmas variáveis vão em Settings → Environment Variables, com
`GOOGLE_REDIRECT_URI=https://decroqui-erp.vercel.app/api/auth/google/callback`.
As migrações não rodam no deploy: rode `npm run db:migrate` localmente antes de publicar uma mudança de banco.
