import {createScene,smooth} from './scene.js';
import {createUnwrapInput,filmTimeForParcel,parcelTrackEnd} from './assets/unwrap-input.js';
import {createHands} from './assets/hands.js';
import {createDedication} from './assets/dedication.js';
import {createWishNote} from './assets/wish-note.js';
import {createLetter} from './assets/letter.js';
import {t} from './assets/i18n.js';
import {bindInterfaceLanguage} from './assets/interface-language.js';

const $=selector=>document.querySelector(selector);
const modes=[...document.querySelectorAll('[data-effect]')];
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const stage=$('#stage'),unwrap=$('#unwrap'),sound=$('#sound');
const clamp=(x,min=0,max=1)=>Math.min(max,Math.max(min,x));
const hints={
  scatter:['移动指尖或指针，牵引这片星河。','Move your fingertip or pointer to guide the stars.'],
  gather:['暖灯沿枝头依次点亮。拖动可转动树身。','Watch the lights climb the branches. Drag to turn the tree.'],
  snow:['左右移动指尖或指针，改变雪落的方向。','Move left or right to change the wind.'],
  wish:['轻点夜空放烟花，或长按蓄光、松手许愿。','Tap the sky for fireworks, or hold and release to make a wish.']
};
const playHint=['拖动旋转圣诞树，长按摘下一颗星。','Drag to turn the tree. Hold to catch a star.'];
let currentHint=playHint,currentNotice=null,loadFailed=false;
const state={
  phase:'sealed',progress:0,time:0,dt:0,growth:0,parcelProgress:0,scatter:0,
  light:0,illumination:0,snow:0,frost:0,charge:0,aimX:.5,aimY:.5,orbit:0
};
let world=null,phaseTime=0,clock=0,lastFrame=null,raf=0,mode='gather',lastCue='';
let orbit=0,scatterTarget=0,chargeTime=null,relight=null,aimX=.5,aimY=.5;
let pointer=null,noticeTimer=0,keyboardCharge=false,requestedOpen=false;
const letter=createLetter();
const drawDedication=createDedication($('#dedication'),letter.recipient);
const wishNote=createWishNote({onSend(){
  if(!world||state.phase!=='play')return;
  cancelCharge();world.wish({x:aimX,y:.30,strength:1});bell(1174.66,.058,2.2);
  setHint('心愿星已升起。这句话会留在你的圣诞贺卡上。','Your wish is in the sky. You’ll find it on your Christmas card.');
}});

