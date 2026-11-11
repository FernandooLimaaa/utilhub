import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Image as ImageIcon, Link2, Link2Off, RotateCcw } from 'lucide-react';
import { PageIntro, PrivacyNote } from '../components/ui';
import { loadImage, exportImage, downloadBlob } from '../services/images';
import { boundedSize, defaultSettings, presets, validateDimensions } from '../services/imageLayout';
import type { ImageSettings, Preset } from '../services/imageLayout';

const modes = [
  { id: 'contain', label: 'Conter', description: 'Mostra a imagem inteira, com margens quando necessário.' },
  { id: 'cover', label: 'Preencher', description: 'Ocupa todo o quadro e recorta o excedente, sem esticar.' },
  { id: 'adapt', label: 'Adaptar', description: 'Mantém a imagem inteira sobre um fundo personalizado.' },
] as const;
const initial = defaultSettings(1920, 1080);
const message = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível processar a imagem. Reduza a resolução e tente novamente.';

export default function Images() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<ImageSettings>(initial);
  const [preset, setPreset] = useState<Preset>('original');
  const [locked, setLocked] = useState(true);
  const ratio = useRef(1);
  const [view, setView] = useState<'result' | 'original'>('result');
  const [preview, setPreview] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const operation = useRef(0);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; operation.current++; };
  }, []);
  useEffect(() => () => { if (image) image.src = ''; }, [image]);

  // Cancel stale previews and release every object URL when replaced or unmounted.
  useEffect(() => {
    if (!image) return;
    let cancelled = false, url = '';
    setPreviewBusy(true); setPreviewError(''); setPreview('');
    const timer = window.setTimeout(async () => {
      try {
        if (view === 'result') validateDimensions(settings.width, settings.height);
        const config = view === 'original' ? defaultSettings(image.naturalWidth, image.naturalHeight) : settings;
        const blob = await exportImage(image, config, true);
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      } catch (cause) { if (!cancelled) setPreviewError(message(cause)); }
      finally { if (!cancelled) setPreviewBusy(false); }
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [image, settings, view]);

  let dimensionsError = '';
  try { validateDimensions(settings.width, settings.height); }
  catch (cause) { dimensionsError = message(cause); }

  function update(patch: Partial<ImageSettings>) {
    setSettings(current => ({ ...current, ...patch }));
    setStatus(''); setError('');
    setView('result');
  }
  function reset(source = image) {
    if (!source) return;
    setSettings(defaultSettings(source.naturalWidth, source.naturalHeight));
    ratio.current = source.naturalWidth / source.naturalHeight;
    setPreset('original'); setLocked(true); setView('result'); setStatus('Ajustes restaurados. A imagem original foi preservada.'); setError('');
  }
  async function upload(file?: File) {
    if (!file || busy) return;
    const id = ++operation.current;
    setBusy(true); setError(''); setStatus('');
    try {
      const source = await loadImage(file);
      if (!live.current || id !== operation.current) { source.src = ''; return; }
      setImage(source); setName(file.name); reset(source);
      const safe = boundedSize(source.naturalWidth, source.naturalHeight);
      setStatus(safe.width !== source.naturalWidth || safe.height !== source.naturalHeight
        ? 'Imagem carregada. A saída foi reduzida proporcionalmente para respeitar os limites de memória.'
        : 'Imagem carregada. Ajuste o formato e veja o resultado antes de baixar.');
    } catch (cause) { if (live.current && id === operation.current) setError(message(cause)); }
    finally { if (live.current && id === operation.current) setBusy(false); }
  }
  function selectPreset(id: Preset) {
    setPreset(id);
    if (id === 'custom') return;
    const selected = presets.find(item => item.id === id)!;
    const size = id === 'original' && image ? boundedSize(image.naturalWidth, image.naturalHeight) : { width: selected.width, height: selected.height };
    ratio.current = id === 'original' && image ? image.naturalWidth / image.naturalHeight : size.width / size.height;
    setLocked(true);
    update({ ...size, positionX: 50, positionY: 50 });
  }
  function dimension(value: number, axis: 'width' | 'height') {
    setPreset('custom');
    update(axis === 'width'
      ? { width: value, ...(locked ? { height: Math.max(1, Math.round(value / ratio.current)) } : {}) }
      : { height: value, ...(locked ? { width: Math.max(1, Math.round(value * ratio.current)) } : {}) });
  }
  async function download() {
    if (!image || busy || dimensionsError) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const blob = await exportImage(image, settings);
      if (!live.current) return;
      const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[settings.format];
      downloadBlob(blob, (name.replace(/\.[^.]+$/, '') || 'utilhub') + '-' + settings.width + 'x' + settings.height + '.' + extension);
      setStatus('Imagem exportada (' + (blob.size / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' KB). Download iniciado.');
    } catch (cause) { if (live.current) setError(message(cause)); }
    finally { if (live.current) setBusy(false); }
  }

  return <><PageIntro eyebrow="CRIATIVIDADE" title="Uma nova forma para sua imagem." description="Redimensione, enquadre e converta sem distorcer. Seu arquivo continua sendo só seu."/>
    <div className="split image-split image-editor">
      <section className="panel preview-panel">
        <label className={'upload-zone ' + (dragging ? 'dragging' : '')}
          onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files[0]); }}>
          <Upload size={26}/><strong>{image ? 'Escolher outra imagem' : 'Solte sua imagem aqui'}</strong>
          <span>ou clique para selecionar um arquivo</span><small>PNG, JPEG, WebP, GIF, AVIF ou BMP · até 25 MB</small>
          <input aria-label="Selecionar imagem" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }}/>
        </label>
        <div className="preview-heading"><h2>Pré-visualização</h2><div className="preview-tabs" role="group" aria-label="Comparar imagem">
          <button disabled={!image} aria-pressed={view === 'result'} onClick={() => setView('result')}>Resultado</button>
          <button disabled={!image} aria-pressed={view === 'original'} onClick={() => setView('original')}>Original</button>
        </div></div>
        <div className={'image-preview final-preview ' + (!preview ? 'no-image' : '')} aria-busy={previewBusy}>
          {preview && <img src={preview} alt={view === 'original' ? 'Imagem original, sem os ajustes de exportação' : 'Resultado final do enquadramento'}/>}
          {!preview && <><ImageIcon size={38}/><span>{previewBusy ? 'Atualizando prévia…' : image ? 'Ajuste as configurações para visualizar' : 'Sua imagem aparecerá aqui'}</span></>}
        </div>
        {image && <><p className="image-meta">{name}</p><div className="image-dimensions-summary">
          <span>Original<strong>{image.naturalWidth} × {image.naturalHeight} px</strong></span>
          <span>Saída<strong>{settings.width || '—'} × {settings.height || '—'} px</strong></span>
        </div><p className="helper">Exibindo {view === 'original' ? 'o original' : 'o resultado'} em escala reduzida, sem deformação. A qualidade de compressão pode variar na exportação em resolução total.</p>
          <button className="button secondary full" disabled={busy} onClick={() => reset()}><RotateCcw size={15}/> Restaurar original</button>
        </>}
        {previewError && !dimensionsError && <p className="error" role="alert">{previewError}</p>}
      </section>
      <section className="panel image-controls">
        <h2>Ajustes de exportação</h2>
        <fieldset disabled={!image || busy}><legend className="sr-only">Configuração da imagem</legend>
          <section className="editor-section"><h3><span>01</span> Formato e dimensões</h3>
            <label className="field">Formato predefinido<select value={preset} onChange={event => selectPreset(event.target.value as Preset)}>{presets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <div className="dimensions"><label>Largura (px)<input type="number" min="1" max="8192" step="1" value={settings.width || ''} onChange={event => dimension(+event.target.value, 'width')}/></label>
              <label>Altura (px)<input type="number" min="1" max="8192" step="1" value={settings.height || ''} onChange={event => dimension(+event.target.value, 'height')}/></label></div>
            <button className={'button secondary full ' + (locked ? 'selected' : '')} aria-pressed={locked} onClick={() => { if (!locked && settings.width > 0 && settings.height > 0) ratio.current = settings.width / settings.height; setLocked(!locked); }}>{locked ? <Link2 size={16}/> : <Link2Off size={16}/>} {locked ? 'Proporção bloqueada' : 'Proporção desbloqueada'}</button>
            <p className="helper">O bloqueio mantém a proporção do quadro escolhido. Desbloquear permite mudar o quadro; a imagem nunca é esticada.</p>
            {image && dimensionsError && <p className="error" role="alert">{dimensionsError}</p>}
          </section>
          <section className="editor-section"><h3><span>02</span> Enquadramento sem distorção</h3>
            <div className="fit-options" role="group" aria-label="Modo de ajuste">{modes.map(mode => <button key={mode.id} className={settings.mode === mode.id ? 'selected' : ''} aria-pressed={settings.mode === mode.id} onClick={() => update({ mode: mode.id, ...(mode.id === 'adapt' && settings.background === 'transparent' ? { background: 'color' as const } : {}) })}><strong>{mode.label}</strong><small>{mode.description}</small></button>)}</div>
            {settings.mode === 'cover' && <div className="crop-controls"><label className="field">Posição horizontal: {settings.positionX}%<input type="range" min="0" max="100" value={settings.positionX} onChange={event => update({ positionX: +event.target.value })}/></label>
              <label className="field">Posição vertical: {settings.positionY}%<input type="range" min="0" max="100" value={settings.positionY} onChange={event => update({ positionY: +event.target.value })}/></label>
              <button className="button secondary full" onClick={() => update({ positionX: 50, positionY: 50 })}>Centralizar enquadramento</button>
              <p className="helper">Mova o recorte para preservar o que mais importa. O controle só altera eixos com conteúdo excedente.</p>
            </div>}
            {settings.mode === 'adapt' && <><label className="field">Fundo personalizado<select value={settings.background === 'blur' ? 'blur' : 'color'} onChange={event => update({ background: event.target.value as 'blur' | 'color' })}><option value="color">Cor sólida</option><option value="blur">Desfocado da própria imagem</option></select></label>
              <label className="field color-field">{settings.background === 'blur' ? 'Cor de base para áreas transparentes' : 'Cor do fundo'}<input type="color" value={settings.color} onChange={event => update({ color: event.target.value })}/><span>{settings.color.toUpperCase()}</span></label></>}
          </section>
          <section className="editor-section"><h3><span>03</span> Arquivo de saída</h3>
            <label className="field">Formato de saída<select value={settings.format} onChange={event => update({ format: event.target.value as ImageSettings['format'] })}><option value="image/png">PNG — transparência e qualidade</option><option value="image/jpeg">JPEG — arquivos menores</option><option value="image/webp">WebP — leve e versátil</option></select></label>
            {settings.format !== 'image/png' && <label className="field">Qualidade: {Math.round(settings.quality * 100)}%<input type="range" min=".1" max="1" step=".05" value={settings.quality} onChange={event => update({ quality: +event.target.value })}/></label>}
            <p className="helper">{settings.mode === 'adapt' ? 'O fundo escolhido compõe a imagem, incluindo áreas transparentes.' : settings.format === 'image/jpeg' ? 'JPEG não tem transparência: áreas transparentes e margens recebem fundo branco.' : 'PNG e WebP preservam a transparência da imagem e das margens.'} O quadriculado da prévia indica transparência e não aparece no arquivo.</p>
            <p className="helper">Saída: até 16 megapixels e 8.192 px por lado para limitar o uso de memória. GIF e outros arquivos animados são convertidos em imagem estática.</p>
          </section>
        </fieldset>
        <button className="button primary full" disabled={!image || busy || !!dimensionsError || !!previewError || previewBusy} onClick={download}><Download size={18}/>{busy ? 'Processando…' : 'Baixar imagem'}</button>
        <p role="status" className="helper">{busy ? 'Processando imagem no seu navegador…' : status}</p>
        {error && <p className="error" role="alert">{error}</p>}
      </section>
    </div><PrivacyNote/></>;
}
