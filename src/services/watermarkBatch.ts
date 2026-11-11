import { loadImage } from './images.ts';
import { watermarkBlob } from './watermark.ts';
import type { WatermarkSettings } from './watermark.ts';

export const MAX_BATCH_FILES = 10;
export function validateBatch(files: File[]) {
  if (!files.length || files.length > MAX_BATCH_FILES) throw new Error('Selecione de 1 a 10 imagens para o lote.');
  if (files.some(file => !['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'].includes(file.type))) throw new Error('O lote aceita apenas PNG, JPEG, WebP, GIF, AVIF e BMP.');
  if (files.some(file => file.size > 25 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) throw new Error('Limite de 25 MB por imagem e 100 MB por lote.');
}
export async function watermarkBatch(files: File[], logo: HTMLImageElement | null, settings: WatermarkSettings, onProgress: (done: number, total: number, name: string) => void, signal: AbortSignal) {
  validateBatch(files);
  const entries: Record<string, Uint8Array> = {};
  let bytes = 0;
  for (let index = 0; index < files.length; index++) {
    signal.throwIfAborted();
    onProgress(index, files.length, files[index].name);
    const image = await loadImage(files[index]);
    try {
      signal.throwIfAborted();
      const blob = await watermarkBlob(image, logo, settings);
      signal.throwIfAborted();
      bytes += blob.size;
      if (bytes > 64 * 1024 * 1024) throw new Error('A saída do lote excedeu 64 MB. Processe menos imagens por vez ou escolha JPEG/WebP.');
      const name = files[index].name.replace(/\.[^.]+$/, '').replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 90) || 'imagem';
      const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[settings.format];
      entries[String(index + 1).padStart(2, '0') + '-' + name + '.' + extension] = new Uint8Array(await blob.arrayBuffer());
      onProgress(index + 1, files.length, files[index].name);
    } finally { image.src = ''; }
    // Give input/paint a turn between images; decoding is strictly sequential.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  signal.throwIfAborted();
  const { zip } = await import('fflate');
  const archive = await new Promise<Uint8Array<ArrayBuffer>>((resolve, reject) => zip(entries, { level: 0 }, (error, result) => error ? reject(error) : resolve(new Uint8Array(result))));
  signal.throwIfAborted();
  return new Blob([archive], { type: 'application/zip' });
}
