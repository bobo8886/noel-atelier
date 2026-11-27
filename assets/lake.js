// The entire horizon wraps around the gift. The sky is drawn once and the
// water reuses a small, periodically refreshed view from beneath its surface.
const TAU = Math.PI * 2;
const surfaceY = -.20;

function generator(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function eveningSky(T) {
  const atlas = document.createElement('canvas');
  const w = atlas.width = 4096, h = atlas.height = 1024;
  const ctx = atlas.getContext('2d'), rand = generator(122506);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0,'#070b17');
  const lowerSky = y => .55 + .45*y;
  [[0, '#080e20'], [.34, '#111529'], [.57, '#242039'], [.72, '#4a2b45'],
   [.80, '#704255'], [.87, '#5c3e52'], [1, '#242735']].forEach(([at, color]) => sky.addColorStop(lowerSky(at), color));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 150; i++) {
    const x = rand() * w, r = 8 + rand() ** 2 * 96;
    const y = h * lowerSky(.35 + .17 * Math.sin(x / w * TAU * 2) + (rand() - .5) * .16);
    for (const offset of [-w, 0, w]) {
      if (x + offset + r < 0 || x + offset - r > w) continue;
      const cloud = ctx.createRadialGradient(x + offset, y, 0, x + offset, y, r);
      cloud.addColorStop(0, i % 3 ? '#b888ac0a' : '#7893cf0d'); cloud.addColorStop(1, '#889ac400');
      ctx.fillStyle = cloud; ctx.fillRect(x + offset - r, y - r, r * 2, r * 2);
    }
  }
  for (let i = 0; i < 16600; i++) {
    const x = rand() * w;
    const y = i % 4 ? rand()*h*.92 : h*lowerSky(.35+.17*Math.sin(x/w*TAU*2)+(rand()+rand()-1)*.16);
    const mag = rand() ** 5, r = .25 + mag * .83;
    ctx.fillStyle = i % 8 ? '#e2dfef' : '#ffdbb7';
    ctx.globalAlpha = (.17+.65*mag)*(1-Math.max(0,(y/h-lowerSky(.57))/.45)*2.9);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    if (mag > .987) {
      ctx.globalAlpha *= .45; ctx.fillRect(x - 2.3, y - .3, 4.6, .6); ctx.fillRect(x - .3, y - 2.3, .6, 4.6);
    }
  }
  const texture = new T.CanvasTexture(atlas);
  texture.wrapS = T.RepeatWrapping; texture.colorSpace = T.SRGBColorSpace;
  const dome=new T.CylinderGeometry(56,56,82,88,1,true);
  const skyMesh = new T.Mesh(dome,
    new T.MeshBasicMaterial({map:texture, side:T.BackSide, transparent:true, depthWrite:false, toneMapped:false}));
  skyMesh.position.y = 34.5; skyMesh.renderOrder = -12;
  return skyMesh;
}

function shoreline(T, band) {
  const positions = [], colors = [], indices = [];
  const high = new T.Color(['#594153','#423445','#302b3b'][band]);
  const low = new T.Color(['#3a3040','#2e2838','#232534'][band]);
  const radius = 48 - band * 7, nodes = 644;
  const ridge = a => .46 + .26 * Math.sin(a * 3 + band) + .19 * Math.cos(a * 8 + band * 2)
    + .14 * Math.sin(a * 17 + .5 * Math.cos(a * 5)) + .08 * Math.sin(a * 37 + band);
  for (let i = 0; i <= nodes; i++) {
    const a = i / nodes * TAU, r = radius + 1.2 * Math.sin(a * 5 + band);
    const top = .22 + (2.8 - .72 * band) * ridge(a) + .055 * Math.sin(a * 116 + band);
    const x = r * Math.cos(a), z = r * Math.sin(a);
    positions.push(x, top, z, x, surfaceY - .32, z);
    colors.push(high.r,high.g,high.b,low.r,low.g,low.b);
    if (i) {const n = i * 2; indices.push(n-2,n-1,n,n,n-1,n+1);}
  }
  const g = new T.BufferGeometry(); g.setIndex(indices);
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const mesh = new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide,vertexColors:true,transparent:true,depthWrite:false,toneMapped:false}));
  mesh.renderOrder = -11 + band;
  return mesh;
}

// Small, irregular stands sit on the far shore. Their trunks converge at
// different depths, so an orbit brings new silhouettes across the horizon.
function distantFirs(T) {
  const rand=generator(1198), vertices=[], shades=[];
  for(let grove=0;grove<82;grove++){
    const center=rand()*TAU, count=4+Math.floor(rand()*17), spread=.016+rand()*.09;
    const dark=new T.Color().setHSL(.72+rand()*.035,.115,.145+rand()*.027,T.SRGBColorSpace);
    for(let j=0;j<count;j++){
      const a=center+(rand()-.5)*spread*2, r=29+rand()*2.6;
      const x=r*Math.cos(a),z=r*Math.sin(a);
      const height=.27+rand()**1.4*.88, width=height*(.13+rand()*.07), foot=-.08+rand()*.08;
      const dx=-Math.sin(a)*width,dz=Math.cos(a)*width;
      for(let k=0;k<3;k++){
        const u=k*.25, span=1-k*.24;
        vertices.push(x,foot+height*(.61+u*.78),z,x-dx*span,foot+height*u,z-dz*span,x+dx*span,foot+height*u,z+dz*span);
        for(let v=0;v<3;v++)shades.push(dark.r,dark.g,dark.b);
      }
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  g.setAttribute('color',new T.Float32BufferAttribute(shades,3));
  const trees=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,depthWrite:false,toneMapped:false}));
  trees.renderOrder=-8;return trees;
}

