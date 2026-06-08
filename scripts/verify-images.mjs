import fs from 'fs';

const src = fs.readFileSync('src/data/events.js', 'utf8');
const urls = [...src.matchAll(/(?:photo|detail):'(https:\/\/[^']+)'/g)].map(m => m[1]);
const unique = [...new Set(urls)];

const broken = [];
const ok = [];

for (const u of unique) {
  await new Promise(r => setTimeout(r, 1500));
  try {
    const res = await fetch(u, { method: 'HEAD', headers: { 'User-Agent': 'JesusLifeVerify/1.0' } });
    if (res.status === 200) ok.push(u);
    else broken.push({ url: u, status: res.status });
  } catch (e) {
    broken.push({ url: u, status: 'ERR' });
  }
  process.stdout.write(`\r${ok.length + broken.length}/${unique.length}`);
}

console.log('\n\nBROKEN (' + broken.length + '):');
broken.forEach(b => console.log(b.status, b.url.split('/').pop()));

fs.writeFileSync('scripts/verify-result.json', JSON.stringify({ ok, broken }, null, 2));