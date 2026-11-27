import {getLanguage, t} from './i18n.js';

// The offline edition carries a pristine document shell, its stylesheet and its
// module bundle. Nothing is copied from the live scene, forms or incoming note.
let cachedParts;
const languageSlot='<!--GIFT_LANG-->', messageSlot='<!--GIFT_MESSAGE-->';

async function prepareParts() {
  let template=document;
  if(!template.getElementById('gift-shell')){
    const response=await fetch(new URL('./gift-template.html',import.meta.url),{mode:'same-origin',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error(t('未能读取礼物模板','The gift template could not be loaded.'));
    template=new DOMParser().parseFromString(await response.text(),'text/html');
  }
  const tags={};
  for(const id of ['style','program','shell']){
    const node=template.getElementById('gift-'+id);
    if(!node)throw new Error(t('礼物模板不完整','The gift template is incomplete.'));
    tags['<!--GIFT_'+id.toUpperCase()+'-->']=new Blob([node.outerHTML]);
  }
  const decoded=atob(template.getElementById('gift-shell').textContent);
  const bytes=new Uint8Array(decoded.length);
  for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
  const shell=new TextDecoder().decode(bytes).replace(/(<html\s+lang=")[^"]*/i,(_,prefix)=>prefix+languageSlot);
  // Blob parts can share the immutable program, styles and shell on every reply.
  return shell.split(/(<!--GIFT_(?:LANG|STYLE|PROGRAM|SHELL|MESSAGE)-->)/g).filter(Boolean).map(part=>
    part===languageSlot||part===messageSlot?part:tags[part]||new Blob([part]));
}

function printableJSON(value) {
  // Script raw-text elements interpret a literal closing tag even for JSON.
  const entities = {'<':'\\u003c','>':'\\u003e','&':'\\u0026','\u2028':'\\u2028','\u2029':'\\u2029'};
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, char => entities[char]);
}

export async function downloadGift({to = '', from = '', message = '', lang = getLanguage()} = {}) {
  cachedParts??=prepareParts().catch(error=>{cachedParts=undefined;throw error;});
  const parts=await cachedParts;
  const note = {to: String(to), from: String(from), message: String(message), lang: lang === 'zh' ? 'zh' : 'en'};
  const messageTag='<script id="gift-message" type="application/json">'+printableJSON(note)+'</script>';
  const file = new Blob(parts.map(part=>part===languageSlot?(note.lang==='zh'?'zh-CN':'en'):part===messageSlot?messageTag:part),
    {type: 'text/html;charset=utf-8'});
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