function setHint(zh,en=zh){currentHint=[zh,en];const text=t(zh,en);if($('#hint').textContent!==text)$('#hint').textContent=text}
function notify(zh,en=zh){
  if(state.phase==='play'){setHint(zh,en);return}
  currentNotice=[zh,en];clearTimeout(noticeTimer);$('#message').textContent=t(zh,en);
  noticeTimer=setTimeout(()=>{currentNotice=null;$('#message').textContent=''},3500);
}
function phaseLabels(){
  if(state.phase==='sealed'){
    if(!world)stage.setAttribute('aria-label',t('拆开圣诞礼物','Open the Christmas gift'));
  }else{
    stage.setAttribute('aria-label',state.phase==='play'
      ?t('拖动转动圣诞树，按住空格或长按许愿','Drag to turn the Christmas tree. Hold the Space key or press and hold to make a wish.')
      :t('礼物动画','Christmas gift animation'));
  }
  $('#skip').textContent=state.phase==='closing'?t('查看贺卡','View your card'):t('跳过开场','Skip opening');
}
function setPhase(phase){
  state.phase=phase;state.progress=0;phaseTime=0;lastCue='';document.body.dataset.phase=phase;
  const sealed=phase==='sealed',playing=phase==='play',film=phase==='opening'||phase==='closing';
  $('#write-gift').hidden=!sealed||Boolean(letter.recipient);
  wishNote.setActive(playing&&mode==='wish');
  $('#invitation').hidden=!sealed;$('#sealed-actions').hidden=!sealed;
  $('#controls').hidden=!playing;$('#film').hidden=!film;$('#letter').hidden=phase!=='card';
  $('#camera').hidden=!playing;$('#guide').hidden=true;$('#guide-toggle').setAttribute('aria-expanded','false');
  currentNotice=null;$('#message').textContent='';
  stage.tabIndex=sealed||playing?0:-1;
  phaseLabels();
  if(film)$('.film-line span').style.transform='scaleX(0)';
}
const score=[72,76,79,0,81,79,76,0,74,77,81,0,79,76,72,0,69,72,76,0,77,76,74,0,71,74,77,0,76,74,72,0];
let audio=null,musicOn=false,musicTimer=0;
function bell(frequency,volume=.045,length=1.5){
  if(!musicOn||!audio)return;
  const now=audio.currentTime;
  for(const [ratio,amp,tail] of [[1,1,1],[2.002,.25,.60],[3.99,.08,.32]]){
    const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=frequency*ratio;
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume*amp,now+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,now+length*tail);osc.connect(gain).connect(audio.destination);
    osc.start(now);osc.stop(now+length*tail+.04);
    osc.onended=()=>{osc.disconnect();gain.disconnect()};
  }
}
function soundLabel(){
  const label=musicOn?t('关闭音乐','Turn music off'):t('开启音乐','Turn music on');sound.title=label;sound.setAttribute('aria-label',label);
  sound.setAttribute('aria-pressed',String(musicOn));sound.firstElementChild.className='icon '+(musicOn?'audible':'muted');
}
function quiet(){musicOn=false;clearTimeout(musicTimer);soundLabel();audio?.suspend().catch(()=>{})}
sound.addEventListener('click',async()=>{
  if(musicOn){quiet();return}
  try{
    audio??=new (window.AudioContext||window.webkitAudioContext)();musicOn=true;await audio.resume();if(!musicOn)return;
    soundLabel();let bar=0;
    function next(){
      if(!musicOn)return;
      const midi=score[bar%score.length];
      if(midi)bell(440*2**((midi-69)/12),.034,1.9);
      if(bar%8===0)bell([130.81,146.83,110,123.47][(bar/8)%4],.022,2.3);
      bar++;musicTimer=setTimeout(next,bar%8===0?860:455);
    }
    next();
  }catch{quiet();notify('浏览器未能播放音乐','Your browser couldn’t play the music.')}
});
function updateMode(next){
  mode=next;for(const b of modes)b.setAttribute('aria-pressed',String(b.dataset.effect===next));
  wishNote.setActive(state.phase==='play'&&next==='wish');
}
function aim(x,y){if(!wishNote.editing){aimX=clamp(x);aimY=clamp(y)}}
function activate(next){
  if(!world||state.phase!=='play'||wishNote.editing)return;
  updateMode(next);scatterTarget=next==='scatter'?1:0;
  if(next==='gather')relight=clock;
  if(next==='wish')world.wish({x:aimX,y:aimY,strength:.85});
  bell(({scatter:739.99,gather:659.25,snow:987.77,wish:1174.66})[next]);
  setHint(...hints[next]);
}
function startCharge(){
  if(state.phase!=='play'||wishNote.editing)return;
  chargeTime=clock;setHint('指尖的星光正在汇聚，松开即可放飞。','Starlight is gathering at your fingertips. Release to send it skyward.');
}
function cancelCharge(){
  if(chargeTime!==null && state.phase==='play')setHint(...hints[mode]);
  chargeTime=null;state.charge=0;
}
function releaseWish(){
  if(wishNote.editing){cancelCharge();return}
  if(chargeTime===null||state.phase!=='play')return;
  const strength=clamp((clock-chargeTime)/1.1,.3,1);cancelCharge();
  world.wish({x:aimX,y:aimY,strength});updateMode('wish');scatterTarget=0;
  bell(1046.50,.064,2.1);setHint('愿望星已放飞。再摘一颗，或收下最后的祝福。','Your wish is on its way. Catch another star or open your card.');
}
const hands=createHands({video:$('#webcam'),button:$('#camera'),onAim:aim,onEffect:activate,
  onPinch:startCharge,onRelease:releaseWish,onCancel:cancelCharge,onStatus:notify,inputPaused:()=>wishNote.editing});

const ribbon=createUnwrapInput({stage,status:$('#load-state'),sealed:()=>state.phase==='sealed',
  ready:()=>Boolean(world),preview:p=>{state.parcelProgress=p},open:openGift,reducedMotion:()=>motion.matches});
