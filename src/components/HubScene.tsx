import { useEffect, useRef } from 'react';
import { Image, Type, Palette, QrCode, Sparkles, ShieldCheck } from 'lucide-react';

/** CSS 3D only: no GPU context, model download, or animation render loop. */
export default function HubScene() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current; if (!element || !('IntersectionObserver' in window)) return;
    let visible = true;
    const pause = () => element.classList.toggle('scene-paused', !visible || document.hidden);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; pause(); }, { threshold: .05 });
    observer.observe(element); document.addEventListener('visibilitychange', pause);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', pause); };
  }, []);
  return <div ref={ref} className="hub-scene" aria-hidden="true"><div className="scene-aura"/><div className="scene-grid"/><div className="scene-orbit orbit-a"/><div className="scene-orbit orbit-b"/>
    <div className="scene-core"><div className="core-glass"><span className="core-cross">✳</span><span className="core-logo">u<span>•</span></span><span className="core-caption">YOUR DIGITAL CORE</span></div><div className="core-base"/></div>
    <div className="scene-chip chip-image"><Image/><span>Imagens<br/><strong>Novas perspectivas.</strong></span><span className="chip-light"/></div>
    <div className="scene-chip chip-color"><Palette/><div className="mini-swatches"><i/><i/><i/></div></div>
    <div className="scene-chip chip-text"><Type/><span>Aa<span className="mini-lines"><i/><i/></span></span></div>
    <div className="scene-chip chip-qr"><QrCode size={37}/><span>IDEIAS<br/>CONECTADAS</span></div>
    <span className="scene-dot dot-a"/><span className="scene-dot dot-b"/><span className="scene-dot dot-c"/><span className="scene-dot dot-d"/>
    <div className="scene-label"><Sparkles size={13}/> Menos limites. Mais possibilidades.</div><div className="scene-privacy"><ShieldCheck size={14}/> Feito no seu navegador.</div>
  </div>;
}
