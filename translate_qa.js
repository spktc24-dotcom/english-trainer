// Перекладає всі Q/A з qa-data.js українською → qa-uk.json (кеш; вже перекладене не чіпає)
const fs = require('fs'), https = require('https');
const { QA } = require('./qa-data');
const OUT = __dirname + '/qa-uk.json';
const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = url => new Promise((ok, fail) => {
  https.get(url, { headers: { 'User-Agent': 'curl/8.4.0', 'Accept': '*/*' } }, r => {
    let d = ''; r.setEncoding('utf8'); r.on('data', c => d += c); r.on('end', () => ok([r.statusCode, d]));
  }).on('error', fail);
});
async function trBatch(lines) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uk&dt=t&q=' + encodeURIComponent(lines.join('\n'));
  for (let attempt = 0; attempt < 5; attempt++) {
    const [code, body] = await get(url);
    if (code === 200) {
      const out = JSON.parse(body)[0].map(x => x[0]).join('').split('\n').map(s => s.trim());
      if (out.length === lines.length) return out;
      throw new Error('line mismatch ' + out.length + '/' + lines.length);
    }
    console.log('HTTP', code, 'retry in', 5 * (attempt + 1), 's'); await sleep(5000 * (attempt + 1));
  }
  throw new Error('blocked');
}
(async () => {
  const texts = [...new Set(Object.values(QA).flatMap(v => [v[1], v[2], v[4], v[5]]))].filter(t => !cache[t]);
  console.log('to translate:', texts.length);
  for (let i = 0; i < texts.length; i += 20) {
    const part = texts.slice(i, i + 20);
    const res = await trBatch(part);
    part.forEach((t, j) => cache[t] = res[j]);
    fs.writeFileSync(OUT, JSON.stringify(cache, null, 1), 'utf8');
    process.stdout.write('.'); await sleep(1500);
  }
  console.log('\ndone, total', Object.keys(cache).length);
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
