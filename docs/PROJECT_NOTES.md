# Registro técnico anterior à primeira publicação

Este documento preserva as notas da implementação. Para configuração atual e publicação, consulte o README e DEPLOYMENT.md; referências antigas a base relativa descrevem o estado anterior.

# UtilHub 2.0

Plataforma de ferramentas digitais gratuitas, em português, feita com React, TypeScript e Vite. As ferramentas processam arquivos localmente, sem backend próprio. A Central de Feedback usa Google Forms: as respostas voluntariamente enviadas ali são processadas pelo Google.

**Central de Feedback integrada:** acesse pela sidebar, pelo card da home ou pelo botão flutuante. Página `#/feedback`, modal no desktop, visualização completa no celular e link direto sempre disponível. URLs públicas centralizadas; nenhum link administrativo de edição no frontend. Veja [implementação, limites e como validar um envio na planilha](docs/FEEDBACK.md). Não foi enviado feedback de teste automaticamente.

**Expansão Premium em andamento:** etapas 1–4 do novo documento concluídas: arquitetura, identidade visual, home/navegação e editor de marcas-d’água ampliado. As oito ferramentas anteriores continuam disponíveis. PhotoClean, Removedor de Fundo, Sorteio Fácil e MindMap ainda não foram implementados. Próxima etapa: ampliar o Criador de currículos. Veja o progresso real em [PLANNING.md](PLANNING.md) e a [especificação integral](docs/EXPANSION_BRIEF.md).

## Executar

Requer Node.js 22.12+ (recomendado Node 24) e npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço exibido pelo Vite. No Windows, `npm.cmd` funciona mesmo quando a política do PowerShell bloqueia `npm.ps1`. Em outros sistemas, use `npm`.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

O build verifica o TypeScript e gera `dist/`. O preview serve esse resultado localmente.

## Ferramentas

- **Imagens:** upload e arrastar/soltar, prévia do resultado, comparação com o original, redimensionamento com bloqueio de proporção, presets, enquadramento sem distorção, conversão PNG/JPEG/WebP, qualidade e download. Entrada de até 25 MB e 40 megapixels; saída de até 16 megapixels e 8.192 px por lado para controlar memória. O navegador precisa suportar o formato escolhido.
- **Texto:** palavras, caracteres (pontos de código Unicode, incluindo espaços), linhas, maiúsculas/minúsculas, limpeza de espaços e cópia.
- **Preços:** produtos temporários, preço normalizado por kg, L ou unidade e destaque do menor preço em cada grupo, incluindo empates. Compare itens equivalentes. Valores positivos; não considera descontos, qualidade ou frete.
- **Senhas:** Web Crypto API com amostragem sem viés de módulo, 8–64 caracteres, inclusão garantida dos grupos selecionados, cópia e indicador orientativo de entropia. Nenhuma senha é armazenada.
- **Marcas-d’água:** texto ou logo, fonte/cor/tamanho, opacidade, rotação, arraste com mouse ou toque, controles por teclado, nove posições predefinidas e mosaico. Desfazer/refazer com até 40 estados e agrupamento de gestos. Prévia Canvas atualizada no próximo frame e exportação PNG/JPEG/WebP. Lotes de até dez imagens em ZIP, progresso real e cancelamento. Saída proporcional de até 16 MP / 8.192 px por imagem, preservando a fonte.
- **Currículos:** dados pessoais, perfil, experiências e formações adicionáveis, habilidades e idiomas. Modelos moderno e clássico, quatro cores de destaque, exemplo preenchido e prévia. A exportação usa a impressão nativa: escolha **Salvar como PDF**, papel **A4**, e desative cabeçalhos/rodapés do navegador. Exporta apenas o currículo, com texto selecionável e várias páginas quando necessário. Não há edição de PDFs.
- **ColorLab:** HEX/RGB/HSL, seletor e cor aleatória, paletas análogas/complementares/monocromáticas, contraste AA/AAA, gradientes lineares/radiais com até cinco cores, cópia do CSS e PNG 1600×900.
- **QR Studio:** QR estático de URL HTTP(S), texto, Wi-Fi ou contato vCard. Cores com contraste mínimo, quatro níveis de correção, PNG em 512/1024/2048 px e SVG. Margem de quatro módulos preservada. Sem encurtador, rastreamento ou expiração imposta pelo UtilHub; links externos dependem de seus próprios destinos.

