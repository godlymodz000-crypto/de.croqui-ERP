// Fase 6a: cálculos do Orçamento conferidos com os casos gerados no arquivo offline original
// (revisao-fase6/casos-de-teste.json). Cada caso roda o módulo de cálculo com a mesma entrada e compara
// o texto que o arquivo mostrou. As diferenças são as mudanças intencionais aprovadas em 04/11/2026,
// listadas em EXCECOES com o valor novo esperado.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  addRoom,
  applyToAll,
  budgetHeadlineCents,
  budgetView,
  emptyBudget,
  parseBudgetData,
  removeRoom,
  splitRooms,
  toCents,
  toggleOption,
  type BudgetData,
} from '../api/_app/budget-calc.js';

interface Case {
  id: string;
  calculo: string;
  entrada: Record<string, unknown>;
  saida: Record<string, any>;
}
const raw = readFileSync('./revisao-fase6/casos-de-teste.json', 'utf8');
const CASES = (JSON.parse(raw) as { orcamento: Case[] }).orcamento;
const byId = (id: string) => CASES.find((c) => c.id === id)!;

/**
 * Valores que o arquivo tinha antes de cada caso: os números e as caixas do exemplo de fábrica.
 * Os casos só gravam o que muda. Nomes e telefones do exemplo não entram (não afetam nenhum cálculo).
 */
function stateFor(entrada: Record<string, unknown>): BudgetData {
  const d: BudgetData = { ...emptyBudget(), op1: true, op2: true, op1Por: 150, op1Exec: 350, op2Todos: 350, nota: true };
  const n = (v: unknown) => (v === '' || v === undefined ? null : (v as number));
  if (entrada.op1 !== undefined) d.op1 = entrada.op1 as boolean;
  if (entrada.op2 !== undefined) d.op2 = entrada.op2 as boolean;
  if ('op1Por' in entrada) d.op1Por = n(entrada.op1Por);
  if ('op1Exec' in entrada) d.op1Exec = n(entrada.op1Exec);
  if ('nota' in entrada) d.nota = entrada.nota as boolean;
  if ('data' in entrada) d.data = entrada.data as string;
  if ('validade' in entrada) d.validade = entrada.validade as string;
  if (entrada.ambientes) d.ambientes = (entrada.ambientes as { nome: string; valor: unknown }[]).map((a) => ({ nome: a.nome, valor: n(a.valor) }));
  else d.ambientes = Array.from({ length: 6 }, (_, i) => ({ nome: `Ambiente ${i + 1}`, valor: 350 }));
  return d;
}

const lines = (v: ReturnType<typeof budgetView>) => v.opcao02!.folhas.flatMap((f) => f.ambientes.flatMap((a) => [a.nome, a.valor]));

/** Mudanças intencionais: o que o arquivo mostrou e o que o ERP mostra. */
const EXCECOES: Record<string, { motivo: string; campo: string; arquivo: string; erp: string }[]> = {
  'orc-03': [
    { motivo: 'arredondamento', campo: 'total da Opção 01', arquivo: 'R$ 100,01', erp: 'R$ 100,02' },
  ],
  'orc-08': [
    { motivo: 'arredondamento', campo: 'total da Opção 02', arquivo: 'R$ 1.234.567,90', erp: 'R$ 1.234.567,89' },
  ],
  'orc-12': [
    { motivo: 'singular', campo: 'linha do render', arquivo: 'Render 3D (1 ambientes × R$ 150,00)', erp: 'Render 3D (1 ambiente × R$ 150,00)' },
  ],
};
const nb = (s: string) => s.replace(/\u00a0/g, ' ');
function expected(id: string, campo: string, fromFile: string): string {
  const ex = EXCECOES[id]?.find((e) => e.campo === campo);
  if (!ex) return fromFile;
  expect(nb(fromFile)).toBe(nb(ex.arquivo));
  return ex.erp;
}
const same = (a: string, b: string) => expect(nb(a)).toBe(nb(b));

