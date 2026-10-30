// Gera as páginas de ARTIGOS a partir dos textos em conteudo/artigos/*.md.
//
//   node .work/build-artigos.cjs
//     → cria artigos/index.html (lista), artigos/<endereço>/index.html (um por
//       artigo, rascunhos inclusive, para conferir no computador) e sitemap.xml.
//
// Na hora de publicar, o .work/build-dist.cjs chama gerar() com rascunhos:false,
// então rascunho nunca vai para o ar, nunca entra na lista nem no sitemap.
//
// O modelo da página usa o CSS, o cabeçalho, o rodapé, a barra de ligação e o
// script do index.html (copiados daqui), então o visual fica sempre igual ao
// da página inicial. Como escrever um artigo: conteudo/LEIA-ME.md.
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const SITE = 'https://www.clinicabrasilvita.com.br'; // mesmo endereço do <link rel="canonical"> do index.html
const PASTA_TEXTOS = path.join(RAIZ, 'conteudo', 'artigos');
const PASTA_CAPAS = path.join(RAIZ, 'assets', 'artigos');
const WHATS = 'https://wa.me/5511988757249?text=';
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
// Ligação com a seção "Entenda a cirurgia" da página inicial.
const CIRURGIAS = {
  catarata: ['/#cirurgia-catarata', 'Veja como é feita a cirurgia de catarata, etapa por etapa'],
  lasik: ['/#cirurgia-lasik', 'Veja como é feita a cirurgia refrativa LASIK, etapa por etapa'],
  prk: ['/#cirurgia-prk', 'Veja como é feita a cirurgia refrativa PRK, etapa por etapa'],
  refrativa: ['/#cirurgia-lasik', 'Veja como são feitas as cirurgias refrativas LASIK e PRK, etapa por etapa'],
  crosslinking: ['/#cirurgia-crosslinking', 'Veja como é feito o crosslinking para o ceratocone, etapa por etapa'],
};
// CFM (Res. 2.336/2023 e 1.974/2011): avisa se o texto parecer prometer resultado,
// falar de preço ou trazer depoimento. É só um aviso; quem decide é a médica.
const ALERTAS = ['garant', 'sem risco', 'sem nenhum risco', 'risco zero', 'visao perfeita', '100%', 'milagr', 'cura definitiva', 'resultado definitivo', 'solucao definitiva', 'indolor', 'sem dor', 'nunca mais', 'livre dos oculos', 'adeus aos oculos', 'melhor clinica', 'melhores medicos', 'o melhor resultado', 'depoimento', 'antes e depois', 'r$', 'preco', 'promocao', 'desconto', 'parcelamento'];

