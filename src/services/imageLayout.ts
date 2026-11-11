export type FitMode = 'contain' | 'cover' | 'adapt';
export type BackgroundMode = 'transparent' | 'color' | 'blur';
export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';
export type ImageSettings = {
  width: number; height: number; mode: FitMode; background: BackgroundMode;
  color: string; positionX: number; positionY: number; format: ImageFormat; quality: number;
};
// One export canvas uses at most 64 MB of raw pixel data.
export const MAX_OUTPUT_PIXELS = 16_000_000;
export const MAX_OUTPUT_SIDE = 8192;
export const MAX_INPUT_PIXELS = 40_000_000;
export const PREVIEW_SIDE = 1000;
export const presets = [
  { id: 'original', label: 'Original', width: 0, height: 0 },
  { id: 'square', label: 'Quadrado · 1:1', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Instagram vertical · 4:5', width: 1080, height: 1350 },
  { id: 'story', label: 'Stories · 9:16', width: 1080, height: 1920 },
  { id: 'wide', label: 'Widescreen · 16:9', width: 1920, height: 1080 },
  { id: 'custom', label: 'Personalizado', width: 0, height: 0 },
] as const;
export type Preset = typeof presets[number]['id'];
export function validateDimensions(width: number, height: number) {
  if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= MAX_OUTPUT_SIDE) || width * height > MAX_OUTPUT_PIXELS) {
    throw new Error('Use dimensões inteiras de 1 a 8.192 px e até 16 megapixels no total.');
  }
}
export function boundedSize(width: number, height: number, maxSide = MAX_OUTPUT_SIDE, maxPixels = MAX_OUTPUT_PIXELS) {
  const scale = Math.min(1, maxSide / Math.max(width, height), Math.sqrt(maxPixels / (width * height)));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
export function defaultSettings(width: number, height: number): ImageSettings {
  return { ...boundedSize(width, height), mode: 'contain', background: 'transparent', color: '#ffffff', positionX: 50, positionY: 50, format: 'image/png', quality: .9 };
}
/** Both axes always use the same scale, even when the frame changes ratio. */
export function imagePlacement(sourceWidth: number, sourceHeight: number, width: number, height: number, mode: FitMode, positionX = 50, positionY = 50) {
  const scale = mode === 'cover' ? Math.max(width / sourceWidth, height / sourceHeight) : Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale, drawHeight = sourceHeight * scale;
  const x = Math.max(0, Math.min(100, positionX)) / 100, y = Math.max(0, Math.min(100, positionY)) / 100;
  return { x: (width - drawWidth) * x, y: (height - drawHeight) * y, width: drawWidth, height: drawHeight };
}
