import { IMAGE_JPEG_QUALITY, imageReduction, imageType } from '../shared/presentation-calc';

// Redução da imagem no navegador antes do envio (Fase 6b, E8). As medidas e o tipo vêm de `imageReduction`
// (E2): acima de 4000 px no lado maior, ou acima de 8 MB, a imagem é redesenhada; PNG continua PNG e o resto
// vira JPEG. Ler e redesenhar ficam num `ImageCodec`, para os testes rodarem sem navegador.

export interface ImageCodec {
  /** Largura e altura em px da imagem original. */
  measure(file: Blob): Promise<{ width: number; height: number }>;
  /** Redesenha a imagem nas medidas pedidas e devolve o arquivo novo. */
  encode(file: Blob, width: number, height: number, type: string, quality: number): Promise<Blob>;
}

export interface PreparedImage {
  /** O que vai para o Drive: o arquivo original ou o redesenhado. */
  blob: Blob;
  name: string;
  type: string;
  width: number;
  height: number;
  reduced: boolean;
}

/** Nome do arquivo enviado: se virou JPEG, a extensão acompanha. */
export function preparedName(name: string, type: string): string {
  if (type !== 'image/jpeg') return name;
  const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
  return /\.jpe?g$/i.test(name) ? name : `${base}.jpg`;
}

export async function prepareImage(file: File, codec: ImageCodec = browserCodec): Promise<PreparedImage> {
  const type = imageType(file.name, file.type);
  const { width, height } = await codec.measure(file);
  const plan = imageReduction({ larguraPx: width, alturaPx: height, tipo: type, bytes: file.size });
  if (!plan.recodificar) return { blob: file, name: file.name, type, width, height, reduced: false };
  const blob = await codec.encode(file, plan.larguraPx, plan.alturaPx, plan.tipo, IMAGE_JPEG_QUALITY);
  return {
    blob,
    name: preparedName(file.name, plan.tipo),
    type: plan.tipo,
    width: plan.larguraPx,
    height: plan.alturaPx,
    reduced: true,
  };
}

/** Codec do navegador: `createImageBitmap` para ler e um canvas para redesenhar. */
export const browserCodec: ImageCodec = {
  async measure(file) {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  },
  async encode(file, width, height, type, quality) {
    const bmp = await createImageBitmap(file, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close();
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas'))), type, type === 'image/jpeg' ? quality : undefined),
    );
  },
};
