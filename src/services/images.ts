import { boundedSize, imagePlacement, MAX_INPUT_PIXELS, PREVIEW_SIDE, validateDimensions } from './imageLayout.ts';
import type { ImageSettings } from './imageLayout.ts';

export async function loadImage(file: File): Promise<HTMLImageElement> {
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'].includes(file.type)) throw new Error('Escolha uma imagem PNG, JPEG, WebP, GIF, AVIF ou BMP.');
  if (file.size > 25 * 1024 * 1024) throw new Error('O limite por imagem é 25 MB.');
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_INPUT_PIXELS) throw new Error('A imagem deve ter até 40 megapixels.');
    return image;
  } catch (error) {
    image.src = '';
    throw new Error(error instanceof Error && error.message.includes('megapixels') ? error.message : 'Não foi possível abrir esta imagem. O arquivo pode estar danificado ou o formato não é suportado.');
  } finally { URL.revokeObjectURL(url); }
}

/** Preview and export share composition; only the canvas resolution changes. */
export function renderImage(canvas: HTMLCanvasElement, image: HTMLImageElement, settings: ImageSettings, preview = false) {
  validateDimensions(settings.width, settings.height);
  const size = preview ? boundedSize(settings.width, settings.height, PREVIEW_SIDE) : settings;
  canvas.width = size.width; canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível criar a imagem. Reduza as dimensões e tente novamente.');
  // Check silent allocation failures on browsers with lower canvas limits.
  ctx.fillStyle = '#010203'; ctx.fillRect(0, 0, 1, 1);
  if (ctx.getImageData(0, 0, 1, 1).data[3] !== 255) throw new Error('A resolução excede o limite deste navegador. Reduza as dimensões.');
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (settings.format === 'image/jpeg' || settings.mode === 'adapt') {
    ctx.fillStyle = settings.mode === 'adapt' ? settings.color : '#ffffff';
    ctx.fillRect(0, 0, size.width, size.height);
  }
  if (settings.mode === 'adapt' && settings.background === 'blur') {
    // Blur a small scratch canvas rather than another full-resolution image.
    const backdrop = document.createElement('canvas');
    try {
      const small = boundedSize(size.width, size.height, 512);
      backdrop.width = small.width; backdrop.height = small.height;
      const bg = backdrop.getContext('2d');
      if (!bg || !('filter' in bg)) throw new Error('Fundo desfocado indisponível neste navegador. Escolha uma cor sólida.');
      const margin = Math.max(4, Math.min(small.width, small.height) * .08);
      const placement = imagePlacement(image.naturalWidth, image.naturalHeight, small.width + margin * 2, small.height + margin * 2, 'cover');
      bg.filter = 'blur(' + Math.max(2, Math.min(small.width, small.height) * .035) + 'px)';
      bg.drawImage(image, placement.x - margin, placement.y - margin, placement.width, placement.height);
      ctx.drawImage(backdrop, 0, 0, size.width, size.height);
    } finally { backdrop.width = 1; backdrop.height = 1; }
  }
  const placement = imagePlacement(image.naturalWidth, image.naturalHeight, size.width, size.height, settings.mode, settings.mode === 'cover' ? settings.positionX : 50, settings.mode === 'cover' ? settings.positionY : 50);
  ctx.drawImage(image, placement.x, placement.y, placement.width, placement.height);
}

export async function exportImage(image: HTMLImageElement, settings: ImageSettings, preview = false): Promise<Blob> {
  const canvas = document.createElement('canvas');
  try {
    renderImage(canvas, image, settings, preview);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, settings.format, settings.quality));
    if (!blob || blob.type !== settings.format) throw new Error('Não foi possível exportar neste formato. Reduza a resolução ou escolha outro formato.');
    return blob;
  } finally { canvas.width = 1; canvas.height = 1; }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
