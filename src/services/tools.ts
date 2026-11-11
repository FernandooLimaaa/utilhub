export function textStats(text: string) {
  return { words: text.trim() ? text.trim().split(/\s+/u).length : 0, characters: Array.from(text).length, lines: text ? text.split('\n').length : 0 };
}
export const units = { un: { label: 'Unidade', family: 'count', factor: 1, base: 'un' }, g: { label: 'Grama (g)', family: 'mass', factor: .001, base: 'kg' }, kg: { label: 'Quilograma (kg)', family: 'mass', factor: 1, base: 'kg' }, ml: { label: 'Mililitro (ml)', family: 'volume', factor: .001, base: 'L' }, L: { label: 'Litro (L)', family: 'volume', factor: 1, base: 'L' } } as const;
export type Unit = keyof typeof units;
export type Product = { id: string; name: string; price: number; quantity: number; unit: Unit };
export const unitPrice = (p: Pick<Product, 'price' | 'quantity' | 'unit'>) => p.price / (p.quantity * units[p.unit].factor);
export function randomIndex(max: number) {
  const ceiling = Math.floor(4294967296 / max) * max;
  const data = new Uint32Array(1);
  do { crypto.getRandomValues(data); } while (data[0] >= ceiling);
  return data[0] % max;
}
export function generatePassword(length: number, numbers: boolean, symbols: boolean) {
  if (!Number.isInteger(length) || length < 8 || length > 64) throw new Error('Tamanho inválido.');
  const groups = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...(numbers ? ['0123456789'] : []), ...(symbols ? ['!@#$%&*+-=?_'] : [])];
  const alphabet = groups.join('');
  // Rejection sampling: every accepted password includes all selected groups.
  let result: string;
  do { result = Array.from({ length }, () => alphabet[randomIndex(alphabet.length)]).join(''); }
  while (!groups.every(group => Array.from(result).some(char => group.includes(char))));
  return result;
}
export const passwordEntropy = (length: number, numbers: boolean, symbols: boolean) => length * Math.log2(52 + (numbers ? 10 : 0) + (symbols ? 12 : 0));
