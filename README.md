# UtilHub

**Todas as ferramentas que você precisa, em um só lugar.**

Plataforma gratuita de ferramentas digitais com React, TypeScript e Vite. Interface responsiva com temas claro/escuro, identidade em verde-lima, elementos CSS 3D e navegação por teclado.

**Endereço de publicação:** [fernandoolimaaa.github.io/utilhub/](https://fernandoolimaaa.github.io/utilhub/)  
**Repositório:** [FernandooLimaaa/utilhub](https://github.com/FernandooLimaaa/utilhub)

Site publicado e verificado em **11/11/2026**, com GitHub Actions. [Registro da primeira publicação](docs/PUBLICATION.md).

## Ferramentas disponíveis

| Ferramenta | Recursos |
| --- | --- |
| Editor de imagens | Redimensionamento sem deformação; Conter, Preencher e Adaptar; presets, recorte, fundos e comparação; PNG/JPEG/WebP. |
| Marcas-d’água | Texto/logo, arraste por mouse/toque, posição, fonte, cor, opacidade, rotação, mosaico, histórico e lotes em ZIP. |
| Ferramentas de texto | Contagem, maiúsculas/minúsculas, limpeza de espaços e cópia. |
| Comparador de preços | Preço normalizado por kg, litro ou unidade; destaque das opções mais econômicas. |
| Gerador de senhas | Web Crypto, comprimento e grupos configuráveis, indicação orientativa de força; sem armazenamento. |
| Criador de currículos | Dados pessoais, experiências, formação, habilidades/idiomas, modelos, prévia e PDF A4 via impressão nativa. |
| ColorLab | HEX/RGB/HSL, paletas, contraste, gradientes lineares/radiais, CSS e PNG. |
| QR Studio | Links, texto, Wi-Fi e contatos; cores/correção configuráveis; PNG e SVG. |

A home oferece busca, categorias, favoritos e ferramentas recentes. A **Central de Feedback** está disponível na sidebar, na home e em um botão flutuante: modal no desktop e página completa no celular.

## Privacidade e custos

As ferramentas processam arquivos no navegador; não há backend próprio, banco remoto ou API paga. Somente tema e IDs de favoritos/recentes são persistidos. Senhas, imagens, textos, produtos e currículos não são armazenados pelo UtilHub.

**Exceção transparente:** respostas enviadas voluntariamente na Central de Feedback são processadas pelo Google Forms. O UtilHub não lê o documento interno do formulário, não captura respostas e não simula confirmação. Há link direto de alternativa à incorporação. [Detalhes e validação de envio](docs/FEEDBACK.md).

O projeto usa bibliotecas gratuitas. Em repositório público, GitHub Pages e os runners padrão de Actions permitem esta hospedagem gratuita, sem domínio próprio ou token pessoal no código.

## Tecnologias

- React 19, TypeScript 5 e Vite 7.
- CSS moderno, Canvas API e Web Crypto API.
- Lucide React para ícones, node-qrcode para geração local e fflate para ZIP.
- jsQR apenas nos testes de leitura de QR.

## Executar localmente

Recomendado **Node.js 24 LTS** e npm.

```bash
npm ci
npm run dev
```

Abra **http://localhost:5173/utilhub/**, ou o endereço exibido pelo Vite se a porta estiver ocupada. No PowerShell com restrição a scripts, substitua `npm` por `npm.cmd`.

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

A build gera `dist/`. O preview atende normalmente em **http://localhost:4173/utilhub/**. Não abra `index.html` diretamente e não use Live Server para executar o React.

## Testes de navegador

Requer Chrome/Edge instalado. O runner detecta os caminhos comuns; outro executável pode ser informado por `UTILHUB_BROWSER`.

```bash
npm run test:browser
# Após npm run build: valida a configuração real em /utilhub/
npm run test:browser -- --production
# Verificações de navegação na versão pública, sem enviar feedback
npm run test:browser -- --site=https://fernandoolimaaa.github.io/utilhub/
```

Foram aprovados **19 testes de lógica e 52 verificações com produção**, incluindo imagens, ZIP, QR decodificado, PDF A4 multipágina, temas, larguras de 320 a 1440 px, gestos e Central de Feedback. Não houve envio real de resposta ao Forms.

## Publicação automática

O [workflow](.github/workflows/deploy.yml) roda em pushes para `main` e por disparo manual:

1. Instala Node 24 e as dependências exatas com `npm ci`.
2. Verifica TypeScript, executa testes e compila o projeto.
3. Envia somente `dist/` como artefato.
4. Publica no ambiente `github-pages`, com permissões de publicação limitadas ao job de deploy.

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Depois acompanhe **Actions → Deploy UtilHub to GitHub Pages**. Atualizações futuras publicam após um push aprovado na `main`.

O Vite está configurado com `base: '/utilhub/'`. As páginas usam hashes — por exemplo, `/utilhub/#/imagens` e `/utilhub/#/feedback` — e não precisam de redirecionamentos de servidor.

[Guia de publicação e comandos Git](docs/DEPLOYMENT.md).

## Estrutura

```text
src/
  components/    # Interface e componentes reutilizáveis
  config/        # Catálogo, categorias e URL pública de feedback
  pages/         # Home, ferramentas e Central de Feedback
  services/      # Processamento local e lógica
  styles/        # Estilos base, premium e feedback
public/          # Assets estáticos
tests/           # Lógica e integração em navegador
scripts/         # Seleção/auditoria de arquivos para publicação
.github/         # Workflow de GitHub Pages
docs/            # Guias e decisões técnicas
```

## Limites e evolução

- Imagens: entrada até 25 MB/40 MP; saída até 16 MP e 8.192 px por lado. Lotes de até dez arquivos, 100 MB de entrada e 64 MB de saída.
- PNG/WebP preservam transparência; JPEG recebe fundo branco. Animações são convertidas em imagens estáticas.
- Currículos usam “Salvar como PDF” do navegador. Leitores de QR e câmeras podem variar.
- A confirmação de feedback fica no Google Forms. Escape funciona nos controles do UtilHub; se o iframe externo consumir a tecla, use o botão Fechar.
- Não há operação offline completa, auditoria integral de leitor de tela ou benchmark em celulares físicos.
- PhotoClean, Removedor de Fundo, Sorteio Fácil e MindMap ainda são **planejados**, não ferramentas disponíveis. PDF Studio permanece fora do escopo; PDF de currículo continua disponível.

[Planejamento](PLANNING.md) · [Especificação da expansão](docs/EXPANSION_BRIEF.md) · [Notas técnicas preservadas](docs/PROJECT_NOTES.md)

## Referências

[Vite: publicação estática](https://vite.dev/guide/static-deploy) · [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
