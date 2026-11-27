// A projected, sprite-based version of the same gift for browsers without WebGL.
// Needle sprays, paper, glass and optical glows are painted once on small canvases.
const TAU=Math.PI*2;
const limit=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const mix=(a,b,t)=>a+(b-a)*t;
const ramp=(n,a,b)=>{const t=limit((n-a)/(b-a));return t*t*(3-2*t)};
function bitmap(w,h,paint){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  paint(canvas.getContext('2d'),w,h);return canvas;
}
function path(ctx,points,color,outline){
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();ctx.fillStyle=color;ctx.fill();
  if(outline){ctx.strokeStyle=outline;ctx.stroke()}
}
function glint(ctx,x,y,r){
  const pts=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,d=(i%2?.17:1)*r;pts.push([x+Math.cos(a)*d*.75,y+Math.sin(a)*d])}
  path(ctx,pts,'#fff2cb');
}
export function createCanvasScene(canvas,recipient=''){
  const screen=canvas.getContext('2d',{alpha:true});
  let seed=15135;
  const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const glow=bitmap(64,64,c=>{
    const g=c.createRadialGradient(32,32,0,32,32,32);
    for(const [s,v] of [[0,'#fff9e2'],[.08,'#ffe2a0'],[.20,'#ffc46bbd'],[.5,'#ffb55932'],[1,'#ffb55900']])g.addColorStop(s,v);
    c.fillStyle=g;c.fillRect(0,0,64,64);
  });
  const sprays=Array.from({length:9},(_,index)=>bitmap(160,76,c=>{
    const variation=index/9;
    const green=['#233c2c','#2a4b32','#32543b','#456a49','#547853','#6e845d'];
    const stem=(u)=>[5+u*146,43-10*Math.sin(u*Math.PI)-9*u];
    c.strokeStyle='#5e6244';c.lineWidth=1.4;c.beginPath();c.moveTo(5,43);c.quadraticCurveTo(79,25,151,34);c.stroke();
    for(let i=1;i<30;i++){
      const t=i/30,[x,y]=stem(t);
      for(const side of [-1,1]){
        const len=(9+20*Math.sin(t*Math.PI)**.54)*(1.05-.39*t)*(.8+.2*rand());
        const dx=len*(.7+.29*rand()),dy=len*side*(.55+.35*rand());
        c.strokeStyle=green[1+Math.floor(variation*2)];c.lineWidth=1.25;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();
        for(let k=0;k<10;k++){
          const v=k/10,tip=(1-v*.72)*(3.4+rand()*6.2);
          c.strokeStyle=green[Math.min(5,Math.floor(rand()*3.4+variation*1.8))];c.lineWidth=.9+rand()*.55;
          c.beginPath();c.moveTo(x+dx*v,y+dy*v);c.lineTo(x+dx*v+tip,y+dy*v+side*(tip*.6+(k%2?-2:2)));c.stroke();
        }
        if(rand()<.055){c.strokeStyle='#a8b5a5';c.lineWidth=.95;c.beginPath();c.moveTo(x+dx*.8,y+dy*.8);c.lineTo(x+dx+2,y+dy);c.stroke()}
      }
    }
  }));
  const globes=['red','gold','pearl'].map((color,index)=>bitmap(64,78,c=>{
    const palette=[['#fff2d6','#dd6762','#a32031','#4e1020','#aa4552'],['#fff8d9','#efd083','#b48139','#6c481c','#daab5c'],['#ffffef','#e4dbc4','#a5aa9c','#616d64','#d7d5c2']][index];
    c.strokeStyle='#aa8853';c.lineWidth=1.4;c.beginPath();c.arc(32,8,4,0,TAU);c.stroke();
    c.fillStyle='#b49659';c.fillRect(26,11,12,7);
    const g=c.createRadialGradient(21,28,1,32,45,29);
    for(const [i,s] of [0,.18,.55,.89,1].entries())g.addColorStop(s,palette[i]);
    c.fillStyle=g;c.beginPath();c.arc(32,44,28,0,TAU);c.fill();
    c.fillStyle='#fff4d9c9';c.beginPath();c.ellipse(21,29,5.3,2.8,-.9,0,TAU);c.fill();
    c.strokeStyle='#e3cfa461';c.lineWidth=1;c.beginPath();c.arc(32,43,23,.4,1.7);c.stroke();
  }));
  const icedSprays=sprays.map(spray=>[false,true].map(reverse=>bitmap(160,76,c=>{
    // Tint only the existing needle silhouettes on their windward side.
    c.drawImage(spray,0,0);c.globalCompositeOperation='source-in';
    const dusting=c.createLinearGradient(0,reverse?72:3,0,reverse?5:73);
    dusting.addColorStop(0,'#f4f4edde');dusting.addColorStop(.42,'#dae4e6c7');
    dusting.addColorStop(.66,'#c1d5dd47');dusting.addColorStop(1,'#bfd0e000');
    c.fillStyle=dusting;c.fillRect(0,0,160,76);
  })));
  const foil=bitmap(480,360,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#326e5d');g.addColorStop(.48,'#265e4a');g.addColorStop(1,'#164336');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<17000;i++){c.fillStyle=rand()>.5?'#c8cda411':'#05190911';c.fillRect(rand()*w,rand()*h,1.5,1)}
    for(let row=0;row<10;row++)for(let col=0;col<13;col++){
      const x=col*40+20*(row%2),y=row*39;
      if((col+row)%3===0){c.globalAlpha=.75;glint(c,x,y,4.3);continue}
      c.save();c.translate(x,y);c.rotate((col+row)%2?.45:-.5);c.strokeStyle='#d5bd88';c.lineWidth=1;c.beginPath();c.moveTo(0,8);c.lineTo(0,-10);
      for(let j=0;j<6;j++){const a=6-j*2.4,d=6-j*.7;c.moveTo(0,a);c.lineTo(-d,a-4);c.moveTo(0,a-.6);c.lineTo(d,a-4.8)}
      c.stroke();c.restore();
    }
    c.globalAlpha=1;c.strokeStyle='#c5a97b';c.strokeRect(5,5,w-10,h-10);
  });
  const frontFoil=bitmap(foil.width,foil.height,(c,w,h)=>{
    c.drawImage(foil,0,0);c.translate(w*.24,h*.59);
    c.strokeStyle='#ddc897';c.lineWidth=1.3;
    for(let arm=0;arm<6;arm++){
      c.beginPath();c.moveTo(0,0);c.lineTo(0,-40);
      for(const y of [16,25,33]){const l=(42-y)*.37;c.moveTo(-l,-y-l);c.lineTo(0,-y);c.lineTo(l,-y-l)}
      c.stroke();c.rotate(TAU/6);
    }
    c.lineWidth=.85;
    for(let i=0;i<3;i++){c.beginPath();c.arc(0,0,47,i*TAU/3+.14,i*TAU/3+1.69);c.stroke()}
  });
  const objects=[];
  const polar=(r,a,y)=>[r*Math.cos(a),y,r*Math.sin(a)];
  const canopy=t=>1.62*Math.max(0,1-t)**.79;
  function append(obj){obj.seed=rand();obj.phase=rand()*TAU;objects.push(obj)}
  for(let tier=0;tier<18;tier++){
    const t=tier/17.5,y=.94+t*3.93,n=Math.max(4,Math.round(12-t*7));
    for(let j=0;j<n;j++){
      const a=j*TAU/n+tier*1.81+(rand()-.5)*.17,rad=canopy(t)*(.85+.16*rand()),twist=(rand()-.5)*.2;
      for(let k=0;k<8;k++){
        const v=.11+k*.111;
        const elev=y-.20*Math.sin(v*Math.PI)-.07*v+.06*t;
        const root=polar(rad*v,a+twist*v,elev);
        for(const side of [-1,1]){
          const reach=rad*(.18+.16*(1-v))*(.85+.2*rand());
          const bend=side*(.38+.65*(1-v)) + twist*v;
          const tip=[root[0]+Math.cos(a+bend)*reach,root[1]-.08*(1-t)+.06*v,root[2]+Math.sin(a+bend)*reach];
          append({kind:0,at:root,to:tip,sprite:Math.floor(rand()*sprays.length),birth:t*.87+.07*v});
        }
      }
    }
  }
  for(let i=0;i<69;i++){
    const t=.035+.90*(1-(1-(i+.2)/69)**.63),a=i*2.39996+rand()*.32;
    append({kind:1,at:polar(canopy(t)*.91,a,.84+3.95*t),sprite:i%7===0?2:i%2,r:.055+rand()*.045,birth:t*.86+.12});
  }
  for(let i=0;i<418;i++){
    const t=i/418,a=t*TAU*5.8+.18,b=canopy(t)*(.94+.055*Math.sin(a*2));
    append({kind:2,at:polar(b,a,.89+t*4.02-.048*Math.sin(a*3)),r:i%4===0?.019:.008,birth:t*.90+.06});
  }
  // Crystal seeds live on the same three-dimensional sprays as the eventual
  // needles, so the silver silhouette settles into the actual branches.
  const crystalPalette=['#86b2e4','#abcdf4','#d1e4fc','#f2f8ff'];
  const rosePalette=['#ae6594','#e38ba7','#ffc4d3','#fff0de'];
  const roseHalo=bitmap(56,56,c=>{
    const s=c.createRadialGradient(28,28,0,28,28,28);
    for(const [p,col] of [[0,'#fff6e9'],[.1,'#ffdbd2f2'],[.25,'#ff9aaf9c'],[.55,'#ee759c28'],[1,'#bc548c00']])s.addColorStop(p,col);
    c.fillStyle=s;c.fillRect(0,0,56,56);
  });
  const dusk=bitmap(640,320,(c,w,h)=>{
    function mist(x,y,rx,ry,colors){
      c.save();c.translate(x*w,y*h);c.scale(rx*w,ry*h);
      const g=c.createRadialGradient(0,0,0,0,0,1);
      for(const [stop,color] of colors)g.addColorStop(stop,color);
      c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
    }
    mist(.50,.731,.60,.274,[[0,'#b95c8259'],[.55,'#8c507138'],[1,'#944a7300']]);
    mist(.48,.774,.58,.057,[[0,'#ffb09271'],[.47,'#ee98a253'],[1,'#e989ae00']]);
    mist(.51,.847,.62,.145,[[0,'#3820384a'],[.63,'#57294438'],[1,'#43233900']]);
  });
  const wavelets=Array.from({length:206},()=>({u:rand(),depth:rand()**1.3,seed:rand(),phase:rand()*TAU}));
  const reflectionSeeds=Array.from({length:49},()=>({u:rand(),v:rand(),phase:rand()*TAU}));
  const courses=[
    {y:1.36,r:2.05,tilt:-.22,skew:.24,speed:.42,offset:2.8,tail:1.50},
    {y:2.83,r:1.57,tilt:.29,skew:.07,speed:-.34,offset:.75,tail:1.78},
    {y:4.12,r:.97,tilt:-.15,skew:.17,speed:.52,offset:4.2,tail:1.24}
  ];
  const calm=window.matchMedia('(prefers-reduced-motion: reduce)');
  const crystals=crystalPalette.map(()=>[]);
  for(const branch of objects){
    if(branch.kind!==0)continue;
    const [x,y,z]=branch.at;
    const dx=branch.to[0]-x,dy=branch.to[1]-y,dz=branch.to[2]-z;
    for(let i=0;i<6;i++){
      const u=(i+rand())/6, side=(rand()-.5)*.59;
      const color=Math.min(3,Math.floor(rand()*2.7+u*.91));
      crystals[color].push({x:x+u*dx-side*dz,y:y+u*dy+side*.073,z:z+u*dz+side*dx,
        size:.004+rand()**2*.015,seed:rand(),spark:rand()>.990});
    }
  }
  const felt=bitmap(480,480,(c,w,h)=>{
    const ink=c.createLinearGradient(0,0,w,h);ink.addColorStop(0,'#344b3e');ink.addColorStop(.48,'#283f33');ink.addColorStop(1,'#162d26');
    c.fillStyle=ink;c.beginPath();c.arc(w/2,h/2,w/2-1,0,TAU);c.fill();c.clip();
    for(let i=0;i<24000;i++){c.fillStyle=i%3?'#c9d0aa13':'#04151233';c.fillRect(rand()*w,rand()*h,1+rand()*2,1)}
    c.translate(w/2,h/2);c.strokeStyle='#b9a8809a';c.lineWidth=1.4;c.beginPath();
    for(let i=0;i<144;i++){const a=i*TAU/144,r=i%6===0?221:228;c.moveTo(r*Math.cos(a),r*Math.sin(a));c.lineTo(234*Math.cos(a),234*Math.sin(a))}
    c.stroke();
  });
  const island=bitmap(660,150,(c,w,h)=>{
    // Accumulated drifts along the edge of the shallows: low shelves of snow,
    // softened windward contours and a few pockets of rock at the waterline.
    c.beginPath();c.moveTo(9,96);
    c.bezierCurveTo(19,86,48,81,76,80);c.bezierCurveTo(102,75,119,61,154,63);
    c.bezierCurveTo(181,62,190,48,220,51);c.bezierCurveTo(249,54,266,30,294,31);
    c.bezierCurveTo(318,32,331,20,358,28);c.bezierCurveTo(391,41,411,35,441,45);
    c.bezierCurveTo(471,52,483,50,508,63);c.bezierCurveTo(535,77,548,68,572,79);
    c.bezierCurveTo(590,91,625,86,650,101);c.bezierCurveTo(629,110,603,106,578,114);
    c.bezierCurveTo(540,126,505,115,466,124);c.bezierCurveTo(436,131,411,124,386,132);
    c.bezierCurveTo(345,142,318,132,285,135);c.bezierCurveTo(245,138,210,121,174,124);
    c.bezierCurveTo(139,128,108,113,76,115);c.bezierCurveTo(47,117,22,107,9,96);c.closePath();
    c.save();c.clip();
    const snow=c.createLinearGradient(0,22,15,h*.96);
    for(const [p,col] of [[0,'#d5bbc4'],[.31,'#b5a9c2'],[.59,'#928ca7'],[.81,'#736d86'],[1,'#484558']])snow.addColorStop(p,col);
    c.fillStyle=snow;c.fillRect(0,0,w,h);
    function ridge(x,y,rx,ry,color){
      c.save();c.translate(x,y);c.scale(rx,ry);const g=c.createRadialGradient(-.14,-.25,0,0,0,1);
      g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
    }
    ridge(255,62,189,24,'#ebd1d3c4');ridge(453,57,86,21,'#ddc8d5c0');
    ridge(319,83,173,17,'#6c64827d');ridge(184,99,141,16,'#c8b9c8c2');ridge(476,102,98,11,'#c7bccab0');
    for(const [x,y,rx,ry] of [[48,99,21,3],[82,102,15,2],[485,121,29,3],[555,111,18,3],[162,122,18,2.5],[606,104,9,2]]){
      ridge(x,y,rx,ry*2.7,'#454454b5');c.fillStyle='#514e60';
      c.beginPath();c.moveTo(x-rx,y+ry*.2);c.quadraticCurveTo(x-rx*.4,y-ry,x,y-ry*.75);
      c.quadraticCurveTo(x+rx*.8,y-ry*.7,x+rx,y+ry*.5);c.quadraticCurveTo(x+rx*.19,y+ry,x-rx,y+ry*.2);c.fill();
      c.strokeStyle='#c6b9c7';c.lineWidth=.75;c.beginPath();c.moveTo(x-rx*.62,y-ry*.1);c.quadraticCurveTo(x,y-ry*1.1,x+rx*.63,y-ry*.25);c.stroke();
    }
    for(let i=0;i<14800;i++){
      const x=rand()*w,y=rand()*h;
      c.fillStyle=i%3?'#eee1ef15':'#453b511b';c.fillRect(x,y,.5+rand()*1.4,.35+rand()*.59);
    }
    c.restore();
  });
  const iceHalo=bitmap(56,56,c=>{
    const g=c.createRadialGradient(28,28,0,28,28,28);
    for(const [p,col] of [[0,'#ffffff'],[.10,'#e7f6ffef'],[.23,'#acdcff9a'],[.52,'#79aef426'],[1,'#6298ff00']])g.addColorStop(p,col);
    c.fillStyle=g;c.fillRect(0,0,56,56);
  });
  // Snow at different focal distances. Broad, quiet drifts behind the branches;
  // a few soft individual aggregates pass close to the lens.
  const snowSprites=Array.from({length:8},(_,i)=>bitmap(36,36,c=>{
    if(i<3){
      const g=c.createRadialGradient(17,17,1,18,18,16);
      g.addColorStop(0,'#e7f0f4eb');g.addColorStop(.32,'#e0eaf0c7');g.addColorStop(.72,'#d0dde735');g.addColorStop(1,'#d0dde700');
      c.fillStyle=g;c.fillRect(0,0,36,36);return;
    }
    c.translate(18,18);c.rotate(rand()*TAU);
    for(let j=0;j<7;j++){
      const a=j*TAU/7+.24*rand(),r=rand()*6.5;
      c.fillStyle=['#dce7edde','#eff4f0d9','#c2d2ded6'][j%3];
      c.beginPath();c.ellipse(r*Math.cos(a),r*Math.sin(a),2.2+rand()*3.7,1.9+rand()*2.9,a,0,TAU);c.fill();
    }
  }));
  const flakes=Array.from({length:390},()=>{
    const z=rand()**1.33;
    return {x:rand(),y:rand(),z,v:.023+z*.092+rand()*.017,roll:rand()*TAU,spin:(rand()-.5)*1.4,
      seed:rand(),sway:.5+rand(),phase:rand()*TAU,r:.52+z**1.4*(2.7+rand()*1.4),
      sprite:z>.83&&rand()<.47?Math.floor(rand()*3):3+Math.floor(rand()*5)};
  });
  let snowWind=0;
  function advanceSnow(dt,state){
    const time=state.time||0,aim=state.aimX??.5;
    snowWind+=((aim-.5)*.23+.012*Math.sin(time*.23)-snowWind)*(1-Math.exp(-dt*1.7));
    for(const f of flakes){
      const gust=.010*Math.sin(time*.53+f.y*5.2)+.006*Math.cos(f.x*4-time*.37);
      const meander=Math.cos(f.phase+time*f.sway)*(.003+.009*f.z);
      f.x+=(snowWind*(.26+f.z)+gust+meander)*dt;
      f.y+=f.v*(1+.10*Math.sin(f.phase+time*.74))*dt;
      f.roll+=f.spin*dt;
      if(f.y>1.02){f.y-=1.04;f.x=rand()}
      if(f.x>1.02)f.x-=1.04;
      if(f.x<-.02)f.x+=1.04;
    }
  }
  function snowPass(ctx,w,h,intensity,front){
    if(intensity<.003)return;
    const count=Math.min(flakes.length,Math.max(145,Math.round(w*h/1450)));
    const pixel=Math.max(.7,Math.min(1.35,h/610));
    ctx.save();
    for(let i=0;i<count;i++){
      const f=flakes[i];if((f.z>=.57)!==front)continue;
      const a=limit((intensity-f.seed*.83)*6);
      if(a<.005)continue;
      const x=f.x*w,y=f.y*h;
      ctx.globalAlpha=a*(.19+f.z*.61);
      if(!front){
        ctx.fillStyle=i%3?'#d8e5ed':'#e7e7e3';
        ctx.beginPath();ctx.ellipse(x,y,pixel*f.r*.76,pixel*f.r,.21+snowWind*2,0,TAU);ctx.fill();
      }else{
        const r=pixel*f.r*(f.sprite<3?2.37:1.91);
        ctx.save();ctx.translate(x,y);ctx.rotate(f.roll);
        ctx.scale(.70+.30*Math.cos(f.roll*.74)**2,1);
        ctx.drawImage(snowSprites[f.sprite],-r,-r,2*r,2*r);ctx.restore();
      }
    }
    ctx.restore();
  }
  const reflectedBulbs=objects.filter((o,i)=>o.kind===2 && i%2===0);
  const colorways=[
    ['#ff526d','#ff8491','#ffa580','#fff1da'],
    ['#479fff','#8ab9ff','#82d5ff','#e2f7ff'],
    ['#47df8e','#98f8a1','#adffc2','#e9fff2'],
    ['#e74fe2','#ff82de','#ffadef','#fff1f8'],
    ['#ff843a','#ffb354','#ffce74','#fff3c1'],
    ['#9970ff','#bf9bff','#d2b1fd','#fff0fc'],
    ['#ffce48','#ffe581','#ffeca0','#fff8de'],
    ['#33d5d3','#7aece0','#9cf4f4','#eeffff']
  ];
  const sparks=colorways.map(palette=>palette.map(color=>bitmap(40,40,c=>{
    const g=c.createRadialGradient(20,20,0,20,20,20);
    g.addColorStop(0,'#fffcf1');g.addColorStop(.10,color);g.addColorStop(.29,color+'af');
    g.addColorStop(.61,color+'28');g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(0,0,40,40);
  })));
  function shuffle(list){
    for(let i=list.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[list[i],list[j]]=[list[j],list[i]]}
    return list;
  }
  const wishes=[],paletteBag=[];let lastTime=0,lastState={},lastPalette=-1;
  function wish({x=.5,y=.54,strength=.8}={}){
    const indices=colorways.map((_,i)=>i);
    if(!paletteBag.length){
      paletteBag.push(...shuffle(indices.slice()));
      if(paletteBag.at(-1)===lastPalette)[paletteBag[0],paletteBag[paletteBag.length-1]]=[paletteBag.at(-1),paletteBag[0]];
    }
    const mainPalette=paletteBag.pop();lastPalette=mainPalette;
    const paletteOrder=[mainPalette,...shuffle(indices.filter(i=>i!==mainPalette))];
    const mainX=limit(.5+(x-.5)*.47+(rand()-.5)*.23,.26,.74),mainY=.27+rand()*.14;
    const scale=limit(strength,.3,1),count=3+Math.round(scale*2),shells=[];
    for(let i=0;i<count;i++){
      const a=i/count*TAU+rand()*.44,main=i===0;
      const tx=main?mainX:limit(mainX+Math.cos(a)*(.14+.085*rand()),.13,.87);
      const ty=main?mainY:limit(mainY+Math.sin(a)*.17,.17,.61);
      const radius=main?.87+scale*.29:.38+rand()*.35,shape=Math.floor(rand()*3);
      const launch=main?0:.07+.16*i+rand()*.10,travel=.74+rand()*.32,life=1.4+rand()*.71;
      const colors=[[],[],[],[]],n=Math.round((main?85:40)*(.75+scale*.62));
      for(let j=0;j<n;j++){
        const theta=j/n*TAU+rand()*.057,speed=(shape===1?.75+rand()*.25:.19+Math.sqrt(rand())*.84);
        const flatten=shape===1?.52:shape===2?.82:1;
        const hue=j%13===0?3:j%7===0?2:j%3===0?1:0;
        colors[hue].push({vx:Math.cos(theta)*speed,vy:Math.sin(theta)*speed*flatten,
          fall:shape===2?.45+rand()*.34:.16+rand()*.29,delay:rand()*.10,
          r:.59+rand()**2*1.32,phase:rand()*TAU});
      }
      shells.push({tx,ty,radius,launch,travel,life,colors,palette:paletteOrder[i],curve:(rand()-.5)*.13});
    }
    wishes.push({x,y,shells,age:0,
      end:Math.max(...shells.map(s=>s.launch+s.travel+s.life+.12))});
    if(wishes.length>4)wishes.shift();
  }
  function drawWishes(ctx,w,h){
    if(!wishes.length)return;
    const size=Math.min(w*.195,h*.225),px=limit(h/580,.73,1.55);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(const f of wishes)for(const [idx,s] of f.shells.entries()){
      const age=f.age-s.launch;if(age<0)continue;
      const color=colorways[s.palette],textures=sparks[s.palette];
      const endX=s.tx*w,endY=s.ty*h,radius=size*s.radius;
      if(age<s.travel){
        const v=age/s.travel;
        for(let k=10;k>=0;k--){
          const u=limit(v-k*.014),curve=Math.sin(u*Math.PI);
          const x=mix(f.x*w,endX,u)+s.curve*w*curve,y=mix(f.y*h,endY,u)-curve*h*(.073+.008*idx);
          const r=px*(idx?6:8)*(1-k*.069);
          ctx.globalAlpha=.89*(1-k*.085)*ramp(age,0,.1);
          ctx.drawImage(textures[0],x-r,y-r,2*r,2*r);
        }
        continue;
      }
      const u=(age-s.travel)/s.life;if(u>1.08)continue;
      const flash=1-ramp(u,0,.29),halo=px*8+radius*(.22+u*.76);
      if(flash>.003){
        ctx.globalAlpha=flash*.97;ctx.drawImage(textures[0],endX-halo,endY-halo,2*halo,2*halo);
      }
      for(let c=0;c<4;c++){
        const bucket=s.colors[c];
        ctx.strokeStyle=color[c];ctx.lineWidth=px*(idx?1.0:1.22);
        ctx.globalAlpha=limit(1-u*.9);ctx.beginPath();
        for(const p of bucket){
          const t=limit(u-p.delay);if(t<=0)continue;
          const tail=limit(t-.052-.116*(1-t));
          const drag=1-(1-t)**2.25,last=1-(1-tail)**2.25;
          const x=endX+p.vx*drag*radius,y=endY+(p.vy*drag+p.fall*t*t)*radius;
          ctx.moveTo(endX+p.vx*last*radius,endY+(p.vy*last+p.fall*tail*tail)*radius);ctx.lineTo(x,y);
        }
        ctx.stroke();
        for(const p of bucket){
          const t=limit(u-p.delay);if(t<=0 || t>=1)continue;
          const drag=1-(1-t)**2.25;
          const x=endX+p.vx*drag*radius,y=endY+(p.vy*drag+p.fall*t*t)*radius;
          const flicker=mix(1,.35+.65*Math.sin(t*19+p.phase)**2,ramp(t,.35,.9));
          const intensity=(1-t**1.5)*flicker;
          ctx.globalAlpha=intensity;const r=p.r*px*(.72+.28*(1-t));
          if(p.r>1.43){const glowR=4*r;ctx.drawImage(textures[c],x-glowR,y-glowR,glowR*2,glowR*2)}
          else{ctx.fillStyle=color[c];ctx.fillRect(x-r*.5,y-r*.5,r,r)}
        }
      }
    }
    ctx.restore();
  }
  function redraw(ctx,w,h,state){
    const {time=0,phase='sealed',progress=0,growth=0,scatter=0,light=1,illumination=0,snow=0,frost=0,aimX=.5,aimY=.5,charge=0,orbit=0,parcelProgress=0}=state;
    const p=limit(parcelProgress),grow=limit(growth),cloud=limit(scatter),camera=ramp(p,.33,.87);
    const boxUnit=Math.min(w*.239,h*.254),treeUnit=Math.min(w*.255,h*.157);
    const baseline=mix(h*.75,h*.872,camera),initialScale=mix(boxUnit,treeUnit,camera);
    const landscape=window.innerWidth/window.innerHeight>=1.20;
    const finale=phase==='closing'?ramp(progress,.10,.60):phase==='card'?1:0;
    const rect=finale?canvas.getBoundingClientRect():null;
    const maxHeight=rect?baseline-(window.innerHeight*.32-rect.top):baseline;
    const finalScale=landscape?initialScale:Math.max(.50*initialScale,Math.min(.78*initialScale,maxHeight/5.24));
    const scale=mix(initialScale,finalScale,finale);
    const centered=w*.5,frameLeft=rect?window.innerWidth*.29-rect.left:centered;
    const center=mix(centered,landscape?frameLeft:centered,finale);
    const yaw=(1-camera)*.43+camera*orbit,ca=Math.cos(yaw),sa=Math.sin(yaw),pitch=mix(.285,.075,camera);
    const project=([x,y,z])=>[center+(x*ca-z*sa)*scale,baseline+((x*sa+z*ca)*pitch-y)*scale];
    function projectTexture(image,quad,shade=0){
      const [a,b,,d]=quad;ctx.save();ctx.transform((b[0]-a[0])/image.width,(b[1]-a[1])/image.width,
        (d[0]-a[0])/image.height,(d[1]-a[1])/image.height,a[0],a[1]);
      ctx.drawImage(image,0,0);if(shade){ctx.fillStyle='rgba(9,20,17,'+shade+')';ctx.fillRect(0,0,image.width,image.height)}
      ctx.restore();
    }
    ctx.clearRect(0,0,w,h);
    const base=project([0,0,0]),r=scale*(grow?1.68:1.8);
    const rose=phase==='sealed'?0:phase==='opening'?ramp(progress,.35,.74):1;
    const drift=calm.matches?0:time;
    const tails=rose>.003?courses.map((track,i)=>{
      const out=[];
      for(let j=0;j<=32;j++){
        const u=j/32,theta=track.offset+drift*track.speed-Math.sign(track.speed)*track.tail*u;
        const radius=track.r*(1+.075*Math.sin(theta*2.4+i)+.037*Math.cos(theta*4.1-i))*(1+.17*cloud);
        const x=radius*Math.cos(theta),z=radius*Math.sin(theta);
        const elevation=mix(track.y,2.58+(i-1)*.36,cloud);
        const y=elevation+track.tilt*x+track.skew*z+.095*Math.sin(theta*2.8+i);
        const [px,py]=project([x,y,z]);
        out.push({x:px+cloud*(aimX-.5)*scale*.65,y:py+cloud*(aimY-.5)*scale*.36,front:x*sa+z*ca>=0,u});
      }
      return out;
    }):[];
    const cometGlow=rose*(phase==='opening'?ramp(progress,.46,.70):phase==='closing'?1-ramp(progress,.05,.42):phase==='card'?.12:1)
      *(.48+.47*Math.max(illumination,cloud,grow*.42));
    function drawComets(front){
      if(cometGlow<.008)return;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
      for(let i=0;i<tails.length;i++){
        const points=tails[i],head=points[0];
        // Four curved segments taper each tail. The canopy masks rear arcs.
        for(let k=0;k<4;k++){
          const start=k*8,part=1-k*.24;
          ctx.beginPath();let connected=false;
          for(let j=start;j<=start+8;j++){
            const q=points[j];if(q.front!==front){connected=false;continue}
            if(connected)ctx.lineTo(q.x,q.y);else{ctx.moveTo(q.x,q.y);connected=true}
          }
          ctx.strokeStyle='#e99b58';ctx.globalAlpha=cometGlow*part*.23;
          ctx.lineWidth=Math.max(.8,scale*.045*part);ctx.stroke();
          ctx.strokeStyle=k<2?'#ffe2a3':'#f2a966';ctx.globalAlpha=cometGlow*part*(front?.91:.52);
          ctx.lineWidth=Math.max(.4,scale*.011*part);ctx.stroke();
        }
        for(let j=3;j<32;j+=2){
          const q=points[j];if(q.front!==front)continue;
          const flutter=q.u*scale*.045;
          ctx.globalAlpha=cometGlow*(1-q.u)*(.3+.4*Math.sin(j*9+drift)**2);
          ctx.fillStyle=j%3?'#ffdca3':'#ffa2bb';
          ctx.fillRect(q.x+Math.sin(j*4.2+i)*flutter,q.y+Math.cos(j*2.72+i)*flutter,1.2,1.2);
        }
        if(head.front===front){
          const size=scale*(.089+.018*Math.sin(drift*.73+i));
          ctx.globalAlpha=cometGlow;ctx.drawImage(glow,head.x-size,head.y-size,2*size,2*size);
          glint(ctx,head.x,head.y,size*.65);
        }
      }
      ctx.restore();
    }
    if(rose>.008){
      ctx.save();ctx.globalAlpha=rose;ctx.drawImage(dusk,0,0,w,h);
      const horizon=h*.775,depth=h-horizon;
      ctx.globalCompositeOperation='lighter';
      for(const s of wavelets){
        const d=s.depth,y=horizon+depth*d;
        const edge=Math.sin(Math.PI*s.u)*Math.sin(Math.PI*d);
        const shimmer=.32+.61*Math.sin(drift*.62+s.phase+d*8)**2;
        ctx.globalAlpha=edge*shimmer*rose*(.08+.13*s.seed);
        const x=w*s.u+Math.sin(s.phase+drift*.38)*scale*.014*(1+d);
        const len=scale*(.004+.151*d**1.5)*(.5+s.seed);
        ctx.fillStyle=s.seed>.78?'#f9baae':s.seed<.28?'#bc92b2':'#dba1a8';
        ctx.fillRect(x-len*.5,y,len,.42+.64*d);
      }
      // Mirror the projected bulbs in perspective; foreground objects occlude
      // the rippling fragments, including wherever the trunk meets the plinth.
      for(const bulb of reflectedBulbs){
        const [x,y]=project(bulb.at),d=limit((baseline-y)/(5*scale));
        const depthY=baseline+d*h*.205;
        if(depthY>=h)continue;
        const sway=Math.sin(d*26+drift*1.25+bulb.phase)*d*scale*.16;
        const energy=rose*(.24+.62*Math.max(light,illumination))*(.35+.65*Math.sin(bulb.phase+drift*.76)**2);
        ctx.globalAlpha=energy*(1-ramp(depthY/h,.945,1))*(1-.7*cloud);
        ctx.fillStyle=bulb.seed>.72?'#ffd39d':'#e790ae';
        const breadth=scale*(.009+d*.084)*(.4+bulb.seed);
        ctx.fillRect(x+sway-breadth*.5,depthY,breadth,.5+d*.74);
      }
      for(let i=0;i<tails.length && cometGlow>.008;i++){
        const head=tails[i][0];
        for(const s of reflectionSeeds){
          const d=s.v,y=horizon+depth*d;
          const x=head.x+(s.u-.5)*scale*(.07+d*.85)+Math.sin(d*19+drift*.9+i)*scale*.027;
          const len=scale*(.004+d*.136)*(.4+s.u);
          ctx.globalAlpha=cometGlow*Math.sin(d*Math.PI)*(.17+.28*Math.sin(drift*.83+s.phase)**2);
          ctx.fillStyle=i%2?'#ffc5b3':'#fed797';ctx.fillRect(x-len*.5,y,len,.52+d*.62);
        }
      }
      ctx.restore();
    }
    ctx.save();ctx.translate(base[0],base[1]);ctx.scale(1,.165);
    const shadow=ctx.createRadialGradient(0,0,0,0,0,r*1.16);shadow.addColorStop(0,'#09110eab');shadow.addColorStop(.62,'#0b191d67');shadow.addColorStop(1,'#18202300');
    ctx.fillStyle=shadow;ctx.fillRect(-r*1.2,-r*1.2,r*2.4,r*2.4);ctx.restore();
    if(rose<.999){
      ctx.save();ctx.globalAlpha=1-rose;ctx.translate(0,rose*scale*.50);
      const radius=Math.min(2.055*scale,.485*w),height=radius*Math.max(.115,pitch),foot=scale*.105;
      for(const [drop,color] of [[1,'#142b27'],[.69,'#a59162'],[.53,'#1d352c'],[.15,'#998660']]){
        ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(base[0],base[1]+foot*drop,radius,height,0,0,TAU);ctx.fill();
      }
      ctx.drawImage(felt,base[0]-radius,base[1]-height,radius*2,height*2);
      ctx.restore();
    }
    if(rose>.001){
      ctx.save();ctx.globalAlpha=rose;
      const radius=Math.min(1.88*scale,w*.48),height=radius*.375;
      ctx.drawImage(island,base[0]-radius,base[1]-height*.42,radius*2,height);
      ctx.translate(base[0]+scale*.046,base[1]+scale*.005);ctx.scale(1,.145);
      const r=scale*.59;
      const contact=ctx.createRadialGradient(0,0,0,0,0,r);
      contact.addColorStop(0,'#292532ce');contact.addColorStop(.31,'#4f475899');contact.addColorStop(1,'#50455600');
      ctx.fillStyle=contact;ctx.fillRect(-r,-r,2*r,2*r);
      ctx.restore();
    }
    if(p<.995){
      const W=2.55,D=2.05,H=1.69,top=H+.07,rim=.242;
      const wx=W/2+.048,dz=D/2+.048;
      const lift=ramp(p,.505,.782),hinge=ramp(p,.48,.63);
      // Faces and silk both use this orthographic projection. The velvet follows
      // the lip and outer walls in world coordinates rather than bridging them.
      function line(a,b,ink,width){
        ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineWidth=width;ctx.strokeStyle=ink;ctx.stroke();
      }
      const lining=ctx.createLinearGradient(0,baseline-scale*1.3,0,baseline+scale*.5);
      lining.addColorStop(0,'#ebd8b4');lining.addColorStop(.7,'#c8b28a');lining.addColorStop(1,'#ae976f');
      const paperFade=1-ramp(p,.831,.996);
      ctx.save();ctx.globalAlpha=paperFade;
      path(ctx,[[-W/2,.052,-D/2],[W/2,.052,-D/2],[W/2,.052,D/2],[-W/2,.052,D/2]].map(project),lining,'#a18b5a');
      for(const i of [2,3,1,0]){
        const az=i*Math.PI/2,c=Math.cos(az),s=Math.sin(az);
        const fold=ramp(p,.659+i*.016,.899+i*.020)*1.552;
        const span=i%2?D:W,dist=(i%2?W:D)*.5;
        const q=(u,y)=>project([u*c+(dist+y*Math.sin(fold))*s,.053+y*Math.cos(fold),-u*s+(dist+y*Math.sin(fold))*c]);
        const quad=[q(-span/2,H),q(span/2,H),q(span/2,0),q(-span/2,0)];
        const signed=(quad[1][0]-quad[0][0])*(quad[3][1]-quad[0][1])-(quad[1][1]-quad[0][1])*(quad[3][0]-quad[0][0]);
        if(signed>0)projectTexture(i===0?frontFoil:foil,quad,i%2?.22:.045);
        else{
          path(ctx,quad,lining,'#a18c67');
          line(q(-span*.48,.035),q(span*.48,.035),'#9d85625e',Math.max(.6,scale*.009));
          line(q(-span*.47,H-.068),q(span*.47,H-.068),'#ece0c5a0',Math.max(.5,scale*.006));
        }
      }
      ctx.restore();
      if(p<.86){
        ctx.save();ctx.globalAlpha=1-ramp(p,.715,.86);
        const angle=lift*.74,tilt=lift*.16+Math.sin(hinge*Math.PI)*.042;
        function lid(x,y,z){
          const ry=y*Math.cos(angle)+z*Math.sin(angle),rz=z*Math.cos(angle)-y*Math.sin(angle);
          return project([x*Math.cos(tilt)-ry*Math.sin(tilt)-.46*lift,top+1.70*lift+x*Math.sin(tilt)+ry*Math.cos(tilt),rz-1.13*lift]);
        }
        const lidPoints=[[-wx,-dz],[wx,-dz],[wx,dz],[-wx,dz]];
        const upper=lidPoints.map(([x,z])=>lid(x,0,z)),lower=lidPoints.map(([x,z])=>lid(x,-rim,z));
        const across=upper[1][0]-upper[0][0],down=upper[1][1]-upper[0][1];
        const topVisible=across*(upper[3][1]-upper[0][1])-down*(upper[3][0]-upper[0][0])>0;
        for(let i=0;i<4;i++){
          const j=(i+1)%4,a=upper[i],b=upper[j],e=lower[i];
          // This outline winds clockwise across the top; only front-facing sides are painted.
          if((a[0]-b[0])*(e[1]-a[1])-(a[1]-b[1])*(e[0]-a[0])<=0)continue;
          path(ctx,[a,b,lower[j],lower[i]],i%2?'#194736':'#2b5840','#9a8157');
          const [ax,az]=lidPoints[i],[bx,bz]=lidPoints[j];
          for(const f of [.72,.86])line(lid(ax,-rim*f,az),lid(bx,-rim*f,bz),'#d0af72',Math.max(.5,scale*.006));
        }
        if(topVisible)projectTexture(foil,upper);
        else{
          path(ctx,lower,lining,'#9d8765');
          const inset=lidPoints.map(([x,z])=>lid(x*.938,-rim-.001,z*.925));
          path(ctx,inset,'#c8b28e','#af9876');
        }

        if(p<.5){
          const silkFade=1-ramp(p,.385,.497);
          function fabric(count,section,visibility){
            let prev=null;
            for(let j=0;j<=count;j++){
              const u=j/count,sample=section(u);
              const left=project(sample[0]),right=project(sample[1]);
              if(prev && (!visibility || visibility((j-.5)/count))){
                const mx=(prev[0][0]+left[0])*.5,my=(prev[0][1]+left[1])*.5;
                const dx=left[0]+right[0]-prev[0][0]-prev[1][0],dy=left[1]+right[1]-prev[0][1]-prev[1][1];
                const chord=Math.hypot(dx,dy)||1,nx=-dy/chord,ny=dx/chord;
                const width=((prev[1][0]+right[0])*.5-mx)*nx+((prev[1][1]+right[1])*.5-my)*ny;
                const g=ctx.createLinearGradient(mx,my,mx+nx*width+.0001,my+ny*width);
                g.addColorStop(0,'#63303a');g.addColorStop(.055,'#d99b72');g.addColorStop(.10,'#9e4550');
                g.addColorStop(.38,'#913043');g.addColorStop(.64,'#ae4052');g.addColorStop(.83,'#792638');g.addColorStop(1,'#b38060');
                path(ctx,[prev[0],prev[1],right,left],g);
              }
              prev=[left,right];
            }
          }
          // Unrolled length is measured down the continuous centerline. Its
          // rounded corner clears the cap; its lower turn rests on the floor.
          const makeRun=(az,distance,width,sideBias=0,flutter=0)=>{
            const sn=Math.sin(az),cs=Math.cos(az),rad=(Math.abs(cs)>.6?dz:wx)-.022;
            const corner=.038,arc=corner*Math.PI/2,wall=top-.078-corner;
            let along,y;
            if(distance<=rad){
              along=distance;y=top+.023+flutter;
            }else if(distance<rad+arc){
              const a=(distance-rad)/corner;
              along=rad+corner*Math.sin(a);y=top+.023-corner*(1-Math.cos(a))+flutter;
            }else if(distance<rad+arc+wall){
              const d=distance-rad-arc,contact=ramp(d,rim+.04,rim+.42);
              along=rad+corner-.045*contact+Math.max(0,flutter*.37);
              y=top+.023-corner-d;
            }else{
              const d=distance-rad-arc-wall;
              along=rad+corner-.045+d;y=.101+.05*Math.sin(d*3.2)*Math.exp(-d*.6);
            }
            const xyz=side=>[sn*along+cs*(sideBias+width*side),y,-sn*(sideBias+width*side)+cs*along];
            return [xyz(-1),xyz(1)];
          };
          ctx.save();ctx.globalAlpha*=silkFade;
          for(const id of [2,3,1,0]){
            const az=id*Math.PI/2,sn=Math.sin(az),cs=Math.cos(az);
            const radius=id%2?wx:dz,len=radius+top-.014,front=sn*sa+cs*ca>0;
            const peel=ramp(p,.155+id*.012,.445+id*.010),distance=u=>u*len+peel*(radius+1.1);
            fabric(58,u=>{
              const d=distance(u),wave=Math.sin(peel*Math.PI);
              const slack=wave*(1-u)*(.11+.045*Math.sin(peel*4-u*3))*(1-ramp(d,radius-.28,radius));
              return makeRun(az,d,id%2?.120:.142,Math.sin(u*4+id)*wave*.09,slack+(id%2?.01:0));
            },u=>front||distance(u)<radius-.017);
          }
          ctx.restore();

          if(p<.368){
            const loose=ramp(p,.022,.292),withdraw=ramp(p,.128,.365);
            ctx.save();ctx.globalAlpha*=1-ramp(p,.247,.368);
            // Both tails stay on the top until they pass their own lip, then
            // conform to the front or right face, clear of the swinging tag.
            for(let side=0;side<2;side++){
              const az=side*Math.PI*.5,reach=(side?wx:dz)*.88;
              fabric(30,u=>{
                const along=.018+u*reach+withdraw*1.2;
                const bias=(side?-.41:-.44)*ramp(u,0,.65)-.39*withdraw;
                return makeRun(az,along,.093+.035*Math.sin(u*Math.PI),bias,.030+.13*(1-u)**3);
              });
            }
            for(const sign of [-1,1]){
              fabric(36,u=>{
                const sin=Math.sin(Math.PI*u),bend=Math.sin(TAU*u);
                const along=.044+.84*sin,high=.11+sin*(.30+.22*bend);
                const vx=mix(along,.14+u*1.03,loose)+withdraw*.26;
                const y=top+mix(high,.258+.11*Math.sin(Math.PI*u),loose)+.095*Math.sin(loose*Math.PI);
                const z=mix(.08-.11*Math.cos(TAU*u),.025+.22*u,loose);
                const half=.084+.060*sin;
                const tilt=.40+.87*Math.sin(TAU*u+.35)*(1-loose);
                return [-1,1].map(k=>[sign*vx,y+Math.sin(tilt)*half*k,z+Math.cos(tilt)*half*k]);
              });
            }
            const knot=project([-.025*loose,top+.146+.086*Math.sin(loose*Math.PI),.095]);
            ctx.save();ctx.translate(...knot);ctx.rotate(-.19+.38*loose);
            const knotScale=1-.94*ramp(p,.16,.345);
            const cw=scale*(.127-.04*loose)*knotScale,ch=scale*.087*knotScale;
            const sat=ctx.createLinearGradient(-cw,-ch,cw,ch);
            sat.addColorStop(0,'#742536');sat.addColorStop(.34,'#c16b71');sat.addColorStop(.50,'#a54556');sat.addColorStop(.78,'#752a3b');sat.addColorStop(1,'#4e2630');
            ctx.fillStyle=sat;ctx.beginPath();ctx.roundRect(-cw,-ch,cw*2,ch*2,ch*.66);ctx.fill();ctx.restore();
            ctx.restore();
          }
        }
        // The string runs from a small eyelet on the front side of the cap.
        const a=lid(.73,-.115,dz+.006),b=lid(.84,-.345,dz+.077);
        const sway=Math.sin(lift*Math.PI)*scale*.07;b[0]+=sway;
        ctx.strokeStyle='#dec18c';ctx.lineWidth=Math.max(.55,scale*.0085);
        ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(a[0]+scale*.02,a[1]+scale*.20,...b);ctx.stroke();
        ctx.fillStyle='#a68a55';ctx.beginPath();ctx.arc(...a,scale*.020,0,TAU);ctx.fill();
        ctx.translate(b[0],b[1]);ctx.rotate(-.11-.25*Math.sin(lift*Math.PI));ctx.scale(scale,scale);
        path(ctx,[[-.13,-.045],[.13,-.045],[.206,.031],[.206,.39],[-.206,.39],[-.206,.031]],'#eedfc1');
        ctx.fillStyle='#a38a61';ctx.beginPath();ctx.arc(0,-.007,.018,0,TAU);ctx.fill();
        ctx.fillStyle='#714a3e';ctx.font=recipient?'.084px SimSun,serif':'italic .108px Georgia';ctx.textAlign='center';
        ctx.fillText(recipient||'For you',0,.216,.34);ctx.restore();
      }
    }
    snowPass(ctx,w,h,snow,false);
    drawComets(false);
    if(grow>.001){
      const topY=project([0,5.04,0])[1],bottomY=project([0,0,0])[1],revealY=mix(bottomY,topY,ramp(grow,0,.96));
      ctx.save();ctx.globalAlpha=1-ramp(cloud,.03,.75);
      const trunk=ctx.createLinearGradient(base[0]-scale*.13,0,base[0]+scale*.13,0);
      trunk.addColorStop(0,'#543e2a');trunk.addColorStop(.3,'#96744b');trunk.addColorStop(.68,'#614834');trunk.addColorStop(1,'#312b22');
      path(ctx,[[base[0]-.115*scale,bottomY],[base[0]-.037*scale,revealY],[base[0]+.034*scale,revealY],[base[0]+.102*scale,bottomY]],trunk);
      ctx.strokeStyle='#372a2270';ctx.lineWidth=Math.max(.55,scale*.005);
      for(let i=0;i<12;i++){
        const a=(i/12-.5)*.19*scale,barkH=Math.min(bottomY-revealY,(.34+.55*((i*7)%13)/13)*scale);
        ctx.beginPath();ctx.moveTo(base[0]+a,bottomY);ctx.quadraticCurveTo(base[0]+a*.85+Math.sin(i)*scale*.025,bottomY-barkH*.55,base[0]+a*.79,bottomY-barkH);ctx.stroke();
      }
      ctx.restore();
      for(const o of objects)o.z=o.at[0]*sa+o.at[2]*ca;
      objects.sort((a,b)=>a.z-b.z);
      for(const o of objects){
        const born=ramp(grow,o.birth,Math.min(.999,o.birth+.13));if(!born)continue;
        const pos=project(o.at);
        let x=pos[0],y=pos[1];
        if(cloud>.0001){
          const spread=Math.sin(o.phase*23.69+o.seed*56);
          const rr=.06+Math.sqrt(o.seed)*2.42,ang=(Math.floor(o.phase/TAU*4))*TAU/4+rr*1.5+o.phase*.13+time*.13+spread*(.23+.1*o.seed);
          const ox=Math.cos(ang)*rr,oy=Math.sin(ang)*rr;
          x=mix(x,center+scale*(ox+(aimX-.5)*.96),cloud);
          y=mix(y,baseline-scale*(2.65+oy*.38+ox*.22+Math.sin(o.seed*120)*.105-(aimY-.5)*.86),cloud)-Math.sin(cloud*Math.PI)*scale*.22;
        }
        if(o.kind===0){
          if(cloud<.95){
            const end=project(o.to),dx=end[0]-pos[0],dy=end[1]-pos[1],l=Math.hypot(dx,dy)*born*(1-cloud);
            const height=Math.max(1,scale*.12*(1-cloud)*born*.98+l*.39);
            ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.drawImage(sprays[o.sprite],-l*.045,-height*.56,l*1.1,height);
            if(frost>.008){
              const reach=Math.hypot(o.to[0],o.to[2])/Math.max(.14,canopy(limit((o.at[1]-.94)/3.93)));
              const dusting=ramp(frost,.13*o.seed,.80+.20*o.seed)*ramp(reach,.44,1.03)*(.45+.41*o.seed);
              if(dusting>.01){
                ctx.globalAlpha=dusting;ctx.drawImage(icedSprays[o.sprite][dx<0?1:0],-l*.045,-height*.56,l*1.1,height);
              }
            }
            ctx.restore();
          }
          if(cloud>.15){
            ctx.globalAlpha=ramp(cloud,.15,.83)*(.46+.52*o.seed);
            ctx.fillStyle=o.seed>.88?'#ffdfb0':o.seed>.62?'#ffd0db':o.seed>.34?'#f396af':'#c77f9e';
            const radius=Math.max(.5,scale*.009*(.4+o.seed));ctx.fillRect(x,y,radius,radius);ctx.globalAlpha=1;
            if(o.seed>.968){
              const radius=scale*.063;ctx.globalAlpha=cloud*(.48+.44*Math.sin(drift*1.2+o.phase)**2);
              ctx.drawImage(roseHalo,x-radius,y-radius,radius*2,radius*2);ctx.globalAlpha=1;
            }
          }
        }else if(o.kind===1){
          const r=o.r*scale*born*(1-cloud*.86);
          ctx.drawImage(globes[o.sprite],x-r,y-r*1.45,r*2,r*2.44);
        }else{
          const lit=limit((light-o.at[1]/5+.075)*12);
          const shine=.70+.30*Math.sin(time*1.7+o.phase*5);
          const r=o.r*scale*born;ctx.fillStyle=cloud>.6?'#ffcad9':lit?'#f5d696':'#87764e';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
          if(lit && o.r>.01){const radius=r*(3+2.8*shine);ctx.globalAlpha=lit*.82;ctx.drawImage(cloud>.45 && o.seed>.15?roseHalo:glow,x-radius,y-radius,radius*2,radius*2);ctx.globalAlpha=1;
            if(o.seed>.83&&shine>.88)glint(ctx,x,y,r*2.9)}
        }
      }
      if(grow>.88&&cloud<.98){
        const [x,y]=project([0,5.0,0]),r=.235*scale*ramp(grow,.88,1)*(1-cloud);
        const pts=Array.from({length:10},(_,i)=>[x+Math.sin(i*Math.PI/5)*r*(i%2?.45:1),y-Math.cos(i*Math.PI/5)*r*(i%2?.45:1)]);
        for(let i=0;i<10;i++)path(ctx,[[x,y],pts[i],pts[(i+1)%10]],i%2?'#d49945':'#ffdf93');
        if(light>.9){ctx.globalAlpha=.55;ctx.drawImage(glow,x-r*2,y-r*2,r*4,r*4);ctx.globalAlpha=1}
      }
    }
    const luminous=limit(illumination)*(1-cloud);
    if(luminous>.006){
      const crown=phase==='opening'?ramp(progress,.42,.64):1;
      const sweep=.63+4.38*crown;
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let shade=0;shade<crystals.length;shade++){
        const layer=crystals[shade],stride=luminous<.22?3:1;
        const from=parseInt(crystalPalette[shade].slice(1),16),to=parseInt(rosePalette[shade].slice(1),16);
        const channels=[16,8,0].map(i=>Math.round(mix((from>>i)&255,(to>>i)&255,rose)));
        ctx.fillStyle='rgb('+channels.join(',')+')';
        ctx.globalAlpha=luminous*(.48+shade*.13);
        for(let i=0;i<layer.length;i+=stride){
          const c=layer[i];if(c.y>sweep+.07)continue;
          const lift=1-ramp(sweep-c.y,-.07,.21);
          const x=center+(c.x*ca-c.z*sa+lift*Math.sin(c.seed*TAU+time*.8)*.145)*scale;
          const y=baseline+((c.x*sa+c.z*ca)*pitch-c.y-lift*c.seed*.10)*scale;
          const sz=Math.max(.55,scale*c.size)*(1-.4*lift);
          ctx.fillRect(x,y,sz,sz);
          if(c.spark){
            const glimmer=(.5+.5*Math.sin(time*(1.5+c.seed)+c.seed*119))**5;
            if(glimmer>.13){const r=(.028+.058*glimmer)*scale;ctx.drawImage(rose>.48?roseHalo:iceHalo,x-r,y-r,r*2,r*2)}
          }
        }
      }
      // Behind the crown the filament is thinner and dimmer. The forward arcs
      // stay white-hot at their centers and project freely past the branch tips.
      for(const front of [false,true]){
        const lanes=[[-.006,'#ffdfae',.85],[0,'#fff3db',1.35],[.006,'#d8eaff',.65]];
        for(const [off,color,weight] of lanes){
          ctx.strokeStyle=color;ctx.lineWidth=Math.max(.45,scale*.011)*weight*(front?1:.70);
          ctx.globalAlpha=luminous*(front?.83:.23)*(off?.56:1)*(1-.43*rose);
          ctx.beginPath();let pen=false;
          for(let j=0;j<=520*crown;j++){
            const u=j/520,a=u*TAU*7+off*10+.69+time*.073+.095*Math.sin(u*16);
            const ring=(1.99*(1-u)**.81+.017)*(1+.042*Math.sin(a*2.1)+.028*Math.cos(a*3.4));
            const x=Math.cos(a)*ring,z=Math.sin(a)*ring,depth=x*sa+z*ca;
            if((depth>=0)!==front){pen=false;continue}
            const px=center+(x*ca-z*sa)*scale,py=baseline+(depth*pitch-.64-u*4.35-off)*scale;
            if(pen)ctx.lineTo(px,py);else{ctx.moveTo(px,py);pen=true}
          }
          ctx.stroke();
        }
      }
      if(crown>.94){const [x,y]=project([0,5,0]),r=scale*.19;ctx.globalAlpha=luminous*.64;ctx.drawImage(rose>.48?roseHalo:iceHalo,x-r,y-r,2*r,2*r)}
      ctx.restore();
    }
    drawComets(true);
    snowPass(ctx,w,h,snow,true);
    if(charge>.001){const r=(.1+.29*charge)*scale;ctx.drawImage(glow,aimX*w-r,aimY*h-r,r*2,r*2);glint(ctx,aimX*w,aimY*h,r*.36)}
    drawWishes(ctx,w,h);
    ctx.globalAlpha=1;
  }
  function render(state){
    lastState=state;const now=state.time??0,dt=limit(state.dt??(now-lastTime),0,.12);lastTime=now;
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(window.devicePixelRatio||1,1.65);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
    screen.setTransform(dpr,0,0,dpr,0,0);
    if(state.snow>.002)advanceSnow(calm.matches?dt*.28:dt,state);
    for(let i=wishes.length-1;i>=0;i--){wishes[i].age+=dt;if(wishes[i].age>wishes[i].end)wishes.splice(i,1)}
    redraw(screen,w,h,state);
  }
  function capture(){
    return bitmap(1280,960,(c,w,h)=>{
      redraw(c,w,h,lastState);
    });
  }
  return {render,wish,capture,reset(){wishes.length=0;lastTime=0;snowWind=0}};
}
