# Clínica de Olhos Brasil Vita & Associados

Site institucional de uma página, refeito do zero em setembro de 2026 para
pacientes idosos em celulares simples: letra grande, contraste alto, botões
grandes com palavra, telefone como ação principal, nada escondido atrás de
gestos ou janelas. Em outubro de 2026 ganhou a seção "Entenda a cirurgia"
(catarata, LASIK e PRK em etapas animadas), a estrutura de artigos e um visual
mais atual, sem mudar cores, fontes nem tamanhos de letra.

## Arquivos

- `index.html` — a página inicial, com CSS e JavaScript embutidos.
- `data/cirurgias.js` — **todos os textos** da seção "Entenda a cirurgia".
- `assets/cirurgias.js` — desenhos (SVG) e animações (GSAP) das cirurgias.
- `conteudo/artigos/*.md` — textos dos artigos; `conteudo/autora.txt` —
  assinatura; `conteudo/LEIA-ME.md` — como adicionar um artigo.
- `artigos/` e `sitemap.xml` — **gerados** por `.work/build-artigos.cjs`
  (não editar à mão).
- `assets/artigos/` — imagens de capa dos artigos.
- `assets/img/` — fotos em WebP e JPG, em vários tamanhos (geradas a partir dos
  originais em `assets/`).
- `assets/fonts/` — DM Sans e DM Serif Display, locais (licenças incluídas).
- `assets/vendor/gsap.min.js` — GSAP (números crescendo, blocos aparecendo e
  as animações das cirurgias).
- `assets/clinic-logo.png`, `assets/favicon.svg` — marca.
- `_headers` — cache no Netlify.
- `.work/` — scripts de preview, build e conferência de conteúdo.

## Rodar e testar

Só precisa do [Node.js](https://nodejs.org); não há nada para instalar.

```sh
node .work/v2-server.cjs 8766          # http://127.0.0.1:8766
node .work/build-artigos.cjs           # gera as páginas de artigos e o sitemap
node .work/v2-content-check.cjs        # confere conteúdo e pedidos da clínica
```

## Publicar

```sh
node .work/build-dist.cjs              # monta a pasta dist/
netlify deploy --prod --dir dist
```

## Antes de considerar pronto

- Preencher no rodapé o nome do responsável técnico e o CRM (exigência do CFM);
  o lugar está marcado com `<!-- TODO CFM -->` no `index.html`.
- Revisão da Dra. Célia em `data/cirurgias.js` e dados de `conteudo/autora.txt`.
