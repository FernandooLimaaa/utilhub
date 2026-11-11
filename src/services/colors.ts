export function normalizeHex(value: string) {
  let hex = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) hex = hex.split('').map(c => c + c).join('');
  if (!/^[\da-f]{6}$/i.test(hex)) throw new Error('Use uma cor HEX válida, como #B9EE60 ou #FFF.');
  return '#' + hex.toUpperCase();
}
export function hexToRgb(hex: string) {
  const value = normalizeHex(hex).slice(1);
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}
export function hexToHsl(hex: string) {
  const rgb = hexToRgb(hex), [r, g, b] = [rgb.r, rgb.g, rgb.b].map(n => n / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d ? d / (1 - Math.abs(2 * l - 1)) * 100 : 0, l: l * 100 };
}
export function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const values = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + values.map(n => Math.round((n + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [red, green, blue] = [r, g, b].map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return .2126 * red + .7152 * green + .0722 * blue;
}
export function contrastRatio(a: string, b: string) {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}
export function makePalette(hex: string, mode: 'analogous' | 'complementary' | 'mono') {
  const { h, s, l } = hexToHsl(hex);
  if (mode === 'mono') return [15, 30, 50, 70, 90].map(lightness => hslToHex(h, s, lightness));
  const shifts = mode === 'analogous' ? [-60, -30, 0, 30, 60] : [0, 15, 180, 195, 210];
  return shifts.map(shift => hslToHex(h + shift, Math.max(20, s), Math.min(80, Math.max(25, l))));
}
export type ColorStop = { id: string; color: string; position: number };
export function gradientCss(stops: ColorStop[], kind: 'linear' | 'radial', angle: number) {
  const colors = [...stops].sort((a, b) => a.position - b.position).map(stop => normalizeHex(stop.color) + ' ' + stop.position + '%').join(', ');
  return kind === 'linear' ? 'linear-gradient(' + angle + 'deg, ' + colors + ')' : 'radial-gradient(circle at center, ' + colors + ')';
}
export async function gradientPng(stops: ColorStop[], kind: 'linear' | 'radial', angle: number) {
  const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 900;
  try {
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas indisponível neste navegador.');
    const rad = angle * Math.PI / 180, dx = Math.sin(rad), dy = -Math.cos(rad), length = Math.abs(1600 * dx) + Math.abs(900 * dy);
    const gradient = kind === 'radial' ? ctx.createRadialGradient(800, 450, 0, 800, 450, Math.hypot(800, 450)) : ctx.createLinearGradient(800 - dx * length / 2, 450 - dy * length / 2, 800 + dx * length / 2, 450 + dy * length / 2);
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    sorted.forEach(stop => gradient.addColorStop(stop.position / 100, normalizeHex(stop.color)));
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1600, 900);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Não foi possível exportar o gradiente.');
    return blob;
  } finally { canvas.width = 1; canvas.height = 1; }
}
