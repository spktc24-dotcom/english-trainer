// Генерує MP3 для всіх фраз з tts-texts.json → audio/<lang>/<hash>.mp3 (вже наявні пропускає).
// Ім'я файлу = ttsHash(text), та сама функція, що й у index.html.
const fs = require('fs'), https = require('https'), path = require('path');
function ttsHash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = url => new Promise((ok, fail) => https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://translate.google.com/' } }, r => {
  const ch = []; r.on('data', c => ch.push(c)); r.on('end', () => ok([r.statusCode, Buffer.concat(ch)]));
}).on('error', fail));
(async () => {
  const items = JSON.parse(fs.readFileSync(__dirname + '/tts-texts.json', 'utf8'));
  let made = 0, skipped = 0;
  for (const { lang, text } of items) {
    const file = path.join(__dirname, 'audio', lang, ttsHash(text) + '.mp3');
    if (fs.existsSync(file)) { skipped++; continue; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&ttsspeed=0.9&q=${encodeURIComponent(text)}`;
    for (let a = 0; ; a++) {
      const [code, buf] = await get(url);
      if (code === 200 && buf.length > 500) { fs.writeFileSync(file, buf); made++; break; }
      if (a >= 6) { console.log('\nFAILED', code, lang, text); break; }
      await sleep(4000 * (a + 1));
    }
    if (made % 50 === 0) console.log(`made ${made}, skipped ${skipped}, of ${items.length}`);
    await sleep(250);
  }
  console.log(`DONE made ${made}, skipped ${skipped}, total ${items.length}`);
})();
