// Monta a pasta dist/ com só o que o site publicado precisa.
// Gera também as páginas de artigos (sem rascunhos) e o sitemap.xml.
const fs = require('node:fs');
const path = require('node:path');
const { gerar } = require('./build-artigos.cjs');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets', 'vendor'), { recursive: true });
const copy = (from, to) => fs.cpSync(path.join(root, from), path.join(dist, to || from), { recursive: true });
copy('index.html');
copy('_headers');
copy('assets/fonts');
copy('assets/img');
copy('assets/favicon.svg');
copy('assets/clinic-logo.png');
copy('assets/vendor/gsap.min.js');
copy('assets/cirurgias.js');
copy('data/cirurgias.js');
if (fs.existsSync(path.join(root, 'assets', 'artigos'))) copy('assets/artigos');
// licenças das fontes e notas de texto não vão para o ar
for (const dir of ['assets/fonts', 'assets/artigos']) {
  const p = path.join(dist, dir);
  if (fs.existsSync(p)) for (const f of fs.readdirSync(p)) if (/\.(txt|md)$/i.test(f)) fs.rmSync(path.join(p, f));
}
try {
  gerar({ destino: dist, rascunhos: false });
} catch (e) {
  console.error('\nPublicação interrompida: corrija os textos dos artigos e rode de novo.');
  process.exit(1);
}
let total = 0, count = 0;
(function walk(dir) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else { total += st.size; count++; } } })(dist);
console.log(`dist: ${count} arquivos, ${(total / 1024).toFixed(0)} KB`);
