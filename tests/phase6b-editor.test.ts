// Fase 6b, etapa E7, lado da tela: capa com a Prévia desligada e ligada, regras do salvamento automático
// (conflito, limite de 512 KB e erro), "Voltar" para a origem e textos do painel. A capa é renderizada sem
// navegador com react-dom/server; o salvamento usa um fetch falso, sem rede.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyPresentation, PRESENTATION_MAX_TEXT, type PresentationProject } from '../src/shared/presentation-data';
import { coverFields, coverTexts, DEFAULT_COVER_TYPE, issueDateLabel } from '../src/presentation/cover';
import {
  backTarget,
  coverNotice,
  isTooLarge,
  pageKindLabel,
  projectTabHelp,
  SAVE_MESSAGES,
  saveFailure,
  saveLabel,
} from '../src/pages/presentations/editor';
import { ApiError } from '../src/api/http';
import { presentationsApi } from '../src/api/presentations';

type SheetMod = typeof import('../src/presentation/CoverSheet');
let sheet: SheetMod;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  sheet = await import('../src/presentation/CoverSheet');
});

const novo = () => emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Teste' });
const projeto = (over: Partial<PresentationProject> = {}): PresentationProject => ({ ...novo().projeto, ...over });

describe('capa', () => {
  it('data de emissão por extenso', () => {
    expect(issueDateLabel('2026-11-07')).toBe('7 de novembro de 2026');
    expect(issueDateLabel('2026-03-01')).toBe('1 de março de 2026');
    expect(issueDateLabel('')).toBe('');
    expect(issueDateLabel('07/11/2026')).toBe('');
    expect(issueDateLabel('2026-13-01')).toBe('');
  });

  it('Prévia desligada: os seis dados na ordem do desenho, os vazios em cinza', () => {
    const f = coverFields(projeto({ localizacao: 'Cidade Teste' }), 'edit');
    expect(f.map((x) => [x.label, x.text, x.pending])).toEqual([
      ['Cliente', 'Cliente Teste', false],
      ['Projetista', 'Projetista', true],
      ['Registro', 'Opcional', true],
      ['Localização', 'Cidade Teste', false],
      ['Emissão', 'Data de emissão', true],
      ['Código', 'Opcional', true],
    ]);
  });

  it('Prévia ligada: só os preenchidos, um depois do outro', () => {
    const f = coverFields(projeto({ localizacao: 'Cidade Teste', data: '2026-11-07' }), 'print');
    expect(f.map((x) => [x.label, x.text])).toEqual([
      ['Cliente', 'Cliente Teste'],
      ['Localização', 'Cidade Teste'],
      ['Emissão', '7 de novembro de 2026'],
    ]);
    expect(f.every((x) => !x.pending)).toBe(true);
  });

  it('documento novo de projeto: só nome e cliente; localização vazia', () => {
    const d = novo();
    expect(d.projeto.localizacao).toBe('');
    expect(coverFields(d.projeto, 'print').map((x) => x.key)).toEqual(['cliente']);
  });

  it('espaços sozinhos contam como vazio', () => {
    expect(coverFields(projeto({ projetista: '   ' }), 'print').map((x) => x.key)).toEqual(['cliente']);
  });

  it('tipo vazio vira "Apresentação de projeto"; nome e contato vazios só aparecem com a Prévia desligada', () => {
    const vazio = projeto({ nome: '', contato: '' });
    expect(coverTexts(vazio, 'edit')).toEqual({
      tipo: DEFAULT_COVER_TYPE,
      nome: { text: 'Nome do projeto', pending: true },
      contato: { text: 'Contato (opcional)', pending: true },
    });
    expect(coverTexts(vazio, 'print')).toEqual({ tipo: DEFAULT_COVER_TYPE, nome: null, contato: null });
    expect(coverTexts(projeto({ tipo: 'Estudo preliminar' }), 'print').tipo).toBe('Estudo preliminar');
  });

  it('a folha com a Prévia desligada mostra o espaço da imagem e os pendentes; ligada, não', () => {
    const p = projeto();
    const edit = renderToStaticMarkup(createElement(sheet.CoverSheet, { projeto: p, mode: 'edit', logoSrc: 'logo.svg' }));
    const print = renderToStaticMarkup(createElement(sheet.CoverSheet, { projeto: p, mode: 'print', logoSrc: 'logo.svg' }));
    expect(edit).toContain('Imagem da capa pendente');
    expect(edit).toContain('Insira pelo painel · não sai no PDF');
    expect(edit).toContain('is-pending');
    expect(print).not.toContain('Imagem da capa pendente');
    expect(print).not.toContain('is-pending');
    expect(print).toContain('Projeto Teste');
    expect(print).toContain('Cliente Teste');
    for (const html of [edit, print]) expect(html).not.toContain('!');
  });
});

