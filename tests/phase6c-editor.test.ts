// Fase 6c, etapa E4: aba Página de cada tipo no editor (desenhos 6c-15 a 6c-20). As regras de edição são
// funções puras; a aba é renderizada sem navegador com react-dom/server. Também: aviso de 80% do limite de
// 1 MB e recusa acima do limite sem perder o que foi escrito.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  emptyPresentation,
  newPresentationPage,
  parsePresentationData,
  presentationBytes,
  presentationImageIds,
  PRESENTATION_MAX_BYTES,
  PRESENTATION_MAX_TEXT,
  type AddablePageKind,
  type PresentationContentPage,
  type PresentationData,
  type PresentationImageRef,
  type PresentationTechnicalPage,
  type PresentationVisualPage,
} from '../src/shared/presentation-data';
import { visibleDrawings, visibleVisualImages } from '../src/presentation/pages';
import {
  addItem,
  addState,
  compositionField,
  HIDDEN_ITEM_TEXT,
  itemFields,
  itemSummary,
  moveItem,
  NEAR_LIMIT_TEXT,
  PAGE_FIELDS,
  PAGE_KIND_LABELS,
  PAGE_LISTS,
  pageItems,
  pageKicker,
  removeItem,
  removeState,
  setComposition,
  setItemField,
  setPageField,
  sizeLevel,
} from '../src/pages/presentations/pageEditor';
import { ApiError } from '../src/api/http';
import { presentationsApi } from '../src/api/presentations';
import {
  extraFilesNotice,
  invalidMessage,
  isTooLarge,
  pageKindLabel,
  refusedSize,
  removeImageText,
  SAVE_MESSAGES,
  saveFailure,
  saveLabel,
  tooLargeMessage,
} from '../src/pages/presentations/editor';

type TabMod = typeof import('../src/pages/presentations/PageTab');
let tab: TabMod;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  tab = await import('../src/pages/presentations/PageTab');
});

let seq = 0;
const newId = () => `e${++seq}`;
const ref = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });
const IMG = (n: number) => `${String(n).repeat(8)}-1111-4111-8111-111111111111`.slice(0, 36);
const TYPES: AddablePageKind[] = ['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos'];

/** Documento com a capa e a página dada, e a checagem da API. */
function doc(page: PresentationContentPage): PresentationData {
  const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
  return { ...d, paginas: [d.paginas[0], page] };
}
const valid = (page: PresentationContentPage) => 'data' in parsePresentationData(doc(page));

function render(page: PresentationContentPage, opts: { readOnly?: boolean; openItem?: string | null } = {}) {
  return renderToStaticMarkup(
    createElement(tab.PageTab, {
      page,
      index: 1,
      readOnly: !!opts.readOnly,
      onChange: () => {},
      newId,
      openItem: opts.openItem ?? null,
      onOpenItem: () => {},
      image: null,
      onBlur: () => {},
    }),
  );
}
const decode = (html: string) => html.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

