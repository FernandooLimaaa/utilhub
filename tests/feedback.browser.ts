import { feedback } from '../src/config/feedback';
const results={passed:[] as string[],failed:[] as string[],done:false};
(window as unknown as {__imageTestResults:typeof results}).__imageTestResults=results;
function assert(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
async function test(name:string,run:()=>Promise<void>|void){try{await run();results.passed.push(name);}catch(error){results.failed.push(name+': '+String(error));}}
const wait=async(check:()=>unknown)=>{for(let i=0;i<160;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw new Error('Timeout: '+check.toString());};
const iframe=document.createElement('iframe');iframe.style.cssText='width:1440px;height:1000px;border:0';iframe.src='/#/';document.body.append(iframe);
await wait(()=>iframe.contentDocument?.querySelector('.feedback-fab'));
const doc=iframe.contentDocument!,win=iframe.contentWindow!;
await test('Feedback: três acessos, sem carregar Google Forms na home',()=>{
  assert(doc.querySelector('.nav-feedback')?.getAttribute('href')===feedback.route,'Acesso na sidebar');
  assert(doc.querySelector('.feedback-home-card .button')?.getAttribute('href')===feedback.route,'Card na home');
  assert(doc.querySelector('.feedback-home-card h2')?.textContent==='Ajude a construir o futuro do UtilHub.','Título do card');
  assert(!doc.querySelector('iframe[src*="docs.google.com"]'),'Não há contato com Google Forms antes de abrir');
  assert(doc.querySelectorAll('.tool-card').length===8,'As oito ferramentas permanecem');
});
await test('Feedback: modal acessível, iframe público, fallback e retorno de foco',async()=>{
  const trigger=doc.querySelector<HTMLAnchorElement>('.feedback-fab')!;trigger.focus();trigger.click();
  await wait(()=>doc.querySelector('.feedback-dialog[open]'));
  const dialog=doc.querySelector<HTMLDialogElement>('.feedback-dialog')!;
  assert(doc.activeElement?.getAttribute('aria-label')==='Fechar Central de Feedback','Foco inicial no fechar');
  assert(dialog.getAttribute('aria-labelledby'),'Modal tem título acessível');
  const form=dialog.querySelector<HTMLIFrameElement>('iframe')!;
  assert(form.src===feedback.embeddedUrl,'URL correta de incorporação');assert(!!form.title,'Título do iframe');
  const fallback=dialog.querySelector<HTMLAnchorElement>('.feedback-external')!;
  assert(fallback.href===feedback.publicUrl&&fallback.target==='_blank','Link direto sempre disponível');
  assert(fallback.rel.includes('noopener')&&fallback.rel.includes('noreferrer'),'Link externo protegido');
  await wait(()=>dialog.querySelector('.feedback-state-loaded'));
  form.dispatchEvent(new Event('error',{bubbles:true}));await wait(()=>dialog.querySelector('.feedback-state-error'));
  assert(dialog.querySelector('.feedback-external'),'Fallback continua em erro');
  assert(!dialog.textContent?.includes('enviado com sucesso'),'Nenhuma confirmação simulada');
  dialog.querySelector<HTMLButtonElement>('.feedback-close')!.click();await wait(()=>!doc.querySelector('.feedback-dialog'));
  assert(doc.activeElement===trigger,'Foco devolvido ao acionador');
});
await test('Feedback: celular abre página completa, com tema e rolagem do iframe',async()=>{
  iframe.style.width='390px';win.dispatchEvent(new Event('resize'));await new Promise(resolve=>setTimeout(resolve,100));
  doc.querySelector<HTMLAnchorElement>('.feedback-fab')!.click();await wait(()=>doc.querySelector('.feedback-page'));
  assert(win.location.hash===feedback.route,'Navegação para página');assert(!doc.querySelector('.feedback-dialog'),'Sem modal pequeno no celular');
  assert(doc.querySelector('.feedback-page h1')?.textContent===feedback.title,'Título da página');
  assert(doc.querySelector('.feedback-page .feedback-external'),'Fallback visível na página');
  assert(doc.querySelector('.nav-feedback')?.getAttribute('aria-current')==='page','Navegação ativa');
  assert(doc.title==='Central de Feedback | UtilHub','Título da aba');
  const form=doc.querySelector<HTMLIFrameElement>('.feedback-page iframe')!;
  assert(!form.hasAttribute('scrolling'),'Rolagem nativa não desativada');
  assert(win.getComputedStyle(form).minHeight==='600px','Área confortável para o formulário');
  for(const width of [320,390,768,1440]){iframe.style.width=width+'px';await new Promise(resolve=>setTimeout(resolve,100));assert(doc.documentElement.scrollWidth<=width,'Sem overflow em '+width);}
  for(const theme of ['light','dark']){if(doc.documentElement.dataset.theme!==theme)doc.querySelector<HTMLButtonElement>('.theme-button')!.click();await wait(()=>doc.documentElement.dataset.theme===theme);assert(doc.querySelector('.feedback-external'),'Link permanece nos dois temas');}
  assert(!JSON.parse(localStorage.getItem('utilhub-recent')||'[]').includes('feedback'),'Nenhum dado de resposta ou feedback nos recentes');
});
iframe.remove();results.done=true;document.querySelector('#results')!.textContent=JSON.stringify(results,null,2);
