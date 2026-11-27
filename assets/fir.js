/* Deterministic spruce geometry. All positions, foliage, bark, glass and light
   reflections are built at runtime; the renderer does not load any tree art. */
export function createFir(THREE) {
  const group = new THREE.Group();
  group.name = 'Winter spruce';
  const compact = globalThis.matchMedia?.('(max-width: 650px), (pointer: coarse)')?.matches === true;
  const tau = Math.PI * 2;
  let state = 0xdec025;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const range = (a, b) => a + (b - a) * random();
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const up = V(0, 1, 0);
  const tint = hex => new THREE.Color(hex);
  const uniforms = {
    uTime: {value: 0}, uGrow: {value: 1}, uScatter: {value: 0},
    uLight: {value: 1}, uAim: {value: new THREE.Vector2()},
    uPixels: {value: 800}, uFrost:{value:0}
  };
  const declarations = `
    uniform float uTime, uGrow, uScatter, uLight, uPixels, uFrost;
    uniform vec2 uAim;
    float rimLight(float y) {
      return smoothstep(y / 5.27 - .045, y / 5.27 + .045, uLight * 1.15 - .06);
    }
    float seedHash(float a){return fract(sin(a * 93.785 + 1.23) * 13758.545);}
    vec3 orbit(vec3 p, float k) {
      if (uScatter < .0001) return p;
      float r = .04 + 3.24 * pow(k,.74);
      float s = seedHash(k + .11);
      float angle = 1.5707963 * floor(s * 4.) + r * 1.65
                  + (seedHash(k + .36) - .5) * (k>.93?2.6:.66) + uTime * (.105 + .07 / (r+.35));
      float ca = cos(angle), sa = sin(angle);
      float flutter = (seedHash(k + .93) - .5) * (.16 + r * .088);
      vec3 galaxy = vec3(ca*r, 2.64 + sa*r*.40 + ca*r*.18 + flutter, sa*r*.75);
      galaxy.xy += uAim * vec2(.65,.53) * (.45 + .55*k);
      vec3 path = mix(p, galaxy, uScatter);
      float arc = sin(uScatter * 3.14159265);
      path += vec3(sin(angle + uScatter*3.)*.26, .45 + .32*k, cos(angle)*.28) * arc;
      return path;
    }`;
  const output = `
    #include <tonemapping_fragment>
    #include <colorspace_fragment>`;
  const shader = (vertexShader, fragmentShader, options = {}) =>
    new THREE.ShaderMaterial({uniforms, vertexShader: declarations + vertexShader, fragmentShader, ...options});
  const attr = (data, count) => new THREE.Float32BufferAttribute(data, count);
  const inst = (data, count) => new THREE.InstancedBufferAttribute(new Float32Array(data), count);
  const srgb = color => [color.r, color.g, color.b];
  const bark = {positions: [], normals: [], colors: [], births: [], origins: [], indices: []};
  const ribbons = {positions: [], normals: [], colors: [], births: [], origins: [], indices: []};
  const needles = {roots: [], axes: [], widths: [], colors: [], meta: []};
  const dust = {positions: [], meta: [], colors: []};
  const bulbs = {positions: [], meta: [], colors: []};
  const sphereData = {positions: [], radii: [], colors: [], meta: []};
  const foliageColors = ['#214733','#365738','#355b40','#294a37','#455e39','#294532','#557655'].map(tint);
  const frost = tint('#b6c6b8');
  const barkBase = tint('#573b23'), stemBase = tint('#3a3922');
  const gold = tint('#b58a41'), red = tint('#932326');
  const twigTipOptions = [];

  function tube(target, points, radii, color, births, sides = 5, groove = false) {
    const offset = target.positions.length / 3;
    const first = points[0];
    let frame = Math.abs(points.at(-1).clone().sub(first).normalize().dot(up)) > .88 ? V(1,0,0) : up;
    const ridge = Array.from({length: sides}, (_, i) => groove ? range(.80,1.16) * (.97+.09*Math.cos(i*1.4)) : 1);
    for (let j = 0; j < points.length; j++) {
      const axis = points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();
      const right = V().crossVectors(axis,frame).normalize();
      frame = V().crossVectors(right,axis).normalize();
      for (let k=0;k<sides;k++) {
        const az = k/sides*tau, normal=right.clone().multiplyScalar(Math.cos(az)).addScaledVector(frame,Math.sin(az));
        const pos=points[j].clone().addScaledVector(normal,radii[j]*ridge[k]);
        const shade = groove ? (.56+.58*ridge[k]*((k%3)+1)/3+random()*.15) : .9+.12*Math.sin(k*4.1);
        target.positions.push(pos.x,pos.y,pos.z); target.normals.push(normal.x,normal.y,normal.z);
        target.colors.push(color.r*shade,color.g*shade,color.b*shade);
        target.births.push(births[j]);target.origins.push(first.x,first.y,first.z);
        if (j+1 < points.length) {
          const a=offset+j*sides+k,b=offset+j*sides+(k+1)%sides;
          target.indices.push(a,b,a+sides,b,b+sides,a+sides);
        }
      }
    }
  }

  const trunk=[],trunkR=[],trunkB=[];
  for(let i=0;i<=32;i++){
    const t=i/32;
    trunk.push(V(Math.sin(t*12)*.018*t,4.79*t,Math.sin(t*8)*.029*t));
    trunkR.push(.007+.093*(1-t)**1.13+.045*Math.exp(-t*48));
    trunkB.push(t*.57);
  }
  tube(bark,trunk,trunkR,barkBase,trunkB,18,true);

  function particle(target, pos, size, seed, birth, color) {
    target.positions.push(pos.x,pos.y,pos.z);target.meta.push(size,seed,birth);
    target.colors.push(...srgb(color));
  }
  function needle(pos, direction, width, breadth, birth, density, frosted) {
    const variant=foliageColors[Math.floor(random()*foliageColors.length)].clone();
    const light=.16+.82*density**1.6+.17*Math.max(0,pos.x*-.42+pos.z*.22);
    variant.multiplyScalar(light*range(.78,1.23));
    if(frosted)variant.lerp(frost,range(.16,.51));
    const seed=random();
    needles.roots.push(pos.x,pos.y,pos.z); needles.axes.push(direction.x,direction.y,direction.z);
    needles.widths.push(width.x*breadth,width.y*breadth,width.z*breadth);
    needles.colors.push(...srgb(variant)); needles.meta.push(birth,seed);
    if(random()<.057) {
      const shade=random();
      const c = tint(shade<.72?'#ffd28c':shade<.84?'#fff3cc':shade<.94?'#a9dbdc':'#ef947b');
      particle(dust,pos,range(.006,.024)*(random()<.045?2.5:1),seed,birth,c);
    }
  }
  function sprig(base, direction, span, phase, birth, tipness, frosted, relativeDensity=1) {
    const tangent=direction.clone().normalize();
    const side=V().crossVectors(tangent,up);
    if(side.lengthSq()<.001)side.set(1,0,0);else side.normalize();
    const above=V().crossVectors(side,tangent).normalize();
    const bend=range(.11,.27)*span;
    const count=Math.max(5, Math.floor((span*35+3)*relativeDensity));
    const point=t=>base.clone().addScaledVector(tangent,span*t).addScaledVector(above,bend*t*t);
    if(!compact || span>.22)
      tube(bark,[base,point(.6),point(1)],[.0065,.0038,.0014],stemBase,[birth,birth+.012,birth+.024],3);
    for(let k=0;k<count;k++){
      const t=(k+.24)/count;
      const center=point(t);
      for(let s=-1;s<=1;s+=2){
        const roll=phase+range(-.38,.38);
        const fan=side.clone().multiplyScalar(s*Math.cos(roll)).addScaledVector(above,s*Math.sin(roll)+range(-.26,.31));
        const axis=fan.addScaledVector(tangent,range(.35,1.28)+t*.36).normalize();
        const length=range(.066,.132)*(.89+.17*tipness)*(1-.46*t*t);
        const widthVec=V().crossVectors(axis,above);
        if(widthVec.lengthSq()<.001)widthVec.copy(side);else widthVec.normalize();
        const rooted=center.clone().addScaledVector(above,range(-.004,.004));
        needle(rooted,axis.multiplyScalar(length),widthVec,range(.0064,.0105),
          birth+t*.026,tipness, frosted && t>.43 && random()<.39);
      }
      if(k%3===0){
        const axis=above.clone().multiplyScalar(range(.45,.85)).addScaledVector(tangent,range(.5,1)).addScaledVector(side,range(-.55,.55)).normalize();
        needle(center,axis.multiplyScalar(range(.038,.078)),side,range(.004,.0067),birth+.021*t,tipness,frosted&&random()<.2);
      }
    }
  }

  const tiers=16;
  for(let layer=0;layer<tiers;layer++){
    const l=layer/(tiers-1);
    const rootY=1.17+3.50*l;
    const arms=Math.round(10.2-5.4*l);
    const offset=layer*2.399963;
    for(let arm=0;arm<arms;arm++){
      const angle=offset+tau*(arm+range(-.21,.21))/arms;
      const radial=V(Math.cos(angle),0,Math.sin(angle));
      const side=V(-radial.z,0,radial.x);
      const branchLength=(1.55*(1-l)**.84+.088)*range(.88,1.15)*(layer%3===1?.80:1);
      const y0=rootY+range(-.062,.062)*(1-l*.6);
      const birth=.047+y0/4.9*.641;
      const droop=(.105+.255*(1-l))*range(.69,1.16);
      const sweep=range(-.14,.14);
      function mainAt(t){
        return radial.clone().multiplyScalar(t*branchLength)
          .addScaledVector(side, sweep*branchLength*t*t)
          .addScaledVector(up,y0+(.08+.15*l)*t-droop*Math.sin(t*2.27)+.095*t*t);
      }
      const spine=Array.from({length:7},(_,i)=>mainAt(i/6));
      tube(bark,spine,spine.map((_,i)=>.002+(.014+branchLength*.013)*(1-i/6)),
        barkBase,spine.map((_,i)=>birth+i/6*.044),5);
      const fans=Math.max(4,Math.round(4+3.8*branchLength));
      for(let k=0;k<fans;k++){
        const along=.105+.87*(k+.35)/fans;
        for(const sign of [-1,1]){
          const root=mainAt(Math.max(.03,along+range(-.023,.023)));
          const feather=(.22+.36*branchLength)*(1-along*.67)*range(.76,1.14);
          const shoot=side.clone().multiplyScalar(sign*range(.6,.99))
            .addScaledVector(radial,.51+along*.31).addScaledVector(up,range(-.54,.105)+l*.14).normalize();
          const fresh=layer%4===2 && random()<.23 && along>.43;
          const since=birth+.039*along;
          sprig(root,shoot,feather,range(-.45,.45),since,.15+along*.92,fresh);
          if(feather>.145){
            const children=feather>.35?3:1;
            for(let j=0;j<children;j++){
              const walk=(j+1)/(children+1);
              const location=root.clone().addScaledVector(shoot,walk*feather).addScaledVector(up,.15*feather*walk*walk);
              const offshoot=shoot.clone().multiplyScalar(.60).addScaledVector(radial,j%2===0?.82:-.45)
                .addScaledVector(side,sign*range(-.45,.42)).addScaledVector(up,range(-.5,.43)).normalize();
              sprig(location,offshoot,feather*(1-walk*.54)*range(.29,.57),
                range(-.7,.7),since+walk*.024,.16+along*.85+walk*.1,fresh,.84);
            }
          }
        }
      }
      sprig(mainAt(.76),radial.clone().addScaledVector(up,.51+l*.44),.26*branchLength+.05,
        range(-.4,.4),birth+.034,.96,false);
      if(layer<tiers-1) {
        const pos=mainAt(range(.82,.99));
        twigTipOptions.push({pos,angle,l,seed:random()});
      }
    }
  }
  // A fresh upright leader and its small ascending shoots close the crown naturally.
  for(let i=0;i<21;i++){
    const y=4.42+i*.016,theta=i*2.39996;
    sprig(V(.005,y,.007),V(Math.cos(theta)*.44,1,Math.sin(theta)*.44),
      .105+(1-i/21)*.08,theta,.67+i*.001,.9,false);
  }

  const matteShader=shader(`
    attribute vec3 firColor, aOrigin;
    attribute float aBirth;
    varying vec3 vC, vN, vView, vLocal;
    varying float vLamp;
    void main(){
      float form=smoothstep(aBirth,aBirth+.10,uGrow);
      vec3 p=mix(aOrigin,position,form);
      float leave=smoothstep(.012,.52,uScatter);
      p=mix(p,aOrigin,leave);
      vC=firColor;vN=normalize(mat3(modelMatrix)*normal);vLocal=position;
      vLamp=rimLight(position.y);vView=cameraPosition-(modelMatrix*vec4(p,1.)).xyz;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    }`,`
    varying vec3 vC,vN,vView,vLocal;varying float vLamp;
    void main(){
      vec3 n=normalize(vN);
      float key=.63+.4*dot(n,normalize(vec3(-.75,.9,.72)));
      float rim=pow(1.-abs(dot(normalize(vView),n)),3.);
      float angle=atan(vLocal.z,vLocal.x);
      float ridge=cos(29.*angle+sin(7.*vLocal.y+2.9*sin(angle*6.))+sin(vLocal.y*18.+angle*4.)*.54);
      float fine=cos(59.*angle+vLocal.y*1.8+sin(angle*7.+vLocal.y*25.));
      float bark=.89+.12*fine-.35*smoothstep(.24,.94,ridge)+.16*smoothstep(.50,.92,-ridge);
      float grain=mix(1.,bark,1.-smoothstep(.111,.145,length(vLocal.xz)));
      gl_FragColor=vec4((vC*(vec3(.70,.80,.88)+vec3(1.,.81,.62)*key*.8+vLamp*.15)+rim*vC*.35)*grain,1.);
      ${output}
    }`,{side:THREE.DoubleSide});
  function meshFromParts(parts,material){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',attr(parts.positions,3));g.setAttribute('normal',attr(parts.normals,3));
    g.setAttribute('aOrigin',attr(parts.origins,3));g.setAttribute('aBirth',attr(parts.births,1));
    g.setAttribute('firColor',attr(parts.colors,3));g.setIndex(parts.indices);
    const mesh=new THREE.Mesh(g,material);mesh.frustumCulled=false;group.add(mesh);return mesh;
  }
  const leafGeo=new THREE.InstancedBufferGeometry();
  leafGeo.setAttribute('position',attr([-.35,0,0,-1,.25,0,1,.23,.36,0,1,0],3));
  leafGeo.setIndex([0,1,2,1,3,2]);
  // Drop alternate needles across the whole crown for small viewports, keeping
  // branch outlines and ornament placement intact at that pixel density.
  function leafAttribute(data,components) {
    if(!compact)return inst(data,components);
    const count=Math.ceil(data.length/components/2);
    const subset=new Float32Array(count*components);
    for(let i=0;i<count;i++)for(let c=0;c<components;c++)subset[i*components+c]=data[i*components*2+c];
    return new THREE.InstancedBufferAttribute(subset,components);
  }
  leafGeo.setAttribute('aRoot',leafAttribute(needles.roots,3));
  leafGeo.setAttribute('aAxis',leafAttribute(needles.axes,3));leafGeo.setAttribute('aWidth',leafAttribute(needles.widths,3));
  leafGeo.setAttribute('aColor',leafAttribute(needles.colors,3));leafGeo.setAttribute('aMeta',leafAttribute(needles.meta,2));
  leafGeo.instanceCount=leafGeo.attributes.aMeta.count;
  const leafMat=shader(`
    attribute vec3 aRoot,aAxis,aWidth,aColor;attribute vec2 aMeta;
    varying vec3 vColor;
    void main(){
      float leaf=smoothstep(aMeta.x,aMeta.x+.089,uGrow);
      vec3 axis=normalize(aAxis),rib=normalize(cross(axis,aWidth));
      float departure=smoothstep(.0,.76,uScatter);
      float intact=leaf*(1.-departure);
      vec3 delta=aWidth*position.x+aAxis*position.y+rib*length(aWidth)*position.z;
      vec3 p=orbit(aRoot,aMeta.y)+delta*intact;
      p.x+=sin(uTime*.66+aRoot.y*1.56)*.010*length(aRoot.xz)*intact;
      vec3 n=normalize(rib+normalize(aWidth)*position.x*.7);
      float sideLight=.51+.63*abs(dot(n,normalize(vec3(-.6,.9,.35))));
      float edge=.78+.26*position.y+.13*position.z;
      float bulb=rimLight(aRoot.y);
      float outer=clamp(length(aRoot.xz)/max(.1,1.72*pow(clamp((4.85-aRoot.y)/3.75,0.,1.),.82)),0.,1.);
      float front=dot(normalize(aRoot.xz+vec2(.001)),normalize(vec2(-.66,.85)))*.5+.5;
      float ambient=.23+.63*outer*outer+.22*front;
      float lampPath=(aRoot.y-.99)/3.72*39.58+.82-atan(aRoot.z,aRoot.x);
      float warm=pow(max(0.,cos(lampPath)),10.)*outer*outer*bulb;
      vColor=aColor*sideLight*edge*ambient*(vec3(.80,.93,.96)+bulb*vec3(.35,.23,.10)+warm*vec3(1.7,.72,.13));
      if(uFrost>.001){
        float pocket=sin(aRoot.x*7.+aRoot.y*5.)*.24+cos(aRoot.z*10.-aRoot.y*9.)*.18;
        float exposed=outer*.54+axis.y*.24+pocket+aMeta.y*.15;
        float snowCap=smoothstep(.94-uFrost*.58,1.13-uFrost*.52,exposed)*uFrost;
        vec3 ice=vec3(.38,.48,.58)*(.67+.30*sideLight)+vec3(.30,.15,.044)*warm;
        vColor=mix(vColor,ice,snowCap*(.67+.26*position.y));
      }
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
    }`,`
    varying vec3 vColor;
    void main(){gl_FragColor=vec4(vColor,1.);${output}
    }`,{side:THREE.DoubleSide,forceSinglePass:true});
  const foliage=new THREE.Mesh(leafGeo,leafMat);foliage.frustumCulled=false;group.add(foliage);

  function ornament(pos,radius,kind,seed) {
    const palette=['#a30c22','#c4963e','#dfc585','#714524','#ecdac2'];
    sphereData.positions.push(pos.x,pos.y,pos.z);sphereData.radii.push(radius);
    sphereData.colors.push(...srgb(tint(palette[kind])));sphereData.meta.push(seed,.65+.185*pos.y/4.9,kind);
    const cap=pos.clone().addScaledVector(up,radius*.93);
    tube(bark,[cap,cap.clone().addScaledVector(up,radius*.18)],[radius*.24,radius*.23],gold,
      [.65+.185*pos.y/4.9,.66+.185*pos.y/4.9],9);
  }
  function addBow(pos,angle,size,birth){
    const xAxis=V(-Math.sin(angle),0,Math.cos(angle));
    const out=V(Math.cos(angle),0,Math.sin(angle));
    const world=(x,y,z)=>pos.clone().addScaledVector(xAxis,x*size).addScaledVector(up,y*size).addScaledVector(out,z*size);
    const bowRed=red.clone().multiplyScalar(range(1.1,1.8));
    function band(fn,n){
      const offset=ribbons.positions.length/3;
      for(let i=0;i<=n;i++){
        const t=i/n;
        for(const s of [-1,1]){
          const p=fn(t,s),next=fn(Math.min(1,t+.002),s),prev=fn(Math.max(0,t-.002),s);
          const normal=V().crossVectors(next.sub(prev),fn(t,1).sub(fn(t,-1))).normalize();
          ribbons.positions.push(p.x,p.y,p.z);ribbons.normals.push(normal.x,normal.y,normal.z);
          const sheen=.66+.6*Math.abs(Math.sin(t*3.7));
          ribbons.colors.push(bowRed.r*sheen,bowRed.g*sheen,bowRed.b*sheen);
          ribbons.origins.push(pos.x,pos.y,pos.z);ribbons.births.push(birth);
        }
        if(i<n){const k=offset+i*2;ribbons.indices.push(k,k+1,k+2,k+2,k+1,k+3)}
      }
    }
    for(const s of [-1,1]){
      band((t,e)=>world(s*(.08+Math.sin(t*Math.PI)*.97),Math.sin(t*tau)*.32+e*(.075+.12*Math.sin(t*Math.PI)),.06+Math.sin(t*Math.PI)*.23+Math.cos(t*tau)*.14+e*.035),14);
      band((t,e)=>world(s*(.07+.40*t+Math.sin(t*6)*.065)+e*.105,-t*(s===1?1.24:1.05)+e*t*t*.095,.05+.11*Math.sin(t*6)+t*.04),10);
    }
    tube(ribbons,[world(-.11,0,.18),world(.11,0,.18)],[size*.147,size*.15],bowRed,[birth,birth],9);
  }
  const occupied=[];
  twigTipOptions.sort((a,b)=>a.seed-b.seed);
  let bows=0;
  for(const tip of twigTipOptions){
    const r=range(.072,.122)*(1-.40*tip.l);
    const pos=tip.pos.clone().addScaledVector(up,-r*range(1.02,1.62));
    if(occupied.some(v=>v.distanceToSquared(pos)<(.24-tip.l*.11)**2))continue;
    if(occupied.length>=62)break;
    occupied.push(pos);
    const choose=random();
    if(choose<.15 && tip.l<.92 && bows<10){
      addBow(pos,tip.angle,range(.13,.175)*(1-.24*tip.l),.68+.17*tip.l);
      bows++;
    }else{
      const kind=choose<.52?0:choose<.75?1:choose<.88?2:choose<.94?3:4;
      ornament(pos,r,kind,random());
      tube(bark,[tip.pos,pos.clone().addScaledVector(up,r)],[.0022,.002],gold,[.66+.17*tip.l,.68+.17*tip.l],3);
    }
  }
  // The wire and tiny bulbs follow the branches in a slightly uneven helical swag.
  const wire=[],wireR=[],wireBirth=[];
  for(let i=0;i<=440;i++){
    const u=i/440;
    const a=u*tau*6.3+.82;
    const radius=(1.61*(1-u)**.79+.03)*(1+.037*Math.sin(5*a+.7)+.022*Math.cos(2*a));
    const y=1.02+3.66*u-(1-u)*.16*(1-Math.cos(a*2.6))*.5;
    const p=V(Math.cos(a)*radius,y,Math.sin(a)*radius);
    wire.push(p);wireR.push(.0044*(1-u*.45));wireBirth.push(.70+.16*u);
    if(i%2===0 && u<.99){
      const c = tint(i%7===0?'#ffeac0':i%3===0?'#ffbc61':'#ffd98e');
      particle(bulbs,p,range(.157,.28)*(1-u*.25),random(),.72+.14*u,c);
    }
  }
  tube(bark,wire,wireR,tint('#9a7435'),wireBirth,4);
  for(let i=0;i<235;i++){
    const n=Math.floor(random()*needles.meta.length/2);
    const p=V(...needles.roots.slice(n*3,n*3+3));
    particle(bulbs,p,range(.060,.148),random(),.73+.145*p.y/5,tint(random()>.18?'#ffcd81':'#ffefcf'));
  }
  const woodwork=meshFromParts(bark,matteShader);
  const bowsMesh=meshFromParts(ribbons,matteShader);

  const unitSphere=new THREE.SphereGeometry(1,21,14);
  const glassGeo=new THREE.InstancedBufferGeometry();
  glassGeo.index=unitSphere.index;glassGeo.attributes.position=unitSphere.attributes.position;
  glassGeo.attributes.normal=unitSphere.attributes.normal;glassGeo.attributes.uv=unitSphere.attributes.uv;
  glassGeo.setAttribute('aCenter',inst(sphereData.positions,3));
  glassGeo.setAttribute('aRadius',inst(sphereData.radii,1));glassGeo.setAttribute('aColor',inst(sphereData.colors,3));
  glassGeo.setAttribute('aMeta',inst(sphereData.meta,3));glassGeo.instanceCount=sphereData.radii.length;
  const glassMat=shader(`
    attribute vec3 aCenter,aColor,aMeta;attribute float aRadius;
    varying vec3 vN,vEye,vC;varying vec2 vUV;varying float vSeed,vKind,vLamp;
    void main(){
      float s=smoothstep(aMeta.y,aMeta.y+.076,uGrow)*(1.-smoothstep(.012,.64,uScatter));
      vec3 p=orbit(aCenter,aMeta.x)+position*aRadius*s;
      vec3 world=(modelMatrix*vec4(p,1.)).xyz;
      vEye=cameraPosition-world;vN=mat3(modelMatrix)*normal;vC=aColor;vUV=uv;
      vSeed=aMeta.x;vKind=aMeta.z;vLamp=rimLight(aCenter.y);
      gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
    }`,`
    varying vec3 vN,vEye,vC;varying vec2 vUV;varying float vSeed,vKind,vLamp;
    void main(){
      vec3 n=normalize(vN),v=normalize(vEye);
      if(vKind>1.5 && vKind<2.5){n=normalize(n+vec3(cos(vUV.x*112.)*.045,0.,sin(vUV.x*112.)*.045));}
      vec3 r=reflect(-v,n);
      r.y+=.095*sin(atan(r.x,r.z)*3.+vSeed*3.);
      float horizon=smoothstep(-.26,.31,r.y);
      vec3 env=mix(vec3(.14,.12,.085),vec3(.20,.27,.26),horizon);
      env*=.08+.92*smoothstep(-.10,.11,abs(r.y)-.36+.064*sin(atan(r.x,r.z)*19.));
      float key=max(dot(n,normalize(vec3(-.63,.86,.86))),0.);
      float fres=pow(1.-max(dot(n,v),0.),3.);
      vec3 c=vC*(.088+key*1.108)*(vec3(.24)+env*3.2)+env*(vKind<.5?.09:.32)+fres*env*.48;
      float pane=exp(-22.*pow((r.x+.56)*1.45,2.)-24.*pow(r.y-.55,2.))*smoothstep(-.28,.42,r.z);
      pane*=.60+.4*smoothstep(.027,.042,abs(r.x+.53));
      c+=vec3(.95,.78,.55)*pane*1.7;
      c+=vec3(1.,.91,.69)*pow(max(0.,dot(r,normalize(vec3(-.37,.71,.61)))),148.)*2.1;
      c+=vLamp*vec3(1.,.59,.20)*pow(max(0.,dot(r,normalize(vec3(.78,-.31,.45)))),194.)*1.7;
      if(vKind>3.5 || (vKind>.5 && vKind<1.5 && vSeed>.61)){
        float band=abs(abs(vUV.y-.50)-.129-.027*cos(vUV.x*37.70));
        float line=1.-smoothstep(.003,.003+max(.004,fwidth(band)),band);
        c=mix(c,vec3(.69,.45,.16)*(.3+.8*key)+pane*.4,line*.80);
      }
      gl_FragColor=vec4(c,1.);${output}
    }`);
  const baubles=new THREE.Mesh(glassGeo,glassMat);baubles.frustumCulled=false;group.add(baubles);

  const starY=4.95;
  const starGeom=new THREE.BufferGeometry(),starVerts=[],starColors=[];
  const outline=[];
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+Math.PI/2,r=i%2?.109:.265;
    outline.push(V(Math.cos(a)*r,Math.sin(a)*r,0));
  }
  for(let i=0;i<10;i++)for(const face of [-1,1]){
    const a=outline[i],b=outline[(i+1)%10],c=V(0,0,face*.080);
    const col=tint((i+(face===1?0:1))%2?'#edb653':'#fff0a6');
    for(const p of [c,a,b]){starVerts.push(p.x,p.y,p.z);starColors.push(col.r,col.g,col.b)}
  }
  starGeom.setAttribute('position',attr(starVerts,3));starGeom.setAttribute('color',attr(starColors,3));
  const starMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false});
  const topStar=new THREE.Mesh(starGeom,starMat);topStar.position.y=starY;group.add(topStar);
  particle(bulbs,V(0,starY,.10),.64,.72,.91,tint('#ffdb83'));

  function points(data,galaxy){
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',attr(data.positions,3));geom.setAttribute('aMeta',attr(data.meta,3));
    geom.setAttribute('aColor',attr(data.colors,3));
    const mat=shader(`
      attribute vec3 aMeta,aColor;
      varying vec3 vColor;varying float vA,vSize;
      void main(){
        float grown=smoothstep(aMeta.z,aMeta.z+.065,uGrow);
        vec3 p=orbit(position,aMeta.y);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        float size=aMeta.x * uPixels * projectionMatrix[1][1]/max(1.,-2.*mv.z);
        float flick=.85+.15*sin(uTime*(1.+aMeta.y)+aMeta.y*230.);
        vColor=aColor;
        ${galaxy ? `
        vA=grown*smoothstep(.035,.53,uScatter)*(.37+.63*flick);
        gl_PointSize=clamp(size*(1.+vA*.72),1.5,22.);
        ` : `
        float lit=rimLight(position.y);
        vA=grown*(1.-smoothstep(.10,.92,uScatter))*(.045+lit*.955)*flick;
        gl_PointSize=clamp(size*(.30+.70*lit),1.3,110.);
        `}
        vSize=gl_PointSize;
        gl_Position=projectionMatrix*mv;
      }`,`
      varying vec3 vColor;varying float vA,vSize;
      void main(){
        vec2 uv=gl_PointCoord*2.-1.;
        float d=length(uv);
        if(d>=1. || vA<.006)discard;
        float halo=exp(-d*3.35)*(1.-d);
        float core=${galaxy?'exp(-d*d*8.5)':'exp(-d*d*69.)'};
        float ray=pow(max(0.,1.-min(abs(uv.x),abs(uv.y))*28.),2.)*pow(1.-d,3.)*.22;
        vec3 c=mix(vColor,vec3(1.,.94,.77),core*${galaxy?'.27':'.79'});
        gl_FragColor=vec4(c*(1.+.6*core),vA*(.61*halo+core+ray));
        ${output}
      }`,{transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const cloud=new THREE.Points(geom,mat);cloud.frustumCulled=false;cloud.renderOrder=galaxy?4:3;
    group.add(cloud);return cloud;
  }
  const twinkles=points(bulbs,false),stream=points(dust,true);
  const dims=new THREE.Vector2();
  function resolution(renderer){
    uniforms.uPixels.value=renderer.getRenderTarget()?.height ?? renderer.getDrawingBufferSize(dims).y;
  }
  twinkles.onBeforeRender=resolution;stream.onBeforeRender=resolution;

  const clamp=x=>Math.max(0,Math.min(1,x));
  function update({time=0,growth=1,scatter=0,light=1,frost=0,aimX=0,aimY=0}={}){
    uniforms.uTime.value=time;uniforms.uGrow.value=clamp(growth);
    uniforms.uScatter.value=clamp(scatter);uniforms.uLight.value=clamp(light);uniforms.uFrost.value=clamp(frost);
    uniforms.uAim.value.set(aimX,aimY);
    group.visible=growth>.001;
    stream.visible=scatter>.034;foliage.visible=scatter<.755;
    baubles.visible=scatter<.64;
    woodwork.visible=bowsMesh.visible=scatter<.52;
    const size=THREE.MathUtils.smoothstep(growth,.875,.987)*(1-THREE.MathUtils.smoothstep(scatter,0,.55));
    topStar.visible=size>.0005;topStar.scale.setScalar(Math.max(.0001,size));
    topStar.rotation.y=.12+Math.sin(time*.45)*.10;
    topStar.material.color.setScalar(.51+.49*THREE.MathUtils.smoothstep(light,.88,1));
  }
  update();
  return {group,update,starY,height:5.215};
}
