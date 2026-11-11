import { boundedSize, defaultSettings } from './imageLayout.ts';
import type { ImageFormat } from './imageLayout.ts';
import { renderImage } from './images.ts';

export type WatermarkSettings = {
  kind: 'text' | 'logo'; text: string; color: string; font: 'sans-serif' | 'serif' | 'monospace';
  size: number; opacity: number; rotation: number; x: number; y: number; repeat: boolean;
  format: ImageFormat; quality: number;
};
export const defaultWatermark: WatermarkSettings = { kind: 'text', text: '© Minha marca', color: '#ffffff', font: 'sans-serif', size: 12, opacity: .65, rotation: -25, x: 50, y: 50, repeat: false, format: 'image/png', quality: .9 };

export function watermarkLayout(ctx: CanvasRenderingContext2D, frameWidth: number, frameHeight: number, logo: HTMLImageElement | null, settings: WatermarkSettings) {
  if (settings.kind === 'logo' && !logo) throw new Error('Selecione uma imagem para o logo.');
  if (settings.kind === 'text' && !settings.text.trim()) throw new Error('Digite o texto da marca-d’água.');
  let width: number, height: number;
  if (settings.kind === 'text') {
    let fontSize = Math.min(frameWidth, frameHeight) * settings.size / 100;
    ctx.font = '600 ' + fontSize + 'px ' + settings.font;
    const measured = ctx.measureText(settings.text).width;
    if (measured > frameWidth * .85) fontSize *= frameWidth * .85 / measured;
    ctx.font = '600 ' + fontSize + 'px ' + settings.font;
    width = ctx.measureText(settings.text).width; height = fontSize * 1.3;
  } else {
    width = frameWidth * settings.size / 100;
    height = width * logo!.naturalHeight / logo!.naturalWidth;
    if (height > frameHeight * .6) { width *= frameHeight * .6 / height; height = frameHeight * .6; }
  }
  const angle = settings.rotation * Math.PI / 180;
  const boxWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
  const boxHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
  const marginX = Math.min(frameWidth / 2, boxWidth / 2 + frameWidth * .02);
  const marginY = Math.min(frameHeight / 2, boxHeight / 2 + frameHeight * .02);
  return { width, height, boxWidth, boxHeight, angle, marginX, marginY };
}

export function renderWatermark(canvas: HTMLCanvasElement, image: HTMLImageElement, logo: HTMLImageElement | null, settings: WatermarkSettings, preview = false) {
  const dimensions = boundedSize(image.naturalWidth, image.naturalHeight);
  renderImage(canvas, image, { ...defaultSettings(dimensions.width, dimensions.height), format: settings.format }, preview);
  const ctx = canvas.getContext('2d')!;
  const { width, height, boxWidth, boxHeight, angle, marginX, marginY } = watermarkLayout(ctx, canvas.width, canvas.height, logo, settings);
  function stamp(x: number, y: number) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = settings.opacity;
    if (settings.kind === 'text') {
      ctx.fillStyle = settings.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00000080'; ctx.shadowBlur = Math.min(canvas.width, canvas.height) * .002;
      ctx.fillText(settings.text, 0, 0);
    } else ctx.drawImage(logo!, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
  if (settings.repeat) {
    // At most roughly 15 × 15 stamps, even with small text on a large source.
    const stepX = Math.max(boxWidth * 1.4, canvas.width / 14);
    const stepY = Math.max(boxHeight * 1.8, canvas.height / 14);
    for (let row = -1; row <= Math.ceil(canvas.height / stepY); row++) {
      for (let col = -1; col <= Math.ceil(canvas.width / stepX); col++) stamp(col * stepX + (row % 2 ? stepX / 2 : 0), row * stepY);
    }
  } else {
    stamp(marginX + (canvas.width - marginX * 2) * settings.x / 100, marginY + (canvas.height - marginY * 2) * settings.y / 100);
  }
}

export async function watermarkBlob(image: HTMLImageElement, logo: HTMLImageElement | null, settings: WatermarkSettings, preview = false) {
  const canvas = document.createElement('canvas');
  try {
    renderWatermark(canvas, image, logo, settings, preview);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, settings.format, settings.quality));
    if (!blob || blob.type !== settings.format) throw new Error('Exportação indisponível. Reduza a imagem ou escolha outro formato.');
    return blob;
  } finally { canvas.width = 1; canvas.height = 1; }
}
