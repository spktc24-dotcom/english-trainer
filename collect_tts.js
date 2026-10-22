// Збирає всі фрази для озвучки зі сторінки → tts-texts.json. Потрібен jsdom: npm i jsdom
// node collect_tts.js index.html tts-texts.json
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) { w.speechSynthesis = { getVoices: () => [], cancel(){}, speak(){} }; w.SpeechSynthesisUtterance = function(){}; w.HTMLMediaElement.prototype.play = () => Promise.resolve(); } });
const w = dom.window; const out = [];
const add = (text, lang) => { text = (text || '').trim(); if (text && text !== '–') out.push({ lang: lang.startsWith('uk') ? 'uk' : 'en', text }); };
w.eval('CURRICULUM').forEach((u, ui) => u.lessons.forEach((l, li) => l.words.forEach((wd, wi) => {
  const q2 = w.eval('Q2')[`u${ui}l${li}w${wi}`] || {};
  add(wd.word, 'en'); add(wd.uk, 'uk'); [wd.q, wd.a, q2.q, q2.a].forEach(t => add(t, 'en'));
})));
w.eval('GRAMMAR').forEach(g => g.sections.forEach(sec => w.buildGramQueue(sec).forEach(it => add(it.text, it.lang))));
const uniq = [...new Map(out.map(o => [o.lang + '|' + o.text, o])).values()];
fs.writeFileSync(process.argv[3], JSON.stringify(uniq, null, 1));
console.log('total', uniq.length, 'en', uniq.filter(o=>o.lang==='en').length, 'uk', uniq.filter(o=>o.lang==='uk').length, 'max len', Math.max(...uniq.map(o=>o.text.length)));
setTimeout(() => process.exit(0), 100);
