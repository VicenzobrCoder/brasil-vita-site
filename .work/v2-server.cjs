// Servidor estático de preview: node .work/v2-server.cjs [porta] [pasta] [host]
// Como o Netlify: /pasta → /pasta/ e /pasta/ → /pasta/index.html.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.argv[2] || 8766);
const host = process.argv[4] || '127.0.0.1';
const root = path.resolve(__dirname, '..', process.argv[3] || '.');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
};
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(301, { Location: pathname + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  });
}).listen(port, host, () => console.log(`Preview: http://${host}:${port} (${root})`));