function snowBank(T) {
  const pos = [], tint = [], idx = [], rings = 33, spokes = 152;
  const base = new T.Color(), gold = new T.Color('#b49589'), ice = new T.Color('#8991a5');
  for (let j = 0; j <= rings; j++) {
    for (let i = 0; i <= spokes; i++) {
      const a = i / spokes * TAU, t = j / rings;
      const rim = 1.84 + .21 * Math.sin(3*a+.2) + .15 * Math.cos(5*a-.7) + .065*Math.cos(13*a)+.025*Math.sin(29*a);
      const r = t * rim, x = r*Math.cos(a), z = .85*r*Math.sin(a);
      const grain = Math.sin(8*x + Math.cos(z*11)) * Math.cos(6*z);
      const y = .044 - .071*t - .30*t**5 + .039*t*Math.sin(a*4+t*3) + .018*grain*t;
      pos.push(x,y,z);
      base.copy(ice).lerp(gold, Math.exp(-r*r*1.8)*.8 + .13*(1 + Math.sin(2*a)*t));
      const trunkShadow=Math.exp(-(x*x*10+z*z*19))*.44;
      const castShadow=Math.exp(-((x+.28)**2*2.4+(z+.24)**2*3.3))*.23;
      base.multiplyScalar(.80 + .10*grain - .49*t**4-trunkShadow-castShadow);
      tint.push(base.r,base.g,base.b);
      if (j && i) {
        const k=j*(spokes+1)+i;
        idx.push(k-spokes-2,k-1,k,k-spokes-2,k,k-spokes-1);
      }
    }
  }
  const g=new T.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  g.setAttribute('color',new T.Float32BufferAttribute(tint,3));g.computeVertexNormals();
  const mesh=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false}));
  const flecks=[],rand=generator(6912);
  for(let i=0;i<170;i++){
    const a=rand()*TAU,t=rand()**.75*.79, r=t*(1.84+.21*Math.sin(3*a+.2)+.15*Math.cos(5*a-.7)+.065*Math.cos(13*a)+.025*Math.sin(29*a));
    const x=r*Math.cos(a),z=.85*r*Math.sin(a),lean=rand()*TAU;
    const y=.048-.071*t-.30*t**5+.039*t*Math.sin(a*4+t*3)+.018*t*Math.sin(8*x+Math.cos(z*11))*Math.cos(6*z);
    flecks.push(x,y,z,x+Math.cos(lean)*.035,y+.002,z+.035*Math.sin(lean));
  }
  const debris=new T.BufferGeometry();debris.setAttribute('position',new T.Float32BufferAttribute(flecks,3));
  mesh.add(new T.LineSegments(debris,new T.LineBasicMaterial({color:0x594a50,transparent:true,opacity:.35})));
  return mesh;
}

const waterVertex = `
  uniform mat4 mirrorView;
  varying vec3 place;
  varying vec4 reflected;
  void main(){
    vec4 p=modelMatrix*vec4(position,1.);
    place=p.xyz; reflected=mirrorView*p; gl_Position=projectionMatrix*viewMatrix*p;
  }`;

const waterFragment = `
  uniform sampler2D reflection;
  uniform float time, amount, rose, snow, wind, wake;
  varying vec3 place;
  varying vec4 reflected;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 cell=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(cell),hash(cell+vec2(1,0)),f.x),mix(hash(cell+vec2(0,1)),hash(cell+1.),f.x),f.y);
  }
  void main(){
    vec2 p=place.xz; float range=length(p);
    vec2 sight=normalize(cameraPosition.xz+vec2(.0001));
    vec2 along=vec2(dot(p,vec2(sight.y,-sight.x)),dot(p,sight));
    float fresnel=1.-clamp(normalize(cameraPosition-place).y,0.,1.);
    float waves=noise(along*vec2(1.4,16.)+vec2(time*.15+wind*.28,time*-.39));
    float fine=noise(along*vec2(3.8,39.)+time*.23);
    float ring=sin(range*16.-wake*13.)*exp(-pow((range-1.5-wake*1.15)*2.1,2.))*exp(-wake*.7);
    vec2 uv=reflected.xy/reflected.w*.5+.5;
    uv.x+=(waves-.5)*(.009+.009*snow)+ring*.005;
    uv.y+=(fine-.5)*.004;
    vec3 mirror=texture2D(reflection,clamp(uv,vec2(.002),vec2(.998))).rgb;
    float valid=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.)*step(0.,reflected.w);
    float stripe=smoothstep(.28,.72,waves*.74+fine*.26);
    vec3 base=mix(vec3(.047,.056,.094),vec3(.158,.116,.173),pow(fresnel,4.));
    base+=vec3(.024,.012,.031)*noise(p*.7);
    float nearby=1.-smoothstep(5.,27.,range);
    base+=vec3(.044,.027,.039)*smoothstep(.64,.86,waves)*(.17+.83*nearby);
    vec3 reflectedLight=pow(max(vec3(0.),mirror),vec3(.72));
    base+=reflectedLight*valid*(.16+.63*stripe)*(.47+.53*fresnel);
    float path=exp(-abs(along.x)*1.15)*exp(-range*.16);
    base+=mix(vec3(.16,.095,.054),vec3(.27,.076,.16),rose)*path*(.05+.58*stripe);
    base+=vec3(.23,.068,.12)*rose*exp(-range*range*.47)*(.46+.54*stripe);
    base+=vec3(.20,.14,.11)*max(0.,ring)*.42;
    base=mix(base,vec3(.31,.32,.395),snow*.20*pow(fresnel,3.));
    gl_FragColor=vec4(base,amount);
  }`;

