import { useRef } from 'react';
import { ArrowUpRight, ArrowRight, Star } from 'lucide-react';
import { categoryFor } from '../config/tools';
import type { Tool } from '../config/tools';
import { useToolPreferences } from './ToolPreferences';

export default function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  const ref = useRef<HTMLElement>(null);
  const { favorites, toggleFavorite } = useToolPreferences();
  const favorite = favorites.includes(tool.id);
  function reset() {
    const element = ref.current; if (!element) return;
    element.style.setProperty('--rx', '0deg'); element.style.setProperty('--ry', '0deg');
    element.style.setProperty('--mx', '50%'); element.style.setProperty('--my', '50%');
  }
  return <div className="tool-card-entry" data-reveal style={{ transitionDelay: Math.min(index * 35, 160) + 'ms' }}><article ref={ref} className={'tool-card ' + tool.color} style={{ animationDelay: Math.min(index * 45, 250) + 'ms' }}
    onPointerMove={event => {
      if (event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const element = ref.current!; const rect = element.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      element.style.setProperty('--rx', (-(y - .5) * 7).toFixed(2) + 'deg');
      element.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
      element.style.setProperty('--mx', x * 100 + '%'); element.style.setProperty('--my', y * 100 + '%');
    }} onPointerLeave={reset} onPointerCancel={reset}>
    <div className="card-top"><span className="tool-icon"><tool.icon size={25}/></span><button className={'card-favorite ' + (favorite ? 'is-favorite' : '')} aria-label={(favorite ? 'Remover dos favoritos: ' : 'Favoritar: ') + tool.title} aria-pressed={favorite} onClick={() => toggleFavorite(tool.id)}><Star size={17} fill={favorite ? 'currentColor' : 'none'}/></button></div>
    <span className="card-category">{categoryFor(tool.id)?.label}</span><h3><a className="tool-card-link" href={'#/' + tool.id}>{tool.title}<ArrowUpRight size={18} className="card-arrow"/></a></h3><p>{tool.description}</p><div className="tags">{tool.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="card-bottom"><span>{tool.detail}</span><ArrowRight size={16}/></div>
  </article></div>;
}
