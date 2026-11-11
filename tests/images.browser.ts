import { exportImage, loadImage, renderImage } from '../src/services/images';
import { defaultSettings, imagePlacement } from '../src/services/imageLayout';
import type { ImageSettings, ImageFormat } from '../src/services/imageLayout';

declare global { interface Window { __imageTestResults?: { passed: string[]; failed: string[]; done: boolean } } }
const results = { passed: [] as string[], failed: [] as string[], done: false };
window.__imageTestResults = results;
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
async function test(name: string, run: () => Promise<void> | void) {
  try { await run(); results.passed.push(name); } catch (error) { results.failed.push(name + ': ' + String(error)); }
}
const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!)));
async function fixture(width: number, height: number, transparent = false) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  if (!transparent) { ctx.fillStyle = '#3366cc'; ctx.fillRect(0,0,width,height); }
  ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(width / 2,height / 2,Math.min(width,height) / 8,0,Math.PI * 2); ctx.fill();
  const file = new File([await toBlob(canvas)], 'fixture.png', {type:'image/png'});
  canvas.width = 1; canvas.height = 1;
  return { file, image: await loadImage(file) };
}
const pixel = (ctx: CanvasRenderingContext2D, x: number, y: number) => ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data;
const portrait = await fixture(360,640);
const landscape = await fixture(640,360);

