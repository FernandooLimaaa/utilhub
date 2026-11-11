import { createServer, preview } from 'vite';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { verifyLiveSite } from './live-site.mjs';

const candidates = process.platform === 'win32'
  ? ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe']
  : ['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'];
const executable = process.env.UTILHUB_BROWSER || candidates.find(existsSync);
if (!executable) throw new Error('Instale Chrome/Edge ou defina UTILHUB_BROWSER com o caminho do navegador.');
let server, browser, socket, production;
try {
  // Test fixtures use root-relative routes; production uses the real Vite base.
  server = await createServer({ base:'/', server: {host:'127.0.0.1',port:0}, logLevel:'error' });
  await server.listen();
  const address = server.httpServer.address();
  const origin = 'http://127.0.0.1:' + address.port;
  const profile = await mkdtemp(join(tmpdir(),'utilhub-image-tests-'));
  browser = spawn(executable, [
    '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--disable-background-networking','--remote-debugging-port=0',
    '--user-data-dir=' + profile,'about:blank'
  ], {windowsHide:true,stdio:'ignore'});
  let launchError;
  browser.on('error', error => {launchError=error;});
  let port;
  for(let attempt=0;attempt<100;attempt++){
    if(launchError)throw launchError;
    try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await delay(100);}
  }
  if(!port)throw new Error('O navegador não iniciou a porta de testes.');
  const tabs = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  const tab = tabs.find(tab=>tab.type==='page');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data);
    if(data.id && pending.has(data.id)){const {resolve,reject,timer}=pending.get(data.id);clearTimeout(timer);pending.delete(data.id);data.error?reject(new Error(JSON.stringify(data.error))):resolve(data.result);}
  });
  const call=(method,params={})=>new Promise((resolve,reject)=>{
    const request=++id;
    const timer=setTimeout(()=>{pending.delete(request);reject(new Error('Timeout: '+method));},10000);
    pending.set(request,{resolve,reject,timer});socket.send(JSON.stringify({id:request,method,params}));
  });
  await call('Page.enable');
  checks: {
  const liveSite = process.argv.find(argument => argument.startsWith('--site='))?.slice(7);
  if(liveSite){ await verifyLiveSite(call, liveSite); break checks; }
  let total=0, failures=0;
  const waitFor=async expression=>{for(let i=0;i<100;i++){const response=await call('Runtime.evaluate',{expression,returnByValue:true});if(response.result?.value)return response.result.value;await delay(50);}throw new Error('Timeout: '+expression);};
  // Only external navigation is stubbed in integration tests. No submission is made.
  // The fixture contains no form, fields, responses or simulated confirmation.
  await call('Fetch.enable',{patterns:[{urlPattern:'https://docs.google.com/forms/*',requestStage:'Request'}]});
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.method==='Fetch.requestPaused'){
      const body=Buffer.from('<!doctype html><title>Fixture de conexão externa — sem envio</title><p>Conteúdo isolado para testar o ambiente do iframe.</p>').toString('base64');
      void call('Fetch.fulfillRequest',{requestId:message.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html; charset=utf-8'}],body}).catch(()=>{});
    }
  });
  for(const page of ['images.browser.html','modules.browser.html','premium.browser.html','watermarks.browser.html','feedback.browser.html']){
    await call('Page.navigate',{url:origin+'/tests/'+page});
    let results;
    for(let attempt=0;attempt<160;attempt++){
      await delay(250);
      const response=await call('Runtime.evaluate',{expression:'window.__imageTestResults',returnByValue:true});
      results=response.result?.value;
      if(results?.done)break;
    }
    if(!results?.done)throw new Error('Os testes não terminaram em '+page+'. Resultado parcial: '+JSON.stringify(results));
    for(const name of results.passed) console.log('PASS '+name);
    for(const name of results.failed) console.error('FAIL '+name);
    total+=results.passed.length;failures+=results.failed.length;
  }
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/#/'});
  await waitFor(`!!document.querySelector('.feedback-fab')`);
  await call('Runtime.evaluate',{expression:`document.querySelector('.feedback-fab').focus();document.querySelector('.feedback-fab').click()`});
  await waitFor(`!!document.querySelector('.feedback-dialog[open] .feedback-state-loaded')`);
  const key=async(key,code,windowsVirtualKeyCode,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers});};
  await key('Tab','Tab',9,8);
  await waitFor(`!!document.activeElement?.closest('.feedback-dialog')`);
  await key('Tab','Tab',9);
  await key('Escape','Escape',27);
  await waitFor(`!document.querySelector('.feedback-dialog[open]')`);
  await waitFor(`document.activeElement?.classList.contains('feedback-fab')`);
  console.log('PASS Feedback: Tab/Shift+Tab e Escape nativos, com restauração de foco');total++;
  await call('Runtime.evaluate',{expression:`document.querySelector('.feedback-fab').click()`});
  await waitFor(`!!document.querySelector('.feedback-dialog[open] .feedback-state-loaded')`);
  await call('Runtime.evaluate',{expression:`document.querySelector('.feedback-dialog iframe').focus()`});
  await key('Escape','Escape',27);
  // A cross-origin focused frame may consume Escape. Do not inspect its DOM
  // or intercept its keys: verify the always-present parent close control.
  const stillOpen=await call('Runtime.evaluate',{expression:`!!document.querySelector('.feedback-dialog[open]')`,returnByValue:true});
  if(stillOpen.result.value){
    console.log('LIMITAÇÃO: iframe externo consome Escape; botão Fechar e Escape nos controles do UtilHub permanecem disponíveis.');
    await call('Runtime.evaluate',{expression:`document.querySelector('.feedback-close').focus()`});
    await key('Escape','Escape',27);
  }
  await waitFor(`!document.querySelector('.feedback-dialog[open]')`);
  console.log('PASS Feedback: fechamento acessível preservado após interação com iframe externo');total++;
  if(process.argv.includes('--feedback-live')){
    await call('Fetch.disable');
    await call('Page.navigate',{url:origin+'/#/'});
    await waitFor(`!!document.querySelector('.feedback-fab')`);
    await call('Runtime.evaluate',{expression:`document.querySelector('.feedback-fab').click()`});
    await waitFor(`!!document.querySelector('.feedback-dialog[open] .feedback-state-loaded')`);
    await delay(1500);
    const capture=await call('Page.captureScreenshot',{format:'png'});
    const path=join(profile,'feedback-live-desktop.png');await writeFile(path,Buffer.from(capture.data,'base64'));
    console.log('SCREENSHOT REAL (sem envio) '+path);
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
    await call('Page.navigate',{url:origin+'/#/feedback'});
    await waitFor(`!!document.querySelector('.feedback-page .feedback-state-loaded')`);
    await delay(1000);
    const mobile=await call('Page.captureScreenshot',{format:'png'});
    const mobilePath=join(profile,'feedback-live-mobile.png');await writeFile(mobilePath,Buffer.from(mobile.data,'base64'));
    console.log('SCREENSHOT REAL (sem envio) '+mobilePath);
  }
  // Real native pointer events verify pointer capture on mouse and touch.
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/#/marcas-dagua'});
  await waitFor(`!!document.querySelector('input[type=file]')`);
  await call('Runtime.evaluate',{expression:`(async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');ctx.fillStyle='#315f9a';ctx.fillRect(0,0,640,360);const blob=await new Promise(resolve=>canvas.toBlob(resolve));const transfer=new DataTransfer();transfer.items.add(new File([blob],'ponteiro.png',{type:'image/png'}));const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`,awaitPromise:true});
  await waitFor(`!!document.querySelector('canvas[data-ready=true]')`);
  const xValue=`Array.from(document.querySelectorAll('label')).find(label=>label.textContent.startsWith('Posição horizontal:'))?.querySelector('input')?.value`;
  const getPoint=async()=>{
    await call('Runtime.evaluate',{expression:`document.querySelector('canvas').scrollIntoView({block:'center'})`});await delay(100);
    const result=await call('Runtime.evaluate',{expression:`(()=>{const r=document.querySelector('canvas').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};})()`,returnByValue:true});return result.result.value;
  };
  const mouse=await getPoint();
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...mouse});
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...mouse,button:'left',buttons:1,clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:mouse.x+40,y:mouse.y+20,button:'left',buttons:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:mouse.x+40,y:mouse.y+20,button:'left',clickCount:1});
  await waitFor(`${xValue} !== '50'`);
  await call('Runtime.evaluate',{expression:`document.querySelector('button[aria-label="Desfazer ajuste"]').click()`});
  await waitFor(`${xValue} === '50'`);
  console.log('PASS Marcas-d’água: arraste real de mouse e desfazer gesto completo');total++;
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const touch=await getPoint();
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...touch,id:1}]});
  await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x-30,y:touch.y+15,id:1}]});
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await waitFor(`${xValue} !== '50'`);
  console.log('PASS Marcas-d’água: arraste real por toque no viewport de celular');total++;
  await call('Emulation.setTouchEmulationEnabled',{enabled:false});
  await call('Emulation.clearDeviceMetricsOverride');
  if(process.argv.includes('--screenshots')){
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    for(const [name,width,height,theme] of [['desktop-dark',1440,1000,'dark'],['mobile-dark',390,1000,'dark'],['desktop-light',1440,1000,'light']]){
      await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
      await call('Page.navigate',{url:origin+'/#/'});await delay(400);
      await call('Runtime.evaluate',{expression:`document.documentElement.dataset.theme='${theme}'; window.scrollTo(0,0);`});
      const capture=await call('Page.captureScreenshot',{format:'png'});
      const path=join(profile,name+'.png');await writeFile(path,Buffer.from(capture.data,'base64'));console.log('SCREENSHOT '+path);
    }
    await call('Emulation.clearDeviceMetricsOverride');
  }
  if(process.argv.includes('--production')){
    production=await preview({preview:{host:'127.0.0.1',port:0},logLevel:'error'});
    const productionUrl='http://127.0.0.1:'+production.httpServer.address().port+'/utilhub/';
    await call('Page.navigate',{url:productionUrl});
    await waitFor(`document.querySelectorAll('.tool-card').length===8`);
    await call('Runtime.evaluate',{expression:`location.hash='#/imagens'`});
    await waitFor(`!!document.querySelector('.image-controls')`);
    await call('Runtime.evaluate',{expression:`location.hash='#/marcas-dagua'`});
    await waitFor(`!!document.querySelector('.watermark-batch')`);
    await call('Runtime.evaluate',{expression:`location.hash='#/feedback'`});
    await waitFor(`!!document.querySelector('.feedback-page iframe')`);
    console.log('PASS Produção: home e chunks de ferramentas funcionam na subpasta /utilhub/');total++;
    await call('Page.navigate',{url:origin+'/#/'});
    await waitFor(`!!document.querySelector('.premium-home')`);
  }
  const resume=await call('Runtime.evaluate',{expression:`import('/src/services/resume.ts').then(m=>{const data=structuredClone(m.exampleResume);data.experience=Array.from({length:12},(_,i)=>({...data.experience[0],id:String(i),description:'Realizações e experiência profissional. '.repeat(35)}));document.open();document.write(m.resumeDocument(data,'modern','#2D563B'));document.close();return true;})`,awaitPromise:true,returnByValue:true});
  if(resume.exceptionDetails)throw new Error('Não foi possível preparar o currículo para impressão.');
  const pdf=await call('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
  const bytes=Buffer.from(pdf.data,'base64');
  const pages=(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;
  if(bytes.subarray(0,4).toString()!=='%PDF'||pages<2)throw new Error('PDF multipágina inválido.');
  console.log('PASS Currículo: PDF real com '+pages+' páginas A4 ('+bytes.length+' bytes)');total++;
  console.log(total+' testes de navegador aprovados; '+failures+' falhas.');
  if(failures)process.exitCode=1;
  }
} finally {
  if(socket?.readyState===WebSocket.OPEN)socket.close();
  if(browser && browser.exitCode===null)browser.kill();
  if(server)await server.close();
  if(production)await new Promise(resolve=>production.httpServer.close(resolve));
}
