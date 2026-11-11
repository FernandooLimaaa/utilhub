import { contrastRatio } from '../src/services/colors';
const results={passed:[] as string[],failed:[] as string[],done:false};
(window as unknown as {__imageTestResults:typeof results}).__imageTestResults=results;
function assert(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
async function test(name:string,run:()=>Promise<void>|void){try{await run();results.passed.push(name);}catch(error){results.failed.push(name+': '+String(error));}}
const wait=async(check:()=>unknown)=>{for(let i=0;i<160;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+check.toString());};
localStorage.removeItem('utilhub-favorites');localStorage.removeItem('utilhub-recent');
const iframe=document.createElement('iframe');iframe.style.cssText='width:1440px;height:1000px;border:0';iframe.src='/#/';document.body.append(iframe);
await wait(()=>iframe.contentDocument?.querySelectorAll('.tool-card').length===8);
let doc=iframe.contentDocument!,win=iframe.contentWindow!;
function setInput(input:HTMLInputElement,value:string){Object.getOwnPropertyDescriptor((win as unknown as {HTMLInputElement:typeof HTMLInputElement}).HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));}
await test('Premium: pesquisa por acentos, categorias e estado vazio',async()=>{
  const input=doc.querySelector<HTMLInputElement>('#home-search')!;
  setInput(input,'curriculo');await wait(()=>doc.querySelectorAll('.tool-card').length===1);
  assert(doc.querySelector('.tool-card h3')?.textContent?.includes('currículos'),'Busca sem acento');
  setInput(input,'nada-existe-aqui');await wait(()=>doc.querySelector('.home-empty'));
  setInput(input,'');await wait(()=>doc.querySelectorAll('.tool-card').length===8);
  const filter=Array.from(doc.querySelectorAll<HTMLButtonElement>('.category-filters button')).find(button=>button.textContent?.includes('Imagens e Design'))!;filter.click();
  await wait(()=>doc.querySelectorAll('.tool-card').length===3);
  doc.querySelector<HTMLButtonElement>('.category-filters button')!.click();await wait(()=>doc.querySelectorAll('.tool-card').length===8);
});
await test('Premium: favoritos persistem e recentes guardam somente IDs',async()=>{
  doc.querySelector<HTMLButtonElement>('.card-favorite')!.click();await wait(()=>doc.querySelector('.card-favorite[aria-pressed=true]'));
  await wait(()=>JSON.parse(localStorage.getItem('utilhub-favorites')||'[]').includes('imagens'));
  win.location.hash='#/texto';await wait(()=>doc.querySelector('.text-editor'));
  win.location.hash='#/';await wait(()=>doc.querySelector('.premium-home'));
  assert(doc.querySelector('.personal-panel .saved-tool')?.getAttribute('href')==='#/imagens','Favorito exibido');
  assert(JSON.stringify(JSON.parse(localStorage.getItem('utilhub-recent')||'[]'))==='["texto"]','Somente ID da ferramenta');
  iframe.src='/?premium-reload=1#/';await wait(()=>iframe.contentDocument!==doc&&iframe.contentDocument?.querySelector('.premium-home'));
  doc=iframe.contentDocument!;win=iframe.contentWindow!;
  await wait(()=>doc.querySelector('.card-favorite[aria-pressed=true]'));
  const clear=Array.from(doc.querySelectorAll<HTMLButtonElement>('button')).find(button=>button.textContent?.includes('Limpar recentes'))!;clear.click();await wait(()=>localStorage.getItem('utilhub-recent')==='[]');
});
await test('Premium: pesquisa global, foco inicial, teclado e navegação',async()=>{
  win.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));
  await wait(()=>doc.querySelector('dialog[open]'));
  assert(doc.activeElement?.id==='global-search','Pesquisa recebe foco');
  setInput(doc.querySelector<HTMLInputElement>('#global-search')!,'senhas');await wait(()=>doc.querySelectorAll('.search-results a').length===1);
  doc.querySelector<HTMLAnchorElement>('.search-results a')!.click();await wait(()=>doc.querySelector('#password'));
  assert(!doc.querySelector('dialog[open]'),'Pesquisa fecha ao navegar');
  win.location.hash='#/';await wait(()=>doc.querySelector('.premium-home'));
});
await test('Premium: home sem overflow em 320, 390, 768, 1024 e 1440 px',async()=>{
  for(const width of [320,390,768,1024,1440]){
    iframe.style.width=width+'px';win.dispatchEvent(new Event('resize'));await new Promise(resolve=>setTimeout(resolve,200));
    assert(doc.documentElement.scrollWidth<=width,'Overflow em '+width+': '+doc.documentElement.scrollWidth);
  }
});
await test('Premium: temas com contraste legível e persistência',async()=>{
  for(const theme of ['light','dark']){
    if(doc.documentElement.dataset.theme!==theme)doc.querySelector<HTMLButtonElement>('.theme-button')!.click();
    await wait(()=>doc.documentElement.dataset.theme===theme);
    const styles=win.getComputedStyle(doc.documentElement);
    assert(contrastRatio(styles.getPropertyValue('--ink').trim(),styles.getPropertyValue('--bg').trim())>=7,'Contraste do texto principal');
    assert(contrastRatio(styles.getPropertyValue('--muted').trim(),styles.getPropertyValue('--bg').trim())>=4.5,'Contraste do texto auxiliar');
    assert(localStorage.getItem('utilhub-theme')===theme,'Tema persistido');
  }
});
await test('Premium: menu móvel, área inerte e foco recuperado',async()=>{
  iframe.style.width='390px';win.dispatchEvent(new Event('resize'));await new Promise(resolve=>setTimeout(resolve,100));
  const trigger=doc.querySelector<HTMLButtonElement>('.mobile-menu')!;trigger.click();await wait(()=>doc.querySelector('.sidebar.is-open'));
  assert(doc.querySelector('.workspace')?.hasAttribute('inert'),'Conteúdo de fundo inerte');
  assert(doc.querySelector('.sidebar')?.contains(doc.activeElement),'Foco na navegação');
  doc.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await wait(()=>!doc.querySelector('.sidebar.is-open'));
  assert(doc.activeElement===trigger,'Foco volta ao botão');
  trigger.click();await wait(()=>doc.querySelector('.sidebar.is-open'));
  doc.querySelector<HTMLAnchorElement>('.overview-link')!.click();await wait(()=>!doc.querySelector('.sidebar.is-open'));
});
iframe.remove();results.done=true;document.querySelector('#results')!.textContent=JSON.stringify(results,null,2);