const openingDuration=()=>motion.matches?1.1:12.4;
function openGift(fromParcel=0){
  if(!world){requestedOpen=true;return}
  if(state.phase!=='sealed')return;
  ribbon.clear();setPhase('opening');state.parcelProgress=fromParcel;
  state.progress=filmTimeForParcel(fromParcel);phaseTime=openingDuration()*state.progress;lastFrame=null;
  $('#skip').focus({preventScroll:true});bell(523.25,.04,2);
}
function completeFilm(){
  if(state.phase==='opening'){
    setPhase('play');state.parcelProgress=1;state.growth=1;state.light=1;relight=null;
    updateMode('gather');setHint(...playHint);stage.focus({preventScroll:true});
  }else if(state.phase==='closing'){
    setPhase('card');$('#letter').scrollTop=0;$('#keep').focus({preventScroll:true});
  }
}
function wrapUp(){
  if(state.phase!=='play')return;
  letter.remember(world,wishNote.value);
  hands.stop();pointer=null;keyboardCharge=false;cancelCharge();scatterTarget=0;relight=null;
  setPhase('closing');$('#skip').focus({preventScroll:true});bell(783.99,.054,2.5);
}
function reset(){
  wishNote.reset();letter.reset();
  hands.stop();world?.reset();cancelCharge();scatterTarget=0;relight=null;orbit=0;aim(.5,.5);
  state.scatter=0;state.snow=0;state.frost=0;state.growth=0;state.light=0;state.illumination=0;state.parcelProgress=0;state.orbit=0;
  updateMode('gather');setPhase('sealed');ribbon.clear();unwrap.focus({preventScroll:true});
  resumeScene();
}
unwrap.addEventListener('click',()=>openGift());$('#skip').addEventListener('click',completeFilm);
$('#finish').addEventListener('click',wrapUp);$('#replay').addEventListener('click',reset);
modes.forEach(button=>button.addEventListener('click',()=>activate(button.dataset.effect)));
$('#guide-toggle').addEventListener('click',()=>{
  const open=$('#guide').hidden;$('#guide').hidden=!open;$('#guide-toggle').setAttribute('aria-expanded',String(open));
  if(open)$('#guide-close').focus({preventScroll:true});
});
function closeGuide(){$('#guide').hidden=true;$('#guide-toggle').setAttribute('aria-expanded','false');$('#guide-toggle').focus({preventScroll:true})}
$('#guide-close').addEventListener('click',closeGuide);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#guide').hidden)closeGuide()});
$('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
  catch{notify('此浏览器未提供全屏显示','Fullscreen is unavailable in this browser.')}
});
function fullscreenLabel(){
  const full=Boolean(document.fullscreenElement),b=$('#fullscreen');
  b.firstElementChild.className='icon '+(full?'collapse':'expand');
  b.title=full?t('退出全屏','Leave fullscreen'):t('进入全屏','Enter fullscreen');b.setAttribute('aria-label',b.title);
}
document.addEventListener('fullscreenchange',fullscreenLabel);
function point(e){
  const rect=stage.getBoundingClientRect();aim((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);
}
function tapStage(){
  if(mode==='wish'){activate('wish');return}
  activate(mode==='scatter'?'gather':'scatter');
}
stage.addEventListener('pointerdown',e=>{
  if(pointer||e.button!==0||state.phase!=='play')return;
  point(e);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,start:clock,moved:false,orbit};
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove',e=>{
  if(state.phase!=='play')return;point(e);
  if(!pointer||e.pointerId!==pointer.id)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(!pointer.moved && chargeTime===null && Math.hypot(dx,dy)>7)pointer.moved=true;
  if(pointer.moved)orbit=pointer.orbit+dx/Math.max(240,stage.clientWidth)*Math.PI*2;
});
stage.addEventListener('pointerup',e=>{
  if(!pointer||e.pointerId!==pointer.id)return;
  const press=pointer;pointer=null;
  if(state.phase!=='play')return;
  if(chargeTime!==null)releaseWish();
  else if(!press.moved)tapStage();
});
function cancelPointer(){if(pointer){pointer=null;cancelCharge()}}
stage.addEventListener('pointercancel',cancelPointer);stage.addEventListener('lostpointercapture',cancelPointer);
stage.addEventListener('click',e=>{if(e.detail===0){if(state.phase==='sealed')openGift();else if(state.phase==='play')activate('wish')}});
stage.addEventListener('keydown',e=>{
  if(![' ','Enter','ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();
  if(state.phase==='sealed'){if(!e.repeat&&[' ','Enter'].includes(e.key))openGift();return}
  if(state.phase!=='play')return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){orbit+=(e.key==='ArrowLeft'?-.12:.12);return}
  if(e.repeat)return;
  if(e.key===' '){keyboardCharge=true;startCharge()}else tapStage();
});
stage.addEventListener('keyup',e=>{if(e.key===' '&&keyboardCharge){keyboardCharge=false;releaseWish()}});
stage.addEventListener('blur',()=>{if(keyboardCharge){keyboardCharge=false;cancelCharge()}});

const openingCues=[
  [0,'解开缎带','The ribbon comes undone',523.25],[.20,'缎带滑过盒沿','Silk slips over the edge',587.33],
  [.327,'揭开盒盖','The lid lifts',659.25],[.43,'星尘，勾出树的轮廓','Stardust sketches a tree',783.99],
  [.67,'云杉从星光里生长','A spruce grows from the starlight',880],[.90,'最后一颗星，送给你','One last star, for you',1046.5]
];
const closingCues=[[0,'收起今夜的星光','Gathering tonight’s starlight',783.99],[.48,'把心愿，寄给你','Sending these wishes to you',659.25],[.85,'圣诞快乐','Merry Christmas',523.25]];
function sequence(dt){
  if(state.phase==='sealed')ribbon.tick(dt);
  const film=state.phase==='opening'||state.phase==='closing';
  if(film){
    phaseTime+=dt;
    const opening=state.phase==='opening',length=opening?openingDuration():motion.matches?1.1:7.2;
    state.progress=clamp(phaseTime/length);
    const p=state.progress,points=opening?openingCues:closingCues;
    const cue=points.filter(item=>p>=item[0]).at(-1);
    if(lastCue!==cue){lastCue=cue;$('#cue').textContent=t(cue[1],cue[2]);bell(cue[3],.036,1.7)}
    $('.film-line span').style.transform='scaleX('+p+')';
    if(opening){
      state.parcelProgress=smooth(0,parcelTrackEnd,p);state.growth=smooth(.55,.94,p);state.light=smooth(.73,.99,p);
      state.illumination=smooth(.42,.64,p)*(1-.86*smooth(.76,.99,p));
    }else{state.growth=1;state.light=1;state.illumination=.14*(1-smooth(0,.5,p))}
    if(p>=1)completeFilm();
  }
  if(state.phase==='play'){
    if(pointer&&!pointer.moved&&chargeTime===null&&clock-pointer.start>.29)startCharge();
    const age=relight===null?10:clock-relight;
    state.light=clamp(age/2.45);
    state.illumination=(.14+.86*smooth(0,.8,age)*(1-smooth(2.0,4.1,age)))*(1-state.scatter);
  }
  const blend=1-Math.exp(-dt*4.6),follow=1-Math.exp(-dt*8);
  state.scatter+=(scatterTarget-state.scatter)*blend;
  const snowTarget=state.phase==='play'&&mode==='snow'?1:0;
  state.snow+=(snowTarget-state.snow)*blend;
  state.frost+=(state.snow-state.frost)*(1-Math.exp(-dt*(snowTarget?.34:.16)));
  state.aimX+=(aimX-state.aimX)*follow;state.aimY+=(aimY-state.aimY)*follow;
  state.orbit+=(orbit-state.orbit)*follow;
  state.charge=chargeTime===null?0:clamp((clock-chargeTime)/.95,.03);
  if(!motion.matches && !pointer && state.phase==='play')orbit+=dt*.048;
}
function canRender(){
  return world&&!document.hidden&&state.phase!=='card'&&!wishNote.editing&&!$('#gift-desk').open;
}
function resumeScene(){
  if(!raf&&canRender()){lastFrame=null;raf=requestAnimationFrame(frame)}
}
function frame(now){
  raf=0;if(!canRender()){lastFrame=null;return}
  const dt=lastFrame===null?0:clamp((now-lastFrame)/1000,0,.3);lastFrame=now;clock+=dt;
  state.dt=dt;state.time+=motion.matches?dt*.12:dt;
  sequence(dt);world.render(state);
  drawDedication(state.phase==='closing'?state.progress:null,motion.matches);
  if(state.phase!=='card')raf=requestAnimationFrame(frame);
}
const dialogsObserver=new MutationObserver(resumeScene);
for(const dialog of document.querySelectorAll('dialog'))dialogsObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
function suspend(){
  cancelAnimationFrame(raf);raf=0;lastFrame=null;pointer=null;keyboardCharge=false;cancelCharge();
  hands.stop();if(musicOn)quiet();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)suspend();else resumeScene();
});
window.addEventListener('pagehide',suspend);
window.addEventListener('pageshow',resumeScene);

function loadLabel(){
  $('#load-state').textContent=loadFailed
    ?t('场景未能载入，请用启动器打开后刷新。','The scene couldn’t load. Open the launcher and refresh.')
    :t('正在准备礼物…','Wrapping your gift…');
}
bindInterfaceLanguage(()=>{
  soundLabel();fullscreenLabel();phaseLabels();
  $('#hint').textContent=t(...currentHint);
  if(currentNotice)$('#message').textContent=t(...currentNotice);
  if(lastCue)$('#cue').textContent=t(lastCue[1],lastCue[2]);
  if(!world)loadLabel();
});
try{
  world=await createScene(letter.recipient);world.render(state);
  stage.setAttribute('aria-disabled','false');unwrap.disabled=false;ribbon.readyHint();
  if(requestedOpen)openGift();
  resumeScene();
}catch(error){console.error(error);loadFailed=true;loadLabel()}
