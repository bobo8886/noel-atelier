import { paintNight } from './assets/night.js';

const clamp = (x,a=0,b=1) => Math.min(b,Math.max(a,x));
export function smooth(a,b,x) {
  const u=clamp((x-a)/(b-a));
  return u*u*(3-2*u);
}

function studioEnvironment(T) {
  const map=document.createElement('canvas');
  map.width=512;map.height=256;
  const ctx=map.getContext('2d');
  const wash=ctx.createLinearGradient(0,0,0,256);
  wash.addColorStop(0,'#b5cabf');wash.addColorStop(.32,'#8d9f9b');
  wash.addColorStop(.53,'#283b3d');wash.addColorStop(.7,'#344c42');wash.addColorStop(1,'#65654d');
  ctx.fillStyle=wash;ctx.fillRect(0,0,512,256);
  for(const [x,y,r,color] of [[82,82,65,'#fff2d6'],[285,110,41,'#f1dac0'],[410,69,58,'#b5dbe7']]){
    const grad=ctx.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(.42,color);grad.addColorStop(1,'transparent');
    ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  const tex=new T.CanvasTexture(map);
  tex.mapping=T.EquirectangularReflectionMapping;tex.colorSpace=T.SRGBColorSpace;
  return tex;
}

function displayStand(T) {
  const base=new T.Group();
  const metal=new T.MeshStandardMaterial({color:0xa58c54,roughness:.31,metalness:.72});
  const dark=new T.MeshStandardMaterial({color:0x193831,roughness:.42,metalness:.40});
  const cloth=document.createElement('canvas');cloth.width=cloth.height=256;
  const weave=cloth.getContext('2d');
  weave.fillStyle='#2b3e36';weave.fillRect(0,0,256,256);
  let seed=425;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<16500;i++){
    weave.fillStyle=i%3?'rgba(192,189,152,.095)':'rgba(0,14,12,.15)';
    weave.fillRect(rand()*256,rand()*256,rand()*1.9+.3,.7);
  }
  const clothTexture=new T.CanvasTexture(cloth);clothTexture.colorSpace=T.SRGBColorSpace;
  const top=new T.MeshStandardMaterial({map:clothTexture,roughness:.91,metalness:.2});
  const layers=[[2.075,2.02,.12,-.16,dark],[2.09,2.09,.018,-.108,metal],[2.045,2.07,.085,-.064,dark],[2.05,2.045,.015,-.021,metal],[2.017,2.025,.017,-.009,top]];
  for(const [r1,r2,height,y,material] of layers){
    const disc=new T.Mesh(new T.CylinderGeometry(r1,r2,height,112),material);
    disc.position.y=y;base.add(disc);
  }
  const marks=[];
  for(let i=0;i<144;i++){
    const a=i*Math.PI/72,inner=i%6===0?1.87:1.934;
    marks.push(Math.cos(a)*inner,.001,Math.sin(a)*inner,Math.cos(a)*1.976,.001,Math.sin(a)*1.976);
  }
  const engrave=new T.BufferGeometry();engrave.setAttribute('position',new T.Float32BufferAttribute(marks,3));
  base.add(new T.LineSegments(engrave,new T.LineBasicMaterial({color:0xd3bd89,transparent:true,opacity:.48})));
  const tile=document.createElement('canvas');tile.width=tile.height=160;
  const c=tile.getContext('2d'),falloff=c.createRadialGradient(80,80,4,80,80,80);
  falloff.addColorStop(0,'#020a07b8');falloff.addColorStop(.33,'#06100d99');falloff.addColorStop(.68,'#07140e40');falloff.addColorStop(1,'#0c140d00');
  c.fillStyle=falloff;c.fillRect(0,0,160,160);
  const shadow=new T.Mesh(new T.PlaneGeometry(3.76,3.22),new T.MeshBasicMaterial({map:new T.CanvasTexture(tile),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.004;base.add(shadow);
  return base;
}

async function webglScene(canvas, recipient) {
  const [T,{createFir},{createParcel},{createMagic},{createLake}]=await Promise.all([
    import('three'),import('./assets/fir.js'),import('./assets/parcel.js'),import('./assets/magic.js'),import('./assets/lake.js')
  ]);
  const r=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.17;
  r.setClearColor(0x000000,0);
  const stage=new T.Scene(), camera=new T.PerspectiveCamera(34,1,.095,90);
  stage.environment=studioEnvironment(T);stage.environmentIntensity=.78;
  stage.add(new T.HemisphereLight(0xe4f0ea,0x68756d,1.02));
  for(const [color,intensity,x,y,z] of [[0xffe6c5,2.18,-4,7,5],[0xc8e9ff,1.85,3,5,-4],[0xffc98e,.62,4,2,4]]){
    const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);stage.add(l);
  }
  const stand=displayStand(T),parcel=createParcel(T,recipient),fir=createFir(T),magic=createMagic(T),lake=createLake(T);
  stage.add(stand,parcel.group,fir.group,magic.group,lake.group);
  const frame=canvas.parentElement;
  const nightRim=new T.DirectionalLight(0xff9ab4,0);nightRim.position.set(-4,4,-2);stage.add(nightRim);
  let lastWidth=0,lastHeight=0,lastDensity=0,lastState=null;
  let filmAspect=1, filmHeight=0, filmWidth=0, filmLeft=0, filmTop=0;
  let slow=0,adaptiveDensity=Math.min(devicePixelRatio||1,1.65);
  const resizeFrame=()=>{
    const a=frame.getBoundingClientRect(),b=canvas.getBoundingClientRect();
    filmWidth=Math.max(1,a.width);filmHeight=Math.max(1,a.height);
    filmAspect=filmWidth/filmHeight;filmLeft=a.left-b.left;filmTop=a.top-b.top;
    camera.userData.inputBounds={left:filmLeft/b.width,top:filmTop/b.height,width:filmWidth/b.width,height:filmHeight/b.height};
    camera.setViewOffset(filmWidth,filmHeight,-filmLeft,-filmTop,Math.max(1,b.width),Math.max(1,b.height));
  };
  new ResizeObserver(resizeFrame).observe(frame);
  function draw(s) {
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    if(s.dt>.055)slow++;else slow=Math.max(0,slow-.4);
    if(slow>24){adaptiveDensity=Math.max(.78,adaptiveDensity*.83);slow=0}
    if(w!==lastWidth||h!==lastHeight||lastDensity!==adaptiveDensity){
      r.setPixelRatio(adaptiveDensity);r.setSize(w,h,false);
      resizeFrame();
      lastWidth=w;lastHeight=h;lastDensity=adaptiveDensity;
    }
    const opening=s.phase==='opening';
    const reveal=s.phase==='sealed'?0:opening?smooth(.21,.625,s.progress):1;
    const evening=s.phase==='sealed'?0:opening?smooth(.33,.75,s.progress):1;
    const closing=s.phase==='card'?1:s.phase==='closing'?smooth(0,.58,s.progress):0;
    const wide=w/h>=1.20, widthFit=Math.max(1,1.13/filmAspect);
    const giftDistance=7.65*widthFit;
    const firDistance=10.94*Math.max(1,.83/filmAspect);
    const radius=T.MathUtils.lerp(giftDistance,firDistance,reveal)*(1+.10*s.scatter+(wide?.15:.28)*closing);
    const angle=T.MathUtils.lerp(.51,.105,reveal)+s.orbit+(s.aimX-.5)*.038+closing*.105;
    const aimY=T.MathUtils.lerp(.99,2.17,reveal)+(wide?.02:1.03)*closing;
    const elevation=T.MathUtils.lerp(.32,-.045,reveal)+.15*closing;
    camera.position.set(Math.sin(angle)*radius,aimY+elevation*radius,Math.cos(angle)*radius);
    camera.lookAt(0,aimY,0);camera.updateMatrixWorld();
    const shift=wide?closing*((filmLeft+filmWidth*.5)-w*.292):0;
    const view=camera.view;
    if(Math.abs(view.offsetX+filmLeft-shift)>.05)
      camera.setViewOffset(filmWidth,filmHeight,-filmLeft+shift,-filmTop,w,h);
    // The velvet stand settles into the lake while a small bank of snow takes its place.
    stand.position.y=-.54*evening;stand.visible=evening<.98;
    nightRim.intensity=evening*(.23+.65*s.scatter);
    parcel.update({time:s.time,progress:s.parcelProgress});
    fir.update({time:s.time,growth:s.growth,scatter:s.scatter,light:s.light,frost:s.frost,aimX:2*s.aimX-1,aimY:1-2*s.aimY});
    magic.update(s);
    lake.update(s,evening,r,stage,camera);
    r.render(stage,camera);lastState=s;
  }
  return {render:draw,wish(options){magic.wish(options);lake.ripple()},reset:magic.reset,capture(){
    // Compose the print independently so a portrait viewport retains the full crown and reflection.
    const print=document.createElement('canvas');print.width=1400;print.height=1050;
    const s=lastState;
    try{
      r.setPixelRatio(1);r.setSize(print.width,print.height,false);
      camera.clearViewOffset();camera.aspect=print.width/print.height;camera.updateProjectionMatrix();
      const a=.105+s.orbit;
      camera.position.set(Math.sin(a)*11.3,3.24,Math.cos(a)*11.3);camera.lookAt(0,2.20,0);camera.updateMatrixWorld();
      lake.update({...s,dt:.13},1,r,stage,camera);r.render(stage,camera);
      print.getContext('2d').drawImage(canvas,0,0);
    }finally{lastWidth=0;draw(s)}
    return print;
  }};
}

export async function createScene(recipient=''){
  const backdrop=document.querySelector('#winter'),host=document.querySelector('#experience'),stage=document.querySelector('#stage');
  const repaint=()=>paintNight(backdrop,host.clientWidth,host.clientHeight);
  new ResizeObserver(repaint).observe(host);repaint();
  let canvas=document.querySelector('#world'),world,paintLake;
  try{world=await webglScene(canvas,recipient);host.dataset.renderer='webgl'}
  catch(error){
    console.warn('Using canvas scene:',error.message);
    const other=canvas.cloneNode(false);canvas.replaceWith(other);canvas=other;
    const [{createCanvasScene},{paintRoseLake}]=await Promise.all([import('./assets/canvas-scene.js'),import('./assets/night.js')]);
    paintLake=paintRoseLake;
    const lakeBackdrop=document.createElement('canvas');
    lakeBackdrop.setAttribute('aria-hidden','true');
    Object.assign(lakeBackdrop.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'-1',pointerEvents:'none',opacity:'0'});
    document.querySelector('#aurora').after(lakeBackdrop);
    const redrawLake=()=>{
      const parent=host.getBoundingClientRect(),input=stage.getBoundingClientRect();
      const horizon=(input.top-parent.top+input.height*.775)/Math.max(1,parent.height);
      paintRoseLake(lakeBackdrop,host.clientWidth,host.clientHeight,horizon);
    };
    const resizeLake=new ResizeObserver(redrawLake);resizeLake.observe(host);resizeLake.observe(stage);redrawLake();
    const fallback=createCanvasScene(canvas,recipient);
    world={...fallback,render(s){
      const fade=s.phase==='sealed'?0:s.phase==='opening'?smooth(.33,.75,s.progress):1;
      const opacity=fade.toFixed(3);
      if(lakeBackdrop.style.opacity!==opacity)lakeBackdrop.style.opacity=opacity;
      fallback.render(s);
    }};
    host.dataset.renderer='canvas';
  }
  return {...world,capture(){
    const frame=document.createElement('canvas');frame.width=1400;frame.height=1050;
    const ctx=frame.getContext('2d');
    const art=world.capture(),ratio=art.width/art.height;
    if(host.dataset.renderer==='webgl'){ctx.drawImage(backdrop,0,0,1400,1050);ctx.drawImage(art,0,0);return frame}
    paintLake(frame,1400,1050,.775,1);
    const height=1050,width=height*ratio;
    ctx.drawImage(art,(1400-width)/2,0,width,height);return frame;
  }};
}
