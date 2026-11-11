export type ResumeEntry = { id: string; title: string; organization: string; period: string; description: string };
export type ResumeData = {
  name: string; headline: string; email: string; phone: string; city: string; website: string;
  summary: string; skills: string; languages: string; experience: ResumeEntry[]; education: ResumeEntry[];
};
export const blankResume: ResumeData = { name: '', headline: '', email: '', phone: '', city: '', website: '', summary: '', skills: '', languages: '', experience: [], education: [] };
export const exampleResume: ResumeData = {
  name: 'Alex Silva', headline: 'Designer de produto', email: 'alex@exemplo.com', phone: '(11) 99999-0000', city: 'São Paulo, SP', website: 'portfolio.exemplo.com',
  summary: 'Designer com foco em produtos digitais acessíveis. Experiência em pesquisa, prototipação e colaboração com equipes de desenvolvimento.', skills: 'Pesquisa com usuários, Prototipação, Design de interfaces, Acessibilidade', languages: 'Português — nativo\nInglês — avançado',
  experience: [{ id: 'example-job', title: 'Designer de produto', organization: 'Estúdio Exemplo', period: '2023 — Atual', description: 'Condução de pesquisas e criação de interfaces responsivas.\nColaboração com desenvolvimento para melhorar a experiência do usuário.' }],
  education: [{ id: 'example-education', title: 'Graduação em Design', organization: 'Universidade Exemplo', period: '2019 — 2022', description: '' }],
};
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function resumeMarkup(data: ResumeData) {
  const escape = escapeHtml;
  const block = (heading: string, value: string) => value.trim() ? '<section><h2>' + heading + '</h2><p class="multiline">' + escape(value) + '</p></section>' : '';
  const entries = (heading: string, items: ResumeEntry[]) => {
    const filled = items.filter(item => [item.title, item.organization, item.period, item.description].some(value => value.trim()));
    return filled.length ? '<section><h2>' + heading + '</h2>' + filled.map(item => '<article><div class="entry-heading"><h3>' + escape(item.title) + '</h3><span>' + escape(item.period) + '</span></div><strong class="organization">' + escape(item.organization) + '</strong>' + (item.description ? '<p class="multiline">' + escape(item.description) + '</p>' : '') + '</article>').join('') + '</section>' : '';
  };
  return '<header><h1>' + escape(data.name || 'Seu nome') + '</h1>' + (data.headline ? '<p class="headline">' + escape(data.headline) + '</p>' : '') + '<p class="contacts">' + [data.email, data.phone, data.city, data.website].filter(Boolean).map(escape).join(' · ') + '</p></header>' + block('Perfil profissional', data.summary) + entries('Experiência profissional', data.experience) + entries('Formação', data.education) + block('Habilidades', data.skills) + block('Idiomas', data.languages);
}
export function resumeStyles(template: 'modern' | 'classic', accent: string) {
  const color = /^#[a-f\d]{6}$/i.test(accent) ? accent : '#2d563b';
  return 'body{margin:0;background:white;color:#202b25;font-family:' + (template === 'classic' ? 'Georgia,serif' : 'Arial,sans-serif') + ';font-size:11pt;line-height:1.5}*{box-sizing:border-box}main{padding:0;margin:0;max-width:none;outline:0}header{border-bottom:' + (template === 'classic' ? '1px' : '3px') + ' solid ' + color + ';padding-bottom:14px;margin-bottom:20px}h1{font-size:27pt;line-height:1.15;margin:0 0 7px;color:' + color + ';overflow-wrap:anywhere}h2{font-size:12pt;color:' + color + ';margin:20px 0 10px;text-transform:uppercase;letter-spacing:.8px;break-after:avoid}h3{font-size:11pt;margin:0;overflow-wrap:anywhere}.headline{font-size:13pt;margin:0 0 7px}.contacts{font:9pt/1.6 Arial,sans-serif;color:#525c54;margin:0;overflow-wrap:anywhere}.entry-heading{display:flex;justify-content:space-between;gap:12px;align-items:baseline;break-after:avoid}.entry-heading span{font-size:9pt;color:#525c54;max-width:40%;overflow-wrap:anywhere}.organization{font-size:10pt;font-weight:normal;display:block;margin:2px 0 6px;break-after:avoid}.multiline{white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0 12px;orphans:3;widows:3}article{margin-bottom:16px}p{orphans:3;widows:3}@page{size:A4;margin:16mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}header{break-inside:avoid}h1,h2,h3{break-after:avoid}}';
}
export function resumeDocument(data: ResumeData, template: 'modern' | 'classic', accent: string) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(data.name ? 'Currículo — ' + data.name : 'Currículo') + '</title><style>' + resumeStyles(template, accent) + '</style></head><body><main>' + resumeMarkup(data) + '</main></body></html>';
}

/** Print only the generated résumé; the rest of UtilHub never enters the PDF. */
export function printResume(data: ResumeData, template: 'modern' | 'classic', accent: string): Promise<void> {
  if (!data.name.trim()) return Promise.reject(new Error('Informe seu nome antes de exportar o currículo.'));
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.title = 'Exportação do currículo em PDF';
    frame.style.cssText = 'position:fixed;width:1px;height:1px;right:0;bottom:0;border:0;opacity:0;pointer-events:none';
    const cleanup = () => frame.remove();
    frame.onload = () => {
      try {
        const target = frame.contentWindow;
        if (!target) throw new Error();
        target.addEventListener('afterprint', cleanup, { once: true });
        target.focus(); target.print(); resolve();
        setTimeout(cleanup, 300_000);
      } catch { cleanup(); reject(new Error('Não foi possível abrir a impressão. Tente em uma aba do navegador.')); }
    };
    frame.srcdoc = resumeDocument(data, template, accent);
    document.body.append(frame);
  });
}
