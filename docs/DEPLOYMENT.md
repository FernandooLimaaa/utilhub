# Publicação do UtilHub

## Destino

- Código: https://github.com/FernandooLimaaa/utilhub
- Site esperado: https://fernandoolimaaa.github.io/utilhub/
- Branch: `main`.
- Artefato: `dist/`; base Vite: `/utilhub/`.
- Não há domínio pago, backend próprio ou credencial pessoal exigida pelo workflow.

## Verificações locais

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:browser -- --production
node scripts/publication-files.mjs
```

O script de publicação seleciona explicitamente código, configuração, testes e documentos. Não inclui `node_modules`, `dist`, `.env`, logs ou estado local. Procura padrões conhecidos de chaves/tokens sem imprimir possíveis valores. Não é garantia absoluta contra todo tipo de informação sensível; revise os arquivos antes de commits futuros.

O formulário Google Forms é público e sua URL não é uma credencial. Não inclua URL administrativa de edição, senhas ou tokens em variáveis `VITE_*`: o frontend é público.

## Configuração no GitHub

1. Mantenha o repositório público para usar GitHub Pages com GitHub Free.
2. Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions** e salve, se houver botão.
3. Em **Actions**, abra **Deploy UtilHub to GitHub Pages**. A primeira publicação roda após o push com o workflow; também pode ser iniciada por **Run workflow → main**.
4. Aguarde os jobs **Verify and build** e **Publish to Pages** terminarem com sucesso.
5. Abra a URL fornecida pelo job `deploy` e confira home, ferramentas, ícone da aba e Central de Feedback.

O workflow usa o token temporário do próprio Actions, com `contents: read` no build e apenas `pages: write`/`id-token: write` no deploy. Não é necessário adicionar PAT a arquivos ou secrets para publicar.

**Ativação inicial:** o token padrão do Actions não pode habilitar Pages sozinho. A conexão GitHub usada nesta sessão não disponibiliza alteração de Settings → Pages; por isso essa escolha inicial pode precisar ser feita pelo proprietário. Não confunda um build aprovado com um site publicado.

## Comandos Git para um diretório sem histórico

Instale Git e abra outro terminal se o executável ainda não estiver disponível. Os comandos abaixo são uma orientação, não um registro de execução.

**Use este fluxo somente se o remoto estiver realmente vazio e a pasta não tiver `.git`.** Se os arquivos já foram enviados pela conexão GitHub, use a opção de clone a seguir.

```powershell
git init -b main
git add .gitignore index.html package.json package-lock.json tsconfig.json vite.config.ts README.md PLANNING.md src public tests docs scripts .github
git diff --cached --stat
git diff --cached --check
git commit -m "feat: publish initial UtilHub platform"
git remote add origin https://github.com/FernandooLimaaa/utilhub.git
git push -u origin main
```

Não use `--force`, não reinicialize um histórico existente e não remova arquivos remotos. Se já houver commits no remoto, faça um clone ou compare os históricos antes de integrar.

## Se o código já foi enviado pela conexão GitHub

O envio pela conexão autenticada cria commits Git no remoto, mas não instala o executável Git nem cria automaticamente um clone local.

Para trabalhar com Git convencional sem sobrescrever esta pasta, faça um clone em **uma pasta nova e vazia**:

```powershell
git clone https://github.com/FernandooLimaaa/utilhub.git UtilHub-publicado
cd UtilHub-publicado
npm.cmd ci
```

O histórico remoto permanece intacto. Você pode passar a abrir esse clone no VS Code. Não copie uma pasta `.git` de outro projeto.

## Atualizações futuras

No clone correto, revise as mudanças e use:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
git status --short
git diff
# Adicione somente os arquivos que deseja publicar
git add CAMINHOS_DOS_ARQUIVOS_ALTERADOS
git diff --cached --stat
git commit -m "feat: descreva a atualização"
git push origin main
```

O push para `main` dispara o mesmo workflow. Publicações são serializadas para não cancelar uma publicação em andamento.

## Rotas, assets e diagnóstico

- Home: `/utilhub/`.
- Imagens: `/utilhub/#/imagens`.
- Feedback: `/utilhub/#/feedback`.
- O fragmento depois de `#` não é enviado ao servidor; não há dependência de React Router ou fallback 404.
- Favicon usa `%BASE_URL%favicon.svg`; bundles e importações dinâmicas recebem o prefixo do Vite.
- Em erro de configuração de Pages, revise a fonte GitHub Actions. Em erro de build, abra os logs do job. Não envie manualmente `dist` ao código-fonte nem use force push como correção.
- A integração de feedback depende do acesso ao Google Forms. Um envio só está confirmado quando aparece nas respostas/planilha; esta publicação não envia respostas automaticamente.

Referências: [Vite](https://vite.dev/guide/static-deploy), [configuração da fonte Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
