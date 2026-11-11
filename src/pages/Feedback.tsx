import { MessageSquareText, Sparkles } from 'lucide-react';
import { feedback } from '../config/feedback';
import FeedbackFrame from '../components/feedback/FeedbackFrame';

export default function Feedback() {
  return <div className="feedback-page"><header className="page-intro feedback-page-hero"><div><span className="eyebrow">CENTRAL DE FEEDBACK · CONSTRUÍDO COM VOCÊ</span><h1>{feedback.title}</h1><p>{feedback.subtitle}</p><span className="feedback-page-pill"><Sparkles size={14}/> Cada ideia pode ser o começo de algo melhor.</span></div><div className="feedback-page-art" aria-hidden="true"><div className="feedback-glass-tile"><MessageSquareText size={60}/><span>✳</span></div><i/></div></header><section className="panel feedback-embed-card" aria-label="Envie sua opinião pelo Google Forms"><FeedbackFrame/></section></div>;
}
