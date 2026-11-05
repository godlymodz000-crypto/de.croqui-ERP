// Na Vercel a API roda como ESM do Node, que não completa extensões: `import '../shared/budget-calc'` quebra
// com "Cannot find module" (foi o que derrubou o "Salvar em PDF" em produção). O Vite e o Vitest aceitam o
// import sem extensão, então só um teste estático pega isso. Percorre todos os módulos que a função
// api/index.ts alcança, inclusive os de src/ e o import() do gerador de PDF.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g;

function sourceFor(fromFile: string, spec: string): string | null {
  const target = resolve(dirname(fromFile), spec);
  for (const candidate of [target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx'), target]) {
    if (existsSync(candidate) && /\.(ts|tsx|js|mjs)$/.test(candidate)) return candidate;
  }
  return null;
}

function walk(entry: string) {
  const seen = new Set<string>();
  const bad: string[] = [];
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    for (const [, spec] of code.matchAll(SPECIFIER)) {
      if (/\.(css|json|svg|woff2)$/.test(spec)) continue;
      if (!spec.endsWith('.js')) {
        bad.push(`${relative(ROOT, file)}: '${spec}'`);
        continue;
      }
      const next = sourceFor(file, spec);
      if (next) queue.push(next);
      else bad.push(`${relative(ROOT, file)}: '${spec}' (arquivo não encontrado)`);
    }
  }
  return { seen: [...seen].map((f) => relative(ROOT, f).replace(/\\/g, '/')), bad };
}

describe('imports da função da Vercel', () => {
  it('todo import relativo alcançado por api/index.ts termina em .js e aponta para um arquivo que existe', () => {
    const { seen, bad } = walk(resolve(ROOT, 'api/index.ts'));
    // O gerador de PDF e as folhas entram no percurso (import() sob demanda em app.ts).
    expect(seen).toContain('api/_app/budget-pdf.ts');
    expect(seen).toContain('src/budget/BudgetSheets.tsx');
    expect(seen).toContain('src/shared/budget-calc.ts');
    expect(bad).toEqual([]);
  });
});
