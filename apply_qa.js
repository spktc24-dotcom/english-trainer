// Записує питання з qa-data.js (+ переклади з qa-uk.json) в index.html:
//   Питання 1 → поля q/a/g/qu/au у CURRICULUM, Питання 2 → об'єкт Q2.
const fs = require('fs');
const { G, QA } = require('./qa-data');
const UK = require('./qa-uk.json');
const FILE = __dirname + '/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const J = s => JSON.stringify(s);
const uk = s => { if (!UK[s]) throw new Error('No translation: ' + s); return UK[s]; };

// ── CURRICULUM ──
const cs = html.indexOf('const CURRICULUM = [');
const ce = html.indexOf(']; // end CURRICULUM', cs);
let cur = html.slice(cs, ce);
const C = eval(cur.slice(cur.indexOf('[')) + ']');
const keys = [];
C.forEach((u, ui) => u.lessons.forEach((l, li) => l.words.forEach((w, wi) => keys.push([`u${ui}l${li}w${wi}`, w.word]))));
const missing = keys.filter(([k]) => !QA[k]);
if (missing.length) throw new Error('Missing QA: ' + missing.map(m => m.join('=')).join(', '));

let i = 0;
const STR = String.raw`(?:'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")`;
const re = new RegExp(String.raw`q:${STR},(\s*)a:${STR}(?:, g:${STR}, qu:${STR}, au:${STR})?`, 'g');
cur = cur.replace(re, (m, ws) => {
  const [k] = keys[i++]; const [g1, q, a] = QA[k];
  return `q:${J(q)},${ws}a:${J(a)}, g:${J(G[g1])}, qu:${J(uk(q))}, au:${J(uk(a))}`;
});
if (i !== keys.length) throw new Error(`Replaced ${i} of ${keys.length} words`);
html = html.slice(0, cs) + cur + html.slice(ce);

// ── Q2 ──
const qs = html.indexOf('const Q2 = {');
const qe = html.indexOf('}; // end Q2', qs);
let q2 = 'const Q2 = {\n';
let lastU = -1;
keys.forEach(([k, word]) => {
  const ui = +k.match(/^u(\d+)/)[1];
  if (ui !== lastU) { q2 += `// ── ${C[ui].unit}: ${C[ui].title} ──\n`; lastU = ui; }
  const [, , , g2, q, a] = QA[k];
  q2 += `${J(k)}:{ g:${J(G[g2])}, q:${J(q)}, a:${J(a)}, qu:${J(uk(q))}, au:${J(uk(a))} }, // ${word}\n`;
});
html = html.slice(0, qs) + q2 + html.slice(qe);

// ── перевірка JS ──
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
new Function(js);
fs.writeFileSync(FILE, html, 'utf8');
console.log('OK: оновлено', keys.length, 'слів (Q1 + Q2)');