Somente tema, IDs de ferramentas favoritas e os cinco IDs acessados recentemente ficam no localStorage. As buscas não são armazenadas. Se o armazenamento estiver bloqueado, as preferências funcionam durante a sessão. Texto, produtos, imagens, lotes, currículos e dados de QR são descartados ao sair da ferramenta. Senhas nunca são persistidas. Um QR Wi-Fi contém a senha da rede: qualquer pessoa com a imagem pode lê-la. Downloads e PDFs salvos ficam no dispositivo por escolha do usuário. Cópia usa a área de transferência do sistema; o conteúdo copiado permanece nela até ser substituído. Clipboard e Web Crypto exigem navegador compatível e contexto seguro (HTTPS ou localhost).

## Estrutura

- `src/components`: elementos compartilhados
- `src/config/tools.ts`: catálogo e navegação
- `src/pages`: início e ferramentas
- `src/services`: processamento local e lógica reutilizável
- `src/styles`: identidade visual, temas, responsividade e movimento reduzido
- `tests`: testes de lógica e de navegador, incluindo exportações Canvas, decodificação QR e PDF multipágina

Para adicionar ferramenta, inclua uma entrada no catálogo, crie a página e registre-a no mapa de páginas de `src/App.tsx`. A navegação usa hashes para funcionar sem configuração de servidor.

## GitHub Pages

O projeto está preparado, sem publicação automática fora de um repositório seu. Publique os arquivos em um repositório GitHub e, em **Settings → Pages → Source**, selecione **GitHub Actions**. O workflow em `.github/workflows/deploy.yml` verifica, compila e publica a cada push na branch `main` (ou manualmente). Caso use outra branch, ajuste o workflow.

A configuração `base: './'` mantém os assets relativos, permitindo hospedagem em subpastas. Não requer domínio pago.

## Acessibilidade e privacidade

Interface responsiva, tema claro/escuro, labels de formulário, foco visível, link de salto, feedback de erros e respeito a movimento reduzido. Sem fontes remotas, analytics, serviços pagos ou requisições de dados das ferramentas.

## Verificações realizadas

Compilação de produção e TypeScript estrito; **19 testes de lógica, 51 verificações padrão de navegador e uma verificação adicional de produção aprovados**. A suíte mantém os 25 cenários do editor de imagens e verifica as ferramentas 2.0, pesquisa, favoritos, recentes, temas, foco, menu móvel, ZIP, cancelamento e gestos reais de mouse/toque. Inclui QR decodificado e PDF A4 real de seis páginas. A home foi verificada em 320, 390, 768, 1024 e 1440 px, com inspeção de capturas desktop escuro/claro e celular. Não há auditoria completa de leitor de tela, benchmark em celular físico ou testes com câmeras físicas.

```powershell
npm.cmd run test:browser
# Após o build: verifica home e chunks em /utilhub/, como em um projeto GitHub Pages
npm.cmd run test:browser -- --production
# Opcional: capturas locais para inspeção visual
npm.cmd run test:browser -- --screenshots
```

Requer Chrome ou Edge instalado. O script detecta os caminhos comuns no Windows/Linux; para outro caminho, defina `UTILHUB_BROWSER`. Ele inicia Vite em uma porta local temporária e um navegador headless com perfil de teste no diretório temporário do sistema; encerra ambos ao terminar. Não instala dependências adicionais nem envia imagens para serviços externos. As imagens de teste são geradas localmente com Canvas.

