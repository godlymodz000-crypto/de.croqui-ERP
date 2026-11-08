// Fase 6b, ajustes da E8: texto de remover ou trocar a imagem que perde o último uso (6b-07) e a tela de
// vincular a um projeto (6b-10), sem contagem e com os erros da E5. Fetch falso, sem rede.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/api/http';
import { presentationsApi } from '../src/api/presentations';
import { isLastUse, LAST_USE_TEXT, LINK_MOVING_TEXT, linkFailureText, linkMoveLines, removeImageText } from '../src/pages/presentations/editor';

describe('imagem que perde o último uso (6b-07)', () => {
  it('último uso: só esta apresentação usa, ou ainda nem foi salva', () => {
    expect(isLastUse({ usedBy: 1 })).toBe(true);
    expect(isLastUse({ usedBy: 0 })).toBe(true);
    expect(isLastUse({ usedBy: 2 })).toBe(false);
    expect(isLastUse(null)).toBe(false);
  });

  it('texto de remover: lixeira no último uso; biblioteca quando outra apresentação usa', () => {
    expect(LAST_USE_TEXT).toBe('Esta imagem não é usada em nenhuma outra apresentação. Ela vai para a lixeira ao sair da capa.');
    expect(removeImageText(true, true)).toBe(LAST_USE_TEXT);
    expect(removeImageText(true, false)).toBe(LAST_USE_TEXT);
    expect(removeImageText(false, true)).toBe(
      'Ela continua na biblioteca do projeto e pode ser usada de novo. Só vai para a lixeira do Drive quando nenhuma apresentação a usar.',
    );
    expect(removeImageText(false, false)).toContain('biblioteca desta apresentação');
  });
});

describe('vincular a um projeto (6b-10)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('andamento sem contagem', () => {
    expect(LINK_MOVING_TEXT).toBe('Movendo arquivos para o projeto');
    expect(LINK_MOVING_TEXT).not.toMatch(/\d/);
  });

  it('erros da E5: arquivos voltaram ou ficaram no projeto', () => {
    expect(linkFailureText(new ApiError(502, 'drive_failed', {}, { error: 'drive_failed', rolledBack: true }))).toBe(
      'Não foi possível vincular. Os arquivos voltaram para a pasta anterior.',
    );
    expect(linkFailureText(new ApiError(502, 'drive_failed', {}, { error: 'drive_failed', rolledBack: false }))).toBe(
      'Não foi possível vincular. Alguns arquivos ficaram na pasta do projeto, e a apresentação continua abrindo normalmente.',
    );
    // Recusa antes de mexer no Drive: nada saiu da pasta anterior.
    expect(linkFailureText(new ApiError(400, 'validation'))).toBe('Não foi possível vincular. Os arquivos voltaram para a pasta anterior.');
  });

  it('o que muda de pasta', () => {
    expect(linkMoveLines({ projectName: 'Projeto Teste', images: 2, pdfVersion: 2 })).toEqual([
      '2 imagens: de Avulsos/Imagens para Projeto Teste/Apresentações/Imagens. Passam a fazer parte da biblioteca do projeto.',
      'PDF v2 e versões antigas: de Avulsos para Projeto Teste/Apresentações. Aparecem em Arquivos.',
      'Nome, cliente e textos da capa continuam como estão.',
    ]);
    expect(linkMoveLines({ projectName: 'Projeto Teste', images: 1, pdfVersion: null })[0]).toMatch(/^1 imagem: .*Passa a fazer parte/);
    expect(linkMoveLines({ projectName: 'Projeto Teste', images: 0, pdfVersion: null })).toEqual(['Nome, cliente e textos da capa continuam como estão.']);
  });

  it('chama a rota da E5 sem mudar a API', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, method: String(init.method), body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ id: 'a', projectId: 'p1' }), { status: 200 });
    });
    await presentationsApi.link('a', 'p1');
    expect(calls).toEqual([{ url: '/api/presentations/a/link', method: 'POST', body: { projectId: 'p1' } }]);
  });

  it('a falha do Drive chega com rolledBack', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'drive_failed', rolledBack: false }), { status: 502 }));
    const err = await presentationsApi.link('a', 'p1').catch((e) => e);
    expect(linkFailureText(err)).toContain('Alguns arquivos ficaram na pasta do projeto');
  });
});