describe('casos de teste do arquivo original', () => {
  it('o arquivo de casos é o gerado na Fase 6, sem alteração', () => {
    // SHA-256 do arquivo no commit 2c2cde6 da branch feat/fase-6-orcamento-apresentacao.
    expect(createHash('sha256').update(raw.replace(/\r\n/g, '\n')).digest('hex')).toBe('4c08446b6f6b4243aa8692921149fdb1a883f786691cfaa5f7848579c840a750');
    expect(CASES).toHaveLength(29);
  });

  for (const c of CASES.filter((c) => c.calculo === 'opcao01_render_e_total')) {
    it(`${c.id}: render e total da Opção 01`, () => {
      const v = budgetView(stateFor(c.entrada));
      const o = c.saida.opcao01;
      same(v.resumo.cartoes[0].total, expected(c.id, 'total da Opção 01', c.saida.resumo.total));
      same(v.resumo.cartoes[0].descricao, c.saida.resumo.descricao);
      same(v.resumo.cartoes[0].etiqueta, c.saida.resumo.etiqueta);
      same(v.opcao01!.sobretitulo, o.sobretitulo);
      same(v.opcao01!.porAmbiente, o.porAmbiente);
      same(v.opcao01!.linhaRender, expected(c.id, 'linha do render', o.linhaRender));
      same(v.opcao01!.valorRender, o.valorRender);
      same(v.opcao01!.executivo, o.executivo);
      same(v.opcao01!.total, expected(c.id, 'total da Opção 01', o.total));
      expect(v.opcao01!.nota).toBe(o.nota);
      same(v.opcao01!.pagina, o.pagina);
    });
  }

  for (const c of CASES.filter((c) => c.calculo === 'opcao02_total_e_resumo')) {
    it(`${c.id}: total e resumo da Opção 02`, () => {
      const v = budgetView(stateFor(c.entrada));
      const o = c.saida.opcao02;
      const card = v.resumo.cartoes.find((x) => x.nome === 'Projeto completo')!;
      same(card.total, expected(c.id, 'total da Opção 02', c.saida.resumo.total));
      same(card.descricao, c.saida.resumo.descricao);
      same(v.opcao02!.sobretitulo, o.sobretitulo);
      same(v.opcao02!.porAmbiente, o.porAmbiente);
      same(v.opcao02!.contagem, o.contagem);
      expect(lines(v).map(nb)).toEqual(o.linhas.map(nb));
      same(v.opcao02!.total, expected(c.id, 'total da Opção 02', o.total));
      same(v.opcao02!.pagina, o.pagina);
    });
  }

  for (const c of CASES.filter((c) => c.calculo === 'opcoes_titulos_e_paginas')) {
    it(`${c.id}: títulos e numeração das folhas`, () => {
      const v = budgetView(stateFor(c.entrada));
      const s = c.saida;
      expect(v.resumo.tituloInvestimento).toBe(s.resumo.tituloInvestimento);
      expect(v.resumo.cartoes.map((x) => ({ ...x, total: nb(x.total), descricao: nb(x.descricao) }))).toEqual(
        s.resumo.cartoes.map((x: any) => ({ ...x, total: nb(x.total), descricao: nb(x.descricao) })),
      );
      expect(v.resumo.pagina).toBe(s.resumo.pagina);
      expect(v.opcao01?.pagina ?? null).toBe(s.paginaOpcao01);
      expect(v.opcao01?.sobretitulo ?? null).toBe(s.sobretituloOpcao01);
      expect(v.opcao02?.pagina ?? null).toBe(s.paginaOpcao02);
      expect(v.opcao02?.sobretitulo ?? null).toBe(s.sobretituloOpcao02);
    });
  }

  for (const c of CASES.filter((c) => c.calculo === 'contagem_de_ambientes')) {
    it(`${c.id}: contagem de ambientes`, () => {
      const v = budgetView(stateFor(c.entrada));
      const s = c.saida;
      expect(v.resumo.contagem).toBe(s.resumo);
      expect(v.opcao02!.contagem).toBe(s.opcao02);
      same(v.opcao01!.linhaRender, expected(c.id, 'linha do render', s.linhaRender));
      same(v.opcao01!.total, s.totalOpcao01);
      same(v.opcao02!.porAmbiente, s.porAmbienteOpcao02);
      same(v.opcao02!.total, s.totalOpcao02);
    });
  }

  for (const c of CASES.filter((c) => c.calculo === 'formatacao_de_datas')) {
    it(`${c.id}: datas`, () => {
      const v = budgetView(stateFor(c.entrada));
      expect(v.resumo.data).toBe(c.saida.data);
      expect(v.resumo.validade).toBe(c.saida.validade);
    });
  }

  for (const c of CASES.filter((c) => c.calculo === 'nota_marcenaria')) {
    it(`${c.id}: nota da marcenaria`, () => {
      expect(budgetView(stateFor(c.entrada)).opcao01!.nota).toBe(c.saida.notaNaOpcao01);
    });
  }

  it('orc-20: aplicar valor a todos', () => {
    const c = byId('orc-20');
    const d = applyToAll({ ...stateFor(c.entrada), op2Todos: c.entrada.aplicarATodos as number });
    expect(d.ambientes).toEqual(c.saida.ambientesGravados);
    const v = budgetView(d);
    same(v.opcao02!.porAmbiente, c.saida.opcao02.porAmbiente);
    expect(lines(v).map(nb)).toEqual(c.saida.opcao02.linhas.map(nb));
    same(v.opcao02!.total, c.saida.opcao02.total);
  });

  it('orc-21 e orc-22: adicionar e remover ambiente', () => {
    const before = stateFor(byId('orc-20').entrada);
    const applied = applyToAll({ ...before, op2Todos: 410 });
    const added = addRoom(applied);
    expect(added.ambientes).toEqual(byId('orc-21').saida.ambientesGravados);
    expect(budgetView(added).resumo.contagem).toBe(byId('orc-21').saida.contagem);
    const removed = removeRoom(added, 0);
    expect(removed.ambientes).toEqual(byId('orc-22').saida.ambientesGravados);
    same(budgetView(removed).opcao02!.total, byId('orc-22').saida.total);
  });

  it('orc-23: a única opção marcada não desmarca', () => {
    const d = stateFor({ op1: true, op2: false });
    const after = toggleOption(d, 'op1');
    expect({ op1: after.op1, op2: after.op2 }).toEqual(byId('orc-23').saida.gravado);
    expect(budgetView(after).opcao02).toBeNull();
  });

  it('orc-24: valor apagado conta como zero', () => {
    const v = budgetView({ ...stateFor({}), op1Por: null });
    same(v.opcao01!.valorRender, byId('orc-24').saida.opcao01.valorRender);
    same(v.opcao01!.total, byId('orc-24').saida.opcao01.total);
  });

  it('orc-27 e orc-28: com 10 e 20 ambientes, a lista passa para folhas de continuação, sem folha mais alta que A4', () => {
    // O arquivo deixava a folha crescer (329 e 433 mm). No ERP, a lista é dividida em folhas A4.
    for (const n of [10, 20]) {
      const d = stateFor({ ambientes: Array.from({ length: n }, (_, i) => ({ nome: `Ambiente ${i + 1}`, valor: 350 })) });
      const v = budgetView(d);
      const folhas = v.opcao02!.folhas;
      expect(folhas.flatMap((f) => f.ambientes)).toHaveLength(n);
      expect(folhas.length).toBeGreaterThan(1);
      expect(v.totalPages).toBe(2 + folhas.length);
      expect(folhas.map((f) => f.pagina)).toEqual(folhas.map((_, i) => `${String(3 + i).padStart(2, '0')} / ${String(v.totalPages).padStart(2, '0')}`));
      expect(folhas.at(-1)!.ultima).toBe(true);
    }
  });
});

