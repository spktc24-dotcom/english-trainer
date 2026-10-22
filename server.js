const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const PORT = 3000;
const DIR  = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.mp3':  'audio/mpeg',
};

http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // ── /tts  →  проксі до Google Translate TTS ──
  if (reqUrl.pathname === '/tts') {
    const text  = reqUrl.searchParams.get('text') || '';
    const lang  = reqUrl.searchParams.get('lang') || 'uk';
    const speed = reqUrl.searchParams.get('speed') || '0.9';

    const gUrl =
      `https://translate.google.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}` +
      `&client=tw-ob&ttsspeed=${speed}`;

    https.get(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer':    'https://translate.google.com/'
      }
    }, gRes => {
      res.writeHead(200, {
        'Content-Type':  'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      });
      gRes.pipe(res);
    }).on('error', err => {
      res.writeHead(502);
      res.end('Google TTS error: ' + err.message);
    });
    return;
  }

  // ── статичні файли ──
  let filePath = path.normalize(
    path.join(DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname)
  );
  if (!filePath.startsWith(DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ct = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  });

}).listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('✅  Тренажер запущено!');
  console.log('👉  Відкрий у Chrome:  http://localhost:' + PORT);
  console.log('');
  console.log('Зупинити: Ctrl + C');
});
