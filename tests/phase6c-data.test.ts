// Fase 6c, etapa E1: modelo de dados dos tipos de página (revisao-fase6c/planejamento.md, seção 2, e
// decisoes.md, P30 a P33). Testes de unidade: o módulo é puro e não grava nada, então não precisa de banco.
import { describe, expect, it } from 'vitest';
import {
  ADDABLE_PAGE_TYPES,
  emptyPresentation,
  newMaterial,
  newNote,
  newPresentationPage,
  newTextBlock,
  newVisualImage,
  parsePresentationData,
  PRESENTATION_MAX_BLOCKS,
  PRESENTATION_MAX_BYTES,
  PRESENTATION_MAX_MATERIALS,
  PRESENTATION_MAX_NOTES,
  PRESENTATION_MAX_PAGES,
  PRESENTATION_MAX_SHORT,
  PRESENTATION_MAX_TEXT,
  presentationBytes,
  presentationDataMessage,
  presentationImageIds,
  type PresentationData,
  type PresentationImageRef,
} from '../src/shared/presentation-data';

const IMG_A = '11111111-1111-4111-8111-111111111111';
const IMG_B = '22222222-2222-4222-8222-222222222222';
const IMG_C = '33333333-3333-4333-8333-333333333333';
const img = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });

let seq = 0;
const newId = () => `t${++seq}`;

/** Documento com a capa e uma página de cada tipo, como sai do menu de adicionar. */
function fullDoc(): PresentationData {
  const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
  for (const tipo of ADDABLE_PAGE_TYPES) d.paginas.push(newPresentationPage(tipo, newId));
  return d;
}

function refused(input: unknown) {
  const r = parsePresentationData(input);
  if ('data' in r) throw new Error('documento aceito, mas devia ser recusado');
  return r;
}
const accepted = (input: unknown) => {
  const r = parsePresentationData(input);
  if (!('data' in r)) throw new Error(`documento recusado: ${r.reason} ${r.pagina ?? ''} ${r.campo ?? ''}`);
  return r.data;
};
/** Cópia do documento como JSON, como chega na API. */
const json = (d: PresentationData) => JSON.parse(JSON.stringify(d));

