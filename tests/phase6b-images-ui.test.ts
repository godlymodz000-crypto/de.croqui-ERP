// Fase 6b, etapa E8, lado da tela: redução da imagem no navegador, envio direto ao Drive pela API da E4,
// textos dos desenhos 6b-06 a 6b-09, enquadramento da imagem na capa e o campo "Nome da apresentação".
// Sem navegador: a leitura e o redesenho da imagem usam um codec falso; o envio usa fetch e XHR falsos.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyPresentation } from '../src/shared/presentation-data';
import { IMAGE_JPEG_QUALITY, IMAGE_MAX_BYTES, IMAGE_TYPES } from '../src/shared/presentation-calc';
import { prepareImage, preparedName, type ImageCodec } from '../src/presentation/imageReduce';
import { coverImageStyle } from '../src/presentation/cover';
import {
  cleanPresentationName,
  dragFrame,
  extraFilesNotice,
  imagePlacedLine,
  imageZoomIn,
  imageZoomOut,
  libraryCaption,
  presentationNameError,
  uploadProgressLine,
  uploadRefusal,
} from '../src/pages/presentations/editor';
import { presentationImagesApi, uploadPresentationImage } from '../src/api/presentationImages';
import { presentationsApi } from '../src/api/presentations';

type SheetMod = typeof import('../src/presentation/CoverSheet');
let sheet: SheetMod;

beforeAll(async () => {
  (globalThis as { window?: unknown }).window ??= globalThis;
  sheet = await import('../src/presentation/CoverSheet');
});

/** Codec falso: a imagem "tem" as medidas pedidas e o redesenho registra o que recebeu. */
function fakeCodec(width: number, height: number) {
  const calls: { width: number; height: number; type: string; quality: number }[] = [];
  const codec: ImageCodec = {
    measure: async () => ({ width, height }),
    encode: async (_file, w, h, type, quality) => {
      calls.push({ width: w, height: h, type, quality });
      return new Blob([new Uint8Array(1000)], { type });
    },
  };
  return { codec, calls };
}
const file = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type });

describe('redução no navegador', () => {
  it('até 4000 px e até 8 MB: vai como veio, sem redesenhar', async () => {
    const { codec, calls } = fakeCodec(3000, 2000);
    const f = file('fachada-principal.jpg', 'image/jpeg', 2 * 1048576);
    const out = await prepareImage(f, codec);
    expect(calls).toHaveLength(0);
    expect(out).toMatchObject({ blob: f, name: 'fachada-principal.jpg', type: 'image/jpeg', width: 3000, height: 2000, reduced: false });
  });

  it('acima de 4000 px no lado maior: reduz para 4000 px, mantendo a proporção', async () => {
    const { codec, calls } = fakeCodec(6000, 4000);
    const out = await prepareImage(file('render.jpg', 'image/jpeg', 5 * 1048576), codec);
    expect(calls).toEqual([{ width: 4000, height: 2667, type: 'image/jpeg', quality: IMAGE_JPEG_QUALITY }]);
    expect(out).toMatchObject({ name: 'render.jpg', type: 'image/jpeg', width: 4000, height: 2667, reduced: true });
    expect(out.blob.size).toBe(1000);
  });

  it('imagem em pé: o lado maior é a altura', async () => {
    const { codec, calls } = fakeCodec(3000, 9000);
    await prepareImage(file('alto.png', 'image/png', 1048576), codec);
    expect(calls[0]).toMatchObject({ width: 1333, height: 4000, type: 'image/png' });
  });

  it('PNG continua PNG; WebP grande vira JPEG e o nome acompanha', async () => {
    const png = await prepareImage(file('planta.png', 'image/png', 1048576), fakeCodec(8000, 2000).codec);
    expect(png).toMatchObject({ name: 'planta.png', type: 'image/png', width: 4000, height: 1000 });
    const webp = await prepareImage(file('sala.webp', 'image/webp', 1048576), fakeCodec(5000, 5000).codec);
    expect(webp).toMatchObject({ name: 'sala.jpg', type: 'image/jpeg', width: 4000, height: 4000 });
  });

  it('medida pequena mas acima de 8 MB: redesenha no mesmo tamanho', async () => {
    const { codec, calls } = fakeCodec(3500, 2500);
    const out = await prepareImage(file('pesada.jpg', 'image/jpeg', 9 * 1048576), codec);
    expect(calls).toEqual([{ width: 3500, height: 2500, type: 'image/jpeg', quality: IMAGE_JPEG_QUALITY }]);
    expect(out.reduced).toBe(true);
  });

  it('tipo vazio vem da extensão', async () => {
    const out = await prepareImage(file('foto.JPG', '', 1000), fakeCodec(100, 100).codec);
    expect(out.type).toBe('image/jpeg');
  });

  it('nome do arquivo enviado', () => {
    expect(preparedName('a.png', 'image/png')).toBe('a.png');
    expect(preparedName('a.webp', 'image/jpeg')).toBe('a.jpg');
    expect(preparedName('a.jpeg', 'image/jpeg')).toBe('a.jpeg');
    expect(preparedName('sem-extensao', 'image/jpeg')).toBe('sem-extensao.jpg');
  });
});

