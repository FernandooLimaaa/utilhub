import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHex, hexToRgb, hexToHsl, hslToHex, contrastRatio, makePalette, gradientCss } from '../src/services/colors.ts';
import { emptyQr, qrPayload } from '../src/services/qrPayload.ts';
import { blankResume, exampleResume, resumeDocument, resumeMarkup } from '../src/services/resume.ts';

test('ColorLab: HEX, RGB, HSL e conversões de ida e volta', () => {
  assert.equal(normalizeHex(' abc '),'#AABBCC');
  assert.deepEqual(hexToRgb('#f00'),{r:255,g:0,b:0});
  assert.deepEqual(hexToHsl('#ff0000'),{h:0,s:100,l:50});
  for(const hex of ['#FF0000','#00FF00','#0000FF','#FFFFFF','#000000','#B9EE60']){
    const hsl=hexToHsl(hex); assert.equal(hslToHex(hsl.h,hsl.s,hsl.l),hex);
  }
  for(const invalid of ['', '#12345', '#GG0000', 'red', '#000000ff'])assert.throws(()=>normalizeHex(invalid));
});
test('ColorLab: contraste conhecido, simetria, paletas e ordenação de stops', () => {
  assert.equal(contrastRatio('#000000','#FFFFFF'),21);
  assert.equal(contrastRatio('#AAAAAA','#AAAAAA'),1);
  assert.equal(contrastRatio('#B9EE60','#202B25'),contrastRatio('#202B25','#B9EE60'));
  for(const harmony of ['analogous','complementary','mono'] as const){
    const palette=makePalette('#B9EE60',harmony);assert.equal(palette.length,5);palette.forEach(color=>assert.match(color,/^#[A-F0-9]{6}$/));
  }
  assert.equal(gradientCss([{id:'a',color:'#fff',position:100},{id:'b',color:'#000',position:0}],'linear',90),'linear-gradient(90deg, #000000 0%, #FFFFFF 100%)');
});
test('QR: URL segura, conteúdo Unicode e limite em bytes', () => {
  assert.equal(qrPayload({...emptyQr,url:'https://example.com/a?q=olá'}),'https://example.com/a?q=ol%C3%A1');
  assert.equal(qrPayload({...emptyQr,kind:'text',text:'Olá 🙂'}),'Olá 🙂');
  for(const url of ['javascript:alert(1)','file:///etc/passwd','https://user:pass@example.com','sem-protocolo'])assert.throws(()=>qrPayload({...emptyQr,url}));
  assert.throws(()=>qrPayload({...emptyQr,kind:'text',text:'🙂'.repeat(451)}));
});
test('QR: Wi-Fi com caracteres especiais, rede aberta e vCard sem injeção', () => {
  const wifi=qrPayload({...emptyQr,kind:'wifi',ssid:'Rede;Casa',password:'a:b\\c'});
  assert.ok(wifi.includes('S:Rede\\;Casa;'));assert.ok(wifi.includes('P:a\\:b\\\\c;'));
  assert.ok(!qrPayload({...emptyQr,kind:'wifi',ssid:'Aberta',security:'nopass',password:'não incluir'}).includes('P:'));
  assert.throws(()=>qrPayload({...emptyQr,kind:'wifi',ssid:'Casa',password:''}));
  const card=qrPayload({...emptyQr,kind:'contact',name:'Ana;Silva\nEND:VCARD',email:'ana@example.com'});
  assert.ok(card.includes('Ana\\;Silva\\nEND:VCARD'));assert.equal(card.split('\r\nEND:VCARD').length,2);
});
test('Currículo: conteúdo escapado, seções opcionais e isolamento de impressão', () => {
  const html=resumeDocument({...exampleResume,name:'Ana <script>alert(1)</script>',summary:'A & B'},'modern','#000000;}</style><script>');
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('A &amp; B'));
  assert.ok(html.includes('@page{size:A4'));assert.ok(!html.includes('sidebar'));
  assert.ok(!resumeMarkup(blankResume).includes('Experiência profissional'));
  assert.ok(resumeDocument(exampleResume,'classic','#254B75').includes('Georgia,serif'));
});
