import {getLanguage, t} from './i18n.js';

// The offline edition carries a pristine document shell, its stylesheet and its
// module bundle. Nothing is copied from the live scene, forms or incoming note.
let hostedTemplate;

async function getTemplate() {
  if (document.getElementById('gift-shell')) return document;
  if (!hostedTemplate) {
    hostedTemplate = (async () => {
      const url = new URL('./gift-template.html', import.meta.url);
      const response = await fetch(url, {mode: 'same-origin', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw new Error(t('未能读取礼物模板', 'The gift template could not be loaded.'));
      return new DOMParser().parseFromString(await response.text(), 'text/html');
    })().catch(error => {
      hostedTemplate = undefined;
      throw error;
    });
  }
  return hostedTemplate;
}

function printableJSON(value) {
  // Script raw-text elements interpret a literal closing tag even for JSON.
  const entities = {'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'};
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => entities[char]);
}

export async function downloadGift({to = '', from = '', message = '', lang = getLanguage()} = {}) {
  const template = await getTemplate();
  const shell = template.getElementById('gift-shell');
  const style = template.getElementById('gift-style');
  const program = template.getElementById('gift-program');
  if (!shell || !style || !program) throw new Error(t('礼物模板不完整', 'The gift template is incomplete.'));

  const original = new TextDecoder().decode(Uint8Array.from(atob(shell.textContent), c => c.charCodeAt(0)));
  const note = {to: String(to), from: String(from), message: String(message), lang: lang === 'zh' ? 'zh' : 'en'};
  const parts = {
    STYLE: style.outerHTML,
    PROGRAM: program.outerHTML,
    SHELL: shell.outerHTML,
    MESSAGE: '<script id="gift-message" type="application/json">' + printableJSON(note) + '</script>'
  };
  const html = original.replace(/<html\s+lang="[^"]*"/i, '<html lang="' + (note.lang === 'zh' ? 'zh-CN' : 'en') + '"')
    .replace(/<!--GIFT_(STYLE|PROGRAM|SHELL|MESSAGE)-->/g, (_, key) => parts[key]);
  const file = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(file);
  const recipient = Array.from(note.to.trim()).slice(0, 40).join('').replace(/[<>:"/\\|?*\x00-\x1f]/g, ' ').trim();
  const link = document.createElement('a');
  link.download = (note.lang === 'zh' ? '送给' + (recipient || '你') : 'A Christmas gift for ' + (recipient || 'you')) + '.html';
  link.href = url;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
