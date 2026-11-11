import { ArrowUpRight, MessageSquareText, Sparkles } from 'lucide-react';
import { feedback } from '../../config/feedback';

export default function FeedbackCard() {
  return <section className="feedback-home-card" aria-labelledby="feedback-card-title" data-reveal><div className="feedback-card-art" aria-hidden="true"><div className="feedback-glass-tile"><MessageSquareText size={45}/><span>✳</span></div><i/><Sparkles size={17}/></div><div className="feedback-card-copy"><span className="eyebrow">O PRÓXIMO PASSO TEM A SUA VOZ</span><h2 id="feedback-card-title">Ajude a construir o futuro do UtilHub.</h2><p>Sentiu falta de alguma ferramenta? Encontrou um problema? Compartilhe sua opinião.</p><span className="feedback-card-caption">Suas respostas são processadas pelo Google Forms.</span></div><a className="button primary" href={feedback.route}>Enviar meu feedback <ArrowUpRight size={17}/></a></section>;
}
