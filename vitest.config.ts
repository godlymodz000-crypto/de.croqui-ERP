import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
    // Cada teste sobe um PGlite novo e roda todas as migrações; em paralelo isso passa de 10 s.
    hookTimeout: 60000,
  },
});
