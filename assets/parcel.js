// All surfaces, paper prints, ribbon folds and ornaments are generated in the browser.
export function createParcel(THREE, recipient='') {
  const group = new THREE.Group();
  group.name = 'Wrapped winter present';
  const width = 2.55, depth = 2.05, top = 1.75, lidHeight = .26;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const smooth = (v, a, b) => {
    const n = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return n * n * (3 - 2 * n);
  };
  let seed = 5491;
  const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

  function texture(w, h, paint) {
    const surface = document.createElement('canvas');
    surface.width = w; surface.height = h;
    paint(surface.getContext('2d'), w, h);
    const map = new THREE.CanvasTexture(surface);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }
  function sprig(ctx, x, y, size, angle) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size, size);
    ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(0, 14); ctx.quadraticCurveTo(-1, 0, 1, -18);
    for (let i = 0; i < 8; i++) {
      const v = 9 - i * 3.1, l = (9 - i) * .96;
      ctx.moveTo(0, v); ctx.quadraticCurveTo(-l * .78, v - 2, -l, v - 7);
      ctx.moveTo(.4, v - 1); ctx.quadraticCurveTo(l * .68, v - 4, l, v - 7.5);
    }
    ctx.stroke(); ctx.restore();
  }
  function littleStar(ctx, x, y, radius) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r = (i % 2 ? .23 : 1) * radius;
      const px = x + Math.sin(a) * r * .75, py = y + Math.cos(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  function paperMap(aspect, lining = false, medallion = false) {
    const h = lining ? 384 : 768, w = Math.round(h * aspect);
    return texture(w, h, ctx => {
      const wash = ctx.createLinearGradient(0, h, w, 0);
      wash.addColorStop(0, lining ? '#ae9d79' : '#164639');
      wash.addColorStop(.43, lining ? '#e8d6ae' : '#295943');
      wash.addColorStop(1, lining ? '#dfcba7' : '#174735');
      ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
      const fiber = ctx.getImageData(0, 0, w, h);
      const pixels = fiber.data;
      for (let y = 0, i = 0; y < h; y++) {
        const weave = Math.sin(y * 1.61) * 1.8;
        for (let x = 0; x < w; x++, i += 4) {
          const fleck = (rand() - .48) * 12 + weave;
          pixels[i] += fleck; pixels[i+1] += fleck; pixels[i+2] += fleck;
        }
      }
      ctx.putImageData(fiber, 0, 0);
      ctx.strokeStyle = lining ? '#948056' : '#dfc88d'; ctx.fillStyle = ctx.strokeStyle;
      const spacing=lining?54:119;
      for (let row = -1; row <= h / spacing + 1; row++) {
        for (let col = -1; col <= w / spacing + 1; col++) {
          const x = col * spacing + (row & 1) * spacing/2, y = row * spacing;
          if(medallion&&Math.hypot(x-w*.238,y-h*.59)<h*.181)continue;
          ctx.globalAlpha = lining ? .23 : .78;
          if ((row + col) % 3 === 0) {
            littleStar(ctx, x, y, lining?5:8.4);
            ctx.beginPath(); ctx.arc(x + 7, y - 7, 1.3, 0, 2 * Math.PI); ctx.fill();
          } else {
            const flip=row&1?1:-1;
            sprig(ctx, x, y, lining?.82:1.20,flip*.57);
            if(!lining){
              sprig(ctx,x+flip*10,y+7,.8,flip*1.02);
              sprig(ctx,x+flip*2,y+13,.66,-flip*.38);
              for(let berry=0;berry<3;berry++){
                ctx.beginPath();ctx.arc(x-flip*(5+3*berry),y+7+(berry%2)*4,1.85,0,Math.PI*2);ctx.fill();
              }
            }
          }
          ctx.globalAlpha = .50; littleStar(ctx, x + spacing*.48, y + spacing*.27, 3.4);
          if(!lining){ctx.beginPath();ctx.arc(x+spacing*.28,y+spacing*.41,1.35,0,Math.PI*2);ctx.fill()}
        }
      }
      if(medallion){
        ctx.save();ctx.translate(w*.238,h*.59);ctx.scale(h*.132,h*.132);
        // Six chased arms leave ink between their paired engraved rules. The
        // interrupted outer ring gives the seal definition even at thumbnail size.
        ctx.strokeStyle='#eed398';ctx.lineCap='round';ctx.lineJoin='round';
        ctx.fillStyle='#e8c68b';ctx.globalAlpha=.92;
        for(let i=0;i<6;i++){
          ctx.save();ctx.rotate(i*Math.PI/3);
          ctx.lineWidth=.025;ctx.beginPath();
          ctx.moveTo(0,.13);ctx.lineTo(0,.96);ctx.stroke();
          for(const [rise,reach,wing] of [[.24,.205,.17],[.42,.182,.19],[.61,.133,.15],[.75,.077,.096]]){
            ctx.lineWidth=.022;ctx.beginPath();
            ctx.moveTo(-reach,rise+wing);ctx.lineTo(0,rise);ctx.lineTo(reach,rise+wing);ctx.stroke();
          }
          ctx.lineWidth=.016;ctx.beginPath();
          ctx.moveTo(0,.87);ctx.lineTo(-.043,.937);ctx.lineTo(0,1.045);ctx.lineTo(.043,.937);ctx.closePath();ctx.stroke();
          ctx.beginPath();ctx.moveTo(0,.24);ctx.lineTo(.145,.089);ctx.lineTo(0,.043);ctx.lineTo(-.145,.089);ctx.closePath();ctx.stroke();
          ctx.globalAlpha=.70;ctx.lineWidth=.009;
          ctx.beginPath();ctx.arc(0,0,1.185,.13,.91);ctx.stroke();
          for(const [a,r] of [[.18,1.225],[.50,1.222],[.87,1.225]]){
            ctx.beginPath();ctx.arc(Math.sin(a)*r,Math.cos(a)*r,.014,0,Math.PI*2);ctx.fill();
          }
          ctx.restore();
        }
        ctx.globalAlpha=.90;ctx.lineWidth=.018;
        ctx.beginPath();ctx.arc(0,0,.075,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
      if(!lining){
        // Two hand-engraved corner sprays. Their needles turn around the same
        // arched stem; the negative space between clusters keeps the foil legible.
        for(const [x,y,turn] of [[27,h-28,0],[w-27,28,Math.PI]]){
          ctx.save();ctx.translate(x,y);ctx.rotate(turn);ctx.scale(1,-1);
          ctx.strokeStyle='#e6cd96';ctx.fillStyle='#ecd39c';ctx.globalAlpha=.92;
          ctx.lineCap='round';ctx.lineWidth=2;
          const point=t=>[190*t,23*t+94*t*t];
          ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(94,12,190,117);ctx.stroke();
          for(let shoot=1;shoot<=8;shoot++){
            const t=shoot/9,[sx,sy]=point(t),left=shoot%2===1;
            const dx=left?6+12*t:29-9*t,dy=left?30-11*t:0;
            ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+dx*.53,sy+dy*.40,sx+dx,sy+dy);
            for(let n=1;n<7;n++){
              const u=n/7,bx=sx+dx*u,by=sy+dy*u;
              const reach=9*(1-u)+3;
              ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+reach*.67,by+reach*.54,bx+reach,by+reach);
              ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx-reach*.46,by+reach*.64,bx-reach*.52,by+reach*1.28);
            }
            ctx.stroke();
            if(shoot===2||shoot===5){
              for(const [mx,my,r] of [[0,0,3.3],[6,2,2.8],[2,6,2.5]]){
                ctx.beginPath();ctx.arc(sx+dx+mx,sy+dy+my,r,0,Math.PI*2);ctx.fill();
              }
            }
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = lining ? '#a08758' : '#d3b983';
      ctx.lineWidth = 1.4; ctx.strokeRect(10,10,w-20,h-20);
      ctx.globalAlpha = .58; ctx.strokeRect(15,15,w-30,h-30);
      if(!lining){
        for(const [x,y,angle] of [[0,0,0],[w,0,Math.PI/2],[w,h,Math.PI],[0,h,-Math.PI/2]]){
          ctx.save();ctx.translate(x,y);ctx.rotate(angle);
          ctx.strokeStyle='#f1d6a5';ctx.lineWidth=1.5;
          ctx.beginPath();ctx.moveTo(28,15);ctx.quadraticCurveTo(45,17,25,26);ctx.quadraticCurveTo(14,41,15,56);
          ctx.moveTo(15,28);ctx.quadraticCurveTo(18,46,27,25);ctx.quadraticCurveTo(41,15,56,15);ctx.stroke();
          littleStar(ctx,30,30,4);ctx.restore();
        }
      }
    });
  }
  const silkMap = texture(192, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (const [position, color] of [[0,'#501626'],[.06,'#a93c54'],[.22,'#91283e'],[.49,'#72192d'],[.72,'#982c44'],[.94,'#84223a'],[1,'#551829']]) g.addColorStop(position, color);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = y % 4 ? 'rgba(255,193,171,.07)' : 'rgba(30,4,12,.09)';
      ctx.fillRect(0, y, w, 1);
    }
    for (const x of [5,w-7]) {
      ctx.fillStyle = '#d7b479'; ctx.fillRect(x, 0, 2, h);
      for (let y = 0; y < h; y += 7) { ctx.fillStyle = '#edcf95'; ctx.fillRect(x - 1, y, 2, 2); }
    }
    for(let i=0;i<6200;i++){
      const x=rand()*w,y=rand()*h;
      ctx.strokeStyle=i%2?'#ffd3c817':'#2907161c';ctx.lineWidth=.55;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.9,y+2.6);ctx.stroke();
    }
  });
  silkMap.wrapT = THREE.RepeatWrapping;
  const tagMap = texture(384, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f5e6c7'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 19000; i++) {
      ctx.fillStyle = rand() > .5 ? 'rgba(126,92,42,.10)' : 'rgba(255,255,242,.28)';
      ctx.fillRect(rand()*w, rand()*h, 2, 1);
    }
    ctx.strokeStyle = '#ab915d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(18, 104); ctx.lineTo(70, 34); ctx.lineTo(w-70, 34);
    ctx.lineTo(w-18, 104); ctx.lineTo(w-18, h-18); ctx.lineTo(18,h-18); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#234639'; ctx.strokeStyle = '#536d49';
    sprig(ctx, 180, 190, 1.5, -.5); sprig(ctx, 205, 192, 1.1, .8);
    ctx.fillStyle = '#a53c45'; for (const [x,y] of [[184,201],[192,207],[179,211]]) {
      ctx.beginPath();ctx.arc(x,y,4.5,0,2*Math.PI);ctx.fill();
    }
    ctx.fillStyle = '#613634'; ctx.textAlign = 'center';
    if (recipient) {
      const letters=Array.from(recipient);
      const lines=letters.length>8 ? [letters.slice(0,Math.ceil(letters.length/2)).join(''),letters.slice(Math.ceil(letters.length/2)).join('')] : [recipient];
      ctx.font = '500 '+(lines.length===1?64:46)+'px "Songti SC", SimSun, Georgia, serif';
      lines.forEach((line,i)=>ctx.fillText(line,w/2,lines.length===1?301:272+52*i,w-64));
    } else {
      ctx.font = 'italic 81px Georgia, serif'; ctx.fillText('For you', w/2, 308);
    }
    ctx.strokeStyle = '#ae976a'; ctx.beginPath();ctx.moveTo(126, 349);ctx.lineTo(258,349);ctx.stroke();
    ctx.fillStyle = '#a5804c';littleStar(ctx,192,389,10);
  });

  const materialSets = { box:[], lid:[], silk:[], strap:[] };
  function standard(set, options) {
    const mat = new THREE.MeshStandardMaterial(options);
    materialSets[set].push(mat);
    return mat;
  }
  function paper(set, aspect, lining=false, medallion=false) {
    const map = paperMap(aspect, lining, medallion);
    if(lining)return standard(set,{map,roughness:.91,metalness:.015});
    const surface=map.image;
    const coating=texture(surface.width,surface.height,ctx=>{
      ctx.drawImage(surface,0,0);const data=ctx.getImageData(0,0,surface.width,surface.height);
      const pixels=data.data;
      for(let i=0;i<pixels.length;i+=4){
        const foil=smooth(pixels[i]-pixels[i+1]*.81,-8,48);
        pixels[i]=255;pixels[i+1]=225-foil*116;pixels[i+2]=5+foil*134;
      }
      ctx.putImageData(data,0,0);
    });
    coating.colorSpace=THREE.NoColorSpace;
    return standard(set,{map,bumpMap:map,bumpScale:.00082,roughnessMap:coating,metalnessMap:coating,roughness:1,metalness:1});
  }
  function textile(set) {
    const mat = new THREE.MeshPhysicalMaterial({
      map:silkMap, side:THREE.DoubleSide, roughness:.43, metalness:.055, bumpMap:silkMap, bumpScale:.00031,
      sheen:.73, sheenColor:0x9d495b, sheenRoughness:.54, clearcoat:.08, clearcoatRoughness:.46
    });
    materialSets[set].push(mat);
    return mat;
  }
  const caseEdge = standard('box',{color:0x285543,roughness:.7});
  const inner = paper('box',1.45,true);
  const front = paper('box',width/(top-lidHeight),false,true), side = paper('box',depth/(top-lidHeight));
  const lidEdge = standard('lid',{color:0x214f40,roughness:.66});
  const lidGold = standard('lid',{color:0xc9ab72,metalness:.38,roughness:.32});
  const lidFace = paper('lid',width/depth);
  const lidLining = paper('lid',width/depth,true);
  const silk = textile('silk'), strapSilk=textile('strap');

  // Create a beveled cuboid with geometry-derived normals and correctly scaled planar UVs.
  function bevelGeometry(w,h,d,r) {
    r = Math.min(w/2, h/2, d/2, r);
    const g = new THREE.BoxGeometry(1,1,1,9,9,9);
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    const axis=(coord,span)=>{
      const i=Math.round((coord+.5)*9);
      const a=[0,r*.22,r*.48,r*.75,r,span-r,span-r*.75,span-r*.48,span-r*.22,span];
      return a[i]-span/2;
    };
    const pos=V(0,0,0),nearest=V(0,0,0),normal=V(0,0,0),face=V(0,0,0);
    const low=V(-w/2+r,-h/2+r,-d/2+r),high=V(w/2-r,h/2-r,d/2-r);
    for(let i=0;i<p.count;i++){
      face.fromBufferAttribute(n,i);pos.set(axis(p.getX(i),w),axis(p.getY(i),h),axis(p.getZ(i),d));
      nearest.copy(pos).clamp(low,high);
      normal.subVectors(pos,nearest).normalize(); pos.copy(nearest).addScaledVector(normal,r);
      p.setXYZ(i,pos.x,pos.y,pos.z);n.setXYZ(i,normal.x,normal.y,normal.z);
      if(face.x)uv.setXY(i,.5-face.x*pos.z/d,.5+pos.y/h);
      else if(face.y)uv.setXY(i,.5+pos.x/w,.5-face.y*pos.z/d);
      else uv.setXY(i,.5+face.z*pos.x/w,.5+pos.y/h);
    }
    return g;
  }
  function mesh(parent,geometry,material,x=0,y=0,z=0){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;
  }
  function box(parent,w,h,d,r,material,x=0,y=0,z=0){
    return mesh(parent,bevelGeometry(w,h,d,r),material,x,y,z);
  }
  function pivot(parent,x=0,y=0,z=0){
    const p=new THREE.Group();p.position.set(x,y,z);parent.add(p);return p;
  }
  const bottom=box(group,width,.09,depth,.027,[caseEdge,caseEdge,inner,caseEdge,caseEdge,caseEdge],0,.045,0);
  bottom.receiveShadow=true;
  const panels=[];
  const wallHeight=top-.15-.062;
  for(const [span,azimuth,offset,face] of [[width,0,depth/2,front],[depth,Math.PI/2,width/2,side],[width,Math.PI,depth/2,front],[depth,-Math.PI/2,width/2,side]]){
    const anchor=pivot(group,Math.sin(azimuth)*(offset-.024),.066,Math.cos(azimuth)*(offset-.024));
    anchor.rotation.y=azimuth;
    const hinge=pivot(anchor);
    const wall=box(hinge,span-.016,wallHeight,.048,.009,[caseEdge,caseEdge,caseEdge,caseEdge,face,inner],0,wallHeight/2,0);
    wall.castShadow=wall.receiveShadow=true;panels.push(hinge);
  }
  const lid=pivot(group,0,top,0);
  const cover=box(lid,width+.076,lidHeight,depth+.076,.034,[lidEdge,lidEdge,lidFace,lidLining,lidEdge,lidEdge],0,-lidHeight/2,0);
  cover.castShadow=cover.receiveShadow=true;
  // Low-profile foil tooling follows the lid, including its back and side returns.
  for(const [y,thickness] of [[-.215,.013],[-.181,.0045],[-.054,.0065]]){
    for(const sign of [-1,1]){
      box(lid,width+.068,thickness,.009,thickness*.28,lidGold,0,y,sign*(depth/2+.034));
      box(lid,.009,thickness,depth+.068,thickness*.28,lidGold,sign*(width/2+.034),y,0);
    }
  }

  const routedBands=[],loops=[];
  const bows=pivot(group,0,top+.029,0);
  // Follow the fold around a decreasing arc as the free end is drawn out.
  // Both legs share the same transverse frame at a given radial distance.
  // This preserves the layers through the turnaround of the loop.
  for(const sign of [-1,1]){
    const rows=92,cols=12,pos=new Float32Array((rows+1)*(cols+1)*3),uv=[],indices=[];
    for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
      uv.push(j/cols,i/rows*4.7);
      if(i<rows&&j<cols){
        const n=i*(cols+1)+j;
        if(sign>0)indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);
        else indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);
    const band=mesh(bows,geo,silk);
    band.name=sign<0?'Left bow loop':'Right bow loop';band.userData.ribbon=true;
    band.castShadow=true;band.frustumCulled=false;
    let previous=-1;
    loops.push(progress=>{
      const k=smooth(progress,sign<0?.027:.056,sign<0?.286:.305);
      if(k===previous)return;
      previous=k;
      const sweep=(2*Math.PI-.13)*(1-k)+Math.PI*(sign<0?.91:.85)*k;
      let ix=0;
      for(let i=0;i<=rows;i++){
        const t=i/rows,theta=.042+sweep*t,q=(1-Math.cos(theta))*.5,leg=Math.sin(theta);
        const x=.021+(.95+k*(sign<0?.79:.90))*q;
        const y=.159+.245*q+(sign<0?.158:.185)*leg+.139*Math.max(0,-leg)**1.6+.08*k*q;
        const z=(sign<0?-.048:.041)*q-.142*leg + (sign<0?-.08:.18)*q*k;
        const roll=-.21-.18*q+.10*Math.sin(q*3.1)+(sign<0?.05:-.04);
        const cy=Math.sin(roll),cz=Math.cos(roll);
        const trim=1-.67*smooth(k,.92,1)*smooth(t,.70,1);
        const width=.070+.365*Math.sin(q*Math.PI/2)**.71;
        for(let j=0;j<=cols;j++){
          const f=(2*j/cols-1)*trim;
          const gathers=(.011+.014*(1-q))*Math.cos(f*Math.PI*2+q*.91);
          const crown=(1-f*f)*(.016+.019*q)+gathers*(1-f*f);
          pos[ix++]=sign*x;
          pos[ix++]=y+cy*f*width*.5+cz*crown;
          pos[ix++]=z+cz*f*width*.5-cy*crown;
        }
      }
      geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();
    });
  }

  // A gathered wrap has a waisted profile and small diagonal folds at the knot.
  const knotGeometry=new THREE.BufferGeometry();
  {
    const pos=[],tex=[],idx=[],rows=16,cols=40;
    for(let i=0;i<=rows;i++){
      const u=i/rows,s=u*2-1;
      for(let j=0;j<=cols;j++){
        const a=j/cols*Math.PI*2;
        const lip=.84+.16*s*s+.043*Math.cos(5*a+s*2)+.022*Math.sin(8*a-s);
        pos.push(s*.132+.018*Math.sin(a-.35)*(1-s*s),
          .112*lip*Math.cos(a)+.016*s*Math.sin(a),.152*lip*Math.sin(a));
        tex.push(u,j/cols);
        if(i<rows&&j<cols){const n=i*(cols+1)+j;idx.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1)}
      }
    }
    for(const side of [0,rows]){
      const center=pos.length/3;pos.push(side? .132:-.132,0,0);tex.push(.50,.5);
      for(let j=0;j<cols;j++){
        const n=side*(cols+1)+j;
        if(side)idx.push(center,n,n+1);else idx.push(center,n+1,n);
      }
    }
    knotGeometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    knotGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(tex,2));knotGeometry.setIndex(idx);knotGeometry.computeVertexNormals();
  }
  const knot=mesh(bows,knotGeometry,silk,0,.15,.025);
  knot.name='Gathered center knot';knot.userData.ribbon=true;
  knot.rotation.set(.095,-.075,-.082);

  const straps=pivot(group,0,top,0);
  const names=['Front','Right','Rear','Left'];
  function addSurfaceBand(side,isTail=false){
    const half=side%2?width/2:depth/2;
    const axis=pivot(straps);
    axis.rotation.y=side*Math.PI/2;
    // Unroll the top, the rounded lid return and the wall into one arc length.
    // Every cloth edge travels on that exterior during its release, including the
    // instant when its center has cleared the lid and its outer hem has not.
    const clearance=isTail?(side===0?.100:.074):side%2?.037:.025;
    const bend=isTail?.096:.050, outer=half+.039+clearance;
    const bendStart=outer-bend,bendEnd=bendStart+bend*Math.PI/2;
    const endY=isTail?(side===0?-.59:-.46):-top+.025;
    const clothLength=bendEnd+clearance-bend-endY;
    const rows=100,cols=10,position=new Float32Array((rows+1)*(cols+1)*3),uv=[],indices=[];
    for(let i=0;i<=rows;i++){
      for(let j=0;j<=cols;j++){
        uv.push(j/cols,i/rows*clothLength*1.8);
        if(i<rows&&j<cols){const n=i*(cols+1)+j;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2)}
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(position,3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);
    const band=mesh(axis,geo,isTail?silk:strapSilk);
    band.name=names[side]+(isTail?' swallowtail':' wrap');band.userData.ribbon=true;
    band.castShadow=true;band.frustumCulled=false;
    const start=isTail?.100+side*.024:[.219,.143,.230,.151][side];
    const end=isTail?.351+side*.014:[.475,.410,.486,.418][side];
    let previous=-1;
    routedBands.push(progress=>{
      const k=smooth(progress,start,end);
      if(k===previous)return;
      previous=k;
      let j3=0;
      for(let i=0;i<=rows;i++){
        const t=i/rows,arch=Math.sin(Math.PI*t),flutter=Math.sin(Math.PI*k);
        const tailCurve=smooth(t,0,.76);
        const tailOffset=isTail?-(side===0?.70:.55)*tailCurve-.53*k*(1-tailCurve)+.056*Math.sin(t*8)*smooth(t,.25,.83):0;
        const bandWidth=isTail?.086+.217*smooth(t,0,.42):(side%2?.252:.298);
        for(let j=0;j<=cols;j++){
          const f=j/cols*2-1;
          const notch=isTail?.114*(1-Math.abs(f))*smooth(t,.84,1):0;
          const rest=t*clothLength-notch+(isTail?.072*f*arch:0);
          const target=bendEnd+.22+t*(isTail?.60:1.08);
          const arc=rest+(target-rest)*k;
          let z,y,ny,nz;
          if(arc<=bendStart){z=arc;y=clearance;ny=1;nz=0}
          else if(arc<bendEnd){
            const a=(arc-bendStart)/bend;
            ny=Math.cos(a);nz=Math.sin(a);z=bendStart+bend*nz;y=clearance-bend*(1-ny);
          }else{
            ny=0;nz=1;y=clearance-bend-(arc-bendEnd);
            z=outer-(isTail?.01:.035)*smooth(-y,.30,.49);
          }
          const folds=(1-f*f)*(isTail?.011+.008*Math.sin(arch*6+f*4):.003);
          const release=k*(.30+.18*arch+.040*f*Math.sin(t*6+side))+
            flutter*arch*(isTail?.16:.094);
          const outward=folds+release+(isTail?.034*Math.sin(t*9+side)**2*smooth(t,.53,.94):0);
          const sideways=(side%2?1:-1)*k*(.12+.19*arch)+flutter*.056*Math.sin(5*t+side);
          const x=tailOffset+f*bandWidth/2+sideways;
          position[j3++]=x;
          position[j3++]=y+ny*outward+k*(.24+.10*arch);
          position[j3++]=z+nz*outward;
        }
      }
      geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();
    });
  }
  for(let i=0;i<4;i++)addSurfaceBand(i);
  addSurfaceBand(0,true);addSurfaceBand(1,true);
  const stringMat=standard('lid',{color:0xc3a168,roughness:.52,metalness:.20});
  function cord(points){
    const path=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));
    mesh(lid,new THREE.TubeGeometry(path,24,.006,6,false),stringMat);
  }
  const tagX=.82, tagY=-.347, tagZ=depth/2+.14, eyeZ=depth/2+.049;
  mesh(lid,new THREE.TorusGeometry(.022,.005,6,20),lidGold,.74,-.09,eyeZ);
  cord([[.727,-.086,eyeZ+.003],[.73,-.152,eyeZ+.035],[.759,-.253,tagZ-.012],[tagX-.008,tagY+.006,tagZ+.017]]);
  cord([[.752,-.083,eyeZ+.004],[.782,-.148,eyeZ+.041],[.79,-.24,tagZ-.006],[tagX+.007,tagY+.004,tagZ+.018]]);
  const tag=pivot(lid,tagX,tagY,tagZ);
  const tagW=.53,tagH=.66,tagTop=.073,tagBottom=tagTop-tagH;
  const shape=new THREE.Shape();
  shape.moveTo(-tagW*.33,tagTop);shape.lineTo(tagW*.33,tagTop);
  shape.lineTo(tagW*.5,tagTop-.093);shape.lineTo(tagW*.5,tagBottom+.014);
  shape.quadraticCurveTo(tagW*.5,tagBottom,tagW*.5-.014,tagBottom);
  shape.lineTo(-tagW*.5+.014,tagBottom);shape.quadraticCurveTo(-tagW*.5,tagBottom,-tagW*.5,tagBottom+.014);
  shape.lineTo(-tagW*.5,tagTop-.093);shape.closePath();
  const hole=new THREE.Path();hole.absarc(0,0,.024,0,Math.PI*2,true);shape.holes.push(hole);
  const tagGeo=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:8});
  const tagPos=tagGeo.attributes.position,tagUV=tagGeo.attributes.uv;
  for(let i=0;i<tagPos.count;i++) tagUV.setXY(i,tagPos.getX(i)/tagW+.5,(tagPos.getY(i)-tagBottom)/tagH);
  mesh(tag,tagGeo,[standard('lid',{map:tagMap,side:THREE.DoubleSide,roughness:.89}),standard('lid',{color:0xc8ac7f,roughness:.85})]);
  mesh(tag,new THREE.TorusGeometry(.025,.005,5,18),lidGold,0,0,.017);
  // A small real twig tucked into the bow. Slender needles share a single buffer.
  const sprigGroup=pivot(lid,.055,.083,-.12);
  const needles=[],needleColors=[];
  const shoot=(origin,end,pairs)=>{
    const stem=new THREE.LineCurve3(origin,end);
    mesh(sprigGroup,new THREE.TubeGeometry(stem,1,.009,5,false),sprigBark);
    const direction=end.clone().sub(origin).normalize();
    const sideways=V(direction.z,0,-direction.x).normalize();
    for(let j=1;j<=pairs;j++){
      const u=j/(pairs+1),anchor=origin.clone().lerp(end,u);
      for(const sign of [-1,1]){
        const len=(.12+.05*rand())*(.35+.65*(1-u));
        const tip=anchor.clone().addScaledVector(sideways,sign*len).addScaledVector(direction,len*.76);
        tip.y+=.018+rand()*.045;
        const radius=.009*(1-u*.4);
        for(const p of [anchor.clone().addScaledVector(sideways,radius),tip,anchor.clone().addScaledVector(sideways,-radius)]){
          needles.push(p.x,p.y,p.z);
        }
        const shade=.35+rand()*.3;
        needleColors.push(.06,shade*.55,.15,.17,shade,.24,.07,shade*.59,.16);
      }
    }
  };
  const sprigBark=standard('lid',{color:0x78673b,roughness:.9});
  shoot(V(0,0,0),V(.38,.23,-.70),35);
  shoot(V(.13,.078,-.24),V(.46,.17,-.38),18);
  shoot(V(.19,.12,-.35),V(.16,.21,-.68),16);
  const needleGeo=new THREE.BufferGeometry();
  needleGeo.setAttribute('position',new THREE.Float32BufferAttribute(needles,3));
  needleGeo.setAttribute('color',new THREE.Float32BufferAttribute(needleColors,3));needleGeo.computeVertexNormals();
  mesh(sprigGroup,needleGeo,standard('lid',{vertexColors:true,side:THREE.DoubleSide,roughness:.85}));
  const berry=standard('lid',{color:0x9d2733,roughness:.27,metalness:.07});
  for(const [x,y,z,r] of [[.21,.14,-.28,.068],[.31,.12,-.24,.063],[.26,.19,-.36,.055]]) {
    mesh(sprigGroup,new THREE.SphereGeometry(r,14,10),berry,x,y,z);
  }

  function fade(set,opacity){
    const faded=opacity<.999;
    for(const mat of materialSets[set]){
      if(mat.transparent!==faded){mat.transparent=faded;mat.depthWrite=!faded;mat.needsUpdate=true}
      mat.opacity=opacity;
    }
  }
  function update({time=0,progress=0}={}){
    const p=Math.max(0,Math.min(1,progress));
    group.visible=p<.999;
    if(!group.visible)return;
    const loosen=smooth(p,.026,.307),lift=smooth(p,.505,.81),tilt=smooth(p,.559,.825);
    for(const unfurl of loops)unfurl(p);
    for(const move of routedBands)move(p);
    bows.position.y=top+.029+.359*smooth(p,.065,.226)+.045*Math.sin(loosen*Math.PI);
    bows.rotation.set(0,.037*loosen,.006*Math.sin(time*.95)*(1-loosen));
    const knotSize=1-.93*smooth(p,.077,.266);
    knot.scale.set(knotSize,knotSize*(1+.15*Math.sin(loosen*Math.PI)),knotSize);
    sprigGroup.rotation.z=-.16*Math.sin(lift*Math.PI);
    straps.visible=p<.50; bows.visible=p<.402;
    lid.visible=p<.865;
    lid.position.set(-.46*tilt,top+1.72*lift,-1.04*tilt);
    lid.rotation.set(-.67*tilt,.24*tilt,.18*tilt);
    tag.rotation.set(-.08-.30*Math.sin(lift*Math.PI),-.045+.09*lift,
      .12+.012*Math.sin(time*1.15)+.25*Math.sin(lift*Math.PI*2));
    for(let i=0;i<panels.length;i++){
      const v=smooth(p,.653+i*.014,.886+i*.016);
      panels[i].rotation.x=(Math.PI*.497)*v+.026*Math.sin(v*Math.PI*2);
    }
    fade('silk',1-smooth(p,.292,.402));fade('strap',1-smooth(p,.394,.50));
    fade('lid',1-smooth(p,.722,.865));fade('box',1-smooth(p,.856,.993));
  }
  update();
  return {group,update};
}
