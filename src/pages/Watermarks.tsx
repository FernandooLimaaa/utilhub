import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Download, RotateCcw, Stamp, Undo2, Redo2, Move } from 'lucide-react';
import LocalImageInput, { useLocalImage } from '../components/LocalImageInput';
import { PageIntro, PrivacyNote } from '../components/ui';
import { defaultWatermark, watermarkBlob, renderWatermark, watermarkLayout } from '../services/watermark';
import type { WatermarkSettings } from '../services/watermark';
import { downloadBlob } from '../services/images';
import { boundedSize } from '../services/imageLayout';
import { useHistory } from '../components/useHistory';
import { validateBatch, watermarkBatch } from '../services/watermarkBatch';

export default function Watermarks() {
  const source = useLocalImage(), logo = useLocalImage();
  const history = useHistory<WatermarkSettings>(defaultWatermark), settings = history.value;
  const [error, setError] = useState(''), [status, setStatus] = useState('');
  const [rendering, setRendering] = useState(false), [exporting, setExporting] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{pointerId: number; startX: number; startY: number; x: number; y: number; travelX: number; travelY: number} | null>(null);
  const [batch, setBatch] = useState<File[]>([]), [progress, setProgress] = useState<{done: number; total: number; name: string} | null>(null);
  const controller = useRef<AbortController | null>(null), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; controller.current?.abort(); }; }, []);
  function update(patch: Partial<WatermarkSettings>) { history.set({ ...settings, ...patch }); setStatus(''); }
  useEffect(() => {
    if (!source.image) return;
    setRendering(true); setError('');
    const frame = requestAnimationFrame(() => {
      try {
        if (canvas.current) { renderWatermark(canvas.current, source.image!, logo.image, settings, true); canvas.current.dataset.ready = 'true'; }
      } catch (cause) { if (canvas.current) canvas.current.dataset.ready = 'false'; setError((cause as Error).message); }
      finally { setRendering(false); }
    });
    return () => cancelAnimationFrame(frame);
  }, [source.image, logo.image, settings]);
  function startDrag(event: PointerEvent<HTMLCanvasElement>) {
    if (!source.image || settings.repeat || exporting || error || event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget, rect = target.getBoundingClientRect();
    const layout = watermarkLayout(target.getContext('2d')!, target.width, target.height, logo.image, settings);
    history.begin(); target.setPointerCapture(event.pointerId); target.focus();
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: settings.x, y: settings.y, travelX: rect.width * (1 - layout.marginX * 2 / target.width), travelY: rect.height * (1 - layout.marginY * 2 / target.height) };
  }
  function moveDrag(event: PointerEvent<HTMLCanvasElement>) {
    const current = drag.current; if (!current || current.pointerId !== event.pointerId) return;
    update({ x: current.travelX > 0 ? Math.round(Math.max(0, Math.min(100, current.x + (event.clientX - current.startX) / current.travelX * 100))) : 50, y: current.travelY > 0 ? Math.round(Math.max(0, Math.min(100, current.y + (event.clientY - current.startY) / current.travelY * 100))) : 50 });
  }
  function stopDrag() { if (drag.current) { drag.current = null; history.end(); } }
  function selectBatch(files: File[]) {
    if (!files.length) return;
    try { validateBatch(files); setBatch(files); setProgress(null); setError(''); setStatus(files.length + ' imagens selecionadas. A prévia mostra a primeira.'); void source.select(files[0]); }
    catch (cause) { setError((cause as Error).message); }
  }
  async function exportBatch() {
    if (exporting || !batch.length) return;
    setExporting(true); setError(''); setStatus('');
    const abort = new AbortController(); controller.current = abort;
    try {
      const archive = await watermarkBatch(batch, logo.image, settings, (done, total, name) => { if (live.current) setProgress({ done, total, name }); }, abort.signal);
      if (live.current && !abort.signal.aborted) { downloadBlob(archive, 'utilhub-marcas-dagua.zip'); setStatus('Lote concluído. ZIP com ' + batch.length + ' imagens exportado.'); }
    } catch (cause) { if (live.current) { if (abort.signal.aborted) setStatus('Lote cancelado. Nenhum arquivo foi alterado.'); else setError((cause as Error).message); } }
    finally { if (live.current) setExporting(false); controller.current = null; }
  }
  async function download() {
    if (!source.image || exporting) return;
    setExporting(true); setError(''); setStatus('');
    try {
      const blob = await watermarkBlob(source.image, logo.image, settings);
      if (!live.current) return;
      downloadBlob(blob, (source.name.replace(/\.[^.]+$/, '') || 'imagem') + '-marca-dagua.' + ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[settings.format]));
      setStatus('Imagem com marca-d’água exportada. O arquivo original não foi alterado.');
    } catch (cause) { setError((cause as Error).message); }
    finally { setExporting(false); }
  }
  const size = source.image ? boundedSize(source.image.naturalWidth, source.image.naturalHeight) : null;
  return <><PageIntro eyebrow="CRIATIVIDADE" title="Sua assinatura, na sua imagem." description="Adicione texto ou logo, ajuste o estilo e proteja sua autoria com uma marca-d’água local."/>
    <div className="split image-split image-editor watermark-editor" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !(event.target as HTMLElement).matches('input,textarea,select')) { event.preventDefault(); if (event.shiftKey) history.redo(); else history.undo(); } }}><section className="panel preview-panel">
      <LocalImageInput label="Selecionar imagem base" busy={source.busy || exporting} onSelect={file => { if (file) { setBatch([]); setProgress(null); setStatus(''); void source.select(file); } }}/>
      <div className="watermark-workspace-toolbar"><span><Move size={15}/> Sua área de criação</span><div><button className="icon-button" disabled={!history.canUndo || exporting} aria-label="Desfazer ajuste" onClick={history.undo}><Undo2 size={17}/></button><button className="icon-button" disabled={!history.canRedo || exporting} aria-label="Refazer ajuste" onClick={history.redo}><Redo2 size={17}/></button></div></div>
      <div className="image-preview final-preview" aria-busy={rendering}><canvas ref={canvas} data-testid="watermark-canvas" role="img" aria-label="Prévia da marca-d’água. Arraste para posicionar ou use as setas do teclado." tabIndex={source.image && !settings.repeat ? 0 : -1} style={{ display: source.image ? 'block' : 'none', touchAction: source.image && !settings.repeat ? 'none' : 'auto', cursor: settings.repeat ? 'default' : 'move' }} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag} onKeyDown={event => { if (!source.image || settings.repeat || exporting) return; const step = event.shiftKey ? 10 : 2; const changes: Record<string, Partial<WatermarkSettings>> = { ArrowLeft: { x: Math.max(0, settings.x - step) }, ArrowRight: { x: Math.min(100, settings.x + step) }, ArrowUp: { y: Math.max(0, settings.y - step) }, ArrowDown: { y: Math.min(100, settings.y + step) } }; if (changes[event.key]) { event.preventDefault(); update(changes[event.key]); } }}/>{!source.image && <div className="empty-preview"><Stamp size={38}/><span>Sua assinatura começa por uma imagem</span></div>}</div>
      <p className="helper">Arraste a marca com mouse ou toque. Pelo teclado: foque na prévia e use as setas; Shift aumenta o passo. Ctrl/⌘ Z desfaz, Shift refaz.</p>
      {source.image && size && <><p className="image-meta">{source.name} · original {source.image.naturalWidth} × {source.image.naturalHeight} px</p><p className="helper">Saída: {size.width} × {size.height} px. Prévia em escala reduzida. Imagens grandes são reduzidas proporcionalmente para até 16 MP / 8.192 px.</p></>}
      <section className="watermark-batch"><h3>Uma assinatura. Várias imagens.</h3><label className="batch-input">Selecionar lote (até 10 imagens)<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" disabled={exporting} onChange={event => { selectBatch(Array.from(event.target.files || [])); event.target.value = ''; }}/></label>{batch.length > 0 && <><ul>{batch.map((file, index) => <li key={index}>{file.name}</li>)}</ul><div className="toolbar"><button className="button primary" disabled={exporting || source.busy || logo.busy || rendering || !!error} onClick={exportBatch}><Download size={15}/> Exportar {batch.length} imagens em ZIP</button><button className="text-button" disabled={exporting} onClick={() => { setBatch([]); setProgress(null); }}>Limpar lote</button></div></>}<p className="helper">25 MB por arquivo, 100 MB na entrada e até 64 MB de saída por lote. Cada imagem é decodificada separadamente. A marca usa tamanho e posição proporcionais em todos os formatos.</p>{progress && <div className="batch-progress" role="status"><label htmlFor="batch-progress">{progress.done} de {progress.total} imagens processadas</label><progress id="batch-progress" max={progress.total} value={progress.done}/><span>{progress.done === progress.total ? (exporting ? 'Preparando ZIP…' : 'Lote finalizado.') : (exporting ? progress.name : 'Processamento encerrado.')}</span></div>}{exporting && controller.current && <button className="button secondary full" onClick={() => controller.current?.abort()}>Cancelar lote</button>}</section>
    </section><section className="panel image-controls"><h2>Personalize sua assinatura</h2><fieldset disabled={exporting} onPointerDown={event => { if ((event.target as HTMLElement).matches('input[type=range]')) history.begin(); }} onPointerUp={history.end} onPointerCancel={history.end}>
      <div className="segmented" role="group" aria-label="Tipo de marca-d’água"><button aria-pressed={settings.kind === 'text'} onClick={() => update({ kind: 'text' })}>Texto</button><button aria-pressed={settings.kind === 'logo'} onClick={() => update({ kind: 'logo' })}>Logo</button></div>
      {settings.kind === 'text' ? <><label className="field">Texto da marca<input maxLength={120} value={settings.text} onChange={event => update({ text: event.target.value })}/></label><div className="dimensions"><label className="field">Tipografia<select value={settings.font} onChange={event => update({ font: event.target.value as WatermarkSettings['font'] })}><option value="sans-serif">Moderna</option><option value="serif">Clássica</option><option value="monospace">Monoespaçada</option></select></label><label className="field">Cor<input type="color" value={settings.color} onChange={event => update({ color: event.target.value })}/></label></div></> : <><div className="field"><LocalImageInput label="Selecionar logo" busy={logo.busy} onSelect={logo.select}/></div>{logo.image && <p className="helper">{logo.name} <button className="text-button" onClick={logo.clear}>Remover logo</button></p>}<p className="helper">Use PNG ou WebP transparente para manter o recorte do logo.</p></>}
      <label className="field">Tamanho: {settings.size}%<input type="range" min="3" max="60" value={settings.size} onChange={event => update({ size: +event.target.value })}/></label>
      <label className="field">Opacidade: {Math.round(settings.opacity * 100)}%<input type="range" min=".05" max="1" step=".05" value={settings.opacity} onChange={event => update({ opacity: +event.target.value })}/></label>
      <label className="field">Rotação: {settings.rotation}°<input type="range" min="-180" max="180" value={settings.rotation} onChange={event => update({ rotation: +event.target.value })}/></label>
      <label className="check-row"><span><strong>Repetir em mosaico</strong><small>Distribui a assinatura por toda a imagem</small></span><input type="checkbox" checked={settings.repeat} onChange={event => update({ repeat: event.target.checked })}/></label>
      {!settings.repeat && <><label className="field">Posição horizontal: {settings.x}%<input type="range" min="0" max="100" value={settings.x} onChange={event => update({ x: +event.target.value })}/></label><label className="field">Posição vertical: {settings.y}%<input type="range" min="0" max="100" value={settings.y} onChange={event => update({ y: +event.target.value })}/></label></>}
      {!settings.repeat && <div className="position-presets" role="group" aria-label="Posições predefinidas">{[0, 50, 100].flatMap((y, row) => [0, 50, 100].map((x, col) => <button key={x + '-' + y} className={settings.x === x && settings.y === y ? 'selected' : ''} aria-pressed={settings.x === x && settings.y === y} aria-label={['Superior', 'Centro', 'Inferior'][row] + ' ' + ['esquerda', 'centro', 'direita'][col]} onClick={() => update({ x, y })}><span/></button>))}</div>}
      <label className="field">Formato de saída<select value={settings.format} onChange={event => update({ format: event.target.value as WatermarkSettings['format'] })}><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
      {settings.format !== 'image/png' && <label className="field">Qualidade: {Math.round(settings.quality * 100)}%<input type="range" min=".1" max="1" step=".05" value={settings.quality} onChange={event => update({ quality: +event.target.value })}/></label>}
      <p className="helper">PNG/WebP preservam transparência. JPEG usa fundo branco. Animações são exportadas como imagem estática.</p>
      <div className="toolbar"><button className="button secondary" onClick={() => { history.set({ ...defaultWatermark }); setStatus('Ajustes restaurados.'); }}><RotateCcw size={15}/> Restaurar ajustes</button><button className="button primary" disabled={!source.image || source.busy || logo.busy || rendering || !!error} onClick={download}><Download size={16}/>{exporting ? 'Exportando…' : 'Baixar imagem'}</button></div>
    </fieldset>{[source.error, logo.error, error].filter(Boolean).map((text, index) => <p className="error" role="alert" key={index}>{text}</p>)}<p className="helper" role="status">{status}</p></section></div><PrivacyNote/></>;
}
