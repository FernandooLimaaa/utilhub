/** Read-only public smoke checks. No feedback or other user data is submitted. */
export async function verifyLiveSite(call, site) {
  const base = new URL(site);
  if (base.protocol !== 'https:') throw new Error('A validação pública exige HTTPS.');
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error('Erro ao verificar a interface pública.');
    return result.result?.value;
  };
  const wait = async expression => {
    for (let i = 0; i < 140; i++) { const value = await evaluate(expression); if (value) return value; await pause(100); }
    throw new Error('O site público não apresentou o estado esperado: ' + expression);
  };
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: base.href });
  await wait(`document.querySelectorAll('.tool-card').length === 8`);
  const favicon = await evaluate(`document.querySelector('link[rel=icon]').href`);
  if (!favicon.startsWith(base.href)) throw new Error('Favicon fora da base publicada.');
  const iconResponse = await fetch(favicon);
  if (!iconResponse.ok) throw new Error('Favicon público indisponível.');
  console.log('PASS Público: home, oito ferramentas, SVG e favicon sob /utilhub/');
  const routes = [
    ['imagens', '.image-controls'], ['texto', '.text-editor'], ['precos', '.price-form'],
    ['senhas', '#password'], ['marcas-dagua', '.watermark-batch'],
    ['curriculos', '.resume-preview'], ['colorlab', '.gradient-preview'], ['qr', '.qr-preview'],
  ];
  for (const [route, marker] of routes) {
    await evaluate(`location.hash = '#/${route}'`);
    await wait(`!!document.querySelector(${JSON.stringify(marker)})`);
    console.log('PASS Público: página e importação dinâmica de ' + route);
  }
  await evaluate(`location.hash = '#/feedback'`);
  await wait(`!!document.querySelector('.feedback-page iframe')`);
  const form = await evaluate(`document.querySelector('.feedback-page iframe').src`);
  if (form !== 'https://docs.google.com/forms/d/e/1FAIpQLSfYL5E-pi6tiI4PFca90GJ9pwOndmtvsmdvNyy4o96D35_khA/viewform?embedded=true') throw new Error('Formulário público incorreto.');
  if (!await evaluate(`!!document.querySelector('.feedback-external[target=_blank]')`)) throw new Error('Link alternativo ausente.');
  console.log('PASS Público: Central de Feedback com iframe e link direto; nenhum envio realizado');
  for (const theme of ['light', 'dark']) {
    await evaluate(`if(document.documentElement.dataset.theme !== '${theme}') document.querySelector('.theme-button').click()`);
    await wait(`document.documentElement.dataset.theme === '${theme}'`);
  }
  console.log('PASS Público: temas claro e escuro');
  for (const width of [320, 390, 768]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 500 });
    for (const route of ['feedback', 'imagens', '']) {
      await evaluate(`location.hash = '#/${route}'`);
      await wait(route === '' ? `!!document.querySelector('.premium-home')` : route === 'feedback' ? `!!document.querySelector('.feedback-page')` : `!!document.querySelector('.image-controls')`);
      await pause(200);
      if (!await evaluate(`document.documentElement.scrollWidth <= innerWidth`)) throw new Error('Overflow público em ' + width + ' px, rota ' + route);
    }
  }
  console.log('PASS Público: home, imagens e feedback sem overflow em 320, 390 e 768 px');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('.feedback-fab').focus();document.querySelector('.feedback-fab').click()`);
  await wait(`!!document.querySelector('.feedback-dialog[open] iframe')`);
  await evaluate(`document.querySelector('.feedback-close').click()`);
  await wait(`!document.querySelector('.feedback-dialog[open]')`);
  console.log('PASS Público: modal de feedback abre e fecha');
}
