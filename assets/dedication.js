import {createHeart} from './heart.js';
import {getLanguage, t} from './i18n.js';

// Sample the typeset ink so that the arriving stars settle on the actual letterforms.
export function createDedication(canvas, recipient='') {
  const ctx = canvas.getContext('2d');
  const paintHeart=createHeart();
  const ink = document.createElement('canvas'), letter = ink.getContext('2d',{willReadFrequently:true});
  let width=0,height=0,density=0,stars=[],inkLanguage='';
  function compose(w,h,d) {
    width=w;height=h;density=d;inkLanguage=getLanguage();
    canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
    ink.width=w;ink.height=h;
    letter.textAlign='center';letter.textBaseline='middle';
    const size=Math.min(w*.149,h*.235);
    letter.font='italic 500 '+size+'px Cormorant,Georgia,serif';
    const gold=letter.createLinearGradient(0,h*.62,0,h*.81);
    gold.addColorStop(0,'#fff4dc');gold.addColorStop(.57,'#f8d7cb');gold.addColorStop(1,'#de989f');
    letter.fillStyle=gold;
    letter.fillText('Merry Christmas',w*.5,h*.716,w*.94);
    const verse=recipient ? t(recipient+'，圣诞快乐', 'For you, '+recipient) : t('愿你的冬夜有光','May your winter nights be bright.');
    const cn=Math.min(w*.050,h*.079),maxWidth=w*.9;
    letter.font='500 '+cn+'px "Songti SC",SimSun,serif';
    letter.fillStyle='#f6dfd2';
    letter.save();letter.translate(w*.5,h*.921);
    if('letterSpacing' in letter)letter.letterSpacing=cn*(inkLanguage==='zh'?.22:.04)+'px';
    letter.fillText(verse,0,0,maxWidth);letter.restore();
    const data=letter.getImageData(0,0,w,h).data;
    stars=[];
    let seed=122406;
    const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const spacing=Math.max(2,Math.round(w/210));
    for(let y=2;y<h-1;y+=spacing)for(let x=1;x<w-1;x+=spacing){
      if(data[(y*w+x)*4+3]<70 || rand()<.27)continue;
      stars.push({x,y,dx:(.03+rand()*.16)*w,dy:(rand()-.65)*h*.58,
        arrival:.28+.35*x/w+rand()*.12,phase:rand()*6.28,r:.45+rand()*.7});
    }
  }
  const clamp=x=>Math.max(0,Math.min(1,x));
  return function draw(progress,reduced) {
    if(progress===null){if(!canvas.hidden)canvas.hidden=true;return;}
    canvas.hidden=false;
    const w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(2,devicePixelRatio||1);
    if(!w||!h)return;
    if(w!==width||h!==height||d!==density||inkLanguage!==getLanguage())compose(w,h,d);
    ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
    if(reduced){
      ctx.globalAlpha=clamp(progress*3);ctx.drawImage(ink,0,0);ctx.globalAlpha=1;
      paintHeart(ctx,w,h,progress,true);return;
    }
    const edge=(progress-.23)*2.18;
    ctx.save();ctx.drawImage(ink,0,0);
    const fade=ctx.createLinearGradient(w*(edge-.14),0,w*edge,0);
    fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');
    ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);ctx.restore();
    ctx.globalCompositeOperation='lighter';
    for(const s of stars){
      const t=clamp((progress-s.arrival)/.23);
      if(t<=0||t>=1)continue;
      const k=(1-t)**2, x=s.x+s.dx*k, y=s.y+s.dy*k+Math.sin(s.phase+t*3)*h*.048*k;
      ctx.globalAlpha=Math.sin(t*Math.PI)*.9;
      ctx.fillStyle=s.phase<2?'#ffd6a5':'#ffc3d1';ctx.fillRect(x,y,s.r,s.r);
      if(s.phase<.19){ctx.globalAlpha*=.55;ctx.fillRect(x-2,y,5,.65);ctx.fillRect(x,y-2,.65,5);}
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    paintHeart(ctx,w,h,progress,false);
  };
}
