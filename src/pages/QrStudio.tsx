import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { CopyButton, PageIntro, PrivacyNote } from '../components/ui';
import { emptyQr, qrPayload } from '../services/qrPayload';
import type { QrContent, QrKind } from '../services/qrPayload';
import { contrastRatio } from '../services/colors';
import { downloadBlob } from '../services/images';

export default function QrStudio() {
  const [content, setContent] = useState<QrContent>(emptyQr);
  const [dark, setDark] = useState('#202B25'), [light, setLight] = useState('#FFFFFF');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M'), [size, setSize] = useState(1024);
  const [preview, setPreview] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  let payload = '', validation = '';
  try { payload = qrPayload(content); } catch (cause) { validation = (cause as Error).message; }
  const contrast = contrastRatio(dark, light), colorValid = contrast >= 4.5 && contrastRatio(dark, '#000000') < contrastRatio(light, '#000000');
  function update(patch: Partial<QrContent>) { setContent(current => ({ ...current, ...patch })); setStatus(''); }
  const options = { errorCorrectionLevel: level, margin: 4, width: size, color: { dark, light } };
  useEffect(() => {
    let cancelled = false;
    setPreview(''); setError('');
    if (!payload || !colorValid) { setBusy(false); return; }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const result = await QRCode.toDataURL(payload, { errorCorrectionLevel: level, margin: 4, width: 400, color: { dark, light } });
        if (!cancelled) setPreview(result);
      } catch { if (!cancelled) setError('Não foi possível gerar este QR Code. Reduza o conteúdo ou o nível de correção.'); }
      finally { if (!cancelled) setBusy(false); }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [payload, dark, light, level, colorValid]);
  async function download(format: 'png' | 'svg') {
    if (!payload || !colorValid || busy) return;
    setError(''); setStatus(''); setBusy(true);
    try {
      if (format === 'svg') downloadBlob(new Blob([await QRCode.toString(payload, { ...options, type: 'svg' })], { type: 'image/svg+xml' }), 'utilhub-qr.svg');
      else {
        const canvas = document.createElement('canvas');
        try {
          await QRCode.toCanvas(canvas, payload, options);
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          if (!blob) throw new Error();
          downloadBlob(blob, 'utilhub-qr.png');
        } finally { canvas.width = 1; canvas.height = 1; }
      }
      setStatus('QR Code exportado. Confira a leitura antes de compartilhar ou imprimir.');
    } catch { setError('Não foi possível exportar. Reduza o conteúdo e tente novamente.'); }
    finally { setBusy(false); }
  }
  const field = (key: keyof QrContent, label: string, type = 'text', placeholder = '') => <label className="field">{label}<input type={type} maxLength={key === 'password' ? 128 : 500} placeholder={placeholder} value={String(content[key])} onChange={event => update({ [key]: event.target.value })}/></label>;
  return <><PageIntro eyebrow="PRODUTIVIDADE" title="Uma conexão em cada quadradinho." description="Transforme links, texto, redes Wi-Fi e contatos em QR Codes estáticos, sem expiração ou serviços intermediários."/>
    <div className="split"><section className="panel"><h2>O que vamos compartilhar?</h2><div className="segmented wrap" role="group" aria-label="Conteúdo do QR Code">{([['url', 'Link'], ['text', 'Texto'], ['wifi', 'Wi-Fi'], ['contact', 'Contato']] as [QrKind, string][]).map(([kind, label]) => <button key={kind} aria-pressed={content.kind === kind} onClick={() => update({ kind })}>{label}</button>)}</div>
      {content.kind === 'url' && field('url', 'Endereço completo', 'url', 'https://exemplo.com')}
      {content.kind === 'text' && <label className="field">Texto<textarea className="module-textarea" maxLength={1800} value={content.text} onChange={event => update({ text: event.target.value })}/></label>}
      {content.kind === 'wifi' && <>{field('ssid', 'Nome da rede (SSID)')}<label className="field">Segurança<select value={content.security} onChange={event => update({ security: event.target.value as QrContent['security'] })}><option value="WPA">WPA / WPA2 / WPA3 pessoal</option><option value="WEP">WEP</option><option value="nopass">Rede aberta</option></select></label>{content.security !== 'nopass' && field('password', 'Senha da rede', 'password')}<label className="check-row"><span>Rede oculta</span><input type="checkbox" checked={content.hidden} onChange={event => update({ hidden: event.target.checked })}/></label><p className="helper">O QR contém a senha da rede e pode ser lido por qualquer pessoa com acesso à imagem. Não é armazenado no UtilHub. A compatibilidade depende do leitor.</p></>}
      {content.kind === 'contact' && <>{field('name', 'Nome do contato')}{field('organization', 'Organização (opcional)')}{field('phone', 'Telefone (opcional)', 'tel')}{field('email', 'E-mail (opcional)', 'email')}<p className="helper">Formato vCard 3.0, para salvar nos contatos de leitores compatíveis.</p></>}
      <div className="dimensions"><label className="field">Cor dos módulos<input type="color" value={dark} onChange={event => setDark(event.target.value)}/></label><label className="field">Cor do fundo<input type="color" value={light} onChange={event => setLight(event.target.value)}/></label></div>
      <div className="dimensions"><label className="field">Tamanho do PNG<select value={size} onChange={event => setSize(+event.target.value)}>{[512, 1024, 2048].map(n => <option key={n} value={n}>{n} × {n} px</option>)}</select></label><label className="field">Correção de erros<select value={level} onChange={event => setLevel(event.target.value as typeof level)}><option value="L">Baixa (L)</option><option value="M">Média (M)</option><option value="Q">Alta (Q)</option><option value="H">Máxima (H)</option></select></label></div>
      <p className="helper">A margem de quatro módulos é preservada para facilitar a leitura. Mais correção permite maior resistência a danos, mas reduz a capacidade de conteúdo.</p>
    </section><section className="panel qr-panel"><h2>Pronto para conectar</h2><div className="qr-preview" aria-busy={busy}>{preview ? <img src={preview} alt="QR Code gerado a partir dos dados informados"/> : <div className="empty-preview"><QrCode size={60}/><span>{busy ? 'Gerando QR Code…' : 'Preencha os dados para visualizar'}</span></div>}</div>
      <p className="helper" role="status">{validation || (!colorValid ? 'Escolha módulos mais escuros que o fundo e contraste mínimo de 4,5:1.' : 'Contraste: ' + contrast.toFixed(2) + ':1 · QR estático, sem rastreamento.')}</p>
      {error && <p className="error" role="alert">{error}</p>}<div className="toolbar"><button className="button primary" disabled={!preview || busy || !!validation || !colorValid} onClick={() => download('png')}><Download size={16}/> Baixar PNG</button><button className="button secondary" disabled={!preview || busy || !!validation || !colorValid} onClick={() => download('svg')}>Baixar SVG</button></div>
      {payload && content.kind !== 'wifi' && <details className="payload-details"><summary>Ver conteúdo codificado</summary><pre>{payload}</pre><CopyButton key={payload} text={payload}/></details>}<p className="helper" role="status">{status}</p>
    </section></div><PrivacyNote/></>;
}