describe('envio direto ao Drive', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('abre a sessão na API, manda o arquivo ao Drive e conclui na API', async () => {
    const calls: { url: string; method: string; body: unknown }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, method: String(init.method), body: init.body ? JSON.parse(String(init.body)) : null });
      if (url.endsWith('/uploads')) return new Response(JSON.stringify({ uploadUrl: 'https://drive.test/sessao', token: 't1' }), { status: 201 });
      return new Response(JSON.stringify({ id: 'img-1', fileName: 'render.jpg', sizeBytes: 1000, usedBy: 0 }), { status: 201 });
    });
    const puts: { url: string; type: string; size: number }[] = [];
    class FakeXhr {
      upload: { onprogress?: (e: { loaded: number }) => void } = {};
      status = 0;
      responseText = '';
      onload?: () => void;
      onerror?: () => void;
      onabort?: () => void;
      private url = '';
      private type = '';
      open(_m: string, url: string) {
        this.url = url;
      }
      setRequestHeader(_k: string, v: string) {
        this.type = v;
      }
      abort() {}
      send(body: Blob) {
        puts.push({ url: this.url, type: this.type, size: body.size });
        this.upload.onprogress?.({ loaded: body.size / 2 });
        this.status = 200;
        this.responseText = JSON.stringify({ id: 'drive-1' });
        this.onload?.();
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr);

    const progress: number[] = [];
    const prepared = { blob: new Blob([new Uint8Array(1000)], { type: 'image/jpeg' }), name: 'render.jpg', type: 'image/jpeg', width: 4000, height: 2667, reduced: true };
    const img = await uploadPresentationImage('p1', prepared, (n) => progress.push(n));

    expect(calls.map((c) => [c.method, c.url])).toEqual([
      ['POST', '/api/presentations/p1/images/uploads'],
      ['POST', '/api/presentations/p1/images/complete'],
    ]);
    expect(calls[0].body).toEqual({ name: 'render.jpg', mimeType: 'image/jpeg', size: 1000, width: 4000, height: 2667 });
    expect(calls[1].body).toEqual({ token: 't1', driveFileId: 'drive-1' });
    // O arquivo vai ao Drive, não ao servidor do ERP.
    expect(puts).toEqual([{ url: 'https://drive.test/sessao', type: 'image/jpeg', size: 1000 }]);
    expect(progress).toEqual([500]);
    expect(img.id).toBe('img-1');
  });

  it('endereços das imagens servidas pelo ERP', () => {
    expect(presentationImagesApi.imageUrl('x')).toBe('/api/presentation-images/x/image');
    expect(presentationImagesApi.thumbnailUrl('x')).toBe('/api/presentation-images/x/thumbnail');
  });
});

describe('textos de 6b-06 a 6b-09', () => {
  it('avisos de arquivo recusado (6b-08): nada é enviado', () => {
    expect(uploadRefusal({ name: 'anim.gif', type: 'image/gif', size: 10 }, IMAGE_TYPES, IMAGE_MAX_BYTES)).toBe(
      '“anim.gif” não é um formato aceito. Use PNG, JPG ou WebP. Nada foi enviado.',
    );
    expect(uploadRefusal({ name: 'render-final.png', type: 'image/png', size: 52 * 1048576 }, IMAGE_TYPES, IMAGE_MAX_BYTES)).toBe(
      '“render-final.png” tem 52 MB. O limite é 40 MB; exporte a imagem em resolução menor.',
    );
    expect(uploadRefusal({ name: 'foto.jpeg', type: '', size: 10 }, IMAGE_TYPES, IMAGE_MAX_BYTES)).toBeNull();
    expect(uploadRefusal({ name: 'limite.png', type: 'image/png', size: IMAGE_MAX_BYTES }, IMAGE_TYPES, IMAGE_MAX_BYTES)).toBeNull();
  });

  it('vários arquivos para o espaço da capa', () => {
    expect(extraFilesNotice(2)).toBe('A capa tem um espaço de imagem. A primeira foi usada; as outras 2 ficaram na biblioteca.');
    expect(extraFilesNotice(1)).toBe('A capa tem um espaço de imagem. A primeira foi usada; a outra ficou na biblioteca.');
  });

  it('espaço de imagem: enviando e enviado', () => {
    expect(uploadProgressLine(62, 100)).toBe('62% · enviando ao Drive');
    expect(uploadProgressLine(0, 0)).toBe('0% · enviando ao Drive');
    expect(imagePlacedLine(Math.round(2.4 * 1048576), true)).toBe('2,4 MB · na biblioteca do projeto');
    expect(imagePlacedLine(400 * 1024, false)).toBe('400 KB · na biblioteca desta apresentação');
  });

  it('legendas da biblioteca do projeto e da avulsa', () => {
    expect(libraryCaption({ selected: true, usedBy: 1, hasProject: true })).toBe('Selecionada · usada em 1 apresentação');
    expect(libraryCaption({ selected: false, usedBy: 2, hasProject: true })).toBe('Usada em 2 apresentações');
    expect(libraryCaption({ selected: false, usedBy: 0, hasProject: true })).toBe('Sem uso no momento');
    expect(libraryCaption({ selected: true, usedBy: 0, hasProject: false })).toBe('Selecionada');
    expect(libraryCaption({ selected: false, usedBy: 1, hasProject: false })).toBe('Enviada nesta apresentação');
  });

  it('nenhum texto com exclamação', () => {
    const textos = [
      uploadRefusal({ name: 'a.gif', type: 'image/gif', size: 1 }, IMAGE_TYPES, IMAGE_MAX_BYTES),
      extraFilesNotice(3),
      presentationNameError(''),
      presentationNameError('x'.repeat(200)),
    ];
    for (const t of textos) expect(t).not.toContain('!');
  });
});

