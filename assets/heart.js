// A shallow, curved shell, two pearl hems and a set of spiral meridians.
// The cinema panel keeps the whole constellation clear of both tree and lettering.
const turn=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
function ease(a,b,x){const t=clamp((x-a)/(b-a));return t*t*(3-2*t)}
function outline(t){
  return [Math.sin(t)**3,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16-.16];
}
const inks=['#d66f96','#f8a0b6','#ffbfc2','#ffd29a','#fff2d8'];

export function createHeart(){
  let seed=481226;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const points=[];
  function add(t,latitude,radius,kind){
    const [ex,ey]=outline(t),skin=Math.cos(latitude)*radius;
    const depth=Math.sin(latitude);
    const phase=random(),angle=random()*turn;
    points.push({x:ex*skin,y:ey*skin,z:depth*.44,theta:t,phase,angle,kind,
      startX:Math.cos(angle)*(.4+random()*.82), startY:Math.sin(angle)*(.34+random()*.49),
      birth:.035+.23*(kind===2?(t/turn)%1:random()),size:.46+random()**2*1.12,
      tint:kind===2?(phase>.54?4:3):kind===1?(phase>.68?3:2):Math.floor(random()*3)});
  }
  // The polar curve slows at its cleft and tip. Area weighting prevents a
  // false vertical seam down the centre of the volumetric dust.
  for(let i=0;i<1340;){
    const t=random()*turn,[x,y]=outline(t),[nx,ny]=outline(t+.002);
    if(random()*.0035>Math.abs(x*(ny-y)-y*(nx-x)))continue;
    add(t,Math.asin(random())*(random()<.46?-1:1),.955+random()*.046,0);i++;
  }
  for(let strand=0;strand<9;strand++){
    for(let j=0;j<64;j++){
      const u=j/63;
      add((strand/9+u*.62)*turn,(u-.5)*2.91,1.012,1);
    }
  }
  for(let j=0;j<310;j++)add(j/310*turn,j%2?.08:-.08,j%2?.994:1.014,2);
  points.sort((a,b)=>a.z-b.z);
  const ember=document.createElement('canvas');ember.width=ember.height=32;
  const glow=ember.getContext('2d'),bloom=glow.createRadialGradient(16,16,0,16,16,16);
  bloom.addColorStop(0,'#ffc5c8');bloom.addColorStop(.22,'#ef9baa99');bloom.addColorStop(.6,'#d053810f');bloom.addColorStop(1,'#d0538100');
  glow.fillStyle=bloom;glow.fillRect(0,0,32,32);

  const pulse=(p,at,width)=>Math.exp(-(((p-at)/width)**2));
  return function paint(ctx,w,h,p,reduced){
    const r=Math.min(w*.235,h*.255);
    if(r<1)return;
    const time=reduced?.64:p;
    const opacity=reduced?ease(0,.4,p):1-ease(.94,1,p);
    if(opacity<.002)return;
    const beat=reduced?0:.067*pulse(time,.49,.021)+.031*pulse(time,.543,.028)
      +.056*pulse(time,.743,.024)+.024*pulse(time,.797,.028);
    const scale=r*(1+beat),cx=w*.5,cy=h*.322;
    const yaw=.08+Math.sin(time*5.8-.8)*.34,cos=Math.cos(yaw),sin=Math.sin(yaw);
    ctx.save();
    ctx.translate(cx,cy);
    const halo=ctx.createRadialGradient(0,0,0,0,0,r*1.25);
    halo.addColorStop(0,'#e683a52c');halo.addColorStop(.61,'#c06e8920');halo.addColorStop(1,'#847b9f00');
    ctx.fillStyle=halo;ctx.globalAlpha=opacity*ease(.09,.46,time);
    ctx.fillRect(-r*1.25,-r*1.25,2.5*r,2.5*r);
    ctx.globalCompositeOperation='lighter';
    for(const star of points){
      const form=ease(star.birth,star.birth+.22,time);
      if(form<.002)continue;
      const lag=1-form,swirl=Math.sin(form*Math.PI);
      const x=(star.x*cos+star.z*sin)*form+star.startX*lag+Math.sin(star.angle+form*4)*swirl*.14;
      const y=star.y*form+star.startY*lag+.07*star.z*form;
      const z=star.z*cos-star.x*sin;
      const gleam=(.5+.5*Math.cos(star.theta-time*turn*2.2))**9;
      const grain=.64+.36*Math.sin(star.phase*turn+time*10)**2;
      const light=star.kind===2?.77:star.kind===1?.66:.47;
      ctx.globalAlpha=opacity*form*clamp((light+z*.39+gleam*.36)*grain);
      ctx.fillStyle=inks[star.tint];
      const diameter=Math.max(.56,star.size*(.72+r/103)*(.74+gleam*.39));
      ctx.fillRect(x*scale-diameter*.5,y*scale-diameter*.5,diameter,diameter);
      if(star.phase>.83&&z>-.12){
        const spread=diameter*(3.1+gleam*2);
        ctx.globalAlpha*=.53;ctx.drawImage(ember,x*scale-spread,y*scale-spread,spread*2,spread*2);
      }
    }
    // Two pinpoints travel the sewn edge with short champagne and rose afterimages.
    for(let k=0;k<2;k++){
      const at=(.025+time*1.03+k*.51)*turn, alpha=opacity*ease(.25,.43,time);
      for(let j=18;j>=0;j--){
        const [x,y]=outline(at-j*.017),fade=1-j/19;
        const px=x*cos*scale,py=y*scale;
        ctx.globalAlpha=alpha*fade**2;ctx.fillStyle=k?'#ffd7e3':'#ffe4b6';
        ctx.beginPath();ctx.arc(px,py,.35+fade*Math.max(.8,r*.015),0,turn);ctx.fill();
        if(j===0){
          const ray=Math.max(2.8,r*.059);
          ctx.save();ctx.translate(px,py);ctx.rotate(k?-.31:.26);
          ctx.beginPath();ctx.moveTo(0,-ray);ctx.lineTo(.8,-.7);ctx.lineTo(ray*.74,0);ctx.lineTo(.7,.7);
          ctx.lineTo(0,ray);ctx.lineTo(-.7,.7);ctx.lineTo(-ray*.74,0);ctx.lineTo(-.8,-.7);ctx.closePath();ctx.fill();ctx.restore();
        }
      }
    }
    ctx.restore();
  };
}