describe('cada tipo é editável', () => {
  it('os campos da página mudam e o documento continua válido', () => {
    for (const tipo of TYPES) {
      let page = newPresentationPage(tipo, newId);
      for (const f of PAGE_FIELDS[tipo]) {
        page = setPageField(page, f.key, `Texto de ${f.label}`);
        expect((page as unknown as Record<string, string>)[f.key]).toBe(`Texto de ${f.label}`);
      }
      expect(valid(page)).toBe(true);
      // Campo que o tipo não tem: nada muda.
      expect(setPageField(page, 'nao_existe', 'x')).toBe(page);
    }
  });

  it('Escala e Unidade do desenho técnico são só texto digitado', () => {
    const fields = PAGE_FIELDS.tecnico.filter((f) => f.key === 'escala' || f.key === 'unidade');
    expect(fields.map((f) => f.label)).toEqual(['Escala', 'Unidade de medida']);
    let page = newPresentationPage('tecnico', newId);
    page = setPageField(page, 'escala', '1:50 · indicada') as PresentationTechnicalPage;
    page = setPageField(page, 'unidade', 'cm') as PresentationTechnicalPage;
    expect([page.escala, page.unidade]).toEqual(['1:50 · indicada', 'cm']);
    const html = render(page);
    expect(html).toContain('value="1:50 · indicada"');
    expect(html).toContain('value="cm"');
    // O único seletor da aba é o de composição: escala e unidade não têm lista nem cálculo.
    expect(html.match(/<select/g)).toHaveLength(1);
  });

  it('itens: abrir, alterar, subir, descer e remover', () => {
    for (const tipo of ['texto', 'moodboard', 'notas'] as const) {
      let page = newPresentationPage(tipo, newId);
      const ids = pageItems(page).map((i) => i.id);
      const first = ids[0];
      const key = itemFields(page, pageItems(page)[0]).fields[0].key;
      page = setItemField(page, first, key, 'Cliente Avulso');
      expect(pageItems(page)[0][key]).toBe('Cliente Avulso');
      page = moveItem(page, 0, 1);
      expect(pageItems(page).map((i) => i.id).slice(0, 2)).toEqual([ids[1], first]);
      expect(moveItem(page, 0, -1)).toBe(page);
      expect(moveItem(page, ids.length - 1, 1)).toBe(page);
      page = removeItem(page, 1);
      expect(pageItems(page).map((i) => i.id)).not.toContain(first);
      expect(valid(page)).toBe(true);
    }
  });

  it('a aba de cada tipo mostra os campos, a composição e a lista dos desenhos', () => {
    const expected: Record<AddablePageKind, string[]> = {
      texto: ['Composição das imagens', 'Diagonal · texto e imagens alternados', 'Sobretítulo', 'Título da seção', 'Texto introdutório', 'Blocos de conteúdo', '4 itens', '+ Bloco de texto', '+ Imagem'],
      moodboard: ['Sobretítulo', 'Título', 'Introdução', 'Materiais', '6 itens', '+ Material'],
      visual: ['Composição', 'Imagem grande + texto ao lado', 'Ambiente / título', 'Descrição curta', 'Programas utilizados', 'Observações técnicas', 'Imagens', '1 item'],
      tecnico: ['Composição', 'Um desenho', 'Título da prancha', 'Observações', 'Escala', 'Unidade de medida', 'Desenhos', '1 item'],
      notas: ['Sobretítulo', 'Título', 'Introdução', 'Notas', '4 itens', '+ Nota'],
      direitos: ['Autoria do projeto', 'Marca / escritório responsável', 'Condições de uso', 'Restrições de reprodução e compartilhamento', 'Observações legais'],
    };
    TYPES.forEach((tipo) => {
      const page = newPresentationPage(tipo, newId);
      const html = decode(render(page));
      expect(html).toContain(pageKicker(1, tipo));
      for (const t of expected[tipo]) expect(html, `${tipo}: ${t}`).toContain(t);
      expect(html).not.toContain('!');
      // Um botão Vinho por tela: a aba não tem nenhum (o da tela é "Salvar em PDF").
      expect(html).not.toContain('peditor__primary');
      expect(compositionField(page) !== null).toBe(['texto', 'visual', 'tecnico'].includes(tipo));
      expect(PAGE_LISTS[tipo] === null).toBe(tipo === 'direitos');
    });
    expect(pageKicker(1, 'texto')).toBe('Página 02 · Texto & conceito');
  });

  it('a lista mostra ↑ ↓ × por item; no leitor, sem ações nem "+ item"', () => {
    const page = newPresentationPage('notas', newId);
    const html = render(page);
    expect(html.match(/aria-label="Subir item/g)).toHaveLength(4);
    expect(html.match(/aria-label="Descer item/g)).toHaveLength(4);
    expect(html.match(/aria-label="Remover item/g)).toHaveLength(4);
    expect(html).toMatch(/aria-label="Subir item 01" disabled/);
    expect(html).toMatch(/aria-label="Descer item 04" disabled/);
    const ro = render(page, { readOnly: true });
    expect(ro).not.toContain('Subir item');
    expect(ro).not.toContain('+ Nota');
    expect(ro).toMatch(/<input[^>]*disabled/);
  });

  it('o item aberto mostra os campos dele', () => {
    const page = newPresentationPage('moodboard', newId);
    const id = pageItems(page)[0].id;
    const html = decode(render(page, { openItem: id }));
    for (const t of ['Fabricante / fornecedor', 'Código / referência', 'Cor / acabamento', 'Ambiente / aplicação']) expect(html).toContain(t);
    expect(html).toContain('aria-expanded="true"');
    // Posição e altura da imagem só no "Personalizado".
    const texto = newPresentationPage('texto', newId);
    const img = pageItems(texto)[3];
    expect(itemFields(texto, img).selects.map((s) => s.key)).toEqual(['formato']);
    const livre = setComposition(texto, 'livre', newId);
    expect(itemFields(livre, img).selects.map((s) => s.key)).toEqual(['formato', 'posicao', 'altura']);
  });

  it('cabeçalho da visualização com o tipo da página', () => {
    expect(pageKindLabel('edit', false, 'texto')).toBe('Texto & conceito · campos pendentes em cinza');
    expect(pageKindLabel('print', false, 'notas')).toBe('Notas técnicas · prévia de impressão');
    expect(pageKindLabel('edit')).toBe('Capa · campos pendentes em cinza');
    expect(pageKindLabel('edit', true, 'direitos')).toBe(PAGE_KIND_LABELS.direitos);
  });
});

describe('"+ item" no limite', () => {
  const fill = (page: PresentationContentPage, kind: Parameters<typeof addItem>[1]) => {
    for (let i = 0; i < 20; i++) page = addItem(page, kind, newId);
    return page;
  };

  it('texto para em 6 blocos; moodboard e notas em 12, com o motivo escrito', () => {
    const cases = [
      ['texto', 'texto', 6, 'Limite de 6 blocos nesta página, contando os de imagem. Com mais, os textos não cabem na folha do PDF.'],
      ['moodboard', 'material', 12, 'Limite de 12 materiais nesta página.'],
      ['notas', 'nota', 12, 'Limite de 12 notas nesta página.'],
    ] as const;
    for (const [tipo, kind, max, reason] of cases) {
      const page = fill(newPresentationPage(tipo, newId), kind);
      expect(pageItems(page)).toHaveLength(max);
      expect(addState(page)).toEqual({ enabled: false, reason });
      expect(addItem(page, kind, newId)).toBe(page);
      expect(valid(page)).toBe(true);
      const html = render(page);
      expect(html).toContain(reason);
      // Todos os botões "+" desligados e ligados ao motivo.
      expect(html.match(/class="padd__button" disabled=""/g)?.length).toBe(PAGE_LISTS[tipo]!.adds.length);
      expect(html).toContain('aria-describedby="padd-reason"');
    }
    // Abaixo do limite, ligado e sem motivo.
    const html = render(newPresentationPage('texto', newId));
    expect(html).not.toContain('padd__reason');
    expect(html).not.toMatch(/class="padd__button" disabled/);
  });

  it('o bloco de imagem também conta para o limite de 6 blocos', () => {
    let page: PresentationContentPage = newPresentationPage('texto', newId);
    for (let i = 0; i < 20; i++) page = addItem(page, i % 2 ? 'imagem' : 'texto', newId);
    expect(pageItems(page)).toHaveLength(6);
    expect(addState(page).enabled).toBe(false);
  });

  it('visual: "+ Imagem" só em "Várias imagens do ambiente", até 8', () => {
    const lado = newPresentationPage('visual', newId);
    const st = addState(lado);
    expect(st.enabled).toBe(false);
    expect(st.reason).toBe('A composição “Imagem grande + texto ao lado” mostra 1 imagem. Para mais imagens, escolha “Várias imagens do ambiente”.');
    expect(decode(render(lado))).toContain(st.reason!);
    let grade = setComposition(lado, 'grade', newId) as PresentationVisualPage;
    expect(grade.imagens).toHaveLength(4);
    expect(addState(grade).enabled).toBe(true);
    grade = fill(grade, 'imagem') as PresentationVisualPage;
    expect(grade.imagens).toHaveLength(8);
    expect(addState(grade)).toEqual({ enabled: false, reason: 'Limite de 8 imagens nesta página.' });
    expect(valid(grade)).toBe(true);
  });

  it('× não deixa visual e técnico com menos do que a composição usa', () => {
    const grade = setComposition(newPresentationPage('visual', newId), 'grade', newId);
    expect(removeState(grade).enabled).toBe(false);
    expect(removeItem(grade, 0)).toBe(grade);
    const tec = newPresentationPage('tecnico', newId);
    expect(removeState(tec).reason).toBe('A composição “Um desenho” usa 1 desenho. Para usar menos, troque a composição.');
    expect(render(tec)).toMatch(/title="A composição[^"]*" disabled/);
    // Técnico não tem "+ item": a quantidade vem da composição.
    expect(render(tec)).not.toContain('padd__button');
  });
});

describe('trocar a composição guarda as imagens que sobram (P32)', () => {
  it('visual: de "grade" para "lado" e de volta, nada se perde', () => {
    let page = setComposition(newPresentationPage('visual', newId), 'grade', newId) as PresentationVisualPage;
    for (let i = 0; i < 2; i++) page = addItem(page, 'imagem', newId) as PresentationVisualPage;
    page = { ...page, imagens: page.imagens.map((im, i) => ({ ...im, imagem: ref(IMG(i + 1)), legenda: `Imagem ${i + 1}` })) };
    const ids = page.imagens.map((i) => i.id);

    const lado = setComposition(page, 'lado', newId) as PresentationVisualPage;
    expect(lado.imagens.map((i) => i.id)).toEqual(ids);
    expect(visibleVisualImages(lado)).toHaveLength(1);
    expect(presentationImageIds(doc(lado))).toHaveLength(6);
    expect(valid(lado)).toBe(true);
    // Na lista, as guardadas aparecem com o aviso.
    expect(itemSummary(lado, 0).hidden).toBe(false);
    expect(itemSummary(lado, 5)).toMatchObject({ hidden: true, title: 'Imagem 6' });
    expect(render(lado).match(new RegExp(HIDDEN_ITEM_TEXT, 'g'))).toHaveLength(5);

    const duo = setComposition(lado, 'duo', newId) as PresentationVisualPage;
    expect(visibleVisualImages(duo).map((i) => i.legenda)).toEqual(['Imagem 1', 'Imagem 2']);
    const back = setComposition(duo, 'grade', newId) as PresentationVisualPage;
    expect(back.imagens).toEqual(page.imagens);
    expect(visibleVisualImages(back)).toHaveLength(6);
  });

  it('visual: composição com mais imagens ganha espaços vazios', () => {
    const page = newPresentationPage('visual', newId);
    const principal = setComposition(page, 'principal', newId) as PresentationVisualPage;
    expect(principal.imagens).toHaveLength(3);
    expect(principal.imagens[0].id).toBe(page.imagens[0].id);
    expect(valid(principal)).toBe(true);
  });

  it('técnico: de quatro para um desenho e de volta', () => {
    let page = setComposition(newPresentationPage('tecnico', newId), '4', newId) as PresentationTechnicalPage;
    page = { ...page, desenhos: page.desenhos.map((d, i) => ({ ...d, imagem: ref(IMG(i + 1)), titulo: `Vista ${i + 1}` })) };
    const um = setComposition(page, '1', newId) as PresentationTechnicalPage;
    expect(um.desenhos).toEqual(page.desenhos);
    expect(visibleDrawings(um)).toHaveLength(1);
    expect(presentationImageIds(doc(um))).toHaveLength(4);
    expect(valid(um)).toBe(true);
    expect(setComposition(um, '4', newId)).toEqual(page);
  });

  it('texto: trocar a composição não mexe nos blocos', () => {
    const page = newPresentationPage('texto', newId);
    const lado = setComposition(page, 'lado', newId);
    expect(pageItems(lado)).toEqual(pageItems(page));
    expect(setComposition(lado, 'lado', newId)).toBe(lado);
  });
});

describe('tamanho do documento', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('aviso a partir de 80% de 1 MB, sem bloquear', () => {
    expect(PRESENTATION_MAX_BYTES).toBe(1048576);
    expect(sizeLevel(500_000)).toBe('ok');
    expect(sizeLevel(Math.floor(PRESENTATION_MAX_BYTES * 0.8))).toBe('ok');
    expect(sizeLevel(Math.floor(PRESENTATION_MAX_BYTES * 0.8) + 1)).toBe('near');
    expect(sizeLevel(PRESENTATION_MAX_BYTES)).toBe('near');
    expect(sizeLevel(PRESENTATION_MAX_BYTES + 1)).toBe('over');
    expect(NEAR_LIMIT_TEXT).toBe('O documento está perto do limite de tamanho. Remova conteúdo ou divida a apresentação.');

    // Documento real de 0,85 MB: avisa e ainda pode ser salvo.
    const page = newPresentationPage('notas', newId);
    const d = doc(page);
    const near = { ...d, paginas: [...d.paginas, ...Array.from({ length: 30 }, () => fullNotes())] } as PresentationData;
    expect(sizeLevel(presentationBytes(near))).toBe('near');
    expect(isTooLarge(near)).toBe(false);
    expect('data' in parsePresentationData(near)).toBe(true);
  });

  it('os textos falam em 1 MB, nunca em 512 KB', () => {
    expect(SAVE_MESSAGES.too_large).toBe(
      'A apresentação passou do limite de 1 MB e a última alteração não foi salva. Remova conteúdo ou divida a apresentação para voltar a salvar. O que você escreveu continua aqui.',
    );
    expect(tooLargeMessage(1_258_291)).toBe(
      'A apresentação tem 1,2 MB e passou do limite de 1 MB. A última alteração não foi salva. Remova conteúdo ou divida a apresentação para voltar a salvar. O que você escreveu continua aqui.',
    );
    for (const t of [...Object.values(SAVE_MESSAGES), tooLargeMessage(2_000_000), NEAR_LIMIT_TEXT]) {
      expect(t).not.toMatch(/512|KB|!/);
    }
  });

  it('acima de 1 MB a API recusa, o editor mostra o motivo e o texto escrito fica', async () => {
    const d = doc(newPresentationPage('texto', newId));
    const grande = { ...d, paginas: [...d.paginas, ...Array.from({ length: 38 }, () => fullNotes())] } as PresentationData;
    const before = JSON.stringify(grande);
    expect(isTooLarge(grande)).toBe(true);

    const size = presentationBytes(grande);
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'too_large', size, limit: PRESENTATION_MAX_BYTES }), { status: 413 }));
    const err = await presentationsApi.save('a', { data: grande, baseUpdatedAt: 'x' }).catch((e) => e);
    expect(saveFailure(err)).toBe('too_large');
    expect(refusedSize(err)).toBe(size);
    expect(tooLargeMessage(refusedSize(err))).toContain('passou do limite de 1 MB');
    expect(tooLargeMessage(refusedSize(err))).toContain('O que você escreveu continua aqui.');
    expect(saveLabel({ kind: 'too_large', size })).toBe('Não salvo');
    // Nada do documento foi tirado ou mudado.
    expect(JSON.stringify(grande)).toBe(before);
  });

  it('recusa 400 com motivo: a mensagem da API, sem tentar de novo', () => {
    const err = new ApiError(400, 'invalid_data', {}, { error: 'invalid_data', dataError: { reason: 'too_many_items', pagina: 2, campo: 'notas' } });
    expect(saveFailure(err)).toBe('invalid');
    const msg = invalidMessage(err);
    expect(msg).toBe('A última alteração não foi salva. A página 03 pode ter até 12 notas. O que você escreveu continua aqui.');
    const blocos = new ApiError(400, 'invalid_data', {}, { error: 'invalid_data', dataError: { reason: 'too_many_items', pagina: 1, campo: 'blocos' } });
    expect(invalidMessage(blocos)).toContain('A página 02 pode ter até 6 blocos, contando os de imagem.');
    expect(msg).not.toContain('!');
    expect(saveFailure(new ApiError(400, 'invalid_data'))).toBe('error');
  });
});

describe('imagem dos itens', () => {
  it('avisos com o espaço do item', () => {
    expect(extraFilesNotice(1, 'item')).toBe('Este espaço tem uma imagem só. A primeira foi usada; a outra ficou na biblioteca.');
    expect(extraFilesNotice(2)).toBe('A capa tem um espaço de imagem. A primeira foi usada; as outras 2 ficaram na biblioteca.');
    expect(removeImageText(true, false, 'item')).toContain('ao sair da página');
    expect(removeImageText(true, false)).toContain('ao sair da capa');
  });

  it('a imagem do item vai para o item certo e é lida em todas as páginas', () => {
    const page = newPresentationPage('moodboard', newId);
    const id = pageItems(page)[2].id;
    const next = setItemField(page, id, 'imagem', ref(IMG(7)));
    expect(pageItems(next)[2].imagem).toEqual(ref(IMG(7)));
    expect(presentationImageIds(doc(next))).toEqual([IMG(7)]);
    // Item sem espaço de imagem (bloco de texto): nada muda.
    const texto = newPresentationPage('texto', newId);
    expect(setItemField(texto, pageItems(texto)[0].id, 'imagem', ref(IMG(7)))).toBe(texto);
  });
});

/** Página de notas com 12 notas cheias: cerca de 30 KB. */
function fullNotes(): PresentationContentPage {
  let page: PresentationContentPage = newPresentationPage('notas', newId);
  while (pageItems(page).length < 12) page = addItem(page, 'nota', newId);
  for (const it of pageItems(page)) {
    page = setItemField(page, it.id, 'texto', 'x'.repeat(PRESENTATION_MAX_TEXT));
    page = setItemField(page, it.id, 'titulo', 't'.repeat(200));
    page = setItemField(page, it.id, 'categoria', 'c'.repeat(200));
  }
  return page;
}
