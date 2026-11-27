import {t} from './i18n.js';
const releaseAt=.84;
const manualLimit=.235;
export const parcelTrackEnd=.65;

// The film uses smoothstep for the parcel. Its inverse carries the exact
// manually reached pose into the first automatic frame.
export function filmTimeForParcel(p){
  const u=Math.min(1,Math.max(0,p));
  return parcelTrackEnd*(.5-Math.sin(Math.asin(1-2*u)/3));
}

export function createUnwrapInput({stage,status,sealed,ready,preview,open,reducedMotion}){
  let press=null,heldKey=null,pull=0,returning=null,caption='';
  const clamp=value=>Math.max(0,Math.min(1,value));
  function label(text){
    if(text!==caption){caption=text;status.textContent=text}
  }
  function pullHint(){
    return pull>=releaseAt?t('松手，打开礼物','Release to open your gift'):
      press?.kind==='pull'||heldKey?t('继续拉开缎带','Keep pulling the ribbon'):
      t('横向拉开缎带，或轻点礼盒','Pull the ribbon sideways, or tap the present');
  }
  function show(value){
    pull=clamp(value);preview(manualLimit*pull);
    status.style.setProperty('--ribbon-fill',String(Math.min(1,pull/releaseAt)));
    if(ready())label(pullHint());
  }
  function detach(){
    const id=press?.id;press=null;heldKey=null;
    if(id!==undefined&&stage.hasPointerCapture(id))stage.releasePointerCapture(id);
    delete stage.dataset.pulling;
  }
  function clear(){
    detach();returning=null;show(0);readyHint();
  }
  function rewind(){
    detach();
    if(pull<.001||reducedMotion()){returning=null;show(0);return}
    returning={from:pull,age:0};show(pull);
  }
  function release(){
    if(pull<releaseAt){rewind();return}
    detach();returning=null;open(manualLimit*pull);
  }
  function readyHint(){
    if(ready()&&sealed()){
      stage.setAttribute('aria-label',t('拆开圣诞礼物。轻点或按回车直接拆开，也可横向拖动，或按住左右方向键拉开缎带，松手打开。',
        'Unwrap your Christmas gift. Tap or press Enter to open. You can also pull the ribbon sideways or hold a left or right arrow key, then release.'));
      label(pullHint());
    }
  }
  window.addEventListener('gift-languagechange',readyHint);
  stage.addEventListener('pointerdown',e=>{
    if(!sealed()||press||heldKey||!e.isPrimary||e.button!==0)return;
    const r=stage.getBoundingClientRect(),half=Math.min(r.width*.40,r.height*.41);
    const near=Math.abs(e.clientX-r.left-r.width*.5)<=half&&
      e.clientY>=r.top+r.height*.16&&e.clientY<=r.top+r.height*.82;
    press={id:e.pointerId,x:e.clientX,y:e.clientY,near:near&&ready(),base:pull,
      travel:Math.max(65,Math.min(177,half*.77,r.width*.30)),kind:'pending',direction:0};
    returning=null;stage.setPointerCapture(e.pointerId);
  });
  function move(e){
    if(!press||press.id!==e.pointerId||press.kind==='ignore')return;
    const dx=e.clientX-press.x,dy=e.clientY-press.y;
    if(press.kind==='pending'){
      if(Math.hypot(dx,dy)<=7)return;
      if(!press.near||Math.abs(dx)<Math.abs(dy)*1.15){press.kind='ignore';return}
      press.kind='pull';press.direction=Math.sign(dx);stage.dataset.pulling='true';
    }
    show(press.base+(dx*press.direction-6)/press.travel);
  }
  stage.addEventListener('pointermove',move);
  stage.addEventListener('pointerup',e=>{
    if(!press||press.id!==e.pointerId)return;
    move(e);
    if(press.kind==='pending'){detach();open(manualLimit*pull)}
    else if(press.kind==='pull')release();
    else rewind();
  });
  function cancel(e){if(press?.id===e.pointerId)rewind()}
  stage.addEventListener('pointercancel',cancel);stage.addEventListener('lostpointercapture',cancel);
  stage.addEventListener('keydown',e=>{
    if(!sealed()||!ready()||!['ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();if(e.repeat||press||heldKey)return;
    returning=null;heldKey=e.key;stage.dataset.pulling='true';show(Math.max(.04,pull));
  });
  stage.addEventListener('keyup',e=>{if(heldKey===e.key){e.preventDefault();release()}});
  stage.addEventListener('blur',()=>{if(heldKey)rewind()});
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&sealed()&&(press||heldKey||returning)){e.preventDefault();rewind()}
  });
  window.addEventListener('blur',()=>{if(sealed()&&(press||heldKey||returning))clear()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&sealed())clear()});
  function tick(dt){
    if(heldKey){show(pull+dt*1.25);return}
    if(!returning)return;
    returning.age+=dt;
    const t=Math.min(1,returning.age/.36);
    show(returning.from*(1-t)**3);
    if(t===1)returning=null;
  }
  return {clear,readyHint,tick};
}
