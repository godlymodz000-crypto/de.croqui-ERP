// Fase 6d, etapa E2: modelo de dados e validação da prancha (revisao-fase6d/planejamento.md, seções 2 e 3).
// Testes de unidade: o módulo é puro e não grava nada, então não precisa de banco.
import { describe, expect, it } from 'vitest';
import {
  ADDABLE_PAGE_TYPES,
  emptyPresentation,
  newPresentationPage,
  PAGE_FORMATS,
  PAGE_TYPES,
  parsePresentationData,
  PRANCHA_FRAME_VERSION,
  PRANCHA_SHEETS,
  PRESENTATION_MAX_SHORT,
  presentationBytes,
  presentationImageIds,
  type PresentationData,
  type PresentationImageRef,
  type PresentationPranchaPage,
} from '../src/shared/presentation-data';

const IMG_A = '11111111-1111-4111-8111-111111111111';
const IMG_B = '22222222-2222-4222-8222-222222222222';
const img = (id: string): PresentationImageRef => ({ id, ajuste: 'fill', zoom: 1, x: 50, y: 50 });

let seq = 0;
const newId = () => `d${++seq}`;

/** Documento da 6c: a capa e uma página de cada tipo, como sai do menu de adicionar, com alguns campos preenchidos. */
function doc6c(): PresentationData {
  const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Avulso' });
  for (const tipo of ADDABLE_PAGE_TYPES) d.paginas.push(newPresentationPage(tipo, newId));
  d.paginas[0].imagem = img(IMG_A);
  d.projeto.data = '2026-11-01';
  const tecnico = d.paginas[4];
  if (tecnico.tipo !== 'tecnico') throw new Error('ordem');
  tecnico.escala = '1:50';
  tecnico.desenhos[0].imagem = img(IMG_B);
  return d;
}

/** Prancha com imagem importada, como fica depois da E3. */
function pranchaComImagem(): PresentationPranchaPage {
  return { ...newPresentationPage('prancha', newId), titulo: 'Recepção · balcão', imagem: img(IMG_B), moldura: 1 };
}

const withPage = (p: unknown, base: PresentationData = emptyPresentation('capa', { nome: 'Projeto Teste' })) => ({
  ...json(base),
  paginas: [json(base).paginas[0], p],
});

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
/** Cópia como JSON, como chega na API. */
const json = <T>(d: T): T => JSON.parse(JSON.stringify(d));

describe('Fase 6d · E2 · formato da apresentação', () => {
  it('PAGE_FORMATS tem a4, a3 e wide', () => {
    expect(PAGE_FORMATS).toEqual(['a4', 'a3', 'wide']);
  });

  it('a3 e wide são aceitos e mantidos; documento sem o campo continua a4', () => {
    for (const formato of ['a4', 'a3', 'wide'] as const) {
      const d = emptyPresentation('capa');
      d.projeto.formato = formato;
      expect(accepted(json(d)).projeto.formato, formato).toBe(formato);
    }
    const semCampo = json(emptyPresentation('capa')) as unknown as { projeto: Record<string, unknown> };
    delete semCampo.projeto.formato;
    expect(accepted(semCampo).projeto.formato).toBe('a4');
  });

  it('formato fora da lista é recusado', () => {
    for (const formato of ['a5', 'A4', '16:9', 4, null]) {
      const d = json(emptyPresentation('capa')) as unknown as { projeto: Record<string, unknown> };
      d.projeto.formato = formato;
      expect(refused(d), String(formato)).toMatchObject({ error: 'invalid', reason: 'project', campo: 'formato' });
    }
  });
});

