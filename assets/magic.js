const TAU = Math.PI * 2;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const lerp = (a, b, t) => a + (b - a) * t;
function smooth(low, high, value) {
  const u = clamp((value - low) / (high - low));
  return u * u * (3 - 2 * u);
}
function sequence(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Eight small transparent optical profiles share one texture. Snow crystals
// have their own secondary branches, so they also read as ice at close range.
function makeAtlas(THREE) {
  const side = 128;
  const atlas = document.createElement('canvas');
  atlas.width = side * 4;
  atlas.height = side * 2;
  const ctx = atlas.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.translate((i % 4 + .5) * side, (Math.floor(i / 4) + .5) * side);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 59);
    const stops = i === 2 ? [[0, .72], [.25, .46], [.54, .16], [1, 0]]
      : i === 3 ? [[0, 1], [.27, .97], [.49, .55], [.68, .12], [1, 0]]
      : [[0, 1], [.06, .99], [.14, .73], [.32, .2], [.65, .034], [1, 0]];
    for (const [stop, alpha] of stops) glow.addColorStop(stop, 'rgba(255,255,255,' + alpha + ')');
    ctx.fillStyle = glow;
    ctx.fillRect(-61, -61, 122, 122);
    if (i === 1) {
      for (let spike = 0; spike < 8; spike++) {
        ctx.rotate(Math.PI / 4);
        const radius = spike % 2 ? 56 : 21;
        const ray = ctx.createLinearGradient(0, 0, 0, -radius);
        ray.addColorStop(0, 'white'); ray.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ray;
        ctx.beginPath(); ctx.moveTo(-3.2, 0); ctx.lineTo(0, -radius);
        ctx.lineTo(3.2, 0); ctx.closePath(); ctx.fill();
      }
    } else if (i >= 4) {
      ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const tiers = i === 4 ? 2 : 3;
      for (let spoke = 0; spoke < 6; spoke++) {
        ctx.rotate(TAU / 6);
        ctx.lineWidth = i === 6 ? 3.4 : 2.4;
        ctx.beginPath();
        ctx.moveTo(0, 1); ctx.lineTo(0, -53);
        for (let tier = 0; tier < tiers; tier++) {
          const y = -(19 + tier * (i === 4 ? 18 : 11));
          const branch = 14.5 - tier * 3 + (i === 7 ? 4 : 0);
          for (const s of [-1, 1]) {
            ctx.moveTo(0, y); ctx.lineTo(s * branch, y - branch * .68);
            if (i === 5 && !tier) {
              ctx.moveTo(s * branch * .64, y - branch * .42);
              ctx.lineTo(s * branch * .64, y - branch);
            }
          }
        }
        if (i === 6) {
          ctx.moveTo(0, -31); ctx.lineTo(9, -40); ctx.lineTo(0, -50);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(atlas);
  texture.flipY = false;
  return texture;
}

const commonUniforms = `
  uniform float uTime;
  uniform float uHeight;
  uniform float uAmount;
  uniform vec2 uAim;
  attribute vec3 aTint;
  varying vec3 vTint;
  varying vec4 vSprite;
`;
const projectPoint = `
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  float pixels = diameter * uHeight * 0.5 * projectionMatrix[1][1] / max(0.2, -view.z);
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp(pixels, 1.0, 185.0);
  vSprite = vec4(tile, spin, opacity * min(1.0, pixels * pixels), 0.0);
  vTint = aTint;
`;
const fragment = `
  uniform sampler2D uAtlas;
  varying vec3 vTint;
  varying vec4 vSprite;
  void main() {
    float c = cos(vSprite.y), s = sin(vSprite.y);
    vec2 uv = mat2(c, -s, s, c) * (gl_PointCoord - 0.5) + 0.5;
    if (min(uv.x, uv.y) < 0.0 || max(uv.x, uv.y) > 1.0) discard;
    vec2 cell = vec2(mod(vSprite.x, 4.0), floor(vSprite.x / 4.0));
    float alpha = texture2D(uAtlas, (cell + uv) / vec2(4., 2.)).a * vSprite.z;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(vTint, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const orbitShader = `
  attribute vec4 aSeed;
  void main() {
    float id = position.x, radius = pow(aSeed.x, .56) * 3.18;
    float wing = floor(aSeed.y * 4.0);
    float strand = fract(aSeed.y * 4.0) - .5;
    float filaments = step(.75, aSeed.z);
    float angle = wing * 1.5708 + radius * 1.65 +
      strand * mix(.62, .065, filaments) + .25 * log(radius + .56) +
      uTime * .115;
    float width = mix(.25, .035, filaments);
    radius += width * sin(strand * 7.7 + aSeed.w * 4.);
    float x = cos(angle) * radius, z = sin(angle) * radius;
    float elevation = .5 + .14 * uAim.y;
    vec3 p = vec3(x, 2.65 + z * elevation + x * (.18 + uAim.x * .11), z * .79);
    p.y += (aSeed.w - .5) * (.12 + radius * .095) + .12 * sin(radius * 2. - uTime * .32);
    p.xy += uAim * vec2(.57, .48);
    float sparkle = .58 + .42 * pow(.5 + .5 * sin(uTime * 1.8 + aSeed.z * 85.), 4.);
    float tile = 0.0;
    float diameter = mix(.021, .094, pow(aSeed.w, 3.));
    float opacity = uAmount * sparkle * mix(.48, .95, aSeed.w);
    if (id < .021) {
      tile = 2.; diameter = .50 + aSeed.w * .71;
      opacity = (.033 + .018 * aSeed.x) * uAmount;
    } else if (id < .048) {
      tile = 1.; diameter = .105 + .12 * sparkle; opacity = uAmount * sparkle * .82;
    }
    float spin = -.17 + aSeed.y * .36;
    ${projectPoint}
  }
`;

const snowShader = `
  attribute vec4 aSeed;
  uniform vec2 uAdvection, uBreeze;
  varying vec3 vIce;
  void main() {
    float id=position.x, sizeClass=pow(aSeed.w,2.2), phase=aSeed.y*6.2832;
    float fall=fract(aSeed.y+uTime*(.041+.065*sizeClass+.018*aSeed.x));
    vec2 anchor=(aSeed.xz-.5)*20.;
    float gust=sin(uTime*.47 + anchor.x*.39 - anchor.y*.21);
    float swing=sin(uTime*(.51+.46*aSeed.w)+phase+anchor.y*.36);
    vec2 drift=uAdvection+uBreeze*((aSeed.y-.5)*.41+.22*sizeClass);
    drift+=vec2(.34*swing+.24*gust, .23*cos(uTime*.48+phase*.77)+.19*gust);
    // The same slowly moving eddy carries neighboring flakes. Smaller ones
    // follow it more closely, while larger aggregates keep falling through.
    drift+=vec2(.34,-.09)*sin(uTime*.72-fall*4.5+anchor.x*.29)*(1.-.64*sizeClass);
    vec2 bed=mod(anchor+drift+10.,20.)-10.;
    vec3 p=vec3(bed.x,7.9-fall*8.18+.059*swing*(1.-sizeClass),bed.y);
    vec4 eye=modelViewMatrix*vec4(p,1.);
    float distance=-eye.z;
    float depthFade=smoothstep(1.5,3.2,distance)*(1.-smoothstep(15.,21.,distance));
    float edge=1.-smoothstep(8.8,10.,max(abs(bed.x),abs(bed.y)));
    float tilt=cos(uTime*(.51+aSeed.z*.68)+phase*3.);
    float focalBlur=clamp((6.9-distance)/4.6,0.,1.);
    float diameter=mix(.018,.105,sizeClass);
    float tile=3.,spin=phase+uTime*(aSeed.x-.5)*.91+.24*swing;
    float opacity=(.40+.44*sqrt(sizeClass))*depthFade*edge*uAmount*
      smoothstep(.0,.035,fall)*(1.-smoothstep(.952,1.,fall));
    if(id<.053&&sizeClass>.42){
      tile=4.+floor(aSeed.x*3.999);
      diameter=.086+sizeClass*.055;
    }
    vIce=vec3(.63+.37*abs(tilt),focalBlur,id);
    diameter*=1.+.87*focalBlur;
    opacity*=1.-.61*focalBlur;
    ${projectPoint}
    float lamp=exp(-.21*(p.x*p.x+p.z*p.z))*(1.-smoothstep(3.5,5.7,p.y));
    vTint=mix(aTint*vec3(.83,.92,1.),vec3(1.,.90,.75),lamp*.41);
  }
`;
const snowFragment=`
  uniform sampler2D uAtlas;
  varying vec3 vTint,vIce;
  varying vec4 vSprite;
  void main(){
    vec2 q=gl_PointCoord-.5;
    float c=cos(vSprite.y),s=sin(vSprite.y);
    q=mat2(c,-s,s,c)*q; q.y/=vIce.x;
    float r=length(q);
    float clump=1.-smoothstep(.12,.42,r);
    // Irregular aggregates have two or three overlapping softened lobes.
    float small=1.-smoothstep(.045,.17,length(q-vec2(.15,.065)));
    float chip=1.-smoothstep(.03,.14,length(q+vec2(.13,.12)));
    float density=max(clump,max(small*.79,chip*.63));
    if(vSprite.x>=4.){
      vec2 uv=clamp(q+.5,.001,.999);
      vec2 cell=vec2(mod(vSprite.x,4.),floor(vSprite.x/4.));
      density=texture2D(uAtlas,(cell+uv)/vec2(4.,2.)).a;
    }
    float blur=exp(-r*r*20.)*(1.-smoothstep(.36,.5,r));
    density=mix(density,blur,vIce.y);
    float alpha=vSprite.z*density;
    if(alpha<.004)discard;
    gl_FragColor=vec4(vTint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Path is a parameter of the orbit, not a screen-space ellipse. A small
// hand displacement is felt most strongly at the forward part of each pass.
const skaterPath = `
  vec3 skating(float lane, float tail, float time, vec2 aim) {
    float low = 1. - step(.5,lane), mid = step(.5,lane)*(1.-step(1.5,lane));
    float speed = low*.53 - mid*.71 + step(1.5,lane)*.98;
    float phase = time*speed + lane*2.27 - .74;
    float arc = 1.94 + .46*low + .43*sin(.34*time+lane);
    float a = phase-sign(speed)*tail*arc + .18*sin(.57*phase+lane);
    float radius = 1.41 + .97*low + .69*mid;
    float x = cos(a)*radius*(1.+.09*sin(2.*a+.46*lane));
    float z = sin(a)*radius*(.76+.20*mid);
    float yaw = -.22 + lane*.53 + aim.x*(.24+.51*mid);
    vec2 feet = mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*vec2(x,z);
    float y = 1.02 + lane*1.27 + (.31+.83*mid+.28*step(1.5,lane))*sin(a+.82*lane)
      + .20*cos(a*.95+lane) + aim.y*.34*cos(a+lane);
    float influence = .34 + .14*z;
    return vec3(feet.x+aim.x*influence, y+aim.y*influence*.83, feet.y+lane*.07);
  }
`;

export function createMagic(THREE) {
  const group = new THREE.Group();
  group.name = 'Starlight and snow';
  const atlas = makeAtlas(THREE);
  const drawingSize = new THREE.Vector2();
  let camera = null;
  const palette = ['#ffe0a3', '#fff5d6', '#e8ac70', '#e7998d', '#c3e0df', '#f2bd7f', '#e8f3ff']
    .map(hex => new THREE.Color(hex));
  function cloud(geometry, vertex, additive, pixelShader=fragment) {
    const uniforms = {
      uAtlas: { value: atlas }, uHeight: { value: 900 }, uAmount: { value: 0 },
      uTime: { value: 0 }, uAim: { value: new THREE.Vector2() },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: commonUniforms + vertex, fragmentShader: pixelShader, uniforms,
      transparent: true, depthWrite: false, depthTest: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; points.renderOrder = additive ? 5 : 4;
    points.onBeforeRender = (renderer, _scene, activeCamera) => {
      camera = activeCamera;
      uniforms.uHeight.value = renderer.getRenderTarget()?.height ?? renderer.getDrawingBufferSize(drawingSize).y;
    };
    group.add(points);
    return points;
  }

  function dustField(kind, count, seed) {
    const rng = sequence(seed), ice = kind === 'snow';
    const positions = new Float32Array(count * 3), seeds = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = i / count;
      for (let j = 0; j < 4; j++) seeds[i * 4 + j] = rng();
      const key = rng();
      const tint = ice ? (key < .8 ? 6 : 4) : key < .38 ? 1 : key < .7 ? 0 : key < .83 ? 5 : key < .94 ? 4 : 3;
      palette[tint].toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    geometry.setAttribute('aTint', new THREE.BufferAttribute(colors, 3));
    const points = cloud(geometry, ice ? snowShader : orbitShader, !ice, ice ? snowFragment : fragment);
    points.name = ice ? 'Wind and snow crystals' : 'Spiral filaments';
    return points;
  }
  const galaxy = dustField('galaxy', 1780, 19207);
  const snowField = dustField('snow', 3200, 48921);
  const snowUniforms=snowField.material.uniforms;
  snowUniforms.uBreeze={value:new THREE.Vector2()};
  snowUniforms.uAdvection={value:new THREE.Vector2()};
  let lastSnowClock=0;

  // Narrow, tapered wisps run along the same orbital arms as the fir's motes.
  // They are strips in world space so the viewer can see dust cross in front.
  function silk() {
    const vertices = [], indices = [];
    for (let path = 0; path < 12; path++) {
      const offset = vertices.length / 3;
      for (let i = 0; i <= 115; i++) {
        for (const side of [-1, 1]) vertices.push(i / 115, path, side);
        const a = offset + i * 2;
        if (i < 115) indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    const uniforms = galaxy.material.uniforms;
    const material = new THREE.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, forceSinglePass: true,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uAim;
        varying vec3 vWisp;
        void main() {
          float u = position.x, path = position.y, side = position.z;
          float lane = floor(path / 4.);
          float radius = mix(.10 + .21 * lane, 3.27 - lane * .16, u);
          float a = mod(path, 4.) * 1.5708 + radius * 1.65 + .115 * uTime;
          a += .25 * log(radius + .56) + (lane - 1.) * (.045 + .06 * sin(radius * 3. + path));
          float x = radius * cos(a), z = radius * sin(a);
          float bend = .05 * sin(radius * 3.4 + lane * 4. - uTime * .23);
          vec3 p = vec3(x, 2.65 + z * (.5 + .14 * uAim.y) + x * (.18 + uAim.x * .11) + bend, z * .79);
          p.y += side * ((lane > 1.) ? .034 : .014);
          p.xy += uAim * vec2(.57, .48);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          float pulse = .35 + .65 * pow(.5 + .5 * sin(u * 11. - uTime * .64 + path), 1.6);
          vWisp = vec3(side, pow(max(0., sin(u * 3.1415926)), .7) * pulse, lane);
        }`,
      fragmentShader: `
        uniform float uAmount;
        varying vec3 vWisp;
        void main() {
          vec3 tint = mix(vec3(.98,.59,.29), vec3(.52,.75,.76), vWisp.z * .28);
          float alpha = pow(max(0., 1. - abs(vWisp.x)), 1.65) * vWisp.y * uAmount;
          gl_FragColor = vec4(tint, alpha * (vWisp.z > 1. ? .13 : .31));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Orbital silk'; mesh.frustumCulled = false; mesh.renderOrder = 4;
    group.add(mesh);
    return mesh;
  }
  const wisps = silk();

  // Each whorl has its own limbs. Paired feather sprays hang from those limbs
  // with a rising terminal tip; the gaps between sprays survive the illumination.
  function crystallineFir() {
    const pos = [], seed = [], colors = [], rand = sequence(134526);
    const icy = ['#f4f9ff','#c0daff','#8dbcee','#639be1','#fff4db'].map(v => new THREE.Color(v));
    function point(x, y, z, lightness) {
      pos.push(x, y, z);
      const j = rand(), glint = rand();
      seed.push(rand(), j, glint, lightness);
      const color = icy[glint > .986 ? 4 : lightness > .76 ? 0 : j > .65 ? 1 : j > .19 ? 2 : 3];
      colors.push(color.r, color.g, color.b);
    }
    for (let tier = 0; tier < 22; tier++) {
      const u = tier / 22, limbs = Math.round(12 - 6 * u);
      const nominal = (1.60 * (1 - u) ** .82 + .060) * (tier % 3 === 1 ? .84 : 1);
      for (let limb = 0; limb < limbs; limb++) {
        const theta = tier * 2.39996 + TAU * (limb + (rand() - .5) * .29) / limbs;
        const ca = Math.cos(theta), sa = Math.sin(theta);
        const length = nominal * (.94 + .19 * rand());
        const rootY = 1.08 + u * 3.77 + .11 * (rand() - .5);
        const droop = (.32 - .19 * u) * (.78 + .45 * rand());
        const sprays = Math.round(4 + length * 5.6);
        for (let k = 0; k < sprays; k++) {
          const along = .06 + .91 * (k + .38) / sprays;
          const stem = length * along;
          const kneeY = rootY - droop * Math.sin(along * 2.3) + along * along * (.13 + .06 * u);
          for (const sign of [-1, 1]) {
            const width = (.11 + length * .23) * (1.15 - along * .72) * (.8 + rand() * .4);
            const needles = Math.round(6 + width * 31);
            for (let n = 0; n < needles; n++) {
              const t = (n + rand()) / needles;
              const side = sign * (width * t + (rand() - .5) * .069);
              const radial = stem + width * t * .65 + (rand() - .5) * .10;
              const y = kneeY - .39 * width * t + .17 * width * t * t + (rand() - .5) * .10;
              point(ca * radial - sa * side, y, sa * radial + ca * side, along * .58 + t * .42);
            }
          }
        }
      }
    }
    for (let i = 0; i < 72; i++) {
      const y = 4.54 + rand() * .36, a = rand() * TAU, radius = (4.91 - y) * rand() * .30;
      point(Math.cos(a) * radius, y, Math.sin(a) * radius, .89);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed,4));
    geo.setAttribute('aTint', new THREE.Float32BufferAttribute(colors,3));
    const cloudlet = cloud(geo, `
      attribute vec4 aSeed;
      uniform float uCrown, uRose, uWarm, uGhost;
      void main() {
        float row = (position.y - .58) / 4.4;
        float seated = smoothstep(-.065, .065, uCrown - row);
        float unfold = 1. - seated;
        vec3 p = position;
        float angle = aSeed.x * 6.283 + unfold * 2.8;
        p.xz += vec2(cos(angle), sin(angle)) * unfold * (.09 + .27 * aSeed.z);
        p.y += .26 * unfold * aSeed.y;
        float dye = smoothstep(-.04, .92, uRose * 1.17 + (.48-row)*.18);
        float wispy = .5 + .5*sin(row*64. + atan(p.z,p.x)*2. + .38*uTime);
        float breath = dye*(.015+.024*uGhost)*sin(row*17.+uTime*.69+aSeed.z);
        p.xz *= 1.+breath;
        p.y += dye*(.024 + .046*uGhost)*sin(2.*atan(p.z,p.x)+uTime*.47+row*12.);
        p.xy += vec2(uAim.x,uAim.y*.6)*row*.19*uGhost;
        float flicker = pow(.5 + .5 * sin(uTime * (1.0 + aSeed.x * 2.6) + aSeed.z * 76.), 5.);
        float tile = aSeed.y > .985 ? 1. : aSeed.z > .93 ? 0. : 3.;
        float spin = .04 + .15 * aSeed.x;
        float diameter = mix(.012, .049, pow(aSeed.y,1.8));
        if (tile < 2.) diameter *= tile < .5 ? 1.47 : 2.46;
        float opacity = uAmount * (.39 + .61 * aSeed.w) * (.55 + .45 * flicker) *
                        smoothstep(-.135, -.003, uCrown - row);
        // Rose-coloured sheets drift just outside the densely lit needle sprays.
        opacity *= mix(1.,.57+.43*wispy,dye);
        if(aSeed.x<.023 && uRose>.01){
          diameter=mix(diameter,.16+.17*aSeed.y,dye);
          tile=dye>.24?2.:tile;
          opacity*=mix(1.,.09+.12*aSeed.w,dye);
        }
        ${projectPoint}
        vec3 petal=mix(vec3(.46,.071,.152),vec3(.97,.30,.44),aSeed.w*.63+wispy*.37);
        petal=mix(petal,vec3(1.,.68,.78),smoothstep(.92,1.,aSeed.z)*.72);
        vTint=mix(vTint,petal,dye);
        vTint=mix(vTint,vec3(.99,.68,.36),uWarm*.68);
      }`, true);
    cloudlet.material.uniforms.uCrown = {value: 0};
    for(const key of ['uRose','uWarm','uGhost'])cloudlet.material.uniforms[key]={value:0};
    cloudlet.name = 'Icy needle stars and rose dust';
    return cloudlet;
  }
  const frost = crystallineFir();

  // Extrude the filament in projected space to keep its delicate line width
  // consistent from the rear of the canopy to the forward loop.
  function crownFilaments() {
    const data = [], index = [];
    for (let strand = 0; strand < 6; strand++) {
      const offset = data.length / 3;
      const steps=strand<3?1050:195;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        for (const side of [-1,1]) data.push(u,strand,side);
        const a = offset + i * 2;
        if (i < steps) index.push(a,a+1,a+2,a+2,a+1,a+3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(data,3));geo.setIndex(index);
    const uniforms = {uTime:{value:0},uAmount:{value:0},uCrown:{value:0},uViewport:{value:new THREE.Vector2(1,1)},uDensity:{value:1}};
    uniforms.uComets={value:0};uniforms.uAim={value:new THREE.Vector2()};
    const mat = new THREE.ShaderMaterial({
      uniforms, transparent:true, side:THREE.DoubleSide, forceSinglePass:true,
      depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`
        uniform float uTime, uAmount, uCrown, uDensity, uComets;
        uniform vec2 uViewport, uAim;
        varying vec3 vWire;
        ${skaterPath}
        vec3 curve(float t, float strand) {
          if(strand>=3.)return skating(strand-3.,t,uTime,uAim);
          float lane = strand - 1.;
          float a = t * 43.54 + .76 + .14 * sin(t * 13.) + .075 * uTime;
          a += lane * (.065 + .025 * sin(t * 19.));
          float radius = (2.06 * pow(max(.0,1. - t),.79) + .031) *
             (1. + .061 * sin(a * 1.9 + t * 7.3) + .043 * sin(a * 3.1));
          radius += (1. - t) * lane * (.045 + .051 * sin(t * 16. - uTime * .14));
          float y = .68 + t * 4.27 + (1. - t) * .071 * sin(a + .8) +
                    lane * (1. - t) * .036 * sin(a * 1.5);
          return vec3(cos(a) * radius, y, sin(a) * radius);
        }
        void main() {
          float t=position.x, strand=position.y;
          vec4 pos=projectionMatrix*modelViewMatrix*vec4(curve(t,strand),1.);
          vec4 next=projectionMatrix*modelViewMatrix*vec4(curve(t+.00015,strand),1.);
          vec2 tangent=normalize((next.xy/next.w-pos.xy/pos.w)*uViewport+vec2(.00001));
          vec2 normal=vec2(-tangent.y,tangent.x);
          float width=mix(.72,1.18,step(.5,strand)*step(strand,1.5))*uDensity;
          if(strand>=3.)width=uDensity*mix(.40,1.48,pow(max(0.,1.-t),.82));
          pos.xy+=normal*position.z*width*2./uViewport*pos.w;
          gl_Position=pos;
          float gleam=.64+.36*pow(.5+.5*cos(28.*t-uTime*1.3+strand),2.);
          float secondary=strand==1.?1.:.12+.26*pow(.5+.5*sin(33.*t+strand*2.1),2.);
          vWire=vec3(position.z,gleam*secondary*uAmount*smoothstep(-.11,-.012,uCrown-t),
            .5+.5*sin(21.*t+strand*2.-uTime*.5));
          if(strand>=3.)vWire=vec3(position.z,
            uComets*pow(max(0.,1.-t),1.41)*(.84+.13*sin(t*24.+strand)),.24+.70*pow(1.-t,3.));
        }`,
      fragmentShader:`
        varying vec3 vWire;
        void main() {
          float coverage=1.-smoothstep(.32,1.,abs(vWire.x));
          vec3 tint=mix(vec3(.96,.64,.30),vec3(1.0,.99,.93),vWire.z);
          gl_FragColor=vec4(tint,coverage*vWire.y);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;mesh.renderOrder=5;
    mesh.name='Seven turns of silver-gilt thread';
    mesh.onBeforeRender=r=>{
      const target=r.getRenderTarget();
      if(target)uniforms.uViewport.value.set(target.width,target.height);
      else r.getDrawingBufferSize(uniforms.uViewport.value);
      uniforms.uDensity.value=target?1:r.getPixelRatio();
    };
    group.add(mesh);return mesh;
  }
  const helices = crownFilaments();
  // The pearls and fine grains share the same parametric path as the silk core.
  // Each of the three moving heads has its own diffraction cross and soft aura.
  function skaters(){
    const rng=sequence(81310), pos=[],color=[];
    for(let lane=0;lane<3;lane++){
      for(let k=0;k<210;k++){
        const type=k<3?k:3, tail=k<3?0:rng()**1.65,noise=rng();
        pos.push(lane,tail,type+noise*.8);
        (k<2?palette[1]:k%8===0?palette[3]:k%3===0?palette[5]:palette[0]).toArray(color,color.length);
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('aTint',new THREE.Float32BufferAttribute(color,3));
    const points=cloud(geo,`
      ${skaterPath}
      void main(){
        float lane=position.x,tail=position.y,type=floor(position.z);
        float noise=fract(position.z)/.8;
        vec3 p=skating(lane,tail,uTime,uAim);
        float spin=.07+.14*lane, tile=type<1.?1.:type<3.?2.:0.;
        float diameter=type<1.?.35:type<2.?.32:.71;
        float opacity=uAmount*(type<1.?.99:type<2.?.59:.15);
        if(type>=3.){
          float flicker=.55+.45*sin(noise*126.+uTime*2.);
          p+=vec3(cos(noise*370.),sin(noise*150.),sin(noise*323.))*
            (.012+tail*tail*.145)*(.34+noise);
          opacity=uAmount*pow(1.-tail,.97)*flicker*(.28+.56*noise);
          diameter=mix(.021,.094,noise);
          if(noise>.963){tile=1.;diameter*=1.54;}
        }
        ${projectPoint}
      }`,true);
    points.name='Champagne orbiting comets';
    return points;
  }
  const cometHeads=skaters();

  // All short-lived trails, individual flares and the closing constellation
  // occupy one reusable draw buffer. No object is added per emitted particle.
  const capacity = 2900;
  const dynamic = new THREE.BufferGeometry();
  function attribute(name, stride) {
    const attr = new THREE.BufferAttribute(new Float32Array(capacity * stride), stride);
    attr.setUsage(THREE.DynamicDrawUsage);
    dynamic.setAttribute(name, attr);
    return attr;
  }
  const locations = attribute('position', 3), tints = attribute('aTint', 3), shapes = attribute('aShape', 4);
  dynamic.setDrawRange(0, 0);
  const animation = cloud(dynamic, `
    attribute vec4 aShape;
    void main() {
      vec3 p = position;
      float diameter = aShape.x, opacity = aShape.y, tile = aShape.z, spin = aShape.w;
      ${projectPoint}
    }`, true);
  animation.name = 'Wish trails and constellations';
  let count = 0;
  function dot(x, y, z, diameter, alpha, tint = 0, tile = 0, spin = 0) {
    if (alpha <= .003 || count >= capacity) return;
    locations.setXYZ(count, x, y, z);
    const color = palette[tint];
    tints.setXYZ(count, color.r, color.g, color.b);
    shapes.setXYZW(count++, diameter, Math.min(1, alpha), tile, spin);
  }

  const rng = sequence(20261225);
  const flecks = Array.from({ length: 410 }, () => ({
    a: rng() * TAU, b: rng(), c: rng(), d: rng(), e: rng(), f: rng(),
  }));
  const ray = new THREE.Raycaster(), input = new THREE.Vector2();
  const plane = new THREE.Plane(), normal = new THREE.Vector3(), anchor = new THREE.Vector3();
  const local = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(1, 0, 0);
  function screenPoint(x, y, output, depth = 1.1) {
    if (!camera) return output.set((x - .5) * 6.5, (.94 - y) * 5.5, depth);
    group.updateWorldMatrix(true, false);
    camera.getWorldDirection(normal);
    group.localToWorld(anchor.set(0, 2.55, 0));
    anchor.addScaledVector(normal, -depth);
    plane.setFromNormalAndCoplanarPoint(normal, anchor);
    const bounds=camera.userData.inputBounds;
    const sceneX=bounds?bounds.left+x*bounds.width:x,sceneY=bounds?bounds.top+y*bounds.height:y;
    ray.setFromCamera(input.set(sceneX * 2 - 1, 1 - sceneY * 2), camera);
    if (ray.ray.intersectPlane(plane, output)) return group.worldToLocal(output);
    return output.set(0, 2.55, depth);
  }
  // Display-plane basis keeps little star shapes upright from an angled camera.
  function screenBasis() {
    if (!camera) return;
    screenPoint(.5, .5, origin);
    screenPoint(.6, .5, right).sub(origin).normalize();
    screenPoint(.5, .4, up).sub(origin).normalize();
  }
  function faceDot(center, x, y, size, alpha, tint, tile = 0, spin = 0) {
    dot(center.x + x * right.x + y * up.x, center.y + x * right.y + y * up.y,
      center.z + x * right.z + y * up.z, size, alpha, tint, tile, spin);
  }
  const origin = new THREE.Vector3(), head = new THREE.Vector3();
  const flights = [];
  let aimX = .5, aimY = .5, snowOpacity = 0, lightClock = 0, lastLight = 0, phase = 'sealed';
  let fireClock = 12, lastIllumination = 0;
  // A salvo stages independent rockets. Only tiny Bézier heads run on the CPU;
  // expansion, drag, colour changes, falling trails and twinkle run on the GPU.
  const maxShells=15, raysPerShell=189, tailSamples=7;
  const themes=[
    ['#ff715f','#fdb6ce','#fb8044'], ['#bc86ff','#f99dd9','#a06cc7'],
    ['#47dabb','#d9fa76','#e9a751'], ['#53aeff','#a1e9ff','#708ed7'],
    ['#ffd365','#ff8854','#dd7744'], ['#ff77b5','#d5afff','#dd668a'],
    ['#9bb4ff','#66f2df','#929aaa'], ['#ffab72','#f7ea8d','#c4705b']
  ].map(set=>set.map(hex=>new THREE.Color(hex)));
  const shellUniforms={
    uShell:{value:Array.from({length:maxShells},()=>new THREE.Vector4(0,0,0,-9))},
    uForm:{value:Array.from({length:maxShells},()=>new THREE.Vector4())},
    uAcross:{value:Array.from({length:maxShells},()=>new THREE.Vector3())},
    uUp:{value:Array.from({length:maxShells},()=>new THREE.Vector3())},
    uPetal:{value:Array.from({length:maxShells},()=>new THREE.Color())},
    uTip:{value:Array.from({length:maxShells},()=>new THREE.Color())},
    uEmber:{value:Array.from({length:maxShells},()=>new THREE.Color())},
  };
  function makeShells(){
    const entries=maxShells*raysPerShell*tailSamples;
    const positions=new Float32Array(entries*3),seeds=new Float32Array(entries*4);
    const prng=sequence(913897);
    let index=0;
    for(let slot=0;slot<maxShells;slot++)for(let ray=0;ray<raysPerShell;ray++){
      const sample=[prng(),prng(),prng(),prng()];
      for(let tail=0;tail<tailSamples;tail++,index++){
        positions.set([slot,ray,tail/(tailSamples-1)],index*3);
        seeds.set(sample,index*4);
      }
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geo.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
    geo.setDrawRange(0,0);
    const mesh=cloud(geo,`
      attribute vec4 aSeed;
      uniform vec4 uShell[${maxShells}], uForm[${maxShells}];
      uniform vec3 uAcross[${maxShells}], uUp[${maxShells}];
      uniform vec3 uPetal[${maxShells}], uTip[${maxShells}], uEmber[${maxShells}];
      void main(){
        int slot=int(position.x+.25);
        vec4 shell=uShell[slot], form=uForm[slot];
        float ray=position.y, lag=position.z, kind=form.y;
        float willow=1.-step(.4,abs(kind-1.));
        float t=shell.w-aSeed.y*.07-lag*(.27+.21*willow);
        float lifespan=1.48+.85*aSeed.w+.65*willow;
        if(t<=0. || t>lifespan){
          gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;
          vSprite=vec4(0.);vTint=vec3(0.);return;
        }
        float u=t/lifespan, expanding=1.-exp(-1.92*t);
        float a=form.z+ray*2.399963+(aSeed.z-.5)*.13;
        float z=1.-2.*(ray+.5)/${raysPerShell.toFixed(1)};
        float radial=sqrt(max(.0,1.-z*z)), radius=.81+.22*aSeed.x;
        vec3 dir=vec3(radial*cos(a),radial*sin(a),z);
        if(kind<.5){
          // A chrysanthemum with a smaller, later-changing centre.
          if(mod(ray,5.)<1.)radius*=.53;
        }else if(kind<1.5){
          // Broad initial canopy whose streamers hang progressively lower.
          float lift=.19+.74*aSeed.y;
          dir=vec3(sqrt(1.-lift*lift)*cos(a),lift,sqrt(1.-lift*lift)*sin(a));
          radius*=1.16;
        }else if(kind<2.5){
          // A tilted double crown with a contrasting inner ring.
          float inner=step(.70,aSeed.w),pitch=.47+form.w*.28;
          dir=vec3(cos(a),sin(a)*cos(pitch),sin(a)*sin(pitch));
          if(inner>.5){dir=vec3(dir.x*.68,dir.y*.68,dir.z*-.55);radius*=.89;}
          radius=radius*.5+.49;
        }else if(kind<3.5){
          // Fan-shaped palm fronds split into small fingers at the tips.
          float palm=floor(ray/17.), bend=(aSeed.x-.5)*u*.65;
          float arm=.19+palm*.258+form.z*.045+bend;
          dir=vec3(cos(arm),sin(arm),.28*sin(palm*3.2)+.12*aSeed.z);
          radius=.5+.53*fract(ray/17.);
        }else{
          // A five-petalled dahlia, rotated independently for each rocket.
          radius=(.42+.63*pow(abs(cos(2.5*(a-form.z))),1.5))*(.90+.12*aSeed.y);
          dir=vec3(cos(a),sin(a),z*.22);
        }
        vec3 crossAxis=normalize(cross(uAcross[slot],uUp[slot]));
        float drift=.057*sin(3.*u+aSeed.w*7.)*u*u;
        vec3 motion=(dir.x*uAcross[slot]+dir.y*uUp[slot]+dir.z*crossAxis)*expanding*radius;
        motion+=uAcross[slot]*drift;
        vec3 p=shell.xyz+form.x*motion;
        p.y-=(.105+.139*willow)*t*t*form.x;
        float sizzling=.68+.32*pow(sin(12.*t+aSeed.y*36.),2.);
        float cooling=smoothstep(.48,.96,u+.22*lag);
        float opacity=smoothstep(.0,.048,t)*(1.-smoothstep(.39,1.,u))*
          (1.-lag*.87)*sizzling;
        float diameter=form.x*(.039+.052*aSeed.x)*(1.-lag*.53);
        float tile=lag<.05 && aSeed.w>.928 ? 1. : 0.;
        if(tile>.5)diameter*=1.62;
        float spin=form.z+aSeed.z;
        ${projectPoint}
        vec3 petal=mix(uPetal[slot],uTip[slot],smoothstep(.18,.61,u+.20*lag)*(.57+.43*aSeed.z));
        vec3 hot=mix(vec3(1.,.91,.75),petal,smoothstep(.015,.125,t)+.04*lag);
        vTint=mix(hot,uEmber[slot],cooling);
      }`,true);
    Object.assign(mesh.material.uniforms,shellUniforms);
    mesh.name='Staggered wish salvos';mesh.visible=false;
    return mesh;
  }
  const shells=makeShells();
  // Travel around the hue wheel by a coprime stride: the leading shell visits
  // all eight palettes before revisiting one. Neighbours form a split chord.
  const wheel=[0,7,4,2,6,3,1,5], chord=[0,3,6,1,5];
  const firstColor=Math.floor(Math.random()*wheel.length), stride=Math.random()<.5?3:5;
  let volley=0;
  function wish({ x = aimX, y = aimY, strength = .7 } = {}) {
    if(phase!=='play')return;
    const power=clamp(strength,.14,1);
    const rootColor=(firstColor+volley*stride)%wheel.length;
    const season=Math.floor(volley/wheel.length);
    const hueDrift=.028*Math.sin(season*1.97);
    const firstShape=(volley+Math.floor(rng()*3))%5;
    volley++;
    const requested=3+Number(power>.45)+Number(power>.82);
    // Rapid repeated releases always produce an immediate head; live bursts
    // keep finishing while the number of secondary rockets adapts to capacity.
    const total=Math.max(1,Math.min(requested,maxShells-flights.length));
    let delay=0;
    for(let n=0;n<total;n++){
      let slot=shellUniforms.uShell.value.findIndex((_,i)=>!flights.some(f=>f.slot===i));
      if(slot<0){slot=flights.shift().slot;}
      const spread=[.5,.21,.79,.35,.71][n];
      const targetX=clamp(spread+(n===0?(x-.5)*.52:(x-.5)*.08)+(rng()-.5)*.105,.15,.85);
      const targetY=clamp([.25,.33,.21,.13,.38][n]+(rng()-.5)*.075+(y-.5)*.12,.12,.42);
      const depth=1.13+.66*rng();
      const end=screenPoint(targetX,targetY,new THREE.Vector3(),depth);
      const start=screenPoint(clamp(x),clamp(y),new THREE.Vector3(),1.08);
      const sign=targetX>x?1:-1;
      const bend=(.05+.12*rng())*sign;
      const control1=screenPoint(clamp(x+bend),clamp(y-.04),new THREE.Vector3(),1.38);
      const control2=screenPoint(clamp(targetX-bend*.8),clamp(targetY-.07),new THREE.Vector3(),1.60);
      const angularSize=(n===0?.152:.089+.043*rng())*(.82+.31*power);
      const scale=clamp(screenPoint(targetX,targetY+angularSize,local,depth).distanceTo(end),.30,1.34);
      const style=themes[wheel[(rootColor+chord[n])%wheel.length]];
      shellUniforms.uShell.value[slot].set(end.x,end.y,end.z,-9);
      shellUniforms.uForm.value[slot].set(scale,(firstShape+n)%5,rng()*TAU,rng());
      shellUniforms.uAcross.value[slot].copy(right);
      shellUniforms.uUp.value[slot].copy(up);
      shellUniforms.uPetal.value[slot].copy(style[0]).offsetHSL(hueDrift,0,0);
      shellUniforms.uTip.value[slot].copy(style[1]).offsetHSL(hueDrift*.78,0,0);
      shellUniforms.uEmber.value[slot].copy(style[2]).offsetHSL(hueDrift*.52,0,0);
      flights.push({slot,end,scale,age:-delay,seed:Math.floor(rng()*150),
        travel:.68+.28*Math.hypot(targetX-x,targetY-y)+.19*rng(),
        curve:new THREE.CubicBezierCurve3(start,control1,control2,end)});
      delay+=.21+rng()*.23;
    }
  }
  function drawFlight(flight,dt){
    flight.age+=dt;
    const {age,travel,curve,end,scale,seed,slot}=flight,burst=age-travel;
    shellUniforms.uShell.value[slot].w=burst;
    if(age<0)return;
    if(age<travel+.39){
      for(let i=0;i<41;i++){
        const lag=i/40, u=(age-.38*lag)/travel;
        if(u<0||u>1)continue;
        curve.getPoint(u*(2.-u),head);
        const grain=flecks[(seed+i)%flecks.length],fade=(1.-lag)**1.37;
        faceDot(head,Math.sin(lag*13.+grain.a)*.045*lag,-.082*lag*lag,
          .032+fade*.065,fade*(.64+.35*grain.b),i%6?5:1);
        if(!i){
          dot(head.x,head.y,head.z,.28+scale*.15,.42,0,2);
          dot(head.x,head.y,head.z,.19+scale*.07,.98,1,1,.10);
        }
      }
    }
    if(burst>=0 && burst<.58){
      dot(end.x,end.y,end.z,scale*(.28+burst*.89),.75*Math.exp(-burst*7.8),1,2);
      dot(end.x,end.y,end.z,.20*scale,.73*Math.exp(-burst*9.),1,1);
    }
  }

  function idle(time) {
    for (let i = 0; i < 24; i++) {
      const s = flecks[i], t = (s.b + time * (.025 + s.c * .034)) % 1;
      const alpha = Math.sin(t * Math.PI) * (.12 + .24 * s.e);
      dot((s.d - .5) * 5.7 + .16 * Math.sin(time * .48 + s.a),
        .24 + t * 2.86, (s.f - .58) * 3.65, .033 + .052 * s.c, alpha, i % 6 ? 0 : 4);
    }
  }
  function opening(time, p) {
    const escape = smooth(.13, .29, p) * (1 - smooth(.43, .67, p));
    if (escape > 0) {
      for (let i = 0; i < 110; i++) {
        const s = flecks[i], t = (s.b + p * 2.65) % 1;
        const r = (.27 + s.c * .85) * (.35 + t * 1.12);
        const a = s.a + t * (.7 + s.f * 1.4);
        dot(Math.cos(a) * r, 1.12 + t * (1 + s.d * 1.4),
          Math.sin(a) * r, .035 + s.e * .09, escape * Math.sin(t * Math.PI) ** 1.4,
          i % 7 === 1 ? 3 : i % 6 ? 0 : 1, i % 18 ? 0 : 1);
      }
    }
    if (p < .42) return;
    const ascent = smooth(.42, .65, p);
    const fade = smooth(.42, .49, p) * (1 - smooth(.86, .965, p));
    for (let i = 0; i < 205; i++) {
      const s = flecks[i], lag = s.b ** 1.4;
      const u = ascent - lag * .30;
      if (u < 0) continue;
      const a = u * 19.4 + .9;
      const radius = .045 + 1.86 * (1 - u) * smooth(0, .14, u);
      const noise = lag * (.13 + s.e * .15);
      dot(Math.cos(a) * radius + Math.cos(s.a) * noise, .12 + 5.07 * u + (s.c - .5) * noise,
        Math.sin(a) * radius + Math.sin(s.a) * noise, .025 + s.d * .085,
        (1 - lag) * fade, i % 10 === 0 ? 4 : i % 3 ? 0 : 1, i % 22 ? 0 : 1);
    }
    const ignition = Math.sin(smooth(.87, 1, p) * Math.PI);
    dot(0, 5.14, .02, .48 + ignition * .75, ignition * .58, 0, 2);
    dot(0, 5.14, .02, .22 + ignition * .54, ignition * .91, 1, 1, .13 + time * .025);
  }

  function crownLight(time, dt, amount, reveal, rose, warm, ghost) {
    frost.visible = helices.visible = amount > .004 && reveal > .001;
    const comets=Math.max(rose*amount,ghost)*smooth(.32,.77,reveal);
    cometHeads.visible=comets>.004;
    const gestures=[helices,cometHeads,frost];
    for(const mesh of gestures)mesh.material.uniforms.uAim.value.set((aimX-.5)*2,(.5-aimY)*2);
    const crown=frost.material.uniforms;
    crown.uRose.value=rose;crown.uWarm.value=warm;crown.uGhost.value=ghost;
    cometHeads.material.uniforms.uAmount.value=comets;
    cometHeads.material.uniforms.uTime.value=time;
    helices.material.uniforms.uComets.value=comets;
    for (const mesh of [frost, helices]) {
      const u = mesh.material.uniforms;
      u.uTime.value = time; u.uCrown.value = reveal * 1.10;
      u.uAmount.value = mesh === frost ? amount ** 1.33 : amount*(1-rose*.985);
    }
    if (amount > .42 && lastIllumination <= .42) fireClock = 0;
    lastIllumination = amount; fireClock += dt;
    if (!frost.visible) return;
    const apex = smooth(.86,1,reveal) * amount*(1-rose*.42);
    if (apex > .005) {
      if (camera) camera.getWorldDirection(normal); else normal.set(0,0,-1);
      head.set(0,4.95,0).addScaledVector(normal,-.32);
      const breathe = .94 + .06 * Math.sin(time * 1.8);
      dot(head.x,head.y,head.z,1.21,.60*apex,1,2);
      dot(head.x,head.y,head.z,1.23*breathe,apex,1,1,.015);
      dot(head.x,head.y,head.z,.68,.58*apex,6,1,Math.PI/4+.015);
    }
    // Two distant chrysanthemum bursts and a smaller echo. Slow gravity and
    // ember tails keep this background celebration separate from a hand wish.
    if (fireClock > 4.14 || amount < .12) return;
    screenBasis();
    for (let display=0; display<3; display++) {
      const age = fireClock - [.06,.85,1.66][display];
      if (age < 0 || age > 2.45) continue;
      const sideX = [.17,.84,.27][display], sideY = [.32,.28,.17][display];
      screenPoint(sideX,sideY,local,-2.1 - display*.45);
      const scale = [.95,.83,.49][display];
      for (let i=0; i<39; i++) {
        const s=flecks[135+display*43+i];
        const angle=(i+s.b*.55)*TAU/39, reward=s.d>.7 ? 1.11 : .85;
        const lifetime=1.42+s.f*.89;
        for(let tail=0; tail<4; tail++) {
          const t=age-s.b*.06-tail*.04;
          if(t<0 || t>lifetime)continue;
          const radius=(1-Math.exp(-2.45*t))*scale*reward*(.48+.49*s.c);
          const x=Math.cos(angle)*radius, y=Math.sin(angle)*radius-t*t*.123;
          const alpha=smooth(0,.045,t)*(1-t/lifetime)*(1-tail/4);
          faceDot(local,x,y,tail ? .035 : .082,alpha*(.54+s.e*.36)*amount,
            display===1 ? (i%4 ? 6 : 4) : i%4 ? 0 : 5, !tail && i%8===0 ? 1 : 0);
        }
      }
      dot(local.x,local.y,local.z,.25+age*.45,.42*Math.exp(-age*3.9)*amount,1,2);
    }
  }

  function garland(amount, dt) {
    if (amount > .08 && lastLight <= .08) lightClock = .35;
    lastLight = amount;
    if (amount <= .01) return;
    lightClock += dt;
    for (let i = 0; i < 104; i++) {
      const s = flecks[i], row = i % 2;
      const cycle = (lightClock * .22 + row * .51 - s.b * .18 + 1) % 1;
      const u = cycle * 1.17 - .07;
      if (u < 0 || u > 1) continue;
      const a = u * 21.8 + row * .22 + .58;
      const radius = 1.8 * (1 - u) ** .84 + .045 + .045 * (s.d - .5);
      const fade = smooth(0, .07, u) * (1 - smooth(.89, 1, u)) * (1 - s.b * .85);
      dot(Math.cos(a) * radius, .71 + 4.39 * u + .07 * (s.e - .5),
        Math.sin(a) * radius, .043 + (1 - s.b) * .08,
        amount * fade, row ? (i % 5 ? 2 : 3) : (i % 3 ? 0 : 1), i % 23 ? 0 : 1);
    }
  }
  function fingertip(time, charge) {
    if (charge <= .001) return;
    screenPoint(aimX, aimY, local);
    const t = time * 2.4;
    for (let i = 0; i < 54; i++) {
      const s = flecks[i];
      const u = (s.b + time * (.27 + .2 * s.c)) % 1;
      const r = (.07 + .33 * (1 - u) ** 1.8) * (.82 + s.f * .28);
      const a = t + s.a + u * 3.4;
      faceDot(local, Math.cos(a) * r, Math.sin(a) * r, .035 + s.b * .045,
        charge * (.3 + .65 * Math.sin(Math.PI * u)), i % 6 ? 0 : 3);
    }
    dot(local.x, local.y, local.z, .25 + charge * .42, charge * .65, 0, 2);
    dot(local.x, local.y, local.z, .11 + charge * .21, charge, 1, 1, time * .24);
  }
  function update(state) {
    phase = state.phase ?? 'sealed';
    const time = Number.isFinite(state.time) ? state.time : 0;
    const dt = clamp(Number.isFinite(state.dt) ? state.dt : 1 / 60, 0, .1);
    const p = clamp(state.progress ?? 0), playing = phase === 'play';
    const follow = 1 - Math.exp(-dt * 9);
    aimX = lerp(aimX, clamp(state.aimX ?? .5), follow);
    aimY = lerp(aimY, clamp(state.aimY ?? .5), follow);
    // Coarse flakes fade in behind finer particles as wind gathers.
    const snowTarget = playing ? clamp(state.snow ?? 0) : 0;
    snowOpacity = lerp(snowOpacity, snowTarget, 1 - Math.exp(-dt * 2.2));
    const snowStep=clamp(time-lastSnowClock,0,.15);
    lastSnowClock=time;
    if(snowOpacity>.002){
      const gust=.23+.20*Math.sin(time*.41)+.12*Math.sin(time*.93+.7);
      const across=(aimX-.5)*2.7+gust;
      const rightX=camera?.matrixWorld.elements[0]??1,rightZ=camera?.matrixWorld.elements[2]??0;
      const breeze=snowUniforms.uBreeze.value, catchWind=1.-Math.exp(-dt*1.8);
      breeze.x=lerp(breeze.x,across*rightX,catchWind);
      breeze.y=lerp(breeze.y,across*rightZ-.10,catchWind);
      snowUniforms.uAdvection.value.addScaledVector(breeze,snowStep);
    }
    const orbitAmount = playing ? clamp(state.scatter ?? 0) : 0;
    wisps.visible = orbitAmount > .003;
    for (const points of [galaxy, snowField]) {
      const u = points.material.uniforms;
      u.uTime.value = time;
      u.uAmount.value = points === galaxy ? orbitAmount*.63 : snowOpacity;
      u.uAim.value.set((aimX - .5) * 2, (.5 - aimY) * 2);
      points.visible = u.uAmount.value > .003;
    }
    count = 0;
    const luminous = playing || phase === 'opening' || phase === 'closing' ? clamp(state.illumination ?? 0) : 0;
    const openingFilm=phase==='opening';
    const ghost=playing?smooth(.20,.94,orbitAmount):0;
    const rose=openingFilm?smooth(.596,.725,p)*(1-smooth(.831,.985,p)):ghost;
    const warm=openingFilm?smooth(.79,.95,p):0;
    const crownAmount=Math.max(luminous,ghost*.84);
    crownLight(time,dt,crownAmount,openingFilm ? smooth(.42,.64,p) : 1,rose,warm,ghost);
    if (phase === 'sealed') idle(time);
    if (phase === 'opening') opening(time, p);
    if (playing) {
      screenBasis();
      garland(clamp(state.light ?? 0) * (1 - orbitAmount), dt);
      fingertip(time, clamp(state.charge ?? 0));
      for (let i = flights.length - 1; i >= 0; i--) {
        drawFlight(flights[i], dt);
        if (flights[i].age > flights[i].travel + 3.25){
          shellUniforms.uShell.value[flights[i].slot].w=-9;
          flights.splice(i,1);
        }
      }
    }else if(flights.length){
      for(const f of flights)shellUniforms.uShell.value[f.slot].w=-9;
      flights.length=0;
    }
    shells.visible=flights.length>0;
    if(shells.visible){
      const slots=flights.reduce((n,f)=>Math.max(n,f.slot+1),0);
      shells.geometry.setDrawRange(0,slots*raysPerShell*tailSamples);
    }
    dynamic.setDrawRange(0, count);
    // Keep this draw object visible even at zero draw count to capture the camera.
    if (count) {
      for (const attr of [locations, tints, shapes]) {
        attr.clearUpdateRanges(); attr.addUpdateRange(0, count * attr.itemSize);
        attr.needsUpdate = true;
      }
    }
  }

  function reset() {
    flights.length = 0; count = 0;
    shells.visible=false;
    for(const shell of shellUniforms.uShell.value)shell.w=-9;
    snowUniforms.uBreeze.value.set(0,0);snowUniforms.uAdvection.value.set(0,0);lastSnowClock=0;
    phase = 'sealed'; aimX = aimY = .5; snowOpacity = lastLight = lightClock = 0;
    fireClock=12;lastIllumination=0;
    galaxy.visible = wisps.visible = snowField.visible = frost.visible = helices.visible = cometHeads.visible = false;
    dynamic.setDrawRange(0, 0);
  }
  reset();
  return {group, update, wish, reset};
}
