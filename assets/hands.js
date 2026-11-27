import {t} from './i18n.js';

export function createHands({video, button, onAim, onEffect, onPinch, onRelease, onCancel, onStatus, inputPaused=()=>false}){
  let model=null,loading=null,stream=null,session=0,state='off',frame=0;
  function display(){
    const starting=state==='starting',on=state==='on';
    const label=starting?t('取消开启','Cancel'):on?t('关闭摄像头','Stop camera'):t('手势互动','Hand gestures');
    button.firstElementChild.className='icon '+(starting?'stop':'video');button.lastElementChild.textContent=label;
    button.setAttribute('aria-pressed',String(starting||on));
    button.title=state==='off'?t('开启摄像头手势','Enable camera gestures'):label;
    button.setAttribute('aria-label',button.title);
  }
  display();window.addEventListener('gift-languagechange',display);
  function stop(zh='',en=''){
    session++;state='off';cancelAnimationFrame(frame);
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    video.pause();video.srcObject=null;video.hidden=true;onCancel();
    display();if(zh)onStatus(zh,en);
  }
  async function getModel(){
    if(model)return model;
    if(!loading)loading=(async()=>{
      const {FilesetResolver,GestureRecognizer}=await import('./vision/vision_bundle.mjs');
      const wasm=await FilesetResolver.forVisionTasks(new URL('./vision/wasm',import.meta.url).href);
      model=await GestureRecognizer.createFromOptions(wasm,{
        baseOptions:{modelAssetPath:new URL('./vision/gesture_recognizer.task',import.meta.url).href},
        runningMode:'VIDEO',numHands:1
      });return model;
    })().finally(()=>{loading=null});
    return loading;
  }
  const actions={Open_Palm:'scatter',Closed_Fist:'gather',Victory:'snow'};
  function track(token){
    let lastTime=-1,lastInference=0,candidate='',since=0,applied='',lastSeen=0,pinched=false,pinchStart=0;
    function tick(now){
      if(token!==session)return;
      if(inputPaused()){
        if(pinched)onCancel();
        pinched=false;candidate='';applied='';frame=requestAnimationFrame(tick);return;
      }
      if(video.readyState>=2 && video.currentTime!==lastTime && now-lastInference>=105){
        lastTime=video.currentTime;lastInference=now;
        let result;
        try{result=model.recognizeForVideo(video,now)}catch{stop('识别已中断，可重新开启手势','Hand tracking stopped. Turn the camera on to try again.');return}
        const best=result.gestures[0]?.[0],hand=result.landmarks[0];
        const effect=best?.score>=.58?actions[best.categoryName]:'';
        if(hand){
          lastSeen=now;
          const distance=(a,b)=>Math.hypot(hand[a].x-hand[b].x,hand[a].y-hand[b].y);
          const palm=Math.max(.025,distance(0,9)),ratio=distance(4,8)/palm;
          const pinch=ratio<.32 && distance(0,8)>palm && best?.categoryName!=='Closed_Fist';
          if(pinch||pinched){
            onAim(1-(hand[4].x+hand[8].x)/2,(hand[4].y+hand[8].y)/2);
            if(pinch && !pinched){pinched=true;pinchStart=now;onPinch()}
            else if(pinched && (ratio>.46 || best?.categoryName==='Closed_Fist')){
              if(now-pinchStart>180)onRelease();else onCancel();pinched=false;
            }
            candidate='';applied='';
          }else{
            onAim(1-hand[9].x,hand[9].y);
            if(candidate!==effect){candidate=effect;since=now}
            if(effect && effect!==applied && now-since>=225){applied=effect;onEffect(effect)}
            if(!effect && now-since>600)applied='';
          }
        }else{
          if(pinched){pinched=false;onCancel()}
          candidate='';
          if(now-lastSeen>650)applied='';
        }
      }
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  button.addEventListener('click',async()=>{
    if(state!=='off'){stop('摄像头已关闭。仍可通过鼠标或触屏互动。','Camera off. You can still play with your mouse or touchscreen.');return}
    if(!navigator.mediaDevices?.getUserMedia){onStatus('请通过本地启动器或 HTTPS 打开，以启用摄像头','Open this gift with the local launcher or over HTTPS to use your camera.');return}
    const token=++session;state='starting';display();onStatus('等待摄像头授权…','Waiting for camera permission…');
    try{
      const capture=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:360}},audio:false});
      if(token!==session){capture.getTracks().forEach(t=>t.stop());return}
      stream=capture;video.srcObject=stream;await video.play();if(token!==session)return;
      video.hidden=false;onStatus('正在载入本地手势模型…','Loading hand tracking on this device…');await getModel();if(token!==session)return;
      state='on';display();onStatus('摄像头已开启，试试张开手掌。','Camera on. Hold up an open palm.');
      capture.getVideoTracks()[0].addEventListener('ended',()=>{if(token===session)stop('摄像头已断开','Camera disconnected.')},{once:true});track(token);
    }catch(e){
      if(token!==session)return;
      const messages={
        NotAllowedError:['摄像头权限未开启。下方四种效果均可点击体验。','Camera access is off. Tap any of the four effects below.'],
        NotFoundError:['未检测到摄像头。可用鼠标或触屏体验。','No camera found. Use your mouse or touchscreen to play.'],
        NotReadableError:['摄像头被占用，可关闭占用程序后重试。','Your camera is in use. Close the other app and try again.']
      };
      stop(...(messages[e.name]||['手势模型未能启动，可重试或点击下方效果。','Hand tracking could not start. Try again or tap an effect below.']));
    }
  });
  return {stop};
}
