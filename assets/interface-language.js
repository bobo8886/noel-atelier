import {getLanguage, setLanguage, t} from './i18n.js';

// Bind only authored interface copy. Names, messages, and editable values are
// owned by the letter and wish editors, including while a dialog is open.
export function bindInterfaceLanguage(onChange){
  const fields=[];
  const attributes=[['data-en',null],['data-en-lang','lang'],['data-en-title','title'],
    ['data-en-label','aria-label'],['data-en-placeholder','placeholder']];
  for(const [source,target] of attributes){
    for(const node of document.querySelectorAll('['+source+']')){
      if(node.hasAttribute('data-camera-copy')&&document.body.dataset.portable==='true')continue;
      fields.push({node,target,zh:target?node.getAttribute(target):node.textContent,en:node.getAttribute(source)});
    }
  }
  function refresh(){
    for(const {node,target,zh,en} of fields){
      if(target)node.setAttribute(target,t(zh,en));else node.textContent=t(zh,en);
    }
    const chinese=getLanguage()==='zh';
    for(const button of document.querySelectorAll('[data-language-switch]')){
      const label=t('切换到英语','Switch to Chinese');
      button.title=label;button.setAttribute('aria-label',label);
      const caption=document.createElement('span');
      caption.lang=chinese?'en':'zh-CN';caption.textContent=chinese?'EN':'中文';
      button.replaceChildren(caption);
    }
    onChange();
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-language-switch]'))setLanguage(getLanguage()==='zh'?'en':'zh');
  });
  window.addEventListener('gift-languagechange',refresh);
  refresh();
}
