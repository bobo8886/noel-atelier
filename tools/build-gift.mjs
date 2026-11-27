import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

// For development, provide esbuild in node_modules or via NODE_PATH.
const source = fileURLToPath(new URL('../', import.meta.url));
const target = process.argv[2] || path.join(source, 'assets', 'gift-template.html');
const {build} = createRequire(import.meta.url)('esbuild');
const mimeTypes = {
  '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ico':'image/x-icon'
};
const sheetLoaders = Object.fromEntries(Object.keys(mimeTypes).map(ext => [ext, 'dataurl']));
const common = {absWorkingDir:source, bundle:true, write:false, minify:true, legalComments:'inline'};
const bundle = await build({
  ...common, entryPoints:['app.js'], format:'esm', target:'es2022',
  alias:{three:path.join(source, 'assets', 'three.module.js')},
  plugins:[{
    name:'portable-camera',
    setup(build) {
      build.onResolve({filter:/\/hands\.js$/}, () => ({
        path:path.join(source, 'assets', 'hands-portable.js')
      }));
    }
  }]
});
const index = await fs.readFile(path.join(source, 'index.html'), 'utf8');
const attribute = (tag, name) => tag.match(new RegExp('\\s' + name + '\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]', 'i'))?.[1];
const styles = [];
let shell = index;
// Include the copyright notices in every offline gift, including later replies.
const licenses = ['LICENSE', 'assets/LICENSE', 'assets/icons/LICENSE.txt',
  'assets/fonts/Cormorant-LICENSE.txt', 'assets/fonts/DM-Sans-LICENSE.txt', 'assets/fonts/WenKai-LICENSE.txt'];
const notice = (await Promise.all(licenses.map(async file =>
  file + '\n\n' + await fs.readFile(path.join(source, file), 'utf8')))).join('\n\n');
shell = shell.replace('</head>', () => '<script type="text/plain" id="gift-licenses">' +
  notice.replace(/<\/script/gi, '<\\/script') + '</script>\n</head>');
for (const [tag] of index.matchAll(/<img\b[^>]*>/gi)) {
  const src = attribute(tag, 'src');
  if (!src || /^(?:data:|https?:|\/\/)/i.test(src)) continue;
  const bytes = await fs.readFile(path.resolve(source, src));
  shell = shell.replace(tag, () => tag.replace(src, 'data:' + mimeTypes[path.extname(src)] + ';base64,' + bytes.toString('base64')));
}
for (const [tag] of index.matchAll(/<link\b[^>]*>/gi)) {
  const rel = attribute(tag, 'rel')?.toLowerCase().split(/\s+/);
  const url = attribute(tag, 'href');
  if (rel?.includes('preload') || rel?.includes('modulepreload')) {
    shell = shell.replace(tag, '');
  } else if (rel?.includes('stylesheet')) {
    const sheet = await build({...common, entryPoints:[url], loader:sheetLoaders});
    let css = sheet.outputFiles[0].text;
    const media = attribute(tag, 'media');
    if (media) css = '@media ' + media + '{' + css + '}';
    shell = shell.replace(tag, styles.length === 0 ? '<!--GIFT_STYLE-->' : '');
    styles.push(css);
  } else if (rel?.includes('icon')) {
    const data = await fs.readFile(path.resolve(source, url));
    const href = 'data:' + mimeTypes[path.extname(url)] + ';base64,' + data.toString('base64');
    shell = shell.replace(tag, () => tag.replace(url, () => href));
  }
}
shell = shell.replace(/<script\b[^>]*\btype\s*=\s*["']importmap["'][^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<script\b[^>]*\bid\s*=\s*["']gift-message["'][^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<script\b[^>]*\bsrc\s*=\s*["'](?:\.\/)?app\.js["'][^>]*>\s*<\/script>/i, '<!--GIFT_MESSAGE-->\n<!--GIFT_SHELL-->\n<!--GIFT_PROGRAM-->');
shell = shell.replace(/^[ \t]+(?=\r?$|<!--GIFT_)/gm, '');
for (const key of ['STYLE','PROGRAM','SHELL','MESSAGE']) {
  if (shell.split('<!--GIFT_' + key + '-->').length !== 2) throw Error('Unexpected template marker count for ' + key);
}
const parts = {
  STYLE:'<style id="gift-style">' + styles.join('\n').replace(/<\/style/gi, '<\\/style') + '\nbody[data-portable] #camera{display:none!important}</style>',
  SHELL:'<script id="gift-shell" type="application/octet-stream">' + Buffer.from(shell).toString('base64') + '</script>',
  PROGRAM:'<script id="gift-program" type="module">' + bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script') + '</script>',
  MESSAGE:''
};
const result = shell.replace(/<!--GIFT_(STYLE|PROGRAM|SHELL|MESSAGE)-->/g, (_, key) => parts[key]);
await fs.writeFile(target, result);
console.log('Portable gift HTML', Buffer.byteLength(result), 'bytes');

