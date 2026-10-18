'use strict';

// Статический сервер без зависимостей: приложение в корне, админка в /xxx/.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8081; // Railway передаёт PORT через env
const HOST = '0.0.0.0';

const ROOT_FILE = 'Зарплаты_и_авансы.html'; // главная страница приложения

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// '/' -> приложение, '/xxx/' -> xxx/index.html. Выход за пределы папки запрещён.
function resolveFile(pathname) {
  let rel;
  try { rel = decodeURIComponent(pathname); } catch (e) { return null; }
  if (!rel || rel === '/') rel = '/' + ROOT_FILE;
  else if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null;
  return file;
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end('<!DOCTYPE html><meta charset="utf-8"><title>404</title><p style="font:16px -apple-system,sans-serif;padding:24px">Страница не найдена</p>');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end('Method Not Allowed');
  }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolveFile(pathname);
  if (!file) return notFound(res);

  fs.stat(file, (stErr, st) => {
    // '/xxx' -> '/xxx/', иначе браузер получит 404 вместо админки.
    if (!stErr && st.isDirectory()) {
      res.writeHead(301, { Location: encodeURI(decodeURIComponent(pathname)) + '/' });
      return res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) return notFound(res);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': data.length,
        // Отдаём свежую версию: приложение и админка обновляются часто.
        'Cache-Control': 'no-cache',
      });
      if (req.method === 'HEAD') return res.end();
      res.end(data);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log('payroll: listening on http://' + HOST + ':' + PORT);
});
