import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadImage } from '../services/images';

export function useLocalImage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => () => { if (image) image.src = ''; }, [image]);
  async function select(file?: File) {
    if (!file) return;
    const id = ++generation.current;
    setBusy(true); setError('');
    try {
      const next = await loadImage(file);
      if (id !== generation.current) { next.src = ''; return; }
      setImage(next); setName(file.name);
    } catch (cause) { if (id === generation.current) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a imagem.'); }
    finally { if (id === generation.current) setBusy(false); }
  }
  function clear() { generation.current++; setImage(null); setName(''); setBusy(false); setError(''); }
  return { image, name, busy, error, select, clear };
}

export default function LocalImageInput({ label, busy, onSelect }: { label: string; busy: boolean; onSelect: (file?: File) => void }) {
  return <label className="upload-zone compact-upload" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy) onSelect(event.dataTransfer.files[0]); }}>
    <Upload size={22}/><strong>{busy ? 'Abrindo imagem…' : label}</strong><small>Clique ou arraste · até 25 MB / 40 MP</small>
    <input aria-label={label} type="file" disabled={busy} accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" onChange={event => { onSelect(event.target.files?.[0]); event.target.value = ''; }}/>
  </label>;
}