describe('ferramentas e enquadramento (6b-07)', () => {
  it('zoom de 1 a 4', () => {
    expect(imageZoomIn(1)).toBe(1.25);
    expect(imageZoomIn(4)).toBe(4);
    expect(imageZoomOut(1)).toBe(1);
    expect(imageZoomOut(2)).toBe(1.75);
  });

  it('arrastar move o enquadramento ao contrário do ponteiro, de 0 a 100%', () => {
    const box = { width: 400, height: 800 };
    expect(dragFrame({ x: 50, y: 50 }, 40, 0, box, 1)).toEqual({ x: 40, y: 50 });
    expect(dragFrame({ x: 50, y: 50 }, 40, 0, box, 2)).toEqual({ x: 45, y: 50 });
    expect(dragFrame({ x: 50, y: 50 }, -1000, 1000, box, 1)).toEqual({ x: 100, y: 0 });
  });

  it('estilo da imagem: caber inteira ou preencher, zoom e ponto de enquadramento', () => {
    expect(coverImageStyle({ ajuste: 'fill', zoom: 1, x: 50, y: 50 })).toEqual({
      objectFit: 'cover',
      objectPosition: '50% 50%',
      transform: undefined,
      transformOrigin: '50% 50%',
    });
    expect(coverImageStyle({ ajuste: 'fit', zoom: 2, x: 20, y: 80 })).toMatchObject({ objectFit: 'contain', transform: 'scale(2)', objectPosition: '20% 80%' });
  });

  it('com imagem, a folha não mostra "Imagem da capa pendente"; sem imagem e com a Prévia ligada, também não', () => {
    const d = emptyPresentation('capa', { nome: 'Projeto Teste', cliente: 'Cliente Teste' });
    const ref = { id: '00000000-0000-4000-8000-000000000001', ajuste: 'fill' as const, zoom: 1, x: 50, y: 50 };
    const comImagem = renderToStaticMarkup(
      createElement(sheet.CoverSheet, { projeto: d.projeto, mode: 'edit', logoSrc: 'logo.svg', image: { src: '/img.jpg', ref } }),
    );
    expect(comImagem).toContain('pcover__image');
    expect(comImagem).toContain('object-fit:cover');
    expect(comImagem).not.toContain('Imagem da capa pendente');
    const semImagem = renderToStaticMarkup(createElement(sheet.CoverSheet, { projeto: d.projeto, mode: 'edit', logoSrc: 'logo.svg' }));
    expect(semImagem).toContain('Imagem da capa pendente');
    const impressa = renderToStaticMarkup(createElement(sheet.CoverSheet, { projeto: d.projeto, mode: 'print', logoSrc: 'logo.svg' }));
    expect(impressa).not.toContain('Imagem da capa pendente');
    expect(impressa).not.toContain('pcover__image');
  });
});

describe('nome da apresentação', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('obrigatório e até 120 caracteres; enquanto isso, fica o nome anterior', () => {
    expect(presentationNameError('')).toBe('Dê um nome à apresentação. Até lá, fica o nome anterior.');
    expect(presentationNameError('   ')).toBe('Dê um nome à apresentação. Até lá, fica o nome anterior.');
    expect(presentationNameError('x'.repeat(121))).toContain('até 120 caracteres');
    expect(presentationNameError('x'.repeat(120))).toBeNull();
    expect(cleanPresentationName('  Apresentação   do anteprojeto ')).toBe('Apresentação do anteprojeto');
  });

  it('o salvamento automático leva o nome junto com o documento', async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ id: 'a', updatedAt: '2026-11-07T10:00:00.000Z' }), { status: 200 });
    });
    const d = emptyPresentation('capa', {});
    await presentationsApi.save('a', { data: d, baseUpdatedAt: 'b', name: 'Apresentação do anteprojeto' });
    expect(bodies[0]).toEqual({ data: d, baseUpdatedAt: 'b', name: 'Apresentação do anteprojeto' });
  });
});
