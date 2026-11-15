// Fase 6d, E1: conferência de pixels da moldura v1 (M7, parte de pixels).
// Lê os dois PNG de public/molduras/ e confere tamanho, dpi gravado, modo de cor
// e a cor nas posições da moldura (revisao-fase6b/molduras.md, seção 3), com
// tolerância de 1 px na posição.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

interface Png {
  width: number;
  height: number;
  colorType: number;
  bitDepth: number;
  interlace: number;
  chunks: string[];
  phys: { x: number; y: number; unit: number } | null;
  channels: number;
  rows: Uint8Array[];
}

function readPng(file: string): Png {
  const buf = readFileSync(file);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  sig.forEach((b, i) => {
    if (buf[i] !== b) throw new Error(`${file} não é PNG`);
  });
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let phys: Png['phys'] = null;
  const chunks: string[] = [];
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    chunks.push(type);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'pHYs') {
      phys = { x: data.readUInt32BE(0), y: data.readUInt32BE(4), unit: data[8] };
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (bitDepth !== 8 || channels === 0 || interlace !== 0) {
    return { width, height, colorType, bitDepth, interlace, chunks, phys, channels, rows: [] };
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rows: Uint8Array[] = [];
  let prev = new Uint8Array(stride);
  let o = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[o++];
    const line = new Uint8Array(raw.subarray(o, o + stride));
    o += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let add = 0;
      if (filter === 1) add = a;
      else if (filter === 2) add = b;
      else if (filter === 3) add = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = (line[x] + add) & 255;
    }
    rows.push(line);
    prev = line;
  }
  return { width, height, colorType, bitDepth, interlace, chunks, phys, channels, rows };
}

function hexAt(png: Png, x: number, y: number): string {
  const i = x * png.channels;
  const r = png.rows[y];
  return '#' + [r[i], r[i + 1], r[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Procura a cor esperada num quadrado de ±1 px em volta da posição (em mm).
function colorNear(png: Png, xmm: number, ymm: number, hex: string): string {
  const k = png.width / 297;
  const cx = Math.round(xmm * k);
  const cy = Math.round(ymm * k);
  const seen: string[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const c = hexAt(png, cx + dx, cy + dy);
      if (c === hex) return c;
      seen.push(c);
    }
  }
  return `${hex} não encontrada em (${xmm}; ${ymm}) mm; cores vistas: ${[...new Set(seen)].join(', ')}`;
}

const LINHO_200 = '#e5ded2';
const LINHO_400 = '#bdb09b';
const VINHO_800 = '#490b1a';
const DIVISORIAS = [80, 124, 152, 196, 240, 272];

const MOLDURAS = [
  { nome: 'A4', arquivo: 'DeCroqui-folha-modelo-A4-v1.png', largura: 3508, altura: 2480 },
  { nome: 'A3', arquivo: 'DeCroqui-folha-modelo-A3-v1.png', largura: 4961, altura: 3508 },
];

describe.each(MOLDURAS)('Moldura v1 $nome ($arquivo)', ({ arquivo, largura, altura }) => {
  const png = readPng(resolve(process.cwd(), 'public/molduras', arquivo));

  it(`tem ${largura} × ${altura} px`, () => {
    expect([png.width, png.height]).toEqual([largura, altura]);
  });

  it('grava 300 dpi no bloco pHYs (11811 px/m)', () => {
    expect(png.phys).toEqual({ x: 11811, y: 11811, unit: 1 });
  });

  it('está em modo RGB (tipo de cor 2, 8 bits, sem entrelaçamento)', () => {
    expect({ colorType: png.colorType, bitDepth: png.bitDepth, interlace: png.interlace }).toEqual({
      colorType: 2,
      bitDepth: 8,
      interlace: 0,
    });
  });

  it('não tem transparência (sem bloco tRNS e nenhum pixel com alfa abaixo de 255)', () => {
    expect(png.chunks).not.toContain('tRNS');
    let transparentes = 0;
    if (png.channels === 4) {
      for (const row of png.rows) {
        for (let i = 3; i < row.length; i += 4) if (row[i] < 255) transparentes++;
      }
    }
    expect(transparentes).toBe(0);
  });

  it('tem a faixa do topo em linho-200', () => {
    for (const x of [20, 148.5, 280]) expect(colorNear(png, x, 1.25, LINHO_200)).toBe(LINHO_200);
  });

  it('tem a faixa do rodapé em linho-200', () => {
    for (const x of [50, 100, 148.5, 220, 285]) expect(colorNear(png, x, 209, LINHO_200)).toBe(LINHO_200);
  });

  it('tem a linha vinho de 0,35 mm em y = 196', () => {
    for (const x of [5, 60, 148.5, 290]) expect(colorNear(png, x, 196.175, VINHO_800)).toBe(VINHO_800);
  });

  it('tem as 6 divisórias do rodapé em linho-400', () => {
    for (const x of DIVISORIAS) {
      for (const y of [199.5, 203.2, 207]) expect(colorNear(png, x + 0.1, y, LINHO_400)).toBe(LINHO_400);
    }
  });
});
