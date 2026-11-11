import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, Search, ShieldCheck, Zap, Globe2, Star, Clock3, Sparkles, X } from 'lucide-react';
import { tools, categories, searchTools } from '../config/tools';
import ToolCard from '../components/ToolCard';
import HubScene from '../components/HubScene';
import { useToolPreferences } from '../components/ToolPreferences';
import FeedbackCard from '../components/feedback/FeedbackCard';

export default function Home() {
  const [query, setQuery] = useState(''), [category, setCategory] = useState('all');
  const { favorites, recent, clearRecent, persistent } = useToolPreferences();
  const root = useRef<HTMLDivElement>(null);
  const results = searchTools(query).filter(tool => category === 'all' || categories.find(item => item.id === category)?.tools.some(id => id === tool.id));
  const popular = ['imagens', 'curriculos', 'qr'].map(id => tools.find(tool => tool.id === id)!);
  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .06 });
    root.current.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => { element.classList.add('reveal-ready'); observer.observe(element); });
    return () => observer.disconnect();
  }, [query, category, favorites.length, recent.length]);
  const toolLinks = (ids: string[]) => ids.map(id => { const tool = tools.find(item => item.id === id)!; return <a className="saved-tool" key={id} href={'#/' + id}><tool.icon size={17}/><span>{tool.title}</span><ArrowUpRight size={15}/></a>; });

  return <div ref={root} className="premium-home">
    <section className="premium-hero">
      <div className="hero-copy"><span className="hero-eyebrow"><span className="status-dot"/> SEU UNIVERSO DE POSSIBILIDADES</span><h1>UtilHub<span className="hero-period">.</span></h1><h2 className="hero-phrase">Todas as ferramentas<br/>que você precisa.<br/><span>Em um só lugar.</span></h2><p>Crie, transforme e simplifique. Um espaço gratuito para suas ideias irem mais longe, com seus dados sempre por perto.</p><div className="hero-actions"><a className="button primary" href="#ferramentas">Explore as ferramentas <ArrowRight size={18}/></a><a href="#privacidade" className="hero-security"><ShieldCheck size={16}/> Privacidade primeiro</a></div><div className="hero-facts"><span><i/> 100% gratuito</span><span><i/> Sem cadastro</span><span><i/> Feito para você</span></div></div>
      <HubScene/>
    </section>
    <div className="home-search" role="search"><Search size={22}/><label className="sr-only" htmlFor="home-search">Pesquisar ferramentas nesta página</label><input id="home-search" value={query} onChange={event => { setQuery(event.target.value); }} placeholder="O que você quer fazer hoje? Busque uma ferramenta…"/>{query ? <button className="icon-button" aria-label="Limpar pesquisa" onClick={() => setQuery('')}><X size={18}/></button> : <span className="search-hint">{tools.length} ferramentas. Infinitas ideias.</span>}</div>
    {!query && <section className="popular-section" data-reveal><div className="section-heading"><div><span className="eyebrow">UM BOM PONTO DE PARTIDA</span><h2>Essenciais para o seu dia.</h2></div><span className="section-note"><Sparkles size={14}/> Acesso rápido</span></div><div className="popular-tools">{popular.map((tool, index) => <a href={'#/' + tool.id} key={tool.id} className={'popular-tool ' + tool.color}><span className="popular-number">0{index + 1}</span><span className="tool-icon"><tool.icon size={22}/></span><span><strong>{tool.title}</strong><small>{tool.detail}</small></span><ArrowUpRight size={19}/></a>)}</div></section>}
    <section id="ferramentas" className="tools-section" data-reveal><div className="section-heading"><div><span className="eyebrow">SEU KIT DIGITAL, REIMAGINADO</span><h2>Uma ferramenta para cada possibilidade.</h2></div><span className="tool-count" role="status">{String(results.length).padStart(2, '0')} ferramentas disponíveis</span></div>
      <div className="category-filters" role="group" aria-label="Filtrar ferramentas por categoria"><button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>Todas <span>{tools.length}</span></button>{categories.filter(item => item.tools.length).map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}<span>{item.tools.length}</span></button>)}</div>
      <div className="tool-grid">{results.map((tool, index) => <ToolCard tool={tool} key={tool.id} index={index}/>)}</div>{!results.length && <div className="home-empty"><Search size={27}/><h3>Nenhuma ferramenta encontrada.</h3><p>Tente outro termo ou explore todas as categorias.</p><button className="button secondary" onClick={() => { setCategory('all'); setQuery(''); }}>Mostrar todas</button></div>}
    </section>
    <section className="personal-tools" data-reveal><div className="personal-panel"><div className="personal-heading"><h2><Star size={17}/> Do seu jeito.</h2><span>{favorites.length} favoritas</span></div>{favorites.length ? <div className="saved-tools">{toolLinks(favorites)}</div> : <div className="saved-empty"><Star size={22}/><p>Suas ferramentas preferidas, sempre à mão.<small>Toque na estrela de um card para guardar aqui.</small></p></div>}</div><div className="personal-panel"><div className="personal-heading"><h2><Clock3 size={17}/> Continue de onde parou.</h2>{recent.length > 0 && <button className="text-button" onClick={clearRecent}>Limpar recentes</button>}</div>{recent.length ? <div className="saved-tools">{toolLinks(recent)}</div> : <div className="saved-empty"><Clock3 size={22}/><p>A próxima ideia começa com um clique.<small>As ferramentas visitadas aparecerão aqui.</small></p></div>}</div></section>
    {!persistent && <p className="helper" role="status">O armazenamento local está indisponível. Favoritos e recentes funcionam durante esta sessão.</p>}
    <section className="privacy-feature" id="privacidade" data-reveal><div className="privacy-art" aria-hidden="true"><div/><ShieldCheck size={52}/><span className="privacy-orbit"/><i/></div><div><span className="eyebrow">SEUS DADOS NÃO PRECISAM VIAJAR</span><h2>Mais controle.<br/><span>Menos exposição.</span></h2><p>Seus arquivos são processados no seu navegador. Nenhum upload para servidores, nenhum cadastro para começar. Só suas ideias ganhando forma.</p><span className="privacy-seal"><span className="status-dot"/> PROCESSAMENTO LOCAL</span></div><div className="privacy-code" aria-hidden="true"><span>✳ PRIVACY BY DESIGN</span><strong>Seus arquivos.<br/>Seu dispositivo.<br/><i>Seu controle.</i></strong><small>LOCAL / PRIVATE / FREE</small></div></section>
    <FeedbackCard/>
    <section className="premium-benefits" data-reveal><div><span className="benefit-icon"><Zap size={23}/></span><h3>Do clique à solução.</h3><p>Sem instalações ou caminhos longos. Abra sua ferramenta e faça acontecer.</p></div><div><span className="benefit-icon"><ShieldCheck size={23}/></span><h3>Privacidade na essência.</h3><p>Seus arquivos ficam com você. Guardamos só as preferências que facilitam seu dia.</p></div><div><span className="benefit-icon"><Globe2 size={23}/></span><h3>Possibilidades para todos.</h3><p>Gratuito, acessível e pronto para caber no seu computador ou na palma da mão.</p></div></section>
  </div>;
}
