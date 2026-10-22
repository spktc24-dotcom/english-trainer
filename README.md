# English Trainer — Solutions Intermediate

Тренажер слів і граматики (10 Units): флешкарти, діалоги 2×Q&A з мітками граматики, переклад 💡, письмо, граматика з озвучкою.

**Онлайн:** https://spktc24-dotcom.github.io/english-trainer/

## Локально
```
node server.js   →  http://localhost:3000
```

## Оновлення питань
1. Правиш `qa-data.js`
2. `node translate_qa.js` — переклади українською → `qa-uk.json`
3. `node apply_qa.js` — записує в `index.html`
4. `node collect_tts.js index.html tts-texts.json`, потім `node gen_audio.js` — MP3 для нових фраз у `audio/`
