import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { renderWatermark, watermarkBlob, defaultWatermark } from '../src/services/watermark';
import { loadImage } from '../src/services/images';
import { gradientPng } from '../src/services/colors';
import { emptyQr, qrPayload } from '../src/services/qrPayload';
import { exampleResume, printResume, resumeDocument } from '../src/services/resume';

const results={passed:[] as string[],failed:[] as string[],done:false};
(window as unknown as {__imageTestResults:typeof results}).__imageTestResults=results;
function assert(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
async function test(name:string,run:()=>Promise<void>|void){try{await run();results.passed.push(name);}catch(error){results.failed.push(name+': '+String(error));}}
const blob=(canvas:HTMLCanvasElement)=>new Promise<Blob>(resolve=>canvas.toBlob(value=>resolve(value!)));
async function fixture(width:number,height:number,color:string){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,width,height);
  const file=new File([await blob(canvas)],'fixture.png',{type:'image/png'});canvas.width=1;canvas.height=1;
  return{file,image:await loadImage(file)};
}
const base=await fixture(640,360,'#0000ff'),logo=await fixture(100,50,'#ff0000');
await test('Marcas-d’água: logo proporcional, posição, opacidade e três formatos',async()=>{
  for(const format of ['image/png','image/jpeg','image/webp'] as const){
    const config={...defaultWatermark,kind:'logo' as const,size:30,rotation:0,opacity:.5,format};
    const output=await watermarkBlob(base.image,logo.image,config);
    assert(output.type===format,'Formato '+format);
    const bitmap=await createImageBitmap(output),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);
    const center=ctx.getImageData(320,180,1,1).data;
    assert(center[0]>100&&center[0]<155&&center[2]>100&&center[2]<155,'Opacidade aplicada');
    const outside=ctx.getImageData(320,240,1,1).data;
    assert(outside[2]>220&&outside[0]<30,'Logo mantém proporção 2:1');
    bitmap.close();canvas.width=1;canvas.height=1;
  }
});
await test('Marcas-d’água: texto, rotação, mosaico e validação',async()=>{
  const canvas=document.createElement('canvas');
  renderWatermark(canvas,base.image,null,{...defaultWatermark,repeat:true,opacity:1},true);
  const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;
  let changed=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>30)changed++;
  assert(changed>500,'Texto em mosaico visível');
  let failed=false;try{await watermarkBlob(base.image,null,{...defaultWatermark,kind:'logo'});}catch{failed=true;}assert(failed,'Logo ausente rejeitado');
  canvas.width=1;canvas.height=1;
});
await test('ColorLab: PNG linear e radial com cores corretas',async()=>{
  for(const kind of ['linear','radial'] as const){
    const output=await gradientPng([{id:'a',color:'#FF0000',position:0},{id:'b',color:'#0000FF',position:100}],kind,90);
    const bitmap=await createImageBitmap(output);assert(bitmap.width===1600&&bitmap.height===900,'Dimensões do gradiente');
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=900;const ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);
    const first=ctx.getImageData(kind==='linear'?0:800,450,1,1).data;
    assert(first[0]>240&&first[2]<20,'Início vermelho');
    bitmap.close();canvas.width=1;canvas.height=1;
  }
});
for(const content of [{...emptyQr,url:'https://example.com/ação'}, {...emptyQr,kind:'text' as const,text:'Olá UtilHub 2.0!'}, {...emptyQr,kind:'wifi' as const,ssid:'Rede;Casa',password:'abc:123'}, {...emptyQr,kind:'contact' as const,name:'Ana Silva',email:'ana@example.com'}]){
  await test('QR Studio: decodificação real de '+content.kind,async()=>{
    const payload=qrPayload(content),canvas=document.createElement('canvas');
    await QRCode.toCanvas(canvas,payload,{width:1024,margin:4,errorCorrectionLevel:'M'});
    const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height);
    const decoded=jsQR(pixels.data,pixels.width,pixels.height);
    assert(decoded?.data===payload,'Leitura idêntica ao conteúdo');
    const svg=await QRCode.toString(payload,{type:'svg',margin:4});assert(svg.includes('<svg'),'SVG gerado');
    canvas.width=1;canvas.height=1;
  });
}
await test('Currículo: impressão isolada com texto selecionável e caracteres especiais',async()=>{
  const create=document.createElement.bind(document);let printed='';const frames:HTMLIFrameElement[]=[];
  document.createElement=((tag:string,options?:ElementCreationOptions)=>{
    const element=create(tag,options);
    if(tag==='iframe'){
      const frame=element as HTMLIFrameElement;frames.push(frame);
      frame.addEventListener('load',()=>{frame.contentWindow!.print=()=>{printed=frame.contentDocument!.body.innerHTML;};});
    }
    return element;
  }) as typeof document.createElement;
  try{
    await printResume({...exampleResume,name:'Ana ação & <teste>'},'modern','#2D563B');
    assert(printed.includes('Ana ação &amp; &lt;teste&gt;'),'Caracteres preservados e escapados');
    assert(!printed.includes('sidebar')&&!printed.includes('Exportar'),'Somente currículo entra na impressão');
    assert(printed.includes('<h1>'),'Documento tem texto, não uma captura raster');
  }finally{document.createElement=create;frames.forEach(frame=>frame.remove());}
  assert(resumeDocument(exampleResume,'classic','#254B75').includes('size:A4'),'Papel A4');
});
await test('Interface 2.0: oito ferramentas, módulos funcionais e layouts de celular',async()=>{
  const iframe=document.createElement('iframe');iframe.style.cssText='width:1280px;height:1000px;border:0';iframe.src='/#/';document.body.append(iframe);
  const wait=async(check:()=>unknown)=>{for(let i=0;i<160;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+check.toString());};
  await wait(()=>iframe.contentDocument?.querySelectorAll('.tool-card').length===8);
  const doc=iframe.contentDocument!,win=iframe.contentWindow!;
  assert(!doc.body.textContent?.includes('PDF Studio'),'Sem módulo PDF Studio');
  const navigate=async(route:string)=>{win.location.hash='#/'+route;const markers:Record<string,string>={'marcas-dagua':'.compact-upload',curriculos:'.resume-form',colorlab:'.color-hero',qr:'.qr-preview'};await wait(()=>doc.querySelector(markers[route]));await new Promise(resolve=>setTimeout(resolve,100));};
  const find=(text:string)=>Array.from(doc.querySelectorAll<HTMLButtonElement>('button')).find(button=>button.textContent?.includes(text))!;
  const setInput=(input:HTMLInputElement,value:string)=>{Object.getOwnPropertyDescriptor((win as unknown as {HTMLInputElement:typeof HTMLInputElement}).HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));};
  await navigate('marcas-dagua');
  const file=doc.querySelector<HTMLInputElement>('input[type=file]')!,transfer=new DataTransfer();transfer.items.add(base.file);file.files=transfer.files;file.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>doc.querySelector('.final-preview canvas[data-ready=true]'));
  assert(!find('Baixar imagem').disabled,'Download habilitado com texto');
  for(const route of ['marcas-dagua','curriculos','colorlab','qr']){
    await navigate(route);iframe.style.width='390px';win.dispatchEvent(new Event('resize'));await new Promise(resolve=>setTimeout(resolve,100));
    assert(doc.documentElement.scrollWidth<=390,'Sem overflow em '+route);
    iframe.style.width='1280px';
    if(route==='curriculos'){find('Preencher exemplo').click();await wait(()=>!find('Exportar currículo').disabled);assert(doc.querySelector('.resume-preview'),'Prévia do currículo');find('Adicionar experiência').click();await wait(()=>doc.querySelectorAll('.resume-entry-form').length===3);}
    if(route==='colorlab'){find('Adicionar cor').click();await wait(()=>doc.querySelectorAll('.gradient-stop').length===3);assert(doc.querySelector('.code-output')?.textContent?.includes('linear-gradient'),'CSS gerado');}
    if(route==='qr'){setInput(doc.querySelector<HTMLInputElement>('input[type=url]')!,'https://example.com');await wait(()=>doc.querySelector('.qr-preview img'));assert(!find('Baixar PNG').disabled,'QR exportável');}
  }
  iframe.remove();
});
base.image.src='';logo.image.src='';results.done=true;document.querySelector('#results')!.textContent=JSON.stringify(results,null,2);