for (const [source,label,width,height] of [[portrait,'vertical → 16:9',1920,1080],[landscape,'horizontal → 4:5',1080,1350]] as const) {
  for (const mode of ['contain','cover','adapt'] as const) {
    for (const format of ['image/png','image/jpeg','image/webp'] as ImageFormat[]) {
      await test(label + ' / ' + mode + ' / ' + format, async () => {
        const settings: ImageSettings = { ...defaultSettings(width,height), mode, format, background:'color', color:'#00ff00' };
        const blob = await exportImage(source.image, settings);
        assert(blob.type === format,'MIME de saída');
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        try {
          assert(bitmap.width === width && bitmap.height === height,'Dimensões de saída');
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap,0,0);
          const center = pixel(ctx,width/2,height/2);
          assert(center[0] > 220 && center[1] < 40 && center[2] < 40,'Centro da imagem preservado');
          const corner = pixel(ctx,0,0);
          if (mode === 'contain') {
            if (format === 'image/jpeg') assert(corner[0] > 240 && corner[1] > 240 && corner[2] > 240,'Margem JPEG branca');
            else assert(corner[3] === 0,'Margem transparente');
          } else if (mode === 'adapt') assert(corner[1] > 220 && corner[0] < 40,'Fundo personalizado verde');
          else assert(corner[3] === 255 && corner[2] > 130,'Quadro preenchido');
          // A round source marker must remain round in the encoded result.
          const red = (x: number,y: number) => { const p=pixel(ctx,x,y); return p[0] > 180 && p[1] < 70 && p[2] < 90; };
          let radiusX = 0, radiusY = 0;
          while (width/2+radiusX < width && red(width/2+radiusX,height/2)) radiusX++;
          while (height/2+radiusY < height && red(width/2,height/2+radiusY)) radiusY++;
          assert(Math.abs(radiusX-radiusY) <= 3,'Círculo não pode virar elipse');
        } finally { bitmap.close(); canvas.width=1; canvas.height=1; }
      });
    }
  }
  await test(label + ' / fundo desfocado e prévia reduzida', async () => {
    const settings: ImageSettings = { ...defaultSettings(width,height), mode:'adapt', background:'blur' };
    const canvas = document.createElement('canvas');
    renderImage(canvas, source.image, settings, true);
    assert(Math.max(canvas.width,canvas.height) <= 1000,'Limite da prévia');
    const corner = pixel(canvas.getContext('2d')!,5,5);
    assert(corner[3] === 255 && corner[2] > corner[0],'Fundo vem da própria imagem');
    const blob = await exportImage(source.image,settings);
    assert(blob.size > 0,'Exportação com desfoque');
    canvas.width=1; canvas.height=1;
  });
}
const transparent = await fixture(360,640,true);
await test('transparência real da fonte em PNG, JPEG e WebP', async () => {
  for (const format of ['image/png','image/jpeg','image/webp'] as ImageFormat[]) {
    const blob = await exportImage(transparent.image,{...defaultSettings(360,640),format});
    const bitmap = await createImageBitmap(blob);
    const canvas=document.createElement('canvas');canvas.width=360;canvas.height=640;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);
    const p=pixel(ctx,10,10);
    assert(format === 'image/jpeg' ? p[0]>240 && p[1]>240 && p[2]>240 : p[3]===0,'Transparência de '+format);
    bitmap.close();canvas.width=1;canvas.height=1;
  }
});
await test('posição do recorte altera o conteúdo visível', async () => {
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=300;
  const ctx=canvas.getContext('2d')!;
  ['#ff0000','#00ff00','#0000ff'].forEach((color,i)=>{ctx.fillStyle=color;ctx.fillRect(i*300,0,300,300);});
  const file=new File([await toBlob(canvas)],'crop.png',{type:'image/png'});
  const image=await loadImage(file);
  for(const [position,channel] of [[0,0],[50,1],[100,2]]) {
    renderImage(canvas,image,{...defaultSettings(300,300),mode:'cover',positionX:position});
    assert(pixel(ctx,150,150)[channel] > 240,'Posição '+position);
  }
  image.src='';canvas.width=1;canvas.height=1;
});
await test('arquivos inválidos e resolução inválida são rejeitados', async () => {
  for(const file of [new File(['text'],'file.txt',{type:'text/plain'}),new File(['bad'],'bad.png',{type:'image/png'})]){
    let failed=false;try{await loadImage(file);}catch{failed=true;}assert(failed,'Arquivo deve ser rejeitado');
  }
  let failed=false;try{await exportImage(portrait.image,{...defaultSettings(1920,1080),width:9000});}catch{failed=true;}
  assert(failed,'Resolução deve ser rejeitada');
});
await test('qualidade altera a compressão JPEG e WebP', async () => {
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d')!, pixels=ctx.createImageData(256,256);
  for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=(i*17)%251;pixels.data[i+1]=(i*31)%253;pixels.data[i+2]=(i*53)%255;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);
  const image=await loadImage(new File([await toBlob(canvas)],'quality.png',{type:'image/png'}));
  for(const format of ['image/jpeg','image/webp'] as ImageFormat[]){
    const config={...defaultSettings(256,256),format};
    const low=await exportImage(image,{...config,quality:.1});
    const high=await exportImage(image,{...config,quality:1});
    assert(high.size!==low.size,'Qualidade altera a compressão em '+format);
  }
  image.src='';canvas.width=1;canvas.height=1;
});
await test('interface: upload, presets, prévia, modo, comparação e restauração', async () => {
  const iframe=document.createElement('iframe');
  iframe.style.cssText='width:1280px;height:900px;border:0';iframe.src='/#/imagens';document.body.append(iframe);
  const wait=async(check:()=>unknown)=>{for(let i=0;i<150;i++){if(check())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Interface não atualizou: '+check.toString()+' / '+iframe.contentDocument?.body.textContent?.slice(-2200));};
  await wait(()=>iframe.contentDocument?.querySelector('input[type=file]'));
  const doc=iframe.contentDocument!, win=iframe.contentWindow!;
  const find=(text:string)=>Array.from(doc.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent?.includes(text))!;
  const input=doc.querySelector<HTMLInputElement>('input[type=file]')!;
  const transfer=new DataTransfer();transfer.items.add(portrait.file);input.files=transfer.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>doc.querySelector('.final-preview img'));
  const numberInputs=doc.querySelectorAll<HTMLInputElement>('input[type=number]');
  const setNumber=(input:HTMLInputElement,value:string)=>{
    Object.getOwnPropertyDescriptor((win as unknown as {HTMLInputElement:typeof HTMLInputElement}).HTMLInputElement.prototype,'value')!.set!.call(input,value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
  };
  setNumber(numberInputs[0],'720');
  await wait(()=>numberInputs[1].value==='1280');
  find('Proporção bloqueada').click();
  await wait(()=>find('Proporção desbloqueada'));
  setNumber(numberInputs[0],'1920');setNumber(numberInputs[1],'1080');
  await wait(()=>doc.querySelector('.image-dimensions-summary')?.textContent?.includes('1920 × 1080'));
  await wait(()=>{const current=doc.querySelector<HTMLImageElement>('.final-preview img');return current?.complete && Math.abs(current.naturalWidth/current.naturalHeight-16/9)<.01;});
  find('Restaurar original').click();
  await wait(()=>doc.querySelector('.image-dimensions-summary')?.textContent?.includes('360 × 640') && (doc.querySelector('select') as HTMLSelectElement).value==='original');
  const selectors=doc.querySelectorAll('select');
  const preset=selectors[0];
  preset.value='wide';preset.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>doc.querySelector('.image-dimensions-summary')?.textContent?.includes('1920 × 1080'));
  await wait(()=>doc.querySelector('.final-preview img'));
  await wait(()=>{const current=doc.querySelector<HTMLImageElement>('.final-preview img');return current?.complete && current.naturalWidth>0 && Math.abs(current.naturalWidth/current.naturalHeight-16/9)<.01;});
  const img=doc.querySelector<HTMLImageElement>('.final-preview img')!;
  assert(Math.abs(img.naturalWidth/img.naturalHeight-16/9)<.01,'Prévia em 16:9');
  find('Preencher').click();
  await wait(()=>doc.querySelectorAll('.crop-controls input').length===2);
  find('Adaptar').click();
  await wait(()=>doc.querySelector('.color-field'));
  find('Original').click();
  await wait(()=>doc.querySelector('.preview-tabs button[aria-pressed=true]')?.textContent==='Original');
  find('Restaurar original').click();
  await wait(()=>doc.querySelector('.image-dimensions-summary')?.textContent?.includes('360 × 640') && (doc.querySelector('select') as HTMLSelectElement).value==='original');
  await wait(()=>doc.querySelector('.final-preview img'));
  // Also check mobile layout, including the expanded controls.
  iframe.style.width='390px';win.dispatchEvent(new Event('resize'));
  await new Promise(r=>setTimeout(r,100));
  assert(doc.documentElement.scrollWidth <= 390,'Sem transbordamento horizontal no celular');
  find('Adaptar').click();await wait(()=>doc.querySelector('.color-field'));
  assert(doc.documentElement.scrollWidth <= 390,'Controles de fundo responsivos');
  const p=imagePlacement(360,640,1920,1080,'contain');assert(p.width<p.height,'Fonte segue vertical');
  iframe.remove();
});
portrait.image.src='';landscape.image.src='';transparent.image.src='';
results.done=true;
document.querySelector('#results')!.textContent=JSON.stringify(results,null,2);
