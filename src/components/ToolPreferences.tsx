import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { tools } from '../config/tools';

type Preferences = { favorites: string[]; recent: string[]; toggleFavorite: (id: string) => void; remember: (id: string) => void; clearRecent: () => void; persistent: boolean };
const Context = createContext<Preferences | null>(null);
const known = new Set<string>(tools.map(tool => tool.id));
function read(key: string) {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && known.has(id)))].slice(0, 12) : [];
  } catch { return []; }
}
export function ToolPreferences({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState(() => read('utilhub-favorites'));
  const [recent, setRecent] = useState(() => read('utilhub-recent'));
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    try { localStorage.setItem('utilhub-favorites', JSON.stringify(favorites)); localStorage.setItem('utilhub-recent', JSON.stringify(recent)); setPersistent(true); }
    catch { setPersistent(false); }
  }, [favorites, recent]);
  const toggleFavorite = useCallback((id: string) => { if (known.has(id)) setFavorites(list => list.includes(id) ? list.filter(item => item !== id) : [...list, id]); }, []);
  const remember = useCallback((id: string) => { if (known.has(id)) setRecent(list => [id, ...list.filter(item => item !== id)].slice(0, 5)); }, []);
  const clearRecent = useCallback(() => setRecent([]), []);
  return <Context.Provider value={{ favorites, recent, toggleFavorite, remember, clearRecent, persistent }}>{children}</Context.Provider>;
}
export function useToolPreferences() { const context = useContext(Context); if (!context) throw new Error('Preferências indisponíveis.'); return context; }
