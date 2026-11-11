import { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus('Copiado!'); }
    catch { setStatus('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
  }
  return <div className="copy-wrap"><button className="button secondary" disabled={!text} onClick={copy}>{status === 'Copiado!' ? <Check size={16}/> : <Copy size={16}/>} Copiar</button><span role="status" className="copy-status">{status}</span></div>;
}
export function PrivacyNote() { return <div className="privacy-note"><ShieldCheck size={17}/><span>Seus dados ficam aqui. Tudo é processado no seu navegador.</span></div>; }
export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>;
}
