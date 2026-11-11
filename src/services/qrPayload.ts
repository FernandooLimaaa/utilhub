export type QrKind = 'text' | 'url' | 'wifi' | 'contact';
export type QrContent = { kind: QrKind; text: string; url: string; ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean; name: string; phone: string; email: string; organization: string };
const wifiEscape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1');
const vcardEscape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([;,])/g, '\\$1');
export const emptyQr: QrContent = { kind: 'url', text: '', url: '', ssid: '', password: '', security: 'WPA', hidden: false, name: '', phone: '', email: '', organization: '' };
export function qrPayload(content: QrContent) {
  let result: string;
  if (content.kind === 'text') {
    if (!content.text.trim()) throw new Error('Digite o texto do QR Code.');
    result = content.text;
  } else if (content.kind === 'url') {
    let url: URL;
    try { url = new URL(content.url.trim()); } catch { throw new Error('Digite um endereço completo, como https://exemplo.com.'); }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('Use um endereço HTTP ou HTTPS sem credenciais.');
    result = url.href;
  } else if (content.kind === 'wifi') {
    if (!content.ssid.trim() || /[\r\n]/.test(content.ssid + content.password)) throw new Error('Informe o nome da rede, sem quebras de linha.');
    if (content.security !== 'nopass' && !content.password) throw new Error('Informe a senha da rede ou escolha rede aberta.');
    result = 'WIFI:T:' + content.security + ';S:' + wifiEscape(content.ssid) + ';' + (content.security !== 'nopass' ? 'P:' + wifiEscape(content.password) + ';' : '') + 'H:' + content.hidden + ';;';
  } else {
    if (!content.name.trim()) throw new Error('Informe o nome do contato.');
    if (content.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.email)) throw new Error('Informe um e-mail válido ou deixe o campo vazio.');
    result = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vcardEscape(content.name.trim()), 'N:;' + vcardEscape(content.name.trim()) + ';;;', ...(content.organization ? ['ORG:' + vcardEscape(content.organization)] : []), ...(content.phone ? ['TEL:' + vcardEscape(content.phone)] : []), ...(content.email ? ['EMAIL:' + vcardEscape(content.email)] : []), 'END:VCARD'].join('\r\n');
  }
  if (new TextEncoder().encode(result).length > 1800) throw new Error('Conteúdo muito longo. Reduza para até 1.800 bytes.');
  return result;
}
