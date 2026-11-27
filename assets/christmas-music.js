// "Lamplight on Snow" — an original miniature in G major, 6/8, dotted quarter = 64.
// Each row is one bar: cello bass, harp voicing, then melody as [MIDI note, eighths].
const bars = [
  [43,[55,62,64,71],[[71,1],[74,1],[69,1],[67,3]]],
  [42,[54,62,66,69],[[69,2],[66,1],[64,1],[66,1],[69,1]]],
  [40,[55,59,62,67],[[67,1],[71,1],[74,1],[76,2],[74,1]]],
  [47,[54,59,62,69],[[74,2],[69,1],[66,2],[0,1]]],
  [48,[55,60,64,71],[[76,1],[74,1],[71,1],[67,2],[69,1]]],
  [47,[55,59,62,67],[[71,2],[69,1],[67,2],[64,1]]],
  [45,[55,60,64,69],[[72,1],[71,1],[69,1],[72,2],[74,1]]],
  [38,[54,60,62,69],[[69,2],[66,1],[62,2],[0,1]]],

  [40,[55,59,66,71],[[71,2],[74,1],[76,2],[79,1]]],
  [39,[54,59,63,69],[[78,2],[75,1],[71,3]]],
  [47,[55,59,64,67],[[76,1],[74,1],[71,1],[67,2],[69,1]]],
  [38,[55,59,65,67],[[71,2],[72,1],[74,2],[77,1]]],
  [48,[55,60,64,67],[[76,2],[79,1],[81,1],[79,2]]],
  [45,[55,60,64,71],[[76,2],[72,1],[71,2],[69,1]]],
  [50,[55,60,62,67],[[74,1],[79,1],[76,1],[74,2],[72,1]]],
  [38,[54,60,62,69],[[69,2],[66,1],[69,2],[0,1]]],

  [43,[55,62,67,71],[[71,1],[74,1],[69,1],[67,2],[74,1]]],
  [42,[54,62,66,69],[[78,2],[76,1],[74,2],[69,1]]],
  [40,[55,59,64,71],[[67,1],[71,1],[74,1],[79,2],[76,1]]],
  [38,[55,59,62,67],[[74,3],[71,2],[0,1]]],
  [48,[55,60,64,71],[[76,1],[79,1],[74,1],[72,2],[71,1]]],
  [45,[55,60,64,69],[[69,2],[72,1],[76,2],[74,1]]],
  [38,[54,60,62,69],[[74,2],[69,1],[66,2],[69,1]]],
  [43,[55,59,62,67],[[67,4],[0,2]]]
];
const eighth = 60 / 64 / 3;
const length = bars.length * 6 * eighth;
const frequency = midi => 440 * 2 ** ((midi - 69) / 12);

function arrange() {
  const notes = [];
  const push = (bar, beat, instrument, pitch, duration, level) =>
    notes.push({at: (bar*6 + beat)*eighth, instrument, pitch, duration, level});
  bars.forEach(([bass, chord, melody], bar) => {
    const bridge = bar >= 8 && bar < 16;
    const swell = 1 + .12*Math.sin((bar % 8) / 7 * Math.PI);
    let beat = 0;
    for (const [pitch, value] of melody) {
      if (pitch) {
        const level = (beat === 0 || beat === 3 ? 1 : .82) * swell;
        push(bar, beat, bridge ? 'viola' : 'box', pitch, value*eighth, level);
        if (bridge && value >= 2 && bar % 2 === 0)
          push(bar, beat+.09, 'box', pitch+12, 1.3*eighth, level*.31);
      }
      beat += value;
    }
    // The cello carries the lower line all the way from G through F sharp to E.
    push(bar, .025, 'cello', bass, (bar === 23 ? 4.3 : 5.40)*eighth, swell);
    // The harp leaves breathing room around each answer to the four-note opening.
    const picking = bar % 4 === 3 ? [[0,0],[2,1],[3,2]] :
      bar % 2 ? [[0,0],[1,1],[2,2],[3,1],[5,3]] : [[0,0],[2,2],[3,1],[4,3]];
    for (const [pulse, voice] of picking)
      push(bar, pulse+.052+(voice%2)*.022, 'harp', chord[voice], 1.95*eighth, pulse===0?.90:.68);
    if (!bridge && bar>=4 && bar<23)
      push(bar, .14, 'inner', chord[2], 5.16*eighth, bar>=16?.88:.64);
  });
  return notes.sort((a,b) => a.at-b.at);
}