describe('casos que não se aplicam ao ERP', () => {
  it('orc-25 (Restaurar exemplo): o ERP não tem exemplo; o orçamento novo começa zerado', () => {
    const d = emptyBudget();
    expect(d.cliente).toBe('');
    expect(d.ambientes).toEqual([]);
    expect([d.op1Por, d.op1Exec, d.op2Todos]).toEqual([null, null, null]);
    expect(budgetHeadlineCents(d)).toBe(0);
  });
});

describe('arredondamento corrigido', () => {
  it('cada linha em centavos, total = soma das linhas: R$ 100,01 + R$ 0,01 = R$ 100,02', () => {
    const v = budgetView(stateFor(byId('orc-03').entrada));
    same(v.opcao01!.valorRender, 'R$ 100,01');
    same(v.opcao01!.executivo, 'R$ 0,01 para o projeto');
    same(v.opcao01!.total, 'R$ 100,02');
    expect(v.totals.op1TotalCents).toBe(v.totals.op1RenderCents + v.totals.op1ExecCents);
  });

  it('a soma das linhas da Opção 02 bate com o total mostrado', () => {
    const v = budgetView(stateFor(byId('orc-08').entrada));
    expect(v.totals.op2TotalCents).toBe(v.totals.op2LineCents.reduce((s, c) => s + c, 0));
    same(v.opcao02!.total, 'R$ 1.234.567,89');
  });

  it('toCents arredonda a metade para longe do zero, sem erro de ponto flutuante', () => {
    expect(toCents(100.005)).toBe(10001);
    expect(toCents(0.005)).toBe(1);
    expect(toCents(1.005)).toBe(101);
    expect(toCents(0.004)).toBe(0);
    expect(toCents(-0.005)).toBe(-1);
    expect(toCents(null)).toBe(0);
  });

  it('total_cents é o maior total entre as opções marcadas', () => {
    const d = stateFor({});
    expect(budgetHeadlineCents(d)).toBe(210000);
    expect(budgetHeadlineCents({ ...d, op2: false })).toBe(125000);
  });
});