const sem = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- leitura dos textos ---------- */
function lerChaves(texto) {
  const dados = {};
  for (const linha of texto.split('\n')) {
    const m = linha.match(/^\s*([a-zA-Z_ãçéêíóú]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    dados[sem(m[1])] = v;
  }
  return dados;
}
function lerArtigo(arquivo) {
  const bruto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = bruto.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${path.basename(arquivo)}: falta o bloco de dados entre as linhas "---" no começo do arquivo.`);
  return { dados: lerChaves(m[1]), corpo: m[2], linhaCorpo: m[1].split('\n').length + 3 };
}
function enderecoDe(nome) {
  return sem(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function dataValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(s + 'T12:00:00');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
function dataPorExtenso(s) {
  const [a, m, d] = s.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
const simOuNao = v => /^(sim|s|true|yes|1)$/i.test(sem(v || '').trim());

/* ---------- Markdown simples → HTML ----------
   Parágrafos (linha em branco entre eles), ## e ### para subtítulos, listas com
   "-" ou "1.", "> " para destaque, **negrito**, *itálico*, [texto](endereço) e
   ![descrição](imagem.jpg) numa linha sozinha. */
function inline(s) {
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const fora = /^https?:\/\//.test(u) && !u.includes('clinicabrasilvita');
    return `<a href="${u}"${fora ? ' target="_blank" rel="noopener"' : ''}>${t}${fora ? '<span class="sr-only"> (abre em nova janela)</span>' : ''}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>');
  return s;
}
function markdown(md) {
  const out = [];
  let par = [], lista = null, citacao = [];
  const fecha = () => {
    if (par.length) { out.push('<p>' + inline(par.join(' ')) + '</p>'); par = []; }
    if (lista) { out.push(`<${lista.tag}>` + lista.itens.map(i => '<li>' + inline(i) + '</li>').join('') + `</${lista.tag}>`); lista = null; }
    if (citacao.length) { out.push('<blockquote><p>' + inline(citacao.join(' ')) + '</p></blockquote>'); citacao = []; }
  };
  for (const cru of md.split('\n')) {
    const l = cru.trim();
    let m;
    if (!l) { fecha(); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.+)$/))) { fecha(); const n = m[1].length <= 2 ? 2 : 3; out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      fecha();
      const src = /^(https?:)?\//.test(m[2]) ? m[2] : '/assets/artigos/' + m[2];
      out.push(`<figure><img src="${esc(src)}" alt="${esc(m[1])}" loading="lazy" decoding="async">${m[1] ? `<figcaption>${inline(m[1])}</figcaption>` : ''}</figure>`);
      continue;
    }
    if ((m = l.match(/^[-*•]\s+(.+)$/))) { if (par.length || citacao.length || (lista && lista.tag !== 'ul')) fecha(); lista = lista || { tag: 'ul', itens: [] }; lista.itens.push(m[1]); continue; }
    if ((m = l.match(/^\d+[.)]\s+(.+)$/))) { if (par.length || citacao.length || (lista && lista.tag !== 'ol')) fecha(); lista = lista || { tag: 'ol', itens: [] }; lista.itens.push(m[1]); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { if (par.length || lista) fecha(); citacao.push(m[1]); continue; }
    if (lista) { lista.itens[lista.itens.length - 1] += ' ' + l; continue; }
    if (citacao.length) { citacao.push(l); continue; }
    par.push(l);
  }
  fecha();
  return out.join('\n');
}