const score = arrange();

// Short, pitched one-shots use reproducible partials. The box's higher tines die
// away ahead of the fundamental. The harp has a quieter, off-centre plucked attack.
function pluckedBuffer(ctx, harp) {
  const rate=24000, root=frequency(harp?60:72), seconds=harp?2.7:3.2;
  const buffer=ctx.createBuffer(1,Math.ceil(rate*seconds),rate), out=buffer.getChannelData(0);
  const tones=harp ? [[1,.78,2.9],[2,.37,4.0],[3,.18,5.7],[4,.075,8],[6,.044,11]] :
    [[1,.80,1.78],[2.002,.20,3.35],[3.985,.16,4.9],[6.29,.068,9.8],[8.38,.023,15]];
  for(const [ratio,amp,decay] of tones){
    const step=2*Math.PI*root*ratio/rate, coefficient=2*Math.cos(step);
    const loss=Math.exp(-decay/rate);
    let previous=0, current=Math.sin(step), weight=amp;
    for(let i=0;i<out.length;i++){
      out[i]+=previous*weight;
      const next=coefficient*current-previous; previous=current; current=next; weight*=loss;
    }
  }
  for(let i=0;i<out.length;i++)
    out[i]*=Math.min(1,i/(rate*(harp?.009:.004)),(out.length-1-i)/(rate*.038));
  return buffer;
}

function instruments(ctx) {
  function bow(harmonics){
    return ctx.createPeriodicWave(new Float32Array(harmonics.length),new Float32Array(harmonics));
  }
  const viola=bow([0,1,.47,.35,.12,.15,.090,.047,.048,.021,.012,.009]);
  const cello=bow([0,.87,.70,.34,.16,.12,.082,.051,.037,.026,.017,.012,.007]);
  // A short stereo room, with early reflections and a quickly darkening decay.
  const rate=ctx.sampleRate,room=ctx.createBuffer(2,Math.round(rate*.92),rate);
  let seed=251223;
  function noise(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;}
  for(let channel=0;channel<2;channel++){
    const data=room.getChannelData(channel);
    let low=0;
    for(let i=Math.floor(.018*rate);i<data.length;i++){
      const time=i/rate,white=noise();low+=.20*(white-low);
      data[i]=(.48*low+.13*white*Math.exp(-time*9))*Math.exp(-time*6.8)*Math.min(1,(time-.018)/.025);
    }
    for(const [time,level] of [[.023,.66],[.041,.40],[.068,.29],[.097,.15]])
      data[Math.round((time+channel*.005)*rate)]+=level;
  }
  return {box:pluckedBuffer(ctx,false),harp:pluckedBuffer(ctx,true),viola,cello,room};
}

