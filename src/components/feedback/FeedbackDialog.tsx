import { useEffect, useId, useRef } from 'react';
import { MessageSquareText, X, ArrowUpRight } from 'lucide-react';
import { feedback } from '../../config/feedback';
import FeedbackFrame from './FeedbackFrame';

export default function FeedbackDialog({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.setAttribute('closedby', 'any');
    element.showModal(); closeButton.current?.focus();
    return () => { element.close(); if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="feedback-dialog" aria-labelledby={titleId} onClose={() => { if (dialog.current && !dialog.current.open) close(); }} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    // Only the UtilHub dialog's controls: never inspect the external document.
    const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],iframe') || []);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onClick={event => { if (event.target !== dialog.current) return; const rect = dialog.current!.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); }}>
    <header className="feedback-dialog-header"><span className="feedback-message-icon" aria-hidden="true"><MessageSquareText size={24}/></span><div><span className="eyebrow">CENTRAL DE FEEDBACK</span><h2 id={titleId}>{feedback.title}</h2><p>{feedback.subtitle}</p></div><button ref={closeButton} className="icon-button feedback-close" aria-label="Fechar Central de Feedback" onClick={close}><X size={22}/></button></header>
    <div className="feedback-dialog-body"><FeedbackFrame/></div>
    <div className="feedback-dialog-footer"><span>Esc fecha pelos controles do UtilHub. Dentro do formulário, use o botão Fechar acima.</span><a href={feedback.route} onClick={close}>Ver página completa <ArrowUpRight size={13}/></a></div>
  </dialog>;
}