describe('Fase 6d · E2 · página prancha', () => {
  it('prancha passa a ser um tipo de página; o menu de adicionar continua sem ela até a E4', () => {
    expect(PAGE_TYPES).toContain('prancha');
    expect(ADDABLE_PAGE_TYPES).not.toContain('prancha');
    expect(PRANCHA_SHEETS).toEqual(['a4', 'a3']);
    expect(PRANCHA_FRAME_VERSION).toBe(1);
  });

  it('página nova: A4, fase "Executivo", rodapé ligado, sem imagem e sem moldura (P44)', () => {
    const p = newPresentationPage('prancha', newId);
    expect(p).toEqual({ id: p.id, tipo: 'prancha', folha: 'a4', titulo: '', fase: 'Executivo', rodape: true, imagem: null });
    expect(p).not.toHaveProperty('moldura');
  });

  it('prancha nova e prancha com imagem e moldura 1 são aceitas e relidas iguais', () => {
    const nova = newPresentationPage('prancha', newId);
    expect(accepted(withPage(nova)).paginas[1]).toEqual(nova);
    const cheia = { ...pranchaComImagem(), folha: 'a3' as const, fase: 'Anteprojeto', rodape: false };
    expect(accepted(withPage(cheia)).paginas[1]).toEqual(cheia);
  });

  it('campos desconhecidos são descartados, como nos outros tipos', () => {
    const p = { ...json(pranchaComImagem()), extra: 'x' };
    expect(accepted(withPage(p)).paginas[1]).not.toHaveProperty('extra');
  });

  it('cada campo obrigatório ausente é recusado com o nome do campo', () => {
    for (const campo of ['folha', 'titulo', 'fase', 'rodape']) {
      const p = json(pranchaComImagem()) as unknown as Record<string, unknown>;
      delete p[campo];
      expect(refused(withPage(p)), campo).toMatchObject({ error: 'invalid', reason: 'field', pagina: 1, campo });
    }
  });

  it('rodapé que não é verdadeiro ou falso é recusado', () => {
    for (const rodape of ['sim', 1, null]) {
      expect(refused(withPage({ ...json(pranchaComImagem()), rodape })), String(rodape)).toMatchObject({ reason: 'field', campo: 'rodape' });
    }
  });

  it('folha fora da lista é recusada (a prancha é só A4 ou A3, P38)', () => {
    for (const folha of ['wide', 'a5', 'A4', '', 3, null]) {
      expect(refused(withPage({ ...json(pranchaComImagem()), folha })), String(folha)).toMatchObject({ reason: 'field', pagina: 1, campo: 'folha' });
    }
  });

  it('moldura diferente de 1 é recusada', () => {
    for (const moldura of [0, 2, '1', 1.5, true]) {
      expect(refused(withPage({ ...json(pranchaComImagem()), moldura })), String(moldura)).toMatchObject({ reason: 'field', pagina: 1, campo: 'moldura' });
      const semImagem = { ...json(newPresentationPage('prancha', newId)), moldura };
      expect(refused(withPage(semImagem)), `sem imagem ${String(moldura)}`).toMatchObject({ reason: 'field', campo: 'moldura' });
    }
  });

  it('com imagem, a versão da moldura é obrigatória (gravada na importação, M8)', () => {
    const p = json(pranchaComImagem()) as unknown as Record<string, unknown>;
    delete p.moldura;
    expect(refused(withPage(p))).toMatchObject({ reason: 'field', pagina: 1, campo: 'moldura' });
  });

  it('sem imagem, a moldura pode faltar ou ser 1', () => {
    const p = newPresentationPage('prancha', newId);
    expect(accepted(withPage({ ...p, moldura: 1 })).paginas[1]).toEqual({ ...p, moldura: 1 });
  });

  it('imagem inválida, texto longo e base64 são recusados como nos outros tipos', () => {
    expect(refused(withPage({ ...json(pranchaComImagem()), imagem: { id: 'x', ajuste: 'fit', zoom: 1, x: 50, y: 50 } }))).toMatchObject({
      reason: 'image',
      campo: 'imagem',
    });
    expect(refused(withPage({ ...json(pranchaComImagem()), titulo: 'x'.repeat(PRESENTATION_MAX_SHORT + 1) }))).toMatchObject({
      reason: 'text_too_long',
      campo: 'titulo',
    });
    expect(refused(withPage({ ...json(pranchaComImagem()), fase: 'data:image/png;base64,iVBORw0KGgo=' }))).toMatchObject({
      error: 'base64',
      reason: 'base64',
      campo: 'fase',
    });
  });

  it('a imagem da prancha conta no teto de fotos e no vínculo (P41)', () => {
    const d = doc6c();
    const prancha = { ...pranchaComImagem(), imagem: img('33333333-3333-4333-8333-333333333333') };
    d.paginas.push(prancha);
    expect(presentationImageIds(d)).toEqual([IMG_A, IMG_B, '33333333-3333-4333-8333-333333333333']);
    // A mesma imagem em outro espaço conta uma vez só.
    prancha.imagem = img(IMG_B);
    expect(presentationImageIds(d)).toEqual([IMG_A, IMG_B]);
  });

  it('a prancha entra no tamanho do documento, que é o que o limite de 1 MiB mede', () => {
    const d = doc6c();
    const antes = presentationBytes(d);
    d.paginas.push(pranchaComImagem());
    expect(presentationBytes(d)).toBe(antes + presentationBytes(pranchaComImagem()) + 1);
  });
});

describe('Fase 6d · E2 · documento da 6c', () => {
  it('abre sem mudança: a leitura devolve o mesmo documento, com formato a4', () => {
    const d = doc6c();
    const lido = accepted(json(d));
    expect(lido).toEqual(d);
    expect(JSON.stringify(lido)).toBe(JSON.stringify(d));
    expect(lido.projeto.formato).toBe('a4');
  });

  it('salva sem mudança: ler o que foi lido dá o mesmo documento', () => {
    const lido = accepted(json(doc6c()));
    expect(accepted(json(lido))).toEqual(lido);
  });

  it('documento com prancha entre páginas da 6c é aceito na ordem dada', () => {
    const d = doc6c();
    d.paginas.splice(3, 0, pranchaComImagem());
    expect(accepted(json(d)).paginas.map((p) => p.tipo)).toEqual(['capa', 'texto', 'moodboard', 'prancha', 'visual', 'tecnico', 'notas', 'direitos']);
  });
});
