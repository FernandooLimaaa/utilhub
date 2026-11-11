# Primeira publicação — 11/11/2026

## Resultado confirmado

- Repositório público: https://github.com/FernandooLimaaa/utilhub
- Site funcionando: https://fernandoolimaaa.github.io/utilhub/
- Primeiro commit de preparação: `4a1f0625ed8df79b4b3bc9969f5f420a391c14ea`.
- Commit inicial da plataforma: `da2c3eb553d39f51d681495aca0e39222aa1a1bf`.
- [Workflow da primeira publicação](https://github.com/FernandooLimaaa/utilhub/actions/runs/43058535016).
- O envio foi realizado pela conexão GitHub autenticada, com criação de objetos/commits e atualização fast-forward de `main`. Nenhum force push ou exclusão foi usado.

O repositório foi verificado vazio antes da inicialização. Foram enviados inicialmente 68 arquivos de código/documentação, e nenhum caminho de `node_modules`, `dist`, `.env`, estado local ou chave privada. A seleção foi revista por nomes e padrões conhecidos de segredos. Uma verificação automática não prova ausência absoluta de todos os possíveis dados sensíveis; nenhum segredo foi detectado nos arquivos publicados.

## Publicação automática

O build local e o build no Ubuntu do GitHub passaram. A primeira tentativa de deploy falhou porque Pages estava desativado; após o proprietário selecionar GitHub Actions em Settings → Pages, o workflow foi repetido e concluiu com sucesso. Não foram adicionados tokens pessoais, serviços pagos ou backend.

O workflow usa Node 24, `npm ci`, TypeScript, testes e Vite; envia `dist/` e faz o deploy no ambiente `github-pages`. Permissões de escrita ficam somente no job de publicação.

## Validação

Comandos executados:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:browser -- --production
node scripts/publication-files.mjs
npm.cmd run test:browser -- --site=https://fernandoolimaaa.github.io/utilhub/
```

- **19 testes de lógica e 52 verificações locais de navegador com produção aprovados.**
- Site público respondeu HTTP 200.
- No Edge, as oito páginas de ferramentas abriram e seus chunks carregaram a partir de `/utilhub/`.
- Favicon público e ícones SVG verificados.
- Temas claro e escuro testados na versão pública.
- Home, editor de imagens e feedback sem overflow em 320, 390 e 768 px.
- Central de Feedback pública com iframe correto, link externo e modal que abre/fecha.
- A lógica completa das ferramentas foi verificada localmente antes do envio; a checagem pública é uma validação de carregamento/navegação, não repetição de cada fluxo de exportação em produção.
- Nenhuma resposta ao Google Forms foi enviada. Confirmação na planilha continua sendo teste manual do proprietário, conforme `FEEDBACK.md`.

## Arquivos de preparação alterados ou adicionados

- `vite.config.ts`: base `/utilhub/`.
- `index.html`: favicon pela base do Vite e metadados atualizados.
- `.gitignore`: ambientes, chaves, caches, logs, ferramentas locais e arquivos gerados ignorados.
- `package.json`: comando `typecheck`.
- `.github/workflows/deploy.yml`: build/testes e deploy automáticos com Actions atuais e permissões por job.
- `tests/run-browser.mjs` e `tests/live-site.mjs`: teste da configuração real e verificações no site público.
- `scripts/publication-files.mjs`: seleção explícita e inspeção dos arquivos destinados ao remoto.
- `README.md`, `docs/DEPLOYMENT.md`, este registro e `docs/PROJECT_NOTES.md`: apresentação pública, instruções, histórico técnico preservado e comandos.

Não foram removidas funcionalidades ou alterados serviços/páginas das ferramentas para esta publicação.

## Git local e futuras atualizações

Git e GitHub CLI não estavam disponíveis neste ambiente, e a pasta original não tinha `.git`. O envio remoto não criou um clone local nem configurou credenciais Git no Windows. Não foi executado `git push` no terminal; a atualização equivalente da branch foi feita pela API autenticada, com verificação do SHA anterior e sem força.

Para atualizações convencionais pelo terminal do VS Code, instale Git e clone o repositório em uma pasta nova, conforme `DEPLOYMENT.md`. Isso recupera os commits existentes sem sobrescrever a pasta original. Cada push futuro para `main` dispara a publicação automaticamente. O registro de validação acima não substitui a revisão de mudanças futuras.
