import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

const section=document.querySelector('#pc-experience');
function start(){init().catch(error=>{
  console.error('Sophia PC preview:',error);
  section.dataset.state='error';
  section.querySelector('.pc-hint').textContent='映像を再生して、SOPHIAの世界へ';
  const fallback=document.createElement('video');
  fallback.className='pc-fallback';fallback.src=new URL('./screen-sequence.mp4',import.meta.url).href;
  fallback.controls=true;fallback.playsInline=true;fallback.poster=new URL('./screen-poster.jpg',import.meta.url).href;
  section.querySelector('.pc-fallback')?.replaceWith(fallback);
});}
if(section){const boot=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){boot.disconnect();start();}},{rootMargin:'1000px'});boot.observe(section);}

async function init(){
  const view=section.querySelector('.pc-view'),hint=section.querySelector('.pc-hint');
  const controls=section.querySelector('.pc-controls'),playButton=section.querySelector('[data-pc-play]');
  const restartButton=section.querySelector('[data-pc-restart]');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const manifest=await fetch(new URL('./manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('PC manifest unavailable');return r.json();});
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
  view.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','スクロールに合わせて回転し、定位置へ集まるモニター、キーボード、マウス');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.01,20);
  scene.add(new THREE.HemisphereLight(0xcde7ff,0x797075,3.2));
  for(const [pos,color,intensity] of [[[.5,2,2],0xffffff,5],[[-1,1,.5],0x9bbdff,3],[[1,.6,-1],0xffd79a,4]]){
    const l=new THREE.DirectionalLight(color,intensity);l.position.set(...pos);scene.add(l);
  }
  // A local studio environment supplies reflections for the original metallic textures.
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x6a7588);
  for(const [pos,scale,color] of [[[0,2,0],[4,.01,4],0xffffff],[[2,0,0],[.01,3,3],0xa8c9ff],[[-2,0,0],[.01,3,3],0xffdfbc],[[0,0,-2],[4,3,.01],0x1c2233]]){
    const box=new THREE.Mesh(new THREE.BoxGeometry(...scale),new THREE.MeshBasicMaterial({color}));box.position.set(...pos);studio.add(box);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.02);scene.environment=environment.texture;pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const gltf=await new GLTFLoader().loadAsync(new URL('./sophia-pc.glb',import.meta.url).href);
  scene.add(gltf.scene);
  const screen=gltf.scene.getObjectByName(manifest.screenMesh);
  if(!screen)throw Error('Monitor screen missing');
  const video=document.createElement('video');
  video.src=new URL('./screen-sequence.mp4',import.meta.url).href;video.muted=true;video.defaultMuted=true;
  video.playsInline=true;video.setAttribute('playsinline','');video.preload='metadata';video.loop=false;
  video.style.display='none';section.appendChild(video);
  const videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;
  videoTexture.flipY=false;videoTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const posterMaterial=screen.material;
  const videoMaterial=new THREE.MeshBasicMaterial({map:videoTexture,toneMapped:false});
  const mixer=new THREE.AnimationMixer(gltf.scene),clip=gltf.animations.find(c=>c.name===manifest.animation);
  if(!clip)throw Error('PC scroll animation missing');
  const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  let onStage=false,settled=false,manualPause=false,started=false,playPending=false,primed=false,raf=0,lastProgress=-1;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>v*v*(3-2*v);
  function resize(){
    const w=view.clientWidth,h=view.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
    lastProgress=-1;
  }
  new ResizeObserver(resize).observe(view);resize();
  async function play(){
    if(playPending||!settled||manualPause||video.ended)return;
    playPending=true;
    try{await video.play();started=true;playButton.textContent='一時停止';hint.textContent='SOPHIA FOR PC';}
    catch{playButton.textContent='画面を再生';hint.textContent='画面を再生して、SOPHIAの世界へ';}
    finally{playPending=false;}
  }
  video.addEventListener('loadeddata',()=>{if(settled)screen.material=videoMaterial;});
  video.addEventListener('ended',()=>{playButton.textContent='もう一度再生';});
  video.addEventListener('error',()=>{hint.textContent='画面の動画を読み込めませんでした';});
  playButton.addEventListener('click',()=>{
    if(!video.paused){video.pause();manualPause=true;playButton.textContent='再生';}
    else{if(video.ended)video.currentTime=0;manualPause=false;void play();}
  });
  restartButton.addEventListener('click',()=>{video.currentTime=0;manualPause=false;void play();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){video.pause();cancelAnimationFrame(raf);raf=0;}
    else if(onStage){if(settled&&started&&!manualPause&&!video.ended)void play();tick();}
  });
  function update(){
    const rect=section.getBoundingClientRect(),range=Math.max(1,section.offsetHeight-view.clientHeight);
    const p=clamp(-rect.top/range),assembly=reduce?1:clamp(p/.58);
    if(Math.abs(p-lastProgress)>.00001){
      // setTime directly maps scroll distance to baked Maya animation; reversing scroll reverses the motion.
      action.enabled=true;action.paused=false;mixer.setTime(assembly*clip.duration);lastProgress=p;
      const cp=reduce?1:smooth(clamp((p-.18)/.40));
      const distance=camera.aspect<1?2.7:1.7;
      const zoom=reduce?1:smooth(clamp((p-.64)/.20));
      const frontDistance=Math.max(.495439/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect),.278685/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))))*1.10;
      camera.position.set(THREE.MathUtils.lerp(THREE.MathUtils.lerp(-.26,0,cp),-.09,zoom),THREE.MathUtils.lerp(THREE.MathUtils.lerp(1.55,.66,cp),.2997,zoom),THREE.MathUtils.lerp(distance+THREE.MathUtils.lerp(.25,0,cp),-.16775+frontDistance,zoom));
      camera.lookAt(THREE.MathUtils.lerp(-.025,-.09,zoom),THREE.MathUtils.lerp(.24,.2997,zoom),THREE.MathUtils.lerp(0,-.16775,zoom));
      section.querySelector('.pc-copy').style.opacity=String(1-zoom);
      section.dataset.zoom=zoom.toFixed(4);
    }
    const ready=reduce?true:p>=.855;
    if(ready!==settled){
      settled=ready;controls.hidden=!ready;
      if(ready){
        section.dataset.state='settled';hint.textContent='SOPHIA FOR PC';
        if(video.readyState>=2)screen.material=videoMaterial;
        if(!reduce&&!manualPause)void play();
      }else{
        video.pause();video.currentTime=0;started=false;manualPause=false;
        screen.material=posterMaterial;section.dataset.state='assembling';hint.textContent='SCROLL TO ASSEMBLE';playButton.textContent='画面を再生';
      }
    }
    renderer.render(scene,camera);
    section.dataset.progress=p.toFixed(4);
  }
  function tick(){
    if(!onStage||document.hidden){raf=0;return;}
    update();raf=requestAnimationFrame(tick);
  }
  new IntersectionObserver(entries=>{
    const visible=entries[0].isIntersecting;
    if(visible===onStage)return;
    onStage=visible;
    if(visible){if(!primed){primed=true;video.preload='auto';video.load();}if(settled&&started&&!manualPause&&!video.ended)void play();if(!raf)tick();}
    else{cancelAnimationFrame(raf);raf=0;video.pause();}
  },{rootMargin:'150px'}).observe(section);
  section.classList.add('pc-ready');section.dataset.state='assembling';
  hint.textContent=reduce?'画面を再生して、SOPHIAの世界へ':'SCROLL TO ASSEMBLE';
  // Reduced-motion viewers see the settled model, with explicit playback controls.
  if(reduce){onStage=true;update();}
}
