import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const markdown = await readFile(new URL('README.md', root), 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inline = text => escape(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|BILDQUELLEN\.txt)\)/g, '<a href="$2">$1</a>');
let content = '', navigation = '', list = false, section = 0;
const closeList = () => { if (list) { content += '</ul>'; list = false; } };
for (const line of markdown.split('\n')) {
  const picture = line.match(/^!\[([^\]]+)\]\((bilder\/[a-z0-9-]+\.png)\)$/);
  if (picture) {
    closeList();
    content += `<figure><a href="${escape(picture[2])}"><img src="${escape(picture[2])}" alt="${escape(picture[1])}" width="1440" height="1000"></a><figcaption>${escape(picture[1])}</figcaption></figure>`;
    continue;
  }
  const heading = line.match(/^(#{1,2}) (.+)$/);
  if (heading) {
    closeList();
    const level = heading[1].length, id = `abschnitt-${section++}`;
    content += `<h${level} id="${id}">${inline(heading[2])}</h${level}>`;
    if (level === 2) navigation += `<a href="#${id}">${inline(heading[2])}</a>`;
  } else if (line.startsWith('- ')) {
    if (!list) { content += '<ul>'; list = true; }
    content += `<li>${inline(line.slice(2))}</li>`;
  } else {
    closeList();
    if (line.trim()) content += `<p>${inline(line)}</p>`;
  }
}
closeList();
const hash = createHash('sha256').update(markdown).digest('hex');
const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="source-sha256" content="${hash}"><meta name="description" content="ASA Anatomie: lokale 3D-Anatomie zum Erkunden und Lernen. Einblick in den aktuellen Entwicklungsstand und die geplante Richtung.">
<link rel="icon" href="data:,"><title>ASA Anatomie · Projektinformation</title>
<style>
:root{font:16px/1.7 system-ui,sans-serif;color:#283b36;background:#f5f5f0;color-scheme:light}*{box-sizing:border-box}body{margin:0;height:100dvh;overflow:hidden;display:grid;grid-template-columns:260px minmax(0,1fr)}nav{overflow:auto;padding:32px 24px;background:#fffef9;border-right:1px solid #d8dfd8}nav strong{display:block;font-size:24px;line-height:1.3}nav small{display:block;margin:8px 0 26px;color:#52685c}nav a{display:block;padding:8px 0;color:#355e4d;text-decoration:none}nav a:hover{text-decoration:underline}a:focus-visible{outline:2px solid #355e4d;outline-offset:3px}main{min-width:0;overflow:auto;padding:36px clamp(20px,6vw,90px)}article{max-width:850px;margin:auto}h1{font-size:clamp(28px,4vw,46px);line-height:1.2;letter-spacing:-.04em;margin:0 0 22px}h2{font-size:24px;line-height:1.35;margin-top:42px;padding-top:22px;border-top:1px solid #d8dfd8;scroll-margin-top:20px}p,li{overflow-wrap:anywhere}li{margin:9px 0}ul{padding-left:22px}code{background:#e7ece5;border-radius:4px;padding:2px 5px;font-size:.85em;overflow-wrap:anywhere}@media(max-width:680px){body{grid-template-columns:140px minmax(0,1fr)}nav{padding:22px 12px}nav strong{font-size:19px}nav a{font-size:13px}main{padding:24px 16px}h2{font-size:21px}body{font-size:15px}}@media(prefers-reduced-motion:no-preference){main{scroll-behavior:smooth}}
figure{margin:26px 0 12px}figure img{display:block;width:100%;height:auto;border:1px solid #d8dfd8;border-radius:8px}figcaption{font-size:13px;color:#52685c;margin-top:8px}article a{color:#355e4d}
</style></head><body><nav aria-label="Inhaltsverzeichnis"><strong>ASA Anatomie</strong><small>Projektinformation<br>In Entwicklung</small>${navigation}</nav><main tabindex="-1"><article>${content}</article></main></body></html>`;
await writeFile(new URL('index.html', root), html);
console.log(`Infoseite aus README.md erzeugt: ${Buffer.byteLength(html)} Bytes, ${section - 1} Navigationsabschnitte.`);
