// Fase 6b, etapa E2: cálculos da Apresentação conferidos com os casos gerados no arquivo offline original
// (revisao-fase6/casos-de-teste.json). Cada caso roda o módulo com a mesma entrada e compara a saída que
// o arquivo gravou. As diferenças são as mudanças intencionais das decisões da 6b, listadas em EXCECOES.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  fitZoom,
  imageReduction,
  imageWarning,
  pageFooters,
  pageNavLabel,
  zoomCss,
  zoomIn,
  zoomLabel,
  zoomOut,
  type PresentationPageType,
} from '../src/shared/presentation-calc.js';

interface Case {
  id: string;
  calculo: string;
  descricao?: string;
  entrada: Record<string, any>;
  saida: Record<string, any>;
}
const raw = readFileSync('./revisao-fase6/casos-de-teste.json', 'utf8');
const CASES = (JSON.parse(raw) as { apresentacao: Case[] }).apresentacao;
const byId = (id: string) => {
  const c = CASES.find((x) => x.id === id);
  expect(c, id).toBeDefined();
  return c!;
};

/** Mudanças intencionais: o que o arquivo mostrou e o que o ERP mostra. */
const EXCECOES: Record<string, { motivo: string; campo: string; arquivo: string; erp: string }[]> = {
  'apr-20': [
    {
      motivo: 'sem carimbo automático (decisoes.md, Escala e folha)',
      campo: 'segundo "03 / 04" da página técnica e folhaDoCarimbo',
      arquivo: '03 / 04 no carimbo',
      erp: 'só o rodapé',
    },
  ],
};

describe('numeração das páginas', () => {
  it('apr-20: quatro páginas, capa sem número, rodapé com cliente e data', () => {
    const c = byId('apr-20');
    const tipos = c.entrada.paginas as PresentationPageType[];
    const rod = pageFooters(tipos, { cliente: c.entrada.cliente, data: c.entrada.data });
    expect(rod[0]).toEqual({ numero: null, esquerda: '' });
    const esperado = (c.saida.paginas as { rodape: string[]; esquerda: string }[]).map((p) => ({
      // O primeiro texto é o rodapé; o segundo, quando existe, era o carimbo (ver EXCECOES).
      numero: p.rodape[0],
      esquerda: p.esquerda,
    }));
    expect(rod.slice(1)).toEqual(esperado);
    expect(EXCECOES['apr-20']).toHaveLength(1);
    expect(c.saida.folhaDoCarimbo).toBe('03 / 04');
  });

  it('apr-21: onze páginas, sem cliente nem data', () => {
    const c = byId('apr-21');
    const n = c.entrada.paginas as number;
    const tipos: PresentationPageType[] = ['capa', ...Array.from({ length: n - 1 }, () => 'notas' as const)];
    const rod = pageFooters(tipos, { cliente: c.entrada.cliente, data: c.entrada.data });
    expect([rod[n - 1].numero]).toEqual(c.saida.ultimaPagina);
    expect(rod.every((r) => r.esquerda === '')).toBe(c.saida.esquerdaVazia);
  });

  it('a capa sozinha é o caso de uma página (documento novo da 6b)', () => {
    expect(pageFooters(['capa'], { cliente: 'Cliente Teste', data: '' })).toEqual([{ numero: null, esquerda: '' }]);
    expect(pageNavLabel(0, 1)).toBe('Página 01 de 01');
    expect(pageNavLabel(2, 11)).toBe('Página 03 de 11');
  });
});

describe('importação de imagem', () => {
  for (const id of ['apr-52', 'apr-53', 'apr-54']) {
    it(`${id}: ${byId(id).descricao ?? ''}`, () => {
      const { entrada, saida } = byId(id);
      // Os casos não informam o tamanho do arquivo: todos estão bem abaixo de 8 MB.
      const arquivo = { nome: entrada.nome, tipo: entrada.tipo, bytes: 1048576 };
      const aviso = imageWarning(arquivo);
      expect(aviso).toBe(saida.aviso);
      if (aviso) {
        expect(saida.imagemGuardadaPx).toBeNull();
        expect(saida.larguraOriginalGravada).toBeNull();
        return;
      }
      const r = imageReduction({ larguraPx: entrada.larguraPx, alturaPx: entrada.alturaPx, tipo: entrada.tipo, bytes: arquivo.bytes });
      expect([r.larguraPx, r.alturaPx]).toEqual(saida.imagemGuardadaPx);
      // A largura original é a do arquivo escolhido, antes da redução.
      expect(entrada.larguraPx).toBe(saida.larguraOriginalGravada);
    });
  }

  it('aceita JPG e WebP pela extensão quando o navegador não informa o tipo, e recusa acima de 40 MB', () => {
    expect(imageWarning({ nome: 'foto.JPG', tipo: '', bytes: 10 })).toBeNull();
    expect(imageWarning({ nome: 'foto.webp', tipo: '', bytes: 10 })).toBeNull();
    expect(imageWarning({ nome: 'arquivo.pdf', tipo: 'application/pdf', bytes: 10 })).toBe(
      '“arquivo.pdf” não é um formato compatível. Use PNG, JPG ou WebP.',
    );
    expect(imageWarning({ nome: 'grande.png', tipo: 'image/png', bytes: 41 * 1048576 })).toBe(
      '“grande.png” tem 41 MB. O limite é 40 MB. Exporte a imagem em resolução menor.',
    );
    expect(imageWarning({ nome: 'limite.png', tipo: 'image/png', bytes: 40 * 1048576 })).toBeNull();
  });

  it('reduz pelo lado maior; PNG continua PNG e o resto vira JPEG; acima de 8 MB recodifica', () => {
    expect(imageReduction({ larguraPx: 2500, alturaPx: 6000, tipo: 'image/jpeg', bytes: 1 })).toEqual({
      recodificar: true, larguraPx: 1667, alturaPx: 4000, tipo: 'image/jpeg',
    });
    expect(imageReduction({ larguraPx: 5000, alturaPx: 2500, tipo: 'image/webp', bytes: 1 }).tipo).toBe('image/jpeg');
    expect(imageReduction({ larguraPx: 5000, alturaPx: 2500, tipo: 'image/png', bytes: 1 }).tipo).toBe('image/png');
    expect(imageReduction({ larguraPx: 3000, alturaPx: 2000, tipo: 'image/png', bytes: 9 * 1048576 })).toEqual({
      recodificar: true, larguraPx: 3000, alturaPx: 2000, tipo: 'image/png',
    });
    expect(imageReduction({ larguraPx: 4000, alturaPx: 4000, tipo: 'image/webp', bytes: 8 * 1048576 })).toEqual({
      recodificar: false, larguraPx: 4000, alturaPx: 4000, tipo: 'image/webp',
    });
  });
});

describe('zoom de ajuste em A4', () => {
  for (const id of ['apr-57', 'apr-58', 'apr-60']) {
    it(`${id}: janela de ${byId(id).entrada.larguraDaJanela} px`, () => {
      const { entrada, saida } = byId(id);
      expect(entrada.formato).toBe('a4');
      // A largura útil depende do painel de cada tela; o caso grava a que o arquivo mediu.
      const z = fitZoom(saida.larguraUtilDoMain);
      expect(zoomCss(z)).toBe(saida.zoomCss);
      expect(zoomLabel(z)).toBe(saida.rotulo);
    });
  }

  it('fica entre 25% e 140%, e os botões andam de 10 em 10 entre 25% e 200%', () => {
    expect(fitZoom(100)).toBe(0.25);
    expect(fitZoom(5000)).toBe(1.4);
    expect(zoomIn(fitZoom(1080))).toBe(1);
    expect(zoomOut(fitZoom(1080))).toBe(0.8);
    expect(zoomIn(1.95)).toBe(2);
    expect(zoomOut(0.3)).toBe(0.25);
  });
});