describe('salvamento automático', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('409 é conflito, 413 é limite, o resto tenta de novo', () => {
    expect(saveFailure(new ApiError(409, 'conflict'))).toBe('conflict');
    expect(saveFailure(new ApiError(413, 'too_large'))).toBe('too_large');
    expect(saveFailure(new ApiError(400, 'too_large'))).toBe('too_large');
    expect(saveFailure(new ApiError(500, 'unknown'))).toBe('error');
    expect(saveFailure(new ApiError(0, 'network'))).toBe('error');
    expect(saveFailure(new Error('x'))).toBe('error');
  });

  it('o documento acima de 512 KB nem é enviado', () => {
    const d = novo();
    expect(isTooLarge(d)).toBe(false);
    // Bem acima do que a capa permite: 300 campos de 2000 caracteres.
    const grande = { ...d, extra: Array.from({ length: 300 }, () => 'x'.repeat(PRESENTATION_MAX_TEXT)) };
    expect(isTooLarge(grande as typeof d)).toBe(true);
  });

  it('o salvamento envia o documento e a versão que a tela tem', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: 'a', updatedAt: '2026-11-07T10:00:00.000Z' }), { status: 200 });
    });
    const d = novo();
    await presentationsApi.save('a', { data: d, baseUpdatedAt: '2026-11-07T09:00:00.000Z' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/presentations/a');
    expect(calls[0].init.method).toBe('PATCH');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ data: d, baseUpdatedAt: '2026-11-07T09:00:00.000Z' });
  });

  it('a resposta de conflito e a de limite chegam como os avisos de 6b-05', async () => {
    for (const [status, error, expected] of [
      [409, 'conflict', 'conflict'],
      [413, 'too_large', 'too_large'],
      [500, 'unknown', 'error'],
    ] as const) {
      vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error }), { status }));
      const err = await presentationsApi.save('a', { data: novo(), baseUpdatedAt: 'x' }).catch((e) => e);
      expect(saveFailure(err)).toBe(expected);
    }
    expect(SAVE_MESSAGES.conflict).toBe(
      'Esta apresentação foi alterada em outra aba ou por outra pessoa. Recarregue para ver a versão atual antes de continuar.',
    );
    expect(SAVE_MESSAGES.too_large).toContain('passou do limite de 512 KB');
  });

  it('indicador da barra', () => {
    expect(saveLabel({ kind: 'saved', at: new Date(2026, 10, 7, 10, 42) })).toBe('Salvo às 10:42');
    expect(saveLabel({ kind: 'saved', at: null })).toBe('Salvo');
    expect(saveLabel({ kind: 'saving' })).toBe('Salvando');
    expect(saveLabel({ kind: 'error' })).toBe('Não salvo');
    expect(saveLabel({ kind: 'too_large' })).toBe('Não salvo');
    expect(saveLabel({ kind: 'conflict' })).toBe('Alterado em outra aba');
  });
});

describe('editor', () => {
  it('Voltar volta para onde a pessoa veio', () => {
    expect(backTarget({ from: 'lista', search: '?aba=projeto' })).toEqual({ to: '/apresentacoes?aba=projeto', label: 'Voltar para Apresentações' });
    expect(backTarget({ from: 'projeto', projectId: 'p1' })).toEqual({ to: '/projetos/p1', label: 'Voltar para o projeto' });
    expect(backTarget(null)).toEqual({ to: '/apresentacoes', label: 'Voltar para Apresentações' });
    expect(backTarget({ from: 'outra' })).toEqual({ to: '/apresentacoes', label: 'Voltar para Apresentações' });
  });

  it('texto ao lado da página', () => {
    expect(pageKindLabel('edit')).toBe('Capa · campos pendentes em cinza');
    expect(pageKindLabel('print')).toBe('Capa · prévia de impressão');
    expect(pageKindLabel('readonly')).toBe('Capa · somente leitura');
    expect(pageKindLabel('edit', true)).toBe('Capa');
  });

  it('a localização não é anunciada como copiada; na avulsa, nada vem do projeto', () => {
    for (const text of [coverNotice(true), projectTabHelp(true)]) {
      expect(text).toContain('Nome e cliente');
      expect(text).not.toMatch(/localiza/i);
    }
    expect(coverNotice(false)).toBe('Nome do projeto, cliente e demais dados da capa ficam na aba Projeto.');
    expect(projectTabHelp(false)).not.toMatch(/projeto e podem/);
    for (const text of [coverNotice(true), coverNotice(false), projectTabHelp(true), ...Object.values(SAVE_MESSAGES)]) expect(text).not.toContain('!');
  });
});
