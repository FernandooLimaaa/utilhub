import { unzipSync } from 'fflate';
import { watermarkBatch, validateBatch } from '../src/services/watermarkBatch';
import { defaultWatermark } from '../src/services/watermark';
const results={passed:[] as string[],failed:[] as string[],done:false};
(window as unknown as {__imageTestResults:typeof results}).__imageTestResults=results;
function assert(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
async function test(name:string,run:()=>Promise<void>|void){try{await run();results.passed.push(name);}catch(error){results.failed.push(name+': '+String(error));}}
async function fixture(name:string,width:number,height:number){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#3567ad';ctx.fillRect(0,0,width,height);const blob=await new Promise<Blob>(resolve=>canvas.toBlob(value=>resolve(value!)));canvas.width=1;canvas.height=1;return new File([blob],name,{type:'image/png'});}
const files=[await fixture('mesmo-nome.png',640,360),await fixture('mesmo-nome.png',360,640)];
await test('Lote: ZIP real com nomes únicos, dimensões preservadas e progresso medido',async()=>{
  const updates:number[]=[];
  const blob=await watermarkBatch(files,null,defaultWatermark,(done,total)=>{assert(total===2,'Total real');updates.push(done);},new AbortController().signal);
  const archive=unzipSync(new Uint8Array(await blob.arrayBuffer()));const names=Object.keys(archive);
  assert(names.length===2&&new Set(names).size===2,'Dois arquivos com nomes distintos');
  for(let index=0;index<2;index++){const decoded=await createImageBitmap(new Blob([new Uint8Array(archive[names[index]])],{type:'image/png'}));assert(decoded.width===(index?360:640)&&decoded.height===(index?640:360),'Orientação e resolução preservadas');decoded.close();}
  assert(JSON.stringify(updates)==='[0,1,1,2]','Progresso após cada conclusão');
});
await test('Lote: cancelamento e limites não geram arquivos parciais',async()=>{
  const abort=new AbortController();let rejected=false;
  try{await watermarkBatch(files,null,defaultWatermark,done=>{if(done===1)abort.abort();},abort.signal);}catch{rejected=true;}
  assert(rejected,'Lote interrompido');
  for(const invalid of [[],Array.from({length:11},()=>files[0]),[new File(['bad'],'bad.txt',{type:'text/plain'})]]){let failed=false;try{validateBatch(invalid);}catch{failed=true;}assert(failed,'Validação do lote');}
});
await test('Marcas-d’água: posições, teclado, desfazer/refazer e lote na interface',async()=>{
  const iframe=document.createElement('iframe');iframe.style.cssText='width:1280px;height:1000px;border:0';iframe.src='/#/marcas-dagua';document.body.append(iframe);
  const wait=async(check:()=>unknown)=>{for(let i=0;i<160;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+check.toString());};
  await wait(()=>iframe.contentDocument?.querySelector('input[type=file]'));
  const doc=iframe.contentDocument!;const transfer=new DataTransfer();transfer.items.add(files[0]);const input=doc.querySelector<HTMLInputElement>('input[type=file]')!;input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>doc.querySelector('canvas[data-ready=true]'));
  const preset=doc.querySelector<HTMLButtonElement>('button[aria-label="Inferior direita"]')!;preset.click();await wait(()=>preset.getAttribute('aria-pressed')==='true');
  doc.querySelector<HTMLButtonElement>('button[aria-label="Desfazer ajuste"]')!.click();await wait(()=>doc.querySelector('button[aria-label="Centro centro"][aria-pressed=true]'));
  doc.querySelector<HTMLButtonElement>('button[aria-label="Refazer ajuste"]')!.click();await wait(()=>preset.getAttribute('aria-pressed')==='true');
  const canvas=doc.querySelector('canvas')!;canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));await wait(()=>preset.getAttribute('aria-pressed')==='false');
  const batch=doc.querySelector<HTMLInputElement>('input[multiple]')!,batchTransfer=new DataTransfer();files.forEach(file=>batchTransfer.items.add(file));batch.files=batchTransfer.files;batch.dispatchEvent(new Event('change',{bubbles:true}));
  await wait(()=>doc.querySelectorAll('.watermark-batch li').length===2);
  iframe.style.width='390px';await new Promise(resolve=>setTimeout(resolve,150));assert(doc.documentElement.scrollWidth<=390,'Lote sem overflow no celular');
  iframe.remove();
});
results.done=true;document.querySelector('#results')!.textContent=JSON.stringify(results,null,2);
