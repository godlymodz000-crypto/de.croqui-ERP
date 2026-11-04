import { describe, expect, it } from 'vitest';
import { budgetHtml } from '../api/_app/budget-pdf';
import { emptyBudget, parseBudgetData } from '../src/shared/budget-calc';

// O HTML que o Chromium imprime. A impressão em si é testada localmente com o Edge (revisao-fase6a/pdf).
describe('PDF do orçamento: HTML das folhas', () => {
  const data = parseBudgetData({
    ...emptyBudget(),
    cliente: 'Cliente Exemplo',
    ambientes: Array.from({ length: 20 }, (_, i) => ({ nome: `Ambiente ${i + 1}`, valor: 100 })),
  })!;

  it('monta as folhas A4 com CSS, fontes e logo embutidos, sem buscar nada fora', async () => {
    const html = await budgetHtml(data);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.match(/class="bsheet"/g)?.length).toBe(4);
    expect(html).toContain('Proposta para <em>Cliente Exemplo</em>');
    expect(html).toContain('data:font/woff2;base64,');
    expect(html).toContain('data:image/svg+xml;base64,');
    expect(html).not.toMatch(/url\('\.\.\/fonts/);
    expect(html).not.toMatch(/(src|href)="https?:/);
    expect(html).toContain('size: A4');
  });

  it('aplica a divisão medida dos ambientes', async () => {
    const html = await budgetHtml(data, [3, 5]);
    // 3 + 5 + 12 ambientes: Resumo, Opção 01 e três folhas da Opção 02.
    expect(html.match(/class="bsheet"/g)?.length).toBe(5);
  });
});
