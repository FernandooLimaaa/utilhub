import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { categoryFor, searchTools } from '../config/tools';

export default function GlobalSearch({ open, close }: { open: boolean; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const results = searchTools(query);
  useEffect(() => {
    const dialog = ref.current; if (!dialog) return;
    if (open) { setQuery(''); dialog.showModal(); input.current?.focus(); }
    else if (dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="search-dialog" aria-labelledby="global-search-title" onCancel={close} onClose={close} onClick={event => { if (event.target === ref.current) { const rect = ref.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
    <div className="search-dialog-header"><Search size={20}/><h2 id="global-search-title">Encontre sua próxima solução</h2><button className="icon-button" aria-label="Fechar pesquisa" onClick={close}><X size={20}/></button></div>
    <label className="sr-only" htmlFor="global-search">Pesquisar ferramentas</label><input ref={input} id="global-search" placeholder="Imagem, texto, currículo, QR…" value={query} onChange={event => setQuery(event.target.value)}/>
    <span className="search-result-count" role="status">{results.length} ferramenta{results.length !== 1 ? 's' : ''} encontrada{results.length !== 1 ? 's' : ''}</span>
    <div className="search-results">{results.map(tool => <a href={'#/' + tool.id} key={tool.id} onClick={close}><span className={'search-tool-icon ' + tool.color}><tool.icon size={20}/></span><span><strong>{tool.title}</strong><small>{categoryFor(tool.id)?.label}</small></span><ArrowUpRight size={17}/></a>)}{!results.length && <p className="search-empty">Nenhuma ferramenta por aqui. Tente outro termo.</p>}</div><div className="search-dialog-footer">Use Tab para navegar e Enter para abrir.<kbd>Esc para fechar</kbd></div>
  </dialog>;
}