describe('validação do JSON do orçamento', () => {
  it('aceita o orçamento vazio e completa os campos ausentes', () => {
    expect(parseBudgetData({})).toEqual(emptyBudget());
    expect(parseBudgetData({ cliente: 'Cliente Exemplo', ambientes: [{ nome: 'Sala', valor: 300 }] })).toMatchObject({
      cliente: 'Cliente Exemplo',
      ambientes: [{ nome: 'Sala', valor: 300 }],
    });
  });

  it('recusa tipos errados, datas inválidas, as duas opções desmarcadas e listas grandes demais', () => {
    expect(parseBudgetData(null)).toBeNull();
    expect(parseBudgetData([])).toBeNull();
    expect(parseBudgetData({ cliente: 3 })).toBeNull();
    expect(parseBudgetData({ data: '17/09/2026' })).toBeNull();
    expect(parseBudgetData({ op1: false, op2: false })).toBeNull();
    expect(parseBudgetData({ op1Por: 'cem' })).toBeNull();
    expect(parseBudgetData({ op1Por: Number.POSITIVE_INFINITY })).toBeNull();
    expect(parseBudgetData({ ambientes: [{ nome: 'Sala' }] })).toEqual({ ...emptyBudget(), ambientes: [{ nome: 'Sala', valor: null }] });
    expect(parseBudgetData({ ambientes: Array.from({ length: 201 }, () => ({ nome: 'x', valor: 1 })) })).toBeNull();
  });

  it('splitRooms nunca devolve folha vazia além da primeira', () => {
    expect(splitRooms([])).toEqual([[]]);
    expect(splitRooms([1, 2, 3], { first: 2, next: 2 })).toEqual([[1, 2], [3]]);
  });
});