export function createLake(T) {
  const group = new T.Group(), sky = eveningSky(T);
  const hills = [...[0,1,2].map(i=>shoreline(T,i)),distantFirs(T)];
  const island = snowBank(T), mirrorCamera = new T.PerspectiveCamera();
  const viewTarget = new T.Vector3(), mirrorView = new T.Matrix4();
  const target = new T.WebGLRenderTarget(384,256,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
  const uniforms={reflection:{value:target.texture},mirrorView:{value:mirrorView},time:{value:0},amount:{value:0},
    rose:{value:0},snow:{value:0},wind:{value:0},wake:{value:30}};
  const water = new T.Mesh(new T.CircleGeometry(52,120),new T.ShaderMaterial({
    uniforms,vertexShader:waterVertex,fragmentShader:waterFragment,transparent:true,depthWrite:false
  }));
  water.rotation.x=-Math.PI/2;water.position.y=surfaceY;water.renderOrder=-5;
  // Blowing snow softens the far bank first; the foreground still has crisp flakes.
  const veil=new T.Mesh(new T.CylinderGeometry(26,26,32,72,1,true),new T.ShaderMaterial({
    uniforms,side:T.BackSide,transparent:true,depthWrite:false,
    vertexShader:`varying vec3 spot;
      void main(){spot=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(spot,1.);}`,
    fragmentShader:`uniform float snow, time; varying vec3 spot;
      void main(){
        float drift=sin(spot.x*.32+time*.16)+sin(spot.z*.55-spot.y*.55-time*.14);
        float mist=exp(-abs(spot.y-1.4+drift*.72)*.11)*(.23+.021*drift);
        gl_FragColor=vec4(.47,.49,.60,snow*mist);
      }`
  }));
  veil.position.y=10;veil.renderOrder=-7;
  group.add(sky,...hills,veil,water,island);
  let sinceReflection=1, wakeAge=30;
  function update(s, amount, renderer, scene, camera) {
    group.visible = amount>.001;
    if (!group.visible) {sinceReflection=1;wakeAge=30;return;}
    sky.material.opacity=amount;
    for (const hill of hills) hill.material.opacity=amount;
    island.position.y = -.43*(1-amount)-.247*s.scatter;
    island.material.color.setScalar(1-.52*Math.max(s.scatter,s.illumination));
    uniforms.time.value=s.time; uniforms.amount.value=amount;
    uniforms.rose.value=Math.max(s.scatter,s.illumination);uniforms.snow.value=s.snow;uniforms.wind.value=s.aimX-.5;
    veil.visible=s.snow>.004;
    uniforms.wake.value=wakeAge;wakeAge=Math.min(30,wakeAge+s.dt);
    const width=renderer.domElement.width, height=renderer.domElement.height;
    const scale=Math.min(1,470/Math.max(width,height));
    const rw=Math.max(1,Math.round(width*scale)),rh=Math.max(1,Math.round(height*scale));
    const resized=rw!==target.width||rh!==target.height;
    sinceReflection+=s.dt;
    if(!resized && sinceReflection<.12)return;
    sinceReflection=0;
    if(resized)target.setSize(rw,rh);
    camera.getWorldDirection(viewTarget).add(camera.position);
    mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=2*surfaceY-camera.position.y;
    viewTarget.y=2*surfaceY-viewTarget.y;mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(viewTarget);
    mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);
    mirrorCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    mirrorCamera.updateMatrixWorld();mirrorView.multiplyMatrices(mirrorCamera.projectionMatrix,mirrorCamera.matrixWorldInverse);
    group.visible=false;
    renderer.setRenderTarget(target);renderer.render(scene,mirrorCamera);renderer.setRenderTarget(null);
    group.visible=true;
  }
  return {group,update,ripple(){wakeAge=0;}};
}