describe('Fase 6c · E1 · documento da 6b', () => {
  it('o documento novo da 6b, só com a capa, continua válido sem conversão', () => {
    const d = emptyPresentation('capa-1', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
    expect(accepted(json(d))).toEqual(d);
  });

  it('a capa da 6b com imagem, outra composição, cor e marca continua igual', () => {
    const d = emptyPresentation('capa-1');
    d.paginas[0] = { ...d.paginas[0], composicao: 'foto', cor: 'noite', marca: 'm', imagem: img(IMG_A) };
    d.projeto.contato = 'contato@exemplo.com · (00) 00000-0000';
    expect(accepted(json(d))).toEqual(d);
    expect(presentationImageIds(d)).toEqual([IMG_A]);
  });

  it('a capa aceita as três composições, as três cores e as três marcas', () => {
    for (const composicao of ['arco', 'foto', 'tipo'] as const)
      for (const cor of ['vinho', 'noite', 'linho'] as const)
        for (const marca of ['p', 'm', 'g'] as const) {
          const d = emptyPresentation('capa');
          d.paginas[0] = { ...d.paginas[0], composicao, cor, marca };
          expect(accepted(json(d)).paginas[0]).toMatchObject({ composicao, cor, marca });
        }
  });

  it('campos desconhecidos continuam descartados, inclusive nas páginas novas', () => {
    const d = json(fullDoc());
    d.extra = 1;
    d.paginas[0].extra = 'x';
    d.paginas[1].extra = 'x';
    d.paginas[1].blocos[0].extra = 'x';
    const out = accepted(d);
    expect(out).not.toHaveProperty('extra');
    expect(out.paginas[0]).not.toHaveProperty('extra');
    expect(out.paginas[1]).not.toHaveProperty('extra');
    expect((out.paginas[1] as { blocos: object[] }).blocos[0]).not.toHaveProperty('extra');
  });
});

describe('Fase 6c · E1 · cada tipo aceito', () => {
  it('a página nova de cada tipo é aceita e volta igual', () => {
    const d = fullDoc();
    expect(d.paginas.map((p) => p.tipo)).toEqual(['capa', 'texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos']);
    expect(accepted(json(d))).toEqual(d);
  });

  it('a página nova começa com os títulos e as categorias do arquivo offline e os textos longos vazios (P30)', () => {
    const [, texto, mood, visual, tecnico, notas, direitos] = fullDoc().paginas;
    expect(texto).toMatchObject({ sobretitulo: 'Introdução', titulo: 'Conceito do projeto', introducao: '', composicao: 'diagonal' });
    expect(texto.tipo === 'texto' && texto.blocos.map((b) => (b.tipo === 'texto' ? b.titulo : 'imagem'))).toEqual([
      'Conceito',
      'Referências',
      'Objetivos e premissas',
      'imagem',
    ]);
    expect(texto.tipo === 'texto' && texto.blocos.every((b) => (b.tipo === 'texto' ? b.texto === '' : b.imagem === null))).toBe(true);
    expect(mood).toMatchObject({ sobretitulo: 'Materiais', titulo: 'Moodboard de materiais', introducao: '' });
    expect(mood.tipo === 'moodboard' && mood.materiais).toHaveLength(6);
    expect(visual).toMatchObject({ sobretitulo: 'Projeto', titulo: '', descricao: '', programas: '', observacoes: '', composicao: 'lado' });
    expect(visual.tipo === 'visual' && visual.imagens).toHaveLength(1);
    expect(tecnico).toMatchObject({ sobretitulo: 'Documentação técnica', titulo: 'Planta baixa', escala: '', unidade: '', composicao: '1' });
    expect(tecnico.tipo === 'tecnico' && tecnico.desenhos).toHaveLength(1);
    expect(notas).toMatchObject({ sobretitulo: 'Notas', titulo: 'Notas gerais e diretrizes técnicas', introducao: '' });
    expect(notas.tipo === 'notas' && notas.notas.map((n) => n.categoria)).toEqual([
      'Notas gerais',
      'Diretrizes técnicas',
      'Orientações de execução',
      'Especificações',
    ]);
    expect(direitos).toMatchObject({ sobretitulo: 'Propriedade intelectual', titulo: 'Direitos autorais', autoria: '', escritorio: '', uso: '', restricoes: '', observacoes: '' });
  });

  it('o menu de adicionar tem os seis tipos na ordem de 6c-21, sem capa e sem prancha (P36)', () => {
    expect(ADDABLE_PAGE_TYPES).toEqual(['texto', 'moodboard', 'visual', 'tecnico', 'notas', 'direitos']);
  });

  it('texto & conceito aceita as cinco composições e o bloco de imagem com formato, posição e altura', () => {
    for (const composicao of ['diagonal', 'lado', 'coluna', 'destaque', 'livre']) {
      const d = json(fullDoc());
      d.paginas[1].composicao = composicao;
      d.paginas[1].blocos[3] = { ...d.paginas[1].blocos[3], imagem: img(IMG_A), formato: 'retangular', posicao: 'direita', altura: 'p', legenda: 'Fachada' };
      expect(accepted(d).paginas[1]).toMatchObject({ composicao });
    }
  });

  it('apresentação visual aceita as cinco composições com o número de imagens de cada uma', () => {
    const counts = { lado: 1, duo: 2, principal: 3, iso: 1, grade: 4 } as const;
    for (const [composicao, n] of Object.entries(counts)) {
      const d = json(fullDoc());
      d.paginas[3].composicao = composicao;
      d.paginas[3].imagens = Array.from({ length: n }, () => newVisualImage(newId));
      expect(accepted(d).paginas[3]).toMatchObject({ composicao });
    }
    const grade = json(fullDoc());
    grade.paginas[3].composicao = 'grade';
    grade.paginas[3].imagens = Array.from({ length: 8 }, () => newVisualImage(newId));
    expect(accepted(grade).paginas[3]).toMatchObject({ composicao: 'grade' });
  });

  it('as imagens que sobram de outra composição ficam guardadas (P32)', () => {
    const d = json(fullDoc());
    d.paginas[3].composicao = 'lado';
    d.paginas[3].imagens = [IMG_A, IMG_B, IMG_C].map((id) => ({ ...newVisualImage(newId), imagem: img(id) }));
    const out = accepted(d);
    expect(out.paginas[3].tipo === 'visual' && out.paginas[3].imagens).toHaveLength(3);
    expect(presentationImageIds(out)).toEqual([IMG_A, IMG_B, IMG_C]);
  });

  it('a imagem da capa "Só tipografia" fica guardada e conta para o vínculo (P33)', () => {
    const d = emptyPresentation('capa');
    d.paginas[0] = { ...d.paginas[0], composicao: 'tipo', imagem: img(IMG_A) };
    const out = accepted(json(d));
    expect(out.paginas[0].imagem).toEqual(img(IMG_A));
    expect(presentationImageIds(out)).toEqual([IMG_A]);
  });

  it('desenho técnico aceita as quatro composições e escala e unidade só como texto', () => {
    for (const composicao of ['1', '2', '3', '4']) {
      const d = json(fullDoc());
      d.paginas[4].composicao = composicao;
      d.paginas[4].desenhos = Array.from({ length: Number(composicao) }, () => ({ id: newId(), imagem: null, titulo: 'Planta baixa' }));
      d.paginas[4].escala = '1:50 · indicada';
      d.paginas[4].unidade = 'cm';
      expect(accepted(d).paginas[4]).toMatchObject({ composicao, escala: '1:50 · indicada', unidade: 'cm' });
    }
  });

  it('as imagens de todas as páginas e itens entram em presentationImageIds, sem repetição', () => {
    const d = json(fullDoc());
    d.paginas[0].imagem = img(IMG_A);
    d.paginas[1].blocos[3].imagem = img(IMG_B);
    d.paginas[2].materiais[0].imagem = img(IMG_C);
    d.paginas[3].imagens[0].imagem = img(IMG_A);
    d.paginas[4].desenhos[0].imagem = img(IMG_B.toUpperCase());
    expect(presentationImageIds(accepted(d))).toEqual([IMG_A, IMG_B, IMG_C]);
  });
});

describe('Fase 6c · E1 · capa única e em primeiro', () => {
  it('sem páginas, a capa fora do primeiro lugar e uma segunda capa são recusados', () => {
    const base = json(fullDoc());
    expect(refused({ ...base, paginas: [] })).toMatchObject({ error: 'invalid', reason: 'no_pages' });
    expect(refused({ ...base, paginas: [base.paginas[1], base.paginas[0]] })).toMatchObject({ error: 'invalid', reason: 'cover_first', pagina: 0 });
    expect(refused({ ...base, paginas: base.paginas.slice(1) })).toMatchObject({ reason: 'cover_first' });
    const segunda = { ...base.paginas[0], id: 'capa-2' };
    expect(refused({ ...base, paginas: [base.paginas[0], base.paginas[1], segunda] })).toMatchObject({ error: 'invalid', reason: 'second_cover', pagina: 2 });
  });

  it('prancha, tipo desconhecido e página sem os campos do tipo são recusados', () => {
    const base = json(fullDoc());
    const prancha = { id: 'pr', tipo: 'prancha', title: '', fase: 'Executivo', imagem: null };
    expect(refused({ ...base, paginas: [base.paginas[0], prancha] })).toMatchObject({ reason: 'page_type', pagina: 1 });
    expect(refused({ ...base, paginas: [base.paginas[0], { ...base.paginas[1], tipo: 'galeria' }] })).toMatchObject({ reason: 'page_type' });
    // Uma página "notas" com os campos da capa, como no teste da 6b.
    expect(refused({ ...base, paginas: [base.paginas[0], { ...base.paginas[0], id: 'p2', tipo: 'notas' }] })).toMatchObject({ reason: 'field', pagina: 1 });
    const semTitulo = { ...base.paginas[6] };
    delete semTitulo.titulo;
    expect(refused({ ...base, paginas: [base.paginas[0], semTitulo] })).toMatchObject({ reason: 'field', pagina: 1, campo: 'titulo' });
  });

  it('id de página repetido ou fora do formato é recusado', () => {
    const base = json(fullDoc());
    expect(refused({ ...base, paginas: [base.paginas[0], base.paginas[1], { ...base.paginas[2], id: base.paginas[1].id }] })).toMatchObject({
      reason: 'page_id',
      pagina: 2,
    });
    expect(refused({ ...base, paginas: [base.paginas[0], { ...base.paginas[1], id: 'com espaço' }] })).toMatchObject({ reason: 'page_id' });
    const bloco = base.paginas[1].blocos[0];
    expect(refused({ ...base, paginas: [base.paginas[0], { ...base.paginas[1], blocos: [bloco, bloco] }] })).toMatchObject({ reason: 'field', campo: 'blocos' });
  });

  it('valores fora das listas são recusados', () => {
    const cases: [number, string, unknown][] = [
      [0, 'cor', 'verde'],
      [1, 'composicao', 'grade'],
      [3, 'composicao', 'diagonal'],
      [4, 'composicao', '5'],
    ];
    for (const [i, key, v] of cases) {
      const d = json(fullDoc());
      d.paginas[i][key] = v;
      expect(refused(d), `${i} ${key}`).toMatchObject({ reason: 'field', pagina: i, campo: key });
    }
    const d = json(fullDoc());
    d.paginas[1].blocos[3].posicao = 'centro';
    expect(refused(d)).toMatchObject({ reason: 'field', campo: 'posicao' });
    const e = json(fullDoc());
    e.paginas[2].materiais[0].imagem = { id: 'x', ajuste: 'fit', zoom: 1, x: 50, y: 50 };
    expect(refused(e)).toMatchObject({ reason: 'image', pagina: 2, campo: 'materiais' });
  });
});

describe('Fase 6c · E1 · limites', () => {
  it('40 páginas são aceitas; 41 são recusadas', () => {
    const d = fullDoc();
    while (d.paginas.length < PRESENTATION_MAX_PAGES) d.paginas.push(newPresentationPage('notas', newId));
    expect(accepted(json(d)).paginas).toHaveLength(40);
    d.paginas.push(newPresentationPage('direitos', newId));
    expect(refused(json(d))).toMatchObject({ error: 'invalid', reason: 'too_many_pages' });
  });

  it('6 blocos, 6 materiais e 6 notas são aceitos; o item seguinte é recusado', () => {
    expect([PRESENTATION_MAX_BLOCKS, PRESENTATION_MAX_MATERIALS, PRESENTATION_MAX_NOTES]).toEqual([6, 6, 6]);
    const lists: [number, string, number, () => unknown][] = [
      [1, 'blocos', 6, () => newTextBlock(newId)],
      [2, 'materiais', 6, () => newMaterial(newId)],
      [5, 'notas', 6, () => newNote(newId)],
    ];
    for (const [i, key, max, make] of lists) {
      const d = json(fullDoc());
      d.paginas[i][key] = Array.from({ length: max }, make);
      expect(accepted(d).paginas[i]).toHaveProperty(key);
      d.paginas[i][key] = Array.from({ length: max + 1 }, make);
      expect(refused(d), key).toMatchObject({ error: 'invalid', reason: 'too_many_items', pagina: i, campo: key });
    }
  });

  it('listas vazias de blocos, materiais e notas são aceitas', () => {
    const d = json(fullDoc());
    d.paginas[1].blocos = [];
    d.paginas[2].materiais = [];
    d.paginas[5].notas = [];
    expect(accepted(d).paginas).toHaveLength(7);
  });

  it('"Várias imagens do ambiente" aceita de 4 a 8 imagens; 3 e 9 são recusadas', () => {
    const d = json(fullDoc());
    d.paginas[3].composicao = 'grade';
    d.paginas[3].imagens = Array.from({ length: 3 }, () => newVisualImage(newId));
    expect(refused(d)).toMatchObject({ reason: 'too_few_items', pagina: 3, campo: 'imagens' });
    d.paginas[3].imagens = Array.from({ length: 9 }, () => newVisualImage(newId));
    expect(refused(d)).toMatchObject({ reason: 'too_many_items', pagina: 3, campo: 'imagens' });
    // Nas outras composições, o máximo guardado também é 8.
    d.paginas[3].composicao = 'lado';
    expect(refused(d)).toMatchObject({ reason: 'too_many_items' });
  });

  it('cada composição precisa dos seus espaços de imagem ou de desenho', () => {
    const v = json(fullDoc());
    v.paginas[3].composicao = 'principal';
    v.paginas[3].imagens = Array.from({ length: 2 }, () => newVisualImage(newId));
    expect(refused(v)).toMatchObject({ reason: 'too_few_items', pagina: 3 });
    const t = json(fullDoc());
    t.paginas[4].composicao = '4';
    expect(refused(t)).toMatchObject({ reason: 'too_few_items', pagina: 4, campo: 'desenhos' });
    t.paginas[4].composicao = '1';
    t.paginas[4].desenhos = Array.from({ length: 5 }, () => ({ id: newId(), imagem: null, titulo: '' }));
    expect(refused(t)).toMatchObject({ reason: 'too_many_items', pagina: 4 });
  });

  it('textos curtos vão até 200 caracteres e longos até 2000', () => {
    const fields: [number, (p: Record<string, any>) => Record<string, any>, string, number][] = [
      [1, (p) => p, 'titulo', PRESENTATION_MAX_SHORT],
      [1, (p) => p, 'introducao', PRESENTATION_MAX_TEXT],
      [1, (p) => p.blocos[0], 'texto', PRESENTATION_MAX_TEXT],
      [2, (p) => p.materiais[0], 'nome', PRESENTATION_MAX_SHORT],
      [3, (p) => p.imagens[0], 'legenda', PRESENTATION_MAX_SHORT],
      [3, (p) => p, 'programas', PRESENTATION_MAX_SHORT],
      [4, (p) => p, 'escala', PRESENTATION_MAX_SHORT],
      [5, (p) => p.notas[0], 'categoria', PRESENTATION_MAX_SHORT],
      [6, (p) => p, 'restricoes', PRESENTATION_MAX_TEXT],
    ];
    for (const [i, at, key, max] of fields) {
      const d = json(fullDoc());
      at(d.paginas[i])[key] = 'a'.repeat(max);
      expect(accepted(d).paginas[i], key).toBeTruthy();
      at(d.paginas[i])[key] = 'a'.repeat(max + 1);
      expect(refused(d), key).toMatchObject({ error: 'invalid', reason: 'text_too_long', pagina: i, campo: key });
    }
  });

  it('texto em base64 é recusado em qualquer página e item', () => {
    const b64 = 'data:image/png;base64,iVBORw0KGgo=';
    const d = json(fullDoc());
    d.paginas[5].notas[2].texto = b64;
    expect(refused(d)).toMatchObject({ error: 'base64', reason: 'base64', pagina: 5, campo: 'texto' });
    const e = json(fullDoc());
    e.paginas[6].autoria = b64;
    expect(refused(e)).toMatchObject({ error: 'base64', pagina: 6 });
  });

  it('a mensagem de cada recusa sai em pt-BR, com o número da página', () => {
    expect(presentationDataMessage({ reason: 'too_many_pages' })).toBe('A apresentação pode ter até 40 páginas, com a capa.');
    expect(presentationDataMessage({ reason: 'second_cover', pagina: 2 })).toBe('A apresentação só pode ter uma capa. Há outra capa na página 03.');
    expect(presentationDataMessage({ reason: 'too_many_items', pagina: 4 })).toBe('A lista na página 05 passou do limite de itens.');
    expect(presentationDataMessage({ reason: 'too_many_items', pagina: 1, campo: 'blocos' })).toBe('A página 02 pode ter até 6 blocos, contando os de imagem.');
    expect(presentationDataMessage({ reason: 'too_many_items', pagina: 2, campo: 'materiais' })).toBe('A página 03 pode ter até 6 materiais.');
    expect(presentationDataMessage({ reason: 'too_many_items', pagina: 5, campo: 'notas' })).toBe('A página 06 pode ter até 6 notas.');
    expect(presentationDataMessage({ reason: 'too_many_photos' })).toBe(
      'A apresentação pode ter até 50 fotos, o limite para gerar o PDF. Remova alguma foto para adicionar outra.',
    );
    expect(presentationDataMessage({ reason: 'cover_first', pagina: 0 })).toBe('A capa precisa ser a primeira página.');
    for (const reason of ['format', 'project', 'base64', 'no_pages', 'page_type', 'page_id', 'field', 'text_too_long', 'image', 'too_few_items'] as const) {
      const m = presentationDataMessage({ reason, pagina: 1 });
      expect(m, reason).toMatch(/\.$/);
      expect(m, reason).not.toMatch(/!/);
    }
  });

  it('tamanho de uma página cheia de cada tipo, para o limite de 1 MiB (R1)', () => {
    const L = 'a'.repeat(PRESENTATION_MAX_TEXT);
    const S = 'a'.repeat(PRESENTATION_MAX_SHORT);
    const fill = (o: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && !['id', 'tipo', 'composicao'].includes(k)) o[k] = v === '' || v.length < 40 ? S : v;
    };
    const d = json(fullDoc());
    const pages = d.paginas.slice(1);
    for (const p of pages) {
      fill(p);
      for (const k of ['introducao', 'descricao', 'observacoes', 'autoria', 'escritorio', 'uso', 'restricoes']) if (k in p) p[k] = L;
    }
    pages[0].blocos = Array.from({ length: PRESENTATION_MAX_BLOCKS }, () => ({ ...newTextBlock(newId), titulo: S, texto: L }));
    pages[1].materiais = Array.from({ length: PRESENTATION_MAX_MATERIALS }, () => ({ ...newMaterial(newId), imagem: img(IMG_A), nome: S, fabricante: S, codigo: S, acabamento: S, ambiente: S, observacoes: L }));
    pages[2].composicao = 'grade';
    pages[2].imagens = Array.from({ length: 8 }, () => ({ ...newVisualImage(newId), imagem: img(IMG_A), legenda: S }));
    pages[4].notas = Array.from({ length: PRESENTATION_MAX_NOTES }, () => ({ ...newNote(newId), categoria: S, titulo: S, texto: L }));
    const out = accepted(d);
    const sizes = Object.fromEntries(out.paginas.slice(1).map((p) => [p.tipo, presentationBytes(p)]));
    console.info('Tamanho de uma página cheia, em bytes:', JSON.stringify(sizes));
    // Página de texto cheia: 6 blocos de 2000 caracteres, cerca de 16 KB. Cabem 65 delas em 1 MiB; com o
    // moodboard cheio (6 materiais, cerca de 22 KB), 48. Com 6 itens por lista, 40 páginas cheias de texto sem
    // acento não chegam a 1 MiB; só letras acentuadas (2 bytes cada) levam o documento perto do limite.
    expect(PRESENTATION_MAX_BYTES).toBe(1024 * 1024);
    expect(Math.floor(PRESENTATION_MAX_BYTES / sizes.texto)).toBe(65);
    expect(Math.floor(PRESENTATION_MAX_BYTES / sizes.moodboard)).toBe(48);
  });
});
