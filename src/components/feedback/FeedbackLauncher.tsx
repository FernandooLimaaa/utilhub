import { useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { feedback } from '../../config/feedback';
import FeedbackDialog from './FeedbackDialog';

export default function FeedbackLauncher({ route, hidden }: { route: string; hidden: boolean }) {
  const [open, setOpen] = useState(false), [wide, setWide] = useState(() => matchMedia('(min-width: 761px)').matches);
  useEffect(() => {
    const media = matchMedia('(min-width: 761px)');
    const update = () => setWide(media.matches);
    media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => setOpen(false), [route]);
  return <>
    {!hidden && route !== 'feedback' && <a className="feedback-fab" href={feedback.route} aria-label="Enviar feedback ao UtilHub" aria-haspopup={wide ? 'dialog' : undefined} aria-expanded={wide ? open : undefined} onClick={event => { if (wide) { event.preventDefault(); setOpen(true); } }}><MessageSquareText size={21}/><span>Feedback</span></a>}
    {open && <FeedbackDialog close={() => setOpen(false)}/>}
  </>;
}
