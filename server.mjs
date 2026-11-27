import http from 'node:http';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = {
  '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript',
  '.mjs':'text/javascript', '.svg':'image/svg+xml', '.webp':'image/webp',
  '.woff2':'font/woff2', '.wasm':'application/wasm', '.task':'application/octet-stream'
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const name = decodeURIComponent(url.pathname).slice(1) || 'index.html';
    const file = path.resolve(root, name);
    const relative = path.relative(root,file);
    if (!(['index.html','style.css','app.js','scene.js'].includes(relative) || relative.startsWith('assets'+path.sep))) {
      res.writeHead(404).end(); return;
    }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'text/plain','Content-Length':info.size});
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404).end(); }
});
let port = 4173;
server.on('error', e => {
  if (e.code === 'EADDRINUSE' && port < 4193) server.listen(++port, '127.0.0.1');
  else { console.error(e.message); process.exitCode = 1; }
});
server.on('listening', () => {
  const url = 'http://127.0.0.1:' + port;
  console.log('Noël Atelier  ' + url);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    spawn('explorer.exe', [url], { detached:true, stdio:'ignore', windowsHide:true }).unref();
  }
});
server.listen(port, '127.0.0.1');
