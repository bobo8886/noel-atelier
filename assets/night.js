// A single, resolution-aware painted backdrop keeps the night landscape cheap to render.
export function paintRoseLake(canvas,width,height,horizon=.70,density=Math.min(1.5,window.devicePixelRatio||1)){
  canvas.width=Math.max(1,Math.round(width*density));
  canvas.height=Math.max(1,Math.round(height*density));
  const ctx=canvas.getContext('2d');ctx.scale(density,density);
  const water=Math.min(.83,Math.max(.58,horizon))*height;
  let seed=92543;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const sky=ctx.createLinearGradient(0,0,0,water);
  for(const [p,col] of [[0,'#0a0e1e'],[.37,'#211d32'],[.68,'#4b324b'],[.85,'#734756'],[.97,'#ab707c'],[1,'#d19290']])sky.addColorStop(p,col);
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  function haze(x,y,rx,ry,color){
    ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
    const a=ctx.createRadialGradient(0,0,0,0,0,1);a.addColorStop(0,color);a.addColorStop(1,'transparent');
    ctx.fillStyle=a;ctx.fillRect(-1,-1,2,2);ctx.restore();
  }
  haze(width*.43,water*.79,width*.56,water*.29,'#c2718650');
  haze(width*.64,water*.88,width*.33,water*.12,'#f5a79f36');
  for(let i=0;i<Math.min(350,width*.22);i++){
    const x=random()*width,y=random()*water*.9,size=.35+random()**3*1.10;
    ctx.globalAlpha=(1-y/water)*(.15+.45*random());ctx.fillStyle=i%3?'#f3e6db':'#efc1d0';
    ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const lake=ctx.createLinearGradient(0,water,0,height);
  for(const [p,col] of [[0,'#9b6876'],[.08,'#77515f'],[.37,'#422e43'],[.70,'#262332'],[1,'#101822']])lake.addColorStop(p,col);
  ctx.fillStyle=lake;ctx.fillRect(0,water,width,height-water);
  // A low distant shoreline and its vertically compressed reflection frame the opening in the lake.
  for(let band=0;band<3;band++){
    const shore=[];
    for(let i=0;i<=180;i++){
      const u=i/180, edge=Math.abs(u-.51)*2;
      const shoulder=(.18+.82*edge**1.40);
      const wave=.66+.20*Math.sin(u*14+band*1.72)+.14*Math.sin(u*31+band+.7);
      shore.push([u*width,water-height*shoulder*(.125-band*.031)*wave+height*(random()-.5)*.0017]);
    }
    function silhouette(mirror){
      ctx.beginPath();ctx.moveTo(0,water);
      for(const [x,y] of shore)ctx.lineTo(x,mirror?water+(water-y)*.42:y);
      ctx.lineTo(width,water);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle=['#735365','#594454','#403749'][band];silhouette(false);
    ctx.globalAlpha=.27;silhouette(true);ctx.globalAlpha=1;
    if(band===2){
      ctx.fillStyle='#3e3849';ctx.beginPath();
      const n=Math.min(600,Math.ceil(width/3));
      for(let i=0;i<n;i++){
        const u=(i+random()*.7)/n, x=u*width, y=shore[Math.floor(u*180)][1]+1.4;
        const h=(.001+random()**2*.010)*height*(.46+Math.abs(u-.5));
        ctx.moveTo(x-h*.18,y);ctx.lineTo(x,y-h);ctx.lineTo(x+h*.22,y);
      }
      ctx.fill();
    }
  }
  haze(width*.49,water+height*.038,width*.32,height*.065,'#ffc4ad36');
  const waterH=height-water,count=Math.round(Math.min(3100,Math.max(850,width*1.6)));
  for(let i=0;i<count;i++){
    const u=random(),d=random()**1.35,y=water+d*waterH;
    const distance=(u-.49)/(.095+.19*d),lane=Math.exp(-distance*distance);
    ctx.globalAlpha=(.036+.10*lane)*(.45+.8*random())*(1-.41*d);
    ctx.fillStyle=i%4?'#f5c2bb':'#a6b2c4';
    const length=(.6+(1.5+25*d*d)*random()**1.4)*(width/1100)**.38;
    ctx.fillRect(u*width-length/2,y,length,.39+.73*d);
  }
  ctx.globalAlpha=1;
  const vignette=ctx.createRadialGradient(width*.5,height*.62,height*.14,width*.50,height*.52,Math.max(width*.68,height*.78));
  vignette.addColorStop(0,'#08071100');vignette.addColorStop(.70,'#09091226');vignette.addColorStop(1,'#06081289');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
}

export function paintNight(canvas, width, height) {
  const density = Math.min(1.5, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  const ink = canvas.getContext('2d');
  ink.scale(density, density);
  let seed = 241224;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const gradient = ink.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0,'#07111d'); gradient.addColorStop(.55,'#1d333b');
  gradient.addColorStop(.79,'#34454a'); gradient.addColorStop(1,'#111e27');
  ink.fillStyle=gradient; ink.fillRect(0,0,width,height);
  function glow(x,y,r,color) {
    const haze=ink.createRadialGradient(x,y,0,x,y,r);
    haze.addColorStop(0,color);haze.addColorStop(1,'transparent');
    ink.fillStyle=haze;ink.fillRect(x-r,y-r,r*2,r*2);
  }
  glow(width*.50,height*.48,height*.56,'#99ae962d');
  glow(width*.20,height*.59,height*.32,'#749a9d22');
  const tree=(x,y,h,w,color)=>{
    ink.fillStyle=color;ink.beginPath();ink.moveTo(x,y-h);
    const outline=[];
    for(let n=0;n<17;n++){
      const u=(n+1)/17, span=w*u*(.83+random()*.28);
      outline.push([u,span]);
      ink.lineTo(x-span*.53,y-h+h*u-h*.032);
      ink.lineTo(x-span,y-h+h*u+h*.018*random());
      ink.lineTo(x-span*.59,y-h+h*u-.009*h);
    }
    ink.lineTo(x,y);
    for(let n=outline.length-1;n>=0;n--){
      const [u,span]=outline[n];ink.lineTo(x+span*.61,y-h+h*u-.009*h);
      ink.lineTo(x+span*(.91+random()*.16),y-h+h*u+.01*h);
      ink.lineTo(x+span*.48,y-h+h*u-h*.032);
    }
    ink.closePath();ink.fill();
  };
  for(let i=0;i<230;i++){
    const x=random()*width,y=random()*height*.72,r=.3+random()**3*1.25;
    ink.globalAlpha=.15+random()*.52;ink.fillStyle=i%6===0?'#ffe9ac':'#d2e8dd';
    ink.beginPath();ink.arc(x,y,r,0,Math.PI*2);ink.fill();
    if(r>1.42){glow(x,y,6,'#eed7a65c');ink.fillRect(x-3,y-.35,6,.7);ink.fillRect(x-.35,y-3,.7,6)}
  }
  ink.globalAlpha=1;
  for(let layer=0;layer<3;layer++){
    const color=['#35494d','#283e41','#1c3336'][layer];
    const ridge=x=>height*(.63+layer*.065+.035*Math.sin(x*6.8+layer)+.024*Math.sin(x*14+layer*.9));
    ink.fillStyle=color;ink.beginPath();ink.moveTo(0,height);
    for(let k=0;k<=140;k++)ink.lineTo(width*k/140,ridge(k/140));
    ink.lineTo(width,height);ink.closePath();ink.fill();
    const count=Math.ceil(width/(7+3*layer));
    for(let k=0;k<count;k++){
      const u=(k+random())/count,h=(.014+random()**1.5*.051)*(1+layer*.43)*height;
      tree(u*width,ridge(u)+4,h,h*(.12+random()*.10),color);
    }
  }
  // Ground, low mist, and nearer firs at the very edges of the clearing.
  const snow=ink.createLinearGradient(0,height*.72,0,height);
  snow.addColorStop(0,'#73877c');snow.addColorStop(.22,'#4f655e');snow.addColorStop(1,'#172c2b');
  ink.fillStyle=snow;ink.beginPath();ink.moveTo(0,height);
  ink.bezierCurveTo(width*.12,height*.7,width*.37,height*.79,width*.53,height*.785);
  ink.bezierCurveTo(width*.70,height*.775,width*.87,height*.725,width,height*.76);
  ink.lineTo(width,height);ink.fill();
  for(let k=0;k<650;k++){
    const x=random()*width,y=height*(.82+random()*.18);
    ink.fillStyle='rgba(221,232,202,'+(.018+random()*.06)+')';
    ink.fillRect(x,y,.6+random()**2*4,.65);
  }
  for(const side of [-1,1]){
    for(let i=0;i<18;i++){
      const u=random()**1.9*.19,x=side<0?u*width:width-u*width;
      const h=height*(.13+random()*.34)*(1-u*2.8);
      tree(x,height*(.83+random()*.11),h,h*.18,'#122827');
    }
  }
  const vignette=ink.createRadialGradient(width*.5,height*.46,height*.14,width*.5,height*.50,Math.max(width*.67,height*.73));
  vignette.addColorStop(0,'#06131600'); vignette.addColorStop(.65,'#05111329');vignette.addColorStop(1,'#030e13ad');
  ink.fillStyle=vignette;ink.fillRect(0,0,width,height);
  // Fine translucent curtains are painted once and drift as a single compositor layer.
  const veil=document.querySelector('#aurora');
  veil.width=width;veil.height=height;
  const air=veil.getContext('2d');
  for(let band=0;band<2;band++){
    for(let i=0;i<Math.min(width,1100);i++){
      const count=Math.min(width,1100),u=i/count,x=u*width;
      const bend=Math.sin(u*6.7+band*1.5)*.037+Math.sin(u*14.3+1.4)*.012;
      const baseline=height*(.213+band*.061+bend+.095*u);
      const span=height*(.075+.063*(1+Math.sin(u*8.7+band))+.032*random());
      const strength=(.035+.033*(1+Math.sin(u*27+band)))*(.52+.48*Math.cos(u*6+band)**2);
      const ribbon=air.createLinearGradient(x,baseline-span,x,baseline+4);
      ribbon.addColorStop(0,'rgba(81,134,159,0)');
      ribbon.addColorStop(.63,'rgba(78,173,157,'+strength*.42+')');
      ribbon.addColorStop(.96,'rgba(106,204,161,'+strength+')');
      ribbon.addColorStop(1,'rgba(88,181,150,0)');
      air.fillStyle=ribbon;air.beginPath();air.moveTo(x,baseline+4);air.lineTo(x+width/count+2,baseline+4);
      air.lineTo(x+span*.28+width/count,baseline-span);air.lineTo(x+span*.28,baseline-span);air.fill();
    }
  }
}
