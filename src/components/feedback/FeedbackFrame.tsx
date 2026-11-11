import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink, LoaderCircle, RefreshCw, Info } from 'lucide-react';
import { feedback } from '../../config/feedback';

export function FeedbackExternalLink() {
  return <a className="button secondary feedback-external" href={feedback.publicUrl} target="_blank" rel="noopener noreferrer">Abrir formulário em outra aba <ExternalLink size={15}/><span className="sr-only"> (Google Forms)</span></a>;
}

export default function FeedbackFrame() {
  const [state, setState] = useState<'loading' | 'loaded' | 'slow' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const description = useId();
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current;
    const failed = () => setState('error');
    element?.addEventListener('error', failed);
    return () => element?.removeEventListener('error', failed);
  }, [attempt]);
  useEffect(() => {
    if (state !== 'loading') return;
    const timeout = setTimeout(() => setState('slow'), 15_000);
    return () => clearTimeout(timeout);
  }, [state, attempt]);
  return <div className="feedback-frame">
    <div className="feedback-frame-actions"><div><span className="feedback-provider"><span className="status-dot"/> GOOGLE FORMS</span><p id={description}>As respostas são enviadas diretamente ao Google Forms, conforme as configurações do formulário. O UtilHub não recebe nem armazena suas respostas.</p></div><FeedbackExternalLink/></div>
    <div className={'feedback-frame-status feedback-state-' + state} role="status" aria-live="polite">
      {state === 'loading' && <><LoaderCircle size={16} className="feedback-spinner"/><span>Abrindo Google Forms…</span></>}
      {state === 'loaded' && <><Info size={15}/><span>Se o formulário não aparecer, use o link acima. A confirmação de envio aparece no próprio Google Forms.</span></>}
      {state === 'slow' && <><Info size={16}/><span>O formulário está demorando para abrir. Você pode usar o link acima ou tentar novamente.</span></>}
      {state === 'error' && <><Info size={16}/><span>Não foi possível concluir a abertura neste quadro. Abra o formulário em outra aba.</span></>}
      {(state === 'slow' || state === 'error') && <button className="text-button feedback-retry" onClick={() => { setState('loading'); setAttempt(value => value + 1); }}><RefreshCw size={13}/> Tentar novamente</button>}
    </div>
    <div className="feedback-iframe-viewport" aria-busy={state === 'loading'}>
      <iframe ref={frame} key={attempt} src={feedback.embeddedUrl} title="Formulário de feedback do UtilHub no Google Forms" aria-describedby={description} referrerPolicy="no-referrer" loading="eager" onLoad={() => setState('loaded')}/>
    </div>
    <p className="feedback-form-note">Não é necessário criar conta no UtilHub. Se o Google solicitar login ou limitar o acesso, isso depende das configurações do formulário. Você pode rolar dentro do quadro para acessar todas as perguntas.</p>
  </div>;
}
