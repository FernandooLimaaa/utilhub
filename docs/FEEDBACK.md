# Central de Feedback — Google Forms

## Integração entregue

- Página `#/feedback`, com título/subtítulo solicitados e iframe responsivo.
- Acessos pela sidebar, card de destaque na home e botão flutuante.
- No desktop, o botão flutuante abre um diálogo nativo, preservando o estado da ferramenta aberta. No celular, navega para a página completa. Ao redimensionar um modal aberto, ele adapta-se a tela cheia sem remontar o formulário.
- Temas claro/escuro, vidro, verde-lima, decoração CSS 3D, foco visível e movimento reduzido.
- URLs públicas centralizadas em `src/config/feedback.ts`. Nenhuma URL administrativa de edição está no frontend.
- Google Forms só é carregado ao abrir a página ou o modal; a home não cria o iframe.
- Link direto com `noopener noreferrer` sempre disponível. O Google Forms pode demandar conexão, permissões ou login conforme as configurações do proprietário; o UtilHub não pede conta nem dados adicionais.

## Segurança e limites da origem externa

O UtilHub não lê o DOM interno, não muda estilos do Google Forms, não intercepta respostas e não tenta detectar envio. Não há endpoint próprio, formulário paralelo ou confirmação simulada. As respostas e a confirmação pertencem ao Google Forms.

O evento `load` apenas encerra o indicador de abertura. Ele **não comprova** que o formulário está disponível nem que alguma resposta foi enviada. Bloqueios podem não disparar `error`; após 15 segundos sem `load`, o ambiente sugere usar o link direto ou tentar novamente.

Há rolagem nativa dentro do quadro para alcançar todas as perguntas e o botão de envio. A altura é limitada à janela no modal e adaptativa na página; não se tenta descobrir a altura do documento externo.

O modal abre com foco no botão Fechar, mantém o ciclo de Tab nos controles do UtilHub e devolve o foco ao acionador. Escape fecha quando o foco está no UtilHub. **Limite verificado no Edge:** com foco dentro do iframe externo, a tecla pode ser consumida pelo outro contexto. Nesse caso, use o X sempre visível, Tab/Shift+Tab para os controles externos, o fundo do modal ou a página completa. Nenhum acesso ao documento do iframe foi adicionado para contornar esse limite.

## Validação realizada em 11/11/2026

- Link público de incorporação respondeu HTTP 200, título `UtilHub — Central de Feedback`, sem redirecionamento para login nessa verificação HTTP.
- Formulário real aberto e inspecionado por capturas em desktop e celular, **sem preenchimento nem envio**.
- 19 testes de lógica e 51 verificações padrão no Edge aprovados; com `--production`, 52 verificações, incluindo a página compilada em `/utilhub/`.
- Testes de integração usam um documento externo neutro apenas para verificar ambiente, links, estados de conexão, foco e responsividade. Não há campos, respostas ou confirmação fictícia na fixture. A opção `--feedback-live` remove essa substituição para inspeção do formulário público real.
- Build de produção aprovado. Páginas e serviços das ferramentas existentes não foram alterados.
- Não foi verificada a chegada de resposta real ao Forms ou à planilha: nenhum teste submeteu respostas, e não há acesso administrativo conectado.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:browser -- --production
# Opcional: abre o formulário real e gera capturas locais; nunca envia respostas
npm.cmd run test:browser -- --production --feedback-live
```

## Como confirmar um envio real

1. Execute `npm.cmd run dev`, abra o endereço do Vite e entre na Central de Feedback. Confira também o botão flutuante em desktop e celular.
2. Preencha manualmente uma resposta identificável, por exemplo `TESTE UTILHUB 11/11/2026`, sem dados pessoais. Envie pelo botão do **próprio Google Forms** e aguarde a confirmação dele.
3. Na sua conta de proprietário do Google Forms, abra esse formulário e vá à aba **Respostas**. Procure a resposta de teste, conferindo campos e horário.
4. Use o ícone verde do **Google Planilhas** para abrir a planilha vinculada. Se ainda não existir uma, escolha o destino das respostas e crie/vincule a planilha.
5. Confira a linha com o marcador de teste e os valores enviados. Só então considere envio e armazenamento confirmados. Verifique também se o formulário continua aceitando respostas.

Referências oficiais: [ver e gerenciar respostas](https://support.google.com/docs/answer/139706?hl=pt-BR) e [escolher a planilha de respostas](https://support.google.com/docs/answer/2917686?hl=pt-BR).

## Arquivos

- Configuração: `src/config/feedback.ts`.
- Componentes: `src/components/feedback/FeedbackCard.tsx`, `FeedbackFrame.tsx`, `FeedbackDialog.tsx` e `FeedbackLauncher.tsx`.
- Página: `src/pages/Feedback.tsx`.
- Estilo isolado: `src/styles/feedback.css`, importado em `src/main.tsx`.
- Integração: `src/App.tsx` e `src/pages/Home.tsx`.
- Testes: `tests/feedback.test.ts`, `tests/feedback.browser.html`, `tests/feedback.browser.ts` e `tests/run-browser.mjs`.

Não há dependências novas ou serviços pagos. A navegação por hash e assets relativos continuam compatíveis com GitHub Pages. Não foi realizada publicação nesta execução.
