import { Image, Type, Scale, KeyRound, Stamp, FileUser, Palette, QrCode } from 'lucide-react';
export const tools = [
  { id: 'imagens', title: 'Editor de imagens', short: 'Imagens', description: 'O formato certo. O tamanho ideal. Sua imagem, do seu jeito.', icon: Image, color: 'violet', category: 'CRIATIVIDADE', tags: ['Redimensionar', 'Converter'], detail: 'PNG, JPEG e WebP' },
  { id: 'texto', title: 'Ferramentas de texto', short: 'Texto', description: 'Conte, transforme e organize suas palavras em poucos cliques.', icon: Type, color: 'blue', category: 'PRODUTIVIDADE', tags: ['Contar', 'Formatar'], detail: 'Suas ideias em ordem' },
  { id: 'precos', title: 'Comparador de preços', short: 'Preços', description: 'Compare além da etiqueta e descubra o que vale mais a pena.', icon: Scale, color: 'orange', category: 'DIA A DIA', tags: ['Comparar', 'Economizar'], detail: 'Decisões mais inteligentes' },
  { id: 'senhas', title: 'Gerador de senhas', short: 'Senhas', description: 'Uma boa senha é o começo. Crie a sua com mais segurança.', icon: KeyRound, color: 'pink', category: 'SEGURANÇA', tags: ['Gerar', 'Personalizar'], detail: 'Aleatoriedade com Web Crypto' },
  { id: 'marcas-dagua', title: 'Editor de marcas-d’água', short: 'Marcas-d’água', description: 'Sua assinatura em cada imagem. Texto ou logo, do seu jeito.', icon: Stamp, color: 'violet', category: 'CRIATIVIDADE', tags: ['Assinar', 'Personalizar'], detail: 'Texto, logo e mosaico' },
  { id: 'curriculos', title: 'Criador de currículos', short: 'Currículos', description: 'Dê forma à sua trajetória e prepare seu próximo passo.', icon: FileUser, color: 'blue', category: 'PRODUTIVIDADE', tags: ['Criar', 'Exportar PDF'], detail: 'Sua história bem apresentada' },
  { id: 'colorlab', title: 'ColorLab', short: 'ColorLab', description: 'Encontre combinações, crie gradientes e confira o contraste.', icon: Palette, color: 'pink', category: 'CRIATIVIDADE', tags: ['Cores', 'Gradientes'], detail: 'HEX, RGB, HSL e CSS' },
  { id: 'qr', title: 'QR Studio', short: 'QR Studio', description: 'Conecte ideias, links e pessoas com QR Codes feitos aqui.', icon: QrCode, color: 'orange', category: 'PRODUTIVIDADE', tags: ['Gerar QR', 'Compartilhar'], detail: 'PNG e SVG, sem expiração' }
] as const;

export type Tool = typeof tools[number];
export const categories = [
  { id: 'design', label: 'Imagens e Design', tools: ['imagens', 'marcas-dagua', 'colorlab'] },
  { id: 'documents', label: 'Documentos e Profissão', tools: ['curriculos'] },
  { id: 'digital', label: 'Ferramentas Digitais', tools: ['qr', 'texto', 'senhas'] },
  { id: 'calculations', label: 'Cálculos', tools: ['precos'] },
  { id: 'productivity', label: 'Produtividade e Criatividade', tools: [] },
] as const;
export function categoryFor(id: string) { return categories.find(category => (category.tools as readonly string[]).includes(id)); }
export function searchTools(query: string) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[’']/g, '');
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return tools.filter(tool => {
    const haystack = normalize([tool.title, tool.short, tool.description, tool.detail, ...tool.tags, categoryFor(tool.id)?.label].join(' '));
    return words.every(word => haystack.includes(word));
  });
}