function ensemble(ctx,kit) {
  const output=ctx.createGain(), room=ctx.createConvolver(), wet=ctx.createGain(), music=ctx.createGain();
  const compressor=ctx.createDynamicsCompressor();
  compressor.threshold.value=-10;compressor.knee.value=7;compressor.ratio.value=2;
  compressor.attack.value=.012;compressor.release.value=.15;
  output.gain.value=.87;wet.gain.value=.19;room.buffer=kit.room;
  music.connect(compressor);room.connect(wet).connect(compressor);compressor.connect(output).connect(ctx.destination);
  const definitions={box:[.19,.18],harp:[.103,-.32],viola:[.128,.07],cello:[.113,-.13],inner:[.064,.31],chime:[.13,-.04]};
  const buses={};
  for(const [name,[level,pan]] of Object.entries(definitions)){
    const gain=ctx.createGain(), stereo=ctx.createStereoPanner();
    gain.gain.value=level;stereo.pan.value=pan;gain.connect(stereo);
    stereo.connect(name==='chime'?compressor:music);stereo.connect(room);
    buses[name]={gain,stereo};
  }
  const voices=new Set();
  function play(event,when,offset=0) {
    const {instrument:name,pitch,duration,level}=event;
    const plucked=name==='box'||name==='harp'||name==='chime';
    const tail=plucked?(name==='harp'?.53:.85):.21;
    const end=duration+tail;
    if(offset>=end)return;
    const envelope=ctx.createGain();
    let source;
    if(plucked){
      const harp=name==='harp', rate=2**((pitch-(harp?60:72))/12);
      const sample=harp?kit.harp:kit.box;
      if(offset*rate>=sample.duration)return;
      source=ctx.createBufferSource();source.buffer=sample;source.playbackRate.value=rate;
      if(offset>0){
        const activeLevel=level*Math.exp(-Math.max(0,offset-duration)*4/tail);
        envelope.gain.setValueAtTime(0,when);
        envelope.gain.linearRampToValueAtTime(activeLevel,when+Math.min(.022,(end-offset)*.2));
      }else envelope.gain.setValueAtTime(level,when);
      envelope.gain.setTargetAtTime(0,when+Math.max(.026,duration-offset),tail/4);
    }else{
      source=ctx.createOscillator();source.setPeriodicWave(name==='cello'?kit.cello:kit.viola);
      source.frequency.value=frequency(pitch);
      const attack=name==='cello'?.17:.10, remaining=end-offset;
      const vibrato=new Float32Array(Math.max(4,Math.ceil(remaining*44)));
      const bowPressure=new Float32Array(vibrato.length);
      for(let i=0;i<vibrato.length;i++){
        const local=remaining*i/(vibrato.length-1),age=offset+local;
        const onset=Math.min(1,age/attack,offset?local/.025:1);
        const release=Math.min(1,Math.max(0,(end-age)/tail));
        const swell=.80+.20*Math.sin(Math.PI*Math.min(1,age/duration));
        bowPressure[i]=onset*swell*level*release*release;
        vibrato[i]=Math.min(1,age*4)*(name==='cello'?5.1:8.6)*Math.sin(2*Math.PI*age*(name==='cello'?4.52:5.16)+pitch*.7);
      }
      source.detune.setValueCurveAtTime(vibrato,when,remaining);
      envelope.gain.setValueCurveAtTime(bowPressure,when,remaining);
    }
    source.connect(envelope).connect(buses[name].gain);
    voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();envelope.disconnect();};
    if(plucked)source.start(when,offset*source.playbackRate.value);else source.start(when);
    source.stop(when+end-offset);
  }
  let lastChime=-Infinity;
  function chime(hz,volume=.045,duration=1.5){
    const now=ctx.currentTime;
    if(now-lastChime<.055)return;
    lastChime=now;
    music.gain.cancelScheduledValues(now);music.gain.setTargetAtTime(.85,now,.022);
    music.gain.setTargetAtTime(1,now+.15,.22);
    play({instrument:'chime',pitch:69+12*Math.log2(hz/440),duration:Math.min(2,duration)*.76,level:Math.min(.94,volume*12)},now+.003);
  }
  function fade(){
    const now=ctx.currentTime;
    output.gain.cancelScheduledValues(now);output.gain.setTargetAtTime(0,now,.007);
    for(const source of voices)source.stop(now+.034);
  }
  function dispose(){
    for(const {gain,stereo} of Object.values(buses)){gain.disconnect();stereo.disconnect();}
    for(const node of [room,wet,music,compressor,output])node.disconnect();
  }
  return {play,chime,fade,dispose};
}

export function createChristmasMusic(){
  let ctx,kit,band,enabled=false,serial=0,timer=0,position=0,origin=0;
  async function start(){
    if(enabled)return;
    enabled=true;const token=++serial;
    try{
      ctx??=new (window.AudioContext||window.webkitAudioContext)();
      await ctx.resume();
      if(!enabled||serial!==token)return;
      kit??=instruments(ctx);
      band=ensemble(ctx,kit);
      origin=ctx.currentTime+.035-position;
      // Restore sustained notes at the pause point; a slow visual frame never
      // shifts the musical clock or causes a burst of overdue attacks.
      let pass=Math.floor(Math.max(0,position-3)/length), next=0;
      function pump(){
        if(!enabled||serial!==token)return;
        const now=ctx.currentTime;
        let at=origin+pass*length+score[next].at;
        while(at<=now+.64){
          const when=Math.max(at,now+.006);
          band.play(score[next],when,when-at);
          if(++next===score.length){next=0;pass++;}
          at=origin+pass*length+score[next].at;
        }
        timer=setTimeout(pump,100);
      }
      pump();
    }catch(error){if(serial!==token)return;pause();throw error;}
  }
  function pause(){
    if(!enabled)return;
    enabled=false;++serial;clearTimeout(timer);
    const previous=band;band=null;
    if(previous){position=Math.max(0,ctx.currentTime-origin);previous.fade();}
    setTimeout(()=>{previous?.dispose();if(!enabled)ctx?.suspend().catch(()=>{});},45);
  }
  return {start,pause,chime(...args){band?.chime(...args);},get active(){return enabled;}};
}