/* ---------- tamanho de imagem (para reservar o espaço da capa) ---------- */
function tamanhoImagem(arquivo) {
  try {
    const b = fs.readFileSync(arquivo);
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 9) {
        if (b[i] !== 0xff) { i++; continue; }
        const mk = b[i + 1];
        if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const t = b.toString('ascii', 12, 16);
      if (t === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (t === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
      if (t === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    }
  } catch (e) { /* sem tamanho: a imagem ainda aparece */ }
  return null;
}

/* ---------- pedaços copiados do index.html ---------- */
function casca() {
  const original = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const html = original.replace(/<!--[\s\S]*?-->/g, ''); // comentários não vão para os artigos
  const pega = (re, nome) => { const m = html.match(re); if (!m) throw new Error(`Não achei ${nome} no index.html (o build-artigos depende dele).`); return m[1] || m[0]; };
  const raiz = bloco => bloco
    .replace(/(<a\b[^>]*?\shref=")#inicio"/g, '$1/"')
    .replace(/(<a\b[^>]*?\shref=")#/g, '$1/#')
    .replace(/(\s(?:src|href)=")assets\//g, '$1/assets/')
    .replace(/srcset="([^"]+)"/g, (m, v) => 'srcset="' + v.replace(/(^|,\s*)assets\//g, '$1/assets/') + '"');
  return {
    css: pega(/<style>\n?([\s\S]*?)<\/style>/, 'o <style>').replace(/url\(assets\//g, 'url(/assets/'),
    cabeca: pega(/<script>(\(function\(\)\{var r=document\.documentElement[\s\S]*?)<\/script>/, 'o script de "letra maior" do <head>'),
    gtm: (html.match(/<noscript><iframe src="https:\/\/www\.googletagmanager\.com[\s\S]*?<\/noscript>/) || [''])[0],
    sprite: pega(/<svg class="sprite"[\s\S]*?<\/svg>/, 'o sprite de ícones'),
    cabecalho: raiz(pega(/<header class="hdr">[\s\S]*?<\/header>/, 'o cabeçalho')),
    rodape: raiz(pega(/<footer class="foot">[\s\S]*?<\/footer>/, 'o rodapé')),
    barra: raiz(pega(/<nav class="callbar"[\s\S]*?<\/nav>/, 'a barra de ligação')),
    script: pega(/<script id="site-js">([\s\S]*?)<\/script>/, 'o <script id="site-js">'),
    menuComentado: /<!-- ARTIGOS:/.test(original),
  };
}

/* CSS só das páginas de artigos (mesmos tokens do site). */
const CSS_ARTIGOS = `
/* ---------- Artigos ---------- */
.page{padding:32px 0 72px;background:var(--white)}
.page--list{background:var(--paper)}
.crumbs{margin:0 0 20px;color:var(--ink-2);font-size:1rem}
.crumbs a{display:inline-block;min-width:44px;padding:10px 0}
.crumbs span{margin:0 8px}
.art__wrap{max-width:820px}
.art__head{margin-bottom:28px}
.art__head h1{margin:0 0 18px}
.page .sh h1{margin-bottom:16px}
.art__lead{max-width:62ch;margin:0 0 26px;color:var(--ink-2);font-size:1.25rem}
.art__by{display:flex;align-items:center;margin:0;padding:18px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.art__by img{flex:none;width:64px;height:64px;margin-right:16px;border-radius:50%;box-shadow:0 0 0 4px var(--tint)}
.art__by p{margin:0;font-size:1.0625rem;line-height:1.45}
.art__by strong{display:block;font-size:1.125rem}
.art__by span{display:block;color:var(--ink-2)}
.art__cover{margin:0 0 36px}
.art__cover img{width:100%;border-radius:var(--radius-lg);box-shadow:var(--shadow)}
.prose{max-width:68ch;font-size:1.1875rem;line-height:1.7}
.prose h2{margin:44px 0 14px;font-size:1.875rem}
.prose h3{margin:32px 0 10px;font-size:1.3125rem}
.prose p{margin:0 0 22px}
.prose ul,.prose ol{margin:0 0 22px;padding-left:28px}
.prose li{margin:0 0 10px}
.prose blockquote{margin:30px 0;padding:20px 24px;border-left:4px solid var(--soft);border-radius:0 var(--radius) var(--radius) 0;background:var(--paper)}
.prose blockquote p{margin:0}
.prose figure{margin:32px 0}
.prose img{border-radius:var(--radius)}
.prose figcaption{margin-top:10px;color:var(--ink-2);font-size:1rem}
.prose a{padding:10px 0}
.art__rel{display:flex;align-items:center;margin:44px 0 0;padding:18px 22px;border-radius:var(--radius-lg);background:var(--tint);font-weight:700;text-decoration:none;color:var(--ink)}
.art__rel .ic{width:44px;height:44px;padding:10px;margin-right:16px;border-radius:50%;background:var(--white);color:var(--ink)}
.art__rel:hover{color:var(--ink);text-decoration:underline}
.art__cta{margin:28px 0 0;padding:30px 26px;border-radius:var(--radius-lg);background:var(--ink);color:var(--white);box-shadow:var(--shadow-lg)}
.art__cta h2{color:var(--white);font-size:1.875rem}
.art__cta p{color:var(--on-ink)}
.art__cta .btn+.btn{margin-top:12px}
.art__cta .btn{border-color:var(--white);background:var(--white);color:var(--ink);box-shadow:none}
.art__cta .btn:hover{background:var(--tint);border-color:var(--tint);color:var(--ink)}
.art__cta .btn--ghost{background:transparent;border-color:rgba(255,255,255,.7);color:var(--white)}
.art__cta .btn--ghost:hover{background:rgba(255,255,255,.12);border-color:var(--white);color:var(--white)}
.art__cta :focus-visible{outline-color:var(--white)}
.art__note{margin:24px 0 0;color:var(--ink-2);font-size:1rem}
.art__back{display:inline-block;margin-top:8px;padding:10px 0;font-weight:600}
.draft{margin:0 0 24px;padding:14px 18px;border:2px solid var(--focus);border-radius:var(--radius);background:var(--paper);color:var(--ink);font-size:1.0625rem}
.draft strong{color:var(--focus)}
.arts{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;grid-gap:20px}
.art-card{position:relative;display:flex;flex-direction:column;overflow:hidden;background:var(--white);border:1px solid rgba(16,30,68,.06);border-radius:var(--radius-lg);box-shadow:var(--shadow);transition:box-shadow .15s,transform .15s}
.art-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-2px)}
.art-card img{width:100%;aspect-ratio:16/9;object-fit:cover}
.art-card__body{display:flex;flex-direction:column;flex:1;padding:22px 24px 26px}
.art-card time{color:var(--ink-2);font-size:1rem;font-weight:600}
.art-card h2{margin:8px 0 10px;font-family:var(--sans);font-weight:700;font-size:1.375rem;line-height:1.3;letter-spacing:0}
.art-card h2 a{color:var(--ink);text-decoration:none}
.art-card h2 a::after{content:'';position:absolute;top:0;right:0;bottom:0;left:0;border-radius:var(--radius-lg)}
.art-card h2 a:focus-visible{outline:none}
.art-card h2 a:focus-visible::after{outline:3px solid var(--focus);outline-offset:3px}
.art-card p{margin:0 0 14px;color:var(--ink-2)}
.art-card__more{display:inline-flex;align-items:center;margin-top:auto;font-weight:700;color:var(--link)}
.art-card__more .ic{width:20px;height:20px;margin-left:6px;stroke-width:2.6}
.empty{max-width:640px;padding:28px 26px;border-radius:var(--radius-lg);background:var(--white);box-shadow:var(--shadow)}
.empty p{margin:0}
@media(min-width:768px){.arts{grid-template-columns:1fr 1fr;grid-gap:24px}.art__cta{padding:40px 44px}.art__cta .btn+.btn{margin:0 0 0 12px}}
@media(min-width:900px){.page{padding:56px 0 112px}}
@media(min-width:1100px){.arts{grid-template-columns:repeat(3,1fr)}}
@media(prefers-reduced-motion:reduce){.art-card:hover{transform:none}}
`;

function pagina(c, o) {
  return `<!DOCTYPE html>
<!-- Página gerada por .work/build-artigos.cjs${o.fonte ? ' a partir de ' + o.fonte : ''}. Não edite aqui: edite o texto e rode o build de novo. -->
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.titulo)}</title>
<meta name="description" content="${esc(o.descricao)}">
${o.robots ? `<meta name="robots" content="${o.robots}">\n` : ''}<meta name="theme-color" content="#101e44">
<link rel="canonical" href="${o.url}">
<meta property="og:type" content="${o.ogTipo}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Clínica de Olhos Brasil Vita &amp; Associados">
<meta property="og:title" content="${esc(o.ogTitulo || o.titulo)}">
<meta property="og:description" content="${esc(o.descricao)}">
<meta property="og:url" content="${o.url}">
<meta property="og:image" content="${o.imagem}">
${o.publicado ? `<meta property="article:published_time" content="${o.publicado}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/dm-sans-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dm-serif-display-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
<script>${c.cabeca}</script>
<style>
${c.css}
${CSS_ARTIGOS}</style>
${o.jsonld ? `<script type="application/ld+json">\n${JSON.stringify(o.jsonld, null, 2)}\n</script>\n` : ''}</head>
<body>
${c.gtm}
${c.sprite}

<a class="skip" href="#conteudo">Ir para o conteúdo</a>

${c.cabecalho}

<main id="conteudo">
${o.main}
</main>

${c.rodape}

${c.barra}

<script>${c.script}</script>
</body>
</html>
`;
}

function paginaArtigo(c, a, autora) {
  const url = `${SITE}/artigos/${a.endereco}/`;
  const imagem = a.capa ? `${SITE}/assets/artigos/${a.capa.arquivo}` : `${SITE}/assets/img/hero-1122.jpg`;
  const rel = a.cirurgia ? CIRURGIAS[a.cirurgia] : null;
  const linhaAutora = [autora.especialidade, autora.crm, autora.rqe].filter(Boolean).map(esc).join(' — ');
  const main = `<article class="page">
  <div class="wrap art__wrap">
    <nav class="crumbs" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">›</span><a href="/artigos/">Artigos</a></nav>
${a.rascunho ? `    <p class="draft"><strong>Rascunho.</strong> Esta página serve só para conferir o modelo: não aparece na lista de artigos, não entra no sitemap, não é publicada e pede ao Google para não indexar.</p>\n` : ''}    <header class="art__head">
      <p class="eyebrow"><span>Artigo · <time datetime="${a.data}">${dataPorExtenso(a.data)}</time></span></p>
      <h1>${esc(a.titulo)}</h1>
      <p class="art__lead">${esc(a.resumo)}</p>
      <div class="art__by">
        <picture><source type="image/webp" srcset="/assets/img/dra-celia-160.webp"><img src="/assets/img/dra-celia-160.jpg" width="160" height="160" alt="" decoding="async"></picture>
        <p><strong>${esc(autora.nome)}</strong><span>${linhaAutora}</span><span>Leitura de ${a.minutos} ${a.minutos === 1 ? 'minuto' : 'minutos'}${a.atualizado ? ` · atualizado em <time datetime="${a.atualizado}">${dataPorExtenso(a.atualizado)}</time>` : ''}</span></p>
      </div>
    </header>
${a.capa ? `    <figure class="art__cover"><img src="/assets/artigos/${esc(a.capa.arquivo)}"${a.capa.tam ? ` width="${a.capa.tam.w}" height="${a.capa.tam.h}"` : ''} alt="${esc(a.capa.alt)}" decoding="async"></figure>\n` : ''}    <div class="prose">
${a.html}
    </div>
${rel ? `    <a class="art__rel" href="${rel[0]}"><svg class="ic" aria-hidden="true"><use href="#i-eye"></use></svg>${esc(rel[1])}</a>\n` : ''}    <aside class="art__cta" aria-labelledby="ctaTitulo">
      <h2 id="ctaTitulo">Quer avaliar os seus olhos?</h2>
      <p>A indicação de qualquer tratamento depende de consulta com o oftalmologista.</p>
      <a class="btn" href="${WHATS}${encodeURIComponent('Olá, li o artigo "' + a.titulo + '" e gostaria de agendar uma avaliação.')}" target="_blank" rel="noopener"><svg class="ic ic-wa" aria-hidden="true"><use href="#i-wa"></use></svg>Agendar avaliação<span class="sr-only"> pelo WhatsApp (abre em nova janela)</span></a>
      <a class="btn btn--ghost" href="tel:+551138131200"><svg class="ic" aria-hidden="true"><use href="#i-phone"></use></svg>Ligar <span class="nw">(11) 3813-1200</span></a>
    </aside>
    <p class="art__note">Este conteúdo é informativo e não substitui a consulta com o oftalmologista.</p>
    <a class="art__back" href="/artigos/">← Ver todos os artigos</a>
  </div>
</article>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.titulo.slice(0, 110),
    description: a.resumo,
    image: [imagem],
    datePublished: a.data,
    dateModified: a.atualizado || a.data,
    inLanguage: 'pt-BR',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: autora.nome, jobTitle: autora.especialidade || 'Oftalmologista', identifier: [autora.crm, autora.rqe].filter(Boolean).join(' · ') || undefined },
    publisher: {
      '@type': 'MedicalClinic',
      name: 'Clínica de Olhos Brasil Vita & Associados',
      url: SITE + '/',
      logo: { '@type': 'ImageObject', url: SITE + '/assets/clinic-logo.png' },
      telephone: '+55-11-3813-1200',
      address: { '@type': 'PostalAddress', streetAddress: 'Av. Brigadeiro Faria Lima, 1597 — 9º andar, conj. 902', addressLocality: 'São Paulo', addressRegion: 'SP', postalCode: '01452-917', addressCountry: 'BR' },
    },
  };
  return pagina(c, {
    fonte: 'conteudo/artigos/' + a.arquivo,
    titulo: `${a.titulo} — Clínica de Olhos Brasil Vita`,
    ogTitulo: a.titulo,
    descricao: a.resumo,
    robots: a.rascunho ? 'noindex, nofollow' : '',
    url, imagem, ogTipo: 'article', publicado: a.data, jsonld, main,
  });
}

function paginaLista(c, artigos, autora) {
  const url = `${SITE}/artigos/`;
  const cartoes = artigos.map(a => `      <li class="art-card">
${a.capa ? `        <img src="/assets/artigos/${esc(a.capa.arquivo)}"${a.capa.tam ? ` width="${a.capa.tam.w}" height="${a.capa.tam.h}"` : ''} alt="" loading="lazy" decoding="async">\n` : ''}        <div class="art-card__body">
          <time datetime="${a.data}">${dataPorExtenso(a.data)}</time>
          <h2><a href="/artigos/${a.endereco}/">${esc(a.titulo)}</a></h2>
          <p>${esc(a.resumo)}</p>
          <span class="art-card__more" aria-hidden="true">Ler o artigo<svg class="ic"><use href="#i-right"></use></svg></span>
        </div>
      </li>`).join('\n');
  const main = `<section class="page page--list" aria-labelledby="tituloArtigos">
  <div class="wrap">
    <nav class="crumbs" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">›</span>Artigos</nav>
    <div class="sh sh--left">
      <p class="eyebrow">Artigos</p>
      <h1 id="tituloArtigos">Artigos sobre saúde dos olhos</h1>
      <p class="intro">Textos informativos escritos pela ${esc(autora.curto || autora.nome)}, oftalmologista da clínica. Eles não substituem a consulta.</p>
    </div>
${artigos.length ? `    <ul class="arts">\n${cartoes}\n    </ul>` : `    <div class="empty"><p>Os primeiros artigos estão sendo preparados. Enquanto isso, a recepção atende pelo telefone <a href="tel:+551138131200">(11) 3813-1200</a>.</p></div>`}
  </div>
</section>`;
  return pagina(c, {
    titulo: 'Artigos sobre saúde dos olhos — Clínica de Olhos Brasil Vita',
    descricao: `Artigos informativos sobre saúde dos olhos escritos pela ${autora.curto || autora.nome}, oftalmologista da Clínica de Olhos Brasil Vita & Associados, em São Paulo.`,
    robots: artigos.length ? '' : 'noindex',
    url, imagem: `${SITE}/assets/img/hero-1122.jpg`, ogTipo: 'website', main,
  });
}

function sitemap(artigos) {
  const hoje = fs.statSync(path.join(RAIZ, 'index.html')).mtime.toISOString().slice(0, 10);
  const urls = [[SITE + '/', hoje]];
  if (artigos.length) urls.push([SITE + '/artigos/', artigos.map(a => a.atualizado || a.data).sort().pop()]);
  for (const a of artigos) urls.push([`${SITE}/artigos/${a.endereco}/`, a.atualizado || a.data]);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado por .work/build-artigos.cjs. Rascunhos nunca entram aqui. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`;
}

/* ---------- montagem ---------- */
function gerar(opcoes = {}) {
  const destino = path.resolve(RAIZ, opcoes.destino || '.');
  const comRascunhos = opcoes.rascunhos !== false;
  const avisos = [], erros = [];
  const autora = (() => {
    const f = path.join(RAIZ, 'conteudo', 'autora.txt');
    const d = fs.existsSync(f) ? lerChaves(fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n')) : {};
    return { nome: d.nome || '[NOME COMPLETO DA DRA. CÉLIA]', curto: d.nome_curto || 'Dra. Célia', especialidade: d.especialidade || 'Oftalmologista', crm: d.crm || 'CRM [NÚMERO]', rqe: d.rqe || 'RQE [NÚMERO]' };
  })();
  const arquivos = fs.existsSync(PASTA_TEXTOS) ? fs.readdirSync(PASTA_TEXTOS).filter(f => f.endsWith('.md') && !f.startsWith('_')).sort() : [];
  const todos = [];
  const usados = new Set();
  for (const arquivo of arquivos) {
    let lido;
    try { lido = lerArtigo(path.join(PASTA_TEXTOS, arquivo)); } catch (e) { erros.push(e.message); continue; }
    const { dados, corpo } = lido;
    const a = { arquivo };
    a.endereco = enderecoDe(dados.endereco || arquivo.replace(/\.md$/, ''));
    a.titulo = (dados.titulo || '').trim();
    a.resumo = (dados.resumo || '').trim();
    a.data = (dados.data || '').trim();
    a.atualizado = dataValida((dados.atualizado || '').trim()) ? dados.atualizado.trim() : '';
    a.rascunho = simOuNao(dados.rascunho);
    a.cirurgia = sem(dados.cirurgia || '').trim();
    const nome = `conteudo/artigos/${arquivo}`;
    if (!a.titulo) erros.push(`${nome}: falta o "titulo".`);
    if (!a.resumo) erros.push(`${nome}: falta o "resumo".`);
    if (!dataValida(a.data)) erros.push(`${nome}: a "data" precisa ser no formato ano-mês-dia, por exemplo 2026-10-15 (está "${a.data}").`);
    if (a.cirurgia && !CIRURGIAS[a.cirurgia]) { avisos.push(`${nome}: "cirurgia: ${a.cirurgia}" não existe; use catarata, lasik, prk, refrativa ou crosslinking. O link foi omitido.`); a.cirurgia = ''; }
    if (a.endereco !== arquivo.replace(/\.md$/, '') && !dados.endereco) avisos.push(`${nome}: o endereço ficou /artigos/${a.endereco}/ (letras minúsculas, sem acento e sem espaço).`);
    if (usados.has(a.endereco)) erros.push(`${nome}: já existe outro artigo com o endereço /artigos/${a.endereco}/.`);
    usados.add(a.endereco);
    if (a.resumo.length > 170) avisos.push(`${nome}: o resumo tem ${a.resumo.length} caracteres; o Google costuma mostrar até uns 155.`);
    if (dataValida(a.data) && a.data > new Date().toISOString().slice(0, 10)) avisos.push(`${nome}: a data (${a.data}) está no futuro; o artigo vai ao ar mesmo assim.`);
    const capa = (dados.capa || '').trim();
    if (capa) {
      const f = path.join(PASTA_CAPAS, capa);
      if (fs.existsSync(f)) a.capa = { arquivo: capa, alt: (dados.capa_descricao || '').trim(), tam: tamanhoImagem(f) };
      else avisos.push(`${nome}: a capa "${capa}" não está em assets/artigos/; o artigo sai sem capa.`);
      if (a.capa && !a.capa.alt) avisos.push(`${nome}: escreva "capa_descricao" (o que aparece na imagem), para quem usa leitor de tela.`);
    }
    const texto = sem(a.titulo + '\n' + a.resumo + '\n' + corpo);
    for (const termo of ALERTAS) if (texto.includes(termo)) avisos.push(`${nome}: CFM — o texto contém "${termo}". Confira se não promete resultado, fala de preço ou traz depoimento.`);
    a.html = markdown(corpo);
    a.minutos = Math.max(1, Math.round(corpo.split(/\s+/).filter(Boolean).length / 200));
    todos.push(a);
  }
  if (erros.length) {
    console.log('\nNão gerei os artigos. Corrija primeiro:\n- ' + erros.join('\n- '));
    const e = new Error('textos dos artigos com problema'); e.erros = erros; throw e;
  }
  const publicados = todos.filter(a => !a.rascunho).sort((x, y) => (y.data + y.titulo < x.data + x.titulo ? -1 : 1));
  const gerados = comRascunhos ? todos : publicados;

  const c = casca();
  const pasta = path.join(destino, 'artigos');
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, 'index.html'), paginaLista(c, publicados, autora));
  for (const a of gerados) {
    fs.mkdirSync(path.join(pasta, a.endereco), { recursive: true });
    fs.writeFileSync(path.join(pasta, a.endereco, 'index.html'), paginaArtigo(c, a, autora));
  }
  fs.writeFileSync(path.join(destino, 'sitemap.xml'), sitemap(publicados));

  const rascunhos = todos.filter(a => a.rascunho);
  console.log(`artigos: ${publicados.length} publicado(s)` + (rascunhos.length ? `, ${rascunhos.length} rascunho(s) ${comRascunhos ? 'gerado(s) só para conferir' : 'deixado(s) de fora'}` : '') + ` → ${path.relative(RAIZ, pasta) || '.'}${path.sep}`);
  for (const a of gerados) console.log(`  /artigos/${a.endereco}/${a.rascunho ? '  (rascunho)' : ''}`);
  if (publicados.length && c.menuComentado) avisos.push('Já há artigo publicado: tire o comentário dos links "Artigos" no index.html (procure por "ARTIGOS:"), para o item aparecer no menu e no rodapé.');
  if (/\[NOME COMPLETO|\[NÚMERO\]/.test(JSON.stringify(autora)) && publicados.length) avisos.push('conteudo/autora.txt ainda tem marcadores [NOME COMPLETO]/[NÚMERO]: preencha nome, CRM e RQE antes de publicar.');
  if (avisos.length) console.log('\nAvisos:\n- ' + avisos.join('\n- '));
  return { publicados, rascunhos, avisos };
}

if (require.main === module) {
  try { gerar(); } catch (e) { if (!e.erros) console.error(e); process.exit(1); }
}
module.exports = { gerar, markdown };
