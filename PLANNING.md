# UtilHub 2.0 — escopo implementado

## Central de Feedback — integração entregue em 11/11/2026

Pedido independente da fila de expansão Premium. Página `#/feedback`, acesso na sidebar, card na home e botão flutuante com modal no desktop/página no celular. Google Forms público incorporado, link alternativo sempre presente, carregamento e recuperação de foco, temas e estilos isolados. Não foram alteradas páginas/serviços das ferramentas existentes.

Configuração em `src/config/feedback.ts`; componentes em `src/components/feedback/`; página `src/pages/Feedback.tsx`; estilos `src/styles/feedback.css`. Integração apenas em App/Home/main. Testes e orientações: [docs/FEEDBACK.md](docs/FEEDBACK.md).

Validação: **19 testes de lógica e 52 verificações de navegador com produção aprovados**. Formulário real aberto e inspecionado no desktop e celular; link HTTP 200. Não houve preenchimento, envio de respostas ou confirmação administrativa de chegada à planilha. O limite de Escape quando o iframe consome a tecla está documentado; o botão Fechar permanece visível e o fechamento por Escape nos controles do UtilHub foi validado.

Exceção explícita à regra de processamento local: respostas enviadas voluntariamente na Central são processadas diretamente pelo Google Forms. Arquivos das ferramentas continuam locais. Nenhum backend próprio, link administrativo no frontend ou serviço pago foi adicionado. Para confirmar recebimento real, seguir o teste manual descrito no guia.

## Expansão Premium — progresso em 11/11/2026

Documento integral: [docs/EXPANSION_BRIEF.md](docs/EXPANSION_BRIEF.md). A expansão não está concluída. Esta execução concluiu as etapas **1–4** e preservou as oito ferramentas funcionais da versão 2.0.

| Etapa | Estado | Entrega / pendência |
| --- | --- | --- |
| 1. Análise da arquitetura | Concluída | Catálogo central mantido, rotas por hash, páginas separadas, serviços locais e testes existentes revisados. |
| 2. Identidade Premium | Concluída nesta etapa | Temas grafite/lima e claro, vidro, profundidade, foco e transições em camada CSS adicional. Sem WebGL. |
| 3. Home 3D e navegação | Concluída nesta etapa | Cena CSS 3D, acesso rápido, pesquisa/categorias, cards com tilt/brilho, favoritos/recentes locais, seção de privacidade e benefícios, footer e menu móvel acessível. |
| 4. Marcas-d’água | Concluída | Texto/logo, arraste nativo com mouse/toque, teclado, nove posições, mosaico, prévia por frame, desfazer/refazer/restaurar, exportação e ZIP de múltiplas imagens com progresso/cancelamento. |
| 5. Currículos | **Próxima etapa** | Preservar PDF A4 atual; acrescentar objetivo, cursos/certificações, projetos, links, gestão/reordenação de seções, terceiro modelo, fontes, salvamento opcional e JSON validado. |
| 6. ColorLab ampliado | Pendente | Paleta triádica, extração de cores de imagens, prévia aplicada a componentes, favoritos e exportação CSS/JSON. Recursos 2.0 mantidos. |
| 7. QR Studio ampliado | Pendente | Logo opcional, composição em PNG/SVG e alertas de leitura; preservar conteúdos, cores, dimensões, correção e validação atuais. |
| 8. PhotoClean | Não implementado | Pincel, clonagem/retoque real, intensidade, zoom/pan, comparação, histórico e exportações. |
| 9. Removedor de Fundo | Não implementado | Verificar licença/performance de modelo gratuito, carregar sob demanda e executar segmentação local, com progresso, refinamento e substituição de fundo. |
| 10. Sorteio Fácil | Não implementado | Nomes/números/equipes, importação texto/CSV, Web Crypto sem viés, roleta fiel ao resultado, histórico e exportação. |
| 11. MindMap | Não implementado | Nós/conexões, edição/arraste, cores/formas/tamanhos, pan/zoom, histórico, organização, salvamento e JSON/PNG/SVG. |
| 12. Integração final | Parcial | As oito ferramentas atuais integradas; adicionar as quatro futuras às cinco categorias apenas quando funcionais. |
| 13. Revisão final | Parcial | Etapas atuais verificadas; repetir nos novos módulos antes de declarar a expansão concluída. |

### Arquivos alterados por etapa

