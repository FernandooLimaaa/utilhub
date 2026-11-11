import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ArrowUpRight, Grid2X2, Moon, Sun, ShieldCheck, Menu, X, ChevronRight, Search, Sparkles, ArrowRight, MessageSquareText } from 'lucide-react';
import { tools, categories, categoryFor } from './config/tools';
import Home from './pages/Home';
import GlobalSearch from './components/GlobalSearch';
import { ToolPreferences, useToolPreferences } from './components/ToolPreferences';
import FeedbackLauncher from './components/feedback/FeedbackLauncher';

const pages = {
  imagens: lazy(() => import('./pages/Images')), texto: lazy(() => import('./pages/TextTools')),
  precos: lazy(() => import('./pages/Prices')), senhas: lazy(() => import('./pages/Passwords')),
  'marcas-dagua': lazy(() => import('./pages/Watermarks')), curriculos: lazy(() => import('./pages/Resumes')),
  colorlab: lazy(() => import('./pages/ColorLab')), qr: lazy(() => import('./pages/QrStudio')),
  feedback: lazy(() => import('./pages/Feedback')),
};
const getRoute = () => window.location.hash.startsWith('#/') ? window.location.hash.slice(2).split('?')[0] : '';
function initialTheme() { try { const value = localStorage.getItem('utilhub-theme'); return value === 'dark' || value === 'light' ? value : 'dark'; } catch { return 'dark'; } }
class PageBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Error UI provides recovery without logging user data. */ }
  render() { return this.state.failed ? <section className="empty-state" role="alert"><h1>Não foi possível abrir a ferramenta.</h1><p>Confira sua conexão e recarregue a página para tentar novamente.</p><button className="button primary" onClick={() => location.reload()}>Recarregar</button></section> : this.props.children; }
}
function Workspace() {
  const [route, setRoute] = useState(getRoute), [theme, setTheme] = useState(initialTheme);
  const [menu, setMenu] = useState(false), [searchOpen, setSearchOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null), menuTrigger = useRef<HTMLButtonElement>(null);
  const { remember } = useToolPreferences();
  useEffect(() => {
    const onHash = () => {
      if (!location.hash.startsWith('#/')) return;
      setRoute(getRoute()); setMenu(false); setSearchOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
    };
    const onKey = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (document.querySelector('.feedback-dialog[open]')) return; setMenu(false); setSearchOpen(open => !open); } };
    window.addEventListener('hashchange', onHash); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1210' : '#f3f6ef');
    try { localStorage.setItem('utilhub-theme', theme); } catch { /* Theme remains usable for the session. */ }
  }, [theme]);
  useEffect(() => { remember(route); }, [route, remember]);
  useEffect(() => {
    const wide = matchMedia('(min-width: 761px)');
    const close = () => { if (wide.matches) setMenu(false); };
    wide.addEventListener('change', close); return () => wide.removeEventListener('change', close);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLElement>('a,button')?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),summary') || []).filter(element => element.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', trap); menuTrigger.current?.focus(); };
  }, [menu]);
  const tool = tools.find(item => item.id === route);
  const Page = Object.hasOwn(pages, route) ? pages[route as keyof typeof pages] : undefined;
  useEffect(() => { document.title = route === 'feedback' ? 'Central de Feedback | UtilHub' : tool ? tool.title + ' | UtilHub' : 'UtilHub — Todas as ferramentas, em um só lugar.'; }, [tool, route]);

  return <><a className="skip-link" href="#main">Pular para o conteúdo</a>
    <aside ref={sidebar} className={'sidebar ' + (menu ? 'is-open' : '')} role={menu ? 'dialog' : undefined} aria-modal={menu ? true : undefined} aria-label="Navegação do UtilHub" id="sidebar-navigation">
      <div className="sidebar-brand-row"><a className="brand" href="#/"><span className="brand-mark">u<span>•</span></span>utilhub<span className="brand-dot">.</span></a><button className="icon-button sidebar-close" aria-label="Fechar navegação" onClick={() => setMenu(false)}><X size={21}/></button></div>
      <span className="sidebar-label">UM HUB. INFINITAS POSSIBILIDADES.</span>
      <button className="sidebar-search" onClick={() => { setMenu(false); setSearchOpen(true); }}><Search size={16}/><span>Buscar ferramenta</span><kbd>⌘ K</kbd></button>
      <nav aria-label="Navegação principal" onClick={event => { if ((event.target as HTMLElement).closest('a')) setMenu(false); }}><a href="#/" className={!route ? 'active overview-link' : 'overview-link'} aria-current={!route ? 'page' : undefined}><Grid2X2 size={18}/> Visão geral {!route && <span className="active-dot"/>}</a>
        {categories.filter(category => category.tools.length).map(category => <details className="nav-category" key={category.id} open><summary>{category.label}<ChevronRight size={12}/></summary><div>{tools.filter(item => (category.tools as readonly string[]).includes(item.id)).map(item => <a key={item.id} href={'#/' + item.id} className={route === item.id ? 'active' : ''} aria-current={route === item.id ? 'page' : undefined}><item.icon size={17}/>{item.short}{route === item.id && <span className="active-dot"/>}</a>)}</div></details>)}
        <a href="#/feedback" className={'nav-feedback ' + (route === 'feedback' ? 'active' : '')} aria-current={route === 'feedback' ? 'page' : undefined}><MessageSquareText size={17}/> Central de Feedback {route === 'feedback' && <span className="active-dot"/>}</a>
      </nav>
      <div className="sidebar-bottom"><div className="local-card"><span className="local-icon"><ShieldCheck size={21}/></span><div><strong>Privado por natureza.</strong><p>Seus arquivos ficam com você.</p></div><span className="local-badge"><i/> LOCAL</span></div><button className="theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}<span>Tema {theme === 'dark' ? 'claro' : 'escuro'}</span><span className="theme-toggle"/></button><div className="sidebar-version"><span>UTILHUB <i>✳</i></span><span>GRATUITO, SEMPRE.</span></div></div>
    </aside>
    {menu && <div className="menu-overlay" onClick={() => setMenu(false)} aria-hidden="true"/>}
    <div className="workspace" inert={menu || undefined}><header className="topbar"><div className="breadcrumbs"><button ref={menuTrigger} className="icon-button mobile-menu" aria-label="Abrir menu" aria-controls="sidebar-navigation" aria-expanded={menu} onClick={() => setMenu(true)}><Menu size={22}/></button><span>{tool ? categoryFor(tool.id)?.label : 'Seu workspace'}</span><ChevronRight size={13}/><strong>{route === 'feedback' ? 'Central de Feedback' : tool?.title || 'Visão geral'}</strong></div><div className="topbar-actions"><button className="topbar-search icon-button" aria-label="Abrir pesquisa global" aria-keyshortcuts="Control+k Meta+k" onClick={() => setSearchOpen(true)}><Search size={18}/><kbd>Ctrl K</kbd></button><span className="topbar-tag"><span/> SEM LIMITES PARA CRIAR <ArrowUpRight size={13}/></span></div></header>
      <main id="main" tabIndex={-1}><div key={route} className="page-transition"><PageBoundary><Suspense fallback={<div className="page-loading" role="status"><Sparkles size={25}/><span>Preparando sua ferramenta…</span></div>}>{Page ? <Page/> : route ? <section className="empty-state"><h1>Ferramenta não encontrada.</h1><a className="button primary" href="#/">Voltar ao início</a></section> : <Home/>}</Suspense></PageBoundary></div></main>
      <footer className="premium-footer"><div><a href="#/" className="footer-brand">utilhub<span>✳</span></a><p>Pequenas ferramentas. Grandes possibilidades.</p></div><div><span>© {new Date().getFullYear()} UtilHub</span><small>Gratuito. Local. Feito para todos.</small></div><a href="#/" className="footer-top">Explore seu próximo passo <ArrowRight size={17}/></a></footer>
    </div><GlobalSearch open={searchOpen} close={() => setSearchOpen(false)}/><FeedbackLauncher route={route} hidden={menu || searchOpen}/></>;
}
export default function App() { return <ToolPreferences><Workspace/></ToolPreferences>; }