O QR Studio usa a biblioteca gratuita [node-qrcode](https://github.com/soldair/node-qrcode) (MIT), empacotada com o site. O leitor `jsQR` é dependência apenas de testes. Os critérios de contraste seguem as [referências WCAG do W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum). Nenhuma dessas funcionalidades consulta serviços externos durante o uso.

## Interface Premium e limites da etapa atual

- Núcleo UtilHub em CSS 3D, camadas de vidro, iluminação e gradientes suaves. Sem Three.js, WebGL, fontes ou texturas remotas. As animações da cena pausam fora da tela ou com a aba oculta; movimento reduzido desliga as animações e a inclinação dos cards.
- Cards com brilho/tilt no mouse, alternativa para toque, favorito independente, entrada por Intersection Observer e foco visível. Os efeitos não escondem funções.
- Busca na home e pesquisa global por botão ou Ctrl/⌘ K, com diálogo nativo, foco e fechamento por Escape. Categorias contêm apenas ferramentas disponíveis; não há cards de módulos inexistentes.
- Ferramentas carregadas sob demanda com `React.lazy`/Suspense, transição de página e recuperação de erro de carregamento. A versão compilada foi testada em `/utilhub/`, incluindo importações dinâmicas. O site não foi publicado.
- O novo CSS é uma camada adicional em `src/styles/premium.css`; os estilos e serviços do editor de imagens foram preservados.
- ZIP local usa `fflate` (MIT), carregado somente ao exportar lote. Lotes: até dez imagens, 25 MB por arquivo, 100 MB de entrada e 64 MB de saída. As fontes são decodificadas em sequência; cancelar interrompe entre operações, não no meio da codificação nativa de um Canvas. Nenhum ZIP parcial é baixado.
- Ainda faltam as ampliações de currículo, ColorLab e QR e as quatro novas ferramentas, conforme o planejamento. O removedor de fundo ainda exige seleção e verificação da licença de um modelo gratuito; não há download de modelo ou segmentação simulada na versão atual.

## Escopo 2.0

Veja [PLANNING.md](PLANNING.md). **PDF Studio foi adiado**: edição, junção, divisão e reorganização de PDFs não fazem parte desta versão. A exportação do criador de currículos em PDF permanece disponível. Não havia código de PDF Studio nesta pasta e nenhum arquivo foi excluído para esta atualização.

## Editor de imagens

- **Conter:** preserva toda a imagem, com margens transparentes em PNG/WebP ou brancas em JPEG.
- **Preencher:** amplia proporcionalmente até cobrir o quadro e recorta o excedente. Os controles horizontal e vertical escolhem a posição do recorte.
- **Adaptar:** preserva toda a imagem com fundo sólido personalizado ou fundo desfocado da própria imagem. A cor escolhida também serve de base para transparência na fonte.
- **Presets:** Original, Quadrado (1080×1080), Instagram vertical (1080×1350), Stories (1080×1920), Widescreen (1920×1080) e Personalizado.
- O bloqueio mantém a proporção do quadro selecionado; no carregamento e em Restaurar original, mantém a proporção da fonte. Desbloquear altera o quadro e nunca estica a imagem.
- A prévia atualiza após 180 ms sem alterações e usa no máximo 1.000 px por lado. Ela compartilha a composição com a exportação; a compressão em resolução total pode produzir diferenças sutis. O quadriculado é apenas um indicador de transparência.
- Restaurar original redefine os ajustes, mantendo o arquivo fonte intacto. Fontes acima do limite de saída são reduzidas proporcionalmente, com aviso.
- Canvas de exportação é liberado após gerar o arquivo; o desfoque usa um canvas auxiliar de até 512 px por lado. URLs temporárias são revogadas ao substituir a prévia ou sair. A resolução é validada antes da alocação; falhas do navegador exibem orientação para reduzi-la.
- Imagens animadas são exportadas como imagem estática. Não há expansão generativa, upload para servidor ou persistência de imagens.