- Etapas 1–3: `src/App.tsx`, `src/main.tsx`, `src/pages/Home.tsx`, `src/config/tools.ts`, `src/styles/premium.css`; novos componentes `ToolPreferences`, `ToolCard`, `GlobalSearch` e `HubScene`. Testes: `tests/premium.browser.*` e ajustes no runner e na espera de páginas lazy em `tests/modules.browser.ts`.
- Etapa 4: `src/pages/Watermarks.tsx`, `src/services/watermark.ts`; novos `src/services/watermarkBatch.ts`, `src/services/history.ts`, `src/components/useHistory.ts`, `tests/history.test.ts` e `tests/watermarks.browser.*`. Dependência gratuita `fflate` em `package.json`/lock. Serviços e página do editor de imagens não foram alterados.
- Documentação: este planejamento, `README.md` e cópia integral do pedido em `docs/EXPANSION_BRIEF.md`.

### Validação desta execução

- TypeScript/build: aprovados após cada conjunto funcional.
- `npm.cmd test`: **18 testes aprovados**.
- `npm.cmd run test:browser`: **46 verificações aprovadas** em Edge, incluindo regressão do editor de imagens, oito ferramentas, ZIP/cancelamento, gestos reais de mouse/toque, pesquisa, favoritos/recentes, foco e temas.
- `npm.cmd run test:browser -- --production`: **47 verificações aprovadas**, incluindo build servido em `/utilhub/` com importações dinâmicas.
- Home sem overflow em 320, 390, 768, 1024 e 1440 px. Capturas desktop escuro, desktop claro e celular inspecionadas.
- Sem avaliação em hardware móvel físico ou auditoria completa com leitores de tela. A escolha do destino na impressão segue nativa do navegador/sistema. O deploy público não foi realizado.

### Restrições mantidas

Sem backend, serviços pagos, envio de arquivos ou armazenamento de dados pessoais. Apenas tema e IDs de favoritos/recentes são persistidos. Sem PDF Studio. Nenhum arquivo existente foi excluído. Não adicionar módulos de negócios nem downloads de streaming.

---

## Registro da entrega 2.0 anterior

O UtilHub mantém React, TypeScript, Vite e processamento no navegador. Sem backend, banco remoto, upload para servidores ou APIs pagas.

## Preservado

- Editor de imagens com Conter, Preencher, Adaptar, recorte, presets, fundos, comparação e exportação sem deformação.
- Ferramentas de texto, comparador de preços e gerador de senhas.
- Identidade visual, temas, acessibilidade por teclado, movimento reduzido, layouts responsivos e configuração GitHub Pages.

## Etapas 2.0

1. **Editor de marcas-d’água:** texto/logo, fonte/cor, escala proporcional, opacidade, rotação, posição, mosaico, prévia e PNG/JPEG/WebP.
2. **Criador de currículos:** dados pessoais, perfil, experiências/formações dinâmicas, habilidades, idiomas, modelos, cor, prévia e PDF com impressão A4 nativa. Sem armazenamento automático de dados pessoais.
3. **ColorLab:** conversão HEX/RGB/HSL, paletas, contraste AA/AAA, gradientes lineares/radiais, CSS e PNG.
4. **QR Studio:** texto, URL, Wi-Fi e contato, cores, correção de erros, prévia, PNG e SVG. Geração local de códigos estáticos.

Os detalhes de implementação acima foram apresentados e autorizados nesta sessão, pois não havia especificação anterior detalhada disponível na conversa ou nos arquivos.

## Adiado

**PDF Studio independente:** não implementar edição, junção, divisão ou reorganização de PDFs nesta versão. Não há arquivos desse módulo na pasta analisada. Se forem encontrados futuramente, informar alterações e solicitar confirmação antes de excluir seus arquivos ou código.

A geração de PDF do currículo é parte do Criador de currículos e permanece no escopo.

## Validação

- `npm.cmd test`: 16 testes de lógica.
- `npm.cmd run test:browser`: 35 testes em Edge headless, incluindo os 25 cenários de regressão do editor de imagens, QR decodificado por jsQR e PDF real multipágina.
- `npm.cmd run build`: TypeScript estrito e build Vite.

A impressão em PDF depende da opção de destino do navegador/sistema. Testes automatizados validam a preparação do documento e um PDF A4 multipágina; a janela de escolha do destino e câmeras de celulares não são automatizadas.
