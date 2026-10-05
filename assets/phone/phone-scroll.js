import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { DRACOLoader } from '../vendor/DRACOLoader.js';

const section=document.querySelector('#phone-experience');
function start(){init().catch(error=>{
  console.error('Sophia phone preview:',error);
  section.dataset.state='error';
  section.querySelector('.phone-hint').textContent='映像を再生して、SOPHIAの世界へ';
  const fallback=document.createElement('video');
  fallback.className='phone-fallback';fallback.src=new URL('./screen-sequence.mp4',import.meta.url).href;
  fallback.controls=true;fallback.playsInline=true;fallback.poster=new URL('./screen-poster.jpg',import.meta.url).href;
  section.querySelector('.phone-fallback')?.replaceWith(fallback);
});}
if(section){const boot=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){boot.disconnect();start();}},{rootMargin:'1000px'});boot.observe(section);}

async function init(){
  const view=section.querySelector('.phone-view'),hint=section.querySelector('.phone-hint');
  const controls=section.querySelector('.phone-controls'),playButton=section.querySelector('[data-phone-play]');
  const restartButton=section.querySelector('[data-phone-restart]');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const manifest=await fetch(new URL('./manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Phone manifest unavailable');return r.json();});
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  view.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','コーヒーブラウンのスマホがスクロールに合わせて回転し、画面が正面に現れる');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.001,20);
  scene.add(new THREE.HemisphereLight(0xcde7ff,0x797075,1.2));
  for(const [pos,color,intensity] of [[[.5,2,2],0xffffff,2.3],[[-1,1,.5],0x9bbdff,1.3],[[1,.6,-1],0xffd79a,2]]){
    const l=new THREE.DirectionalLight(color,intensity);l.position.set(...pos);scene.add(l);
  }
  // A local studio environment supplies reflections for the original metallic textures.
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x6a7588);
  for(const [pos,scale,color] of [[[0,2,0],[4,.01,4],0xffffff],[[2,0,0],[.01,3,3],0xa8c9ff],[[-2,0,0],[.01,3,3],0xffdfbc],[[0,0,-2],[4,3,.01],0x1c2233]]){
    const box=new THREE.Mesh(new THREE.BoxGeometry(...scale),new THREE.MeshBasicMaterial({color}));box.position.set(...pos);studio.add(box);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.02);scene.environment=environment.texture;pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  const gltf=await new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(new URL('../vendor/draco/',import.meta.url).href)).loadAsync(new URL('./sophia-mobile.glb',import.meta.url).href);
  scene.add(gltf.scene);
  const screen=gltf.scene.getObjectByName(manifest.screenMesh);
  if(!screen)throw Error('Phone screen missing');
  const video=document.createElement('video');
  video.src=new URL('./screen-sequence.mp4',import.meta.url).href;video.muted=true;video.defaultMuted=true;
  video.playsInline=true;video.setAttribute('playsinline','');video.preload='metadata';video.loop=false;
  video.style.display='none';section.appendChild(video);
  const videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.SRGBColorSpace;
  videoTexture.flipY=false;videoTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const posterMaterial=screen.material;
  const videoMaterial=new THREE.MeshBasicMaterial({map:videoTexture,toneMapped:false});
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
    try{await video.play();started=true;playButton.textContent='一時停止';hint.textContent='SOPHIA FOR MOBILE';}
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
    const p=clamp(-rect.top/range),pose=reduce?1:smooth(clamp(p/.55));
    if(Math.abs(p-lastProgress)>.00001){
      lastProgress=p;
      gltf.scene.rotation.set(THREE.MathUtils.lerp(-.25,0,pose),THREE.MathUtils.lerp(2.7,0,pose),THREE.MathUtils.lerp(.45,0,pose));
      gltf.scene.position.set(-.07*(1-pose)+.045*Math.sin(Math.PI*pose),.10*(1-pose),-.04*Math.sin(Math.PI*pose));
      const distance=Math.max(.143974/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))),.06932/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect))*1.18;
      camera.position.set(0,0,distance+.16*(1-pose));camera.lookAt(0,0,0);
      section.querySelector('.phone-copy').style.opacity=String(1-pose);
    }
    const ready=reduce?true:p>=.57;
    if(ready!==settled){
      settled=ready;controls.hidden=!ready;
      if(ready){
        section.dataset.state='settled';hint.textContent='SOPHIA FOR MOBILE';
        if(video.readyState>=2)screen.material=videoMaterial;
        if(!reduce&&!manualPause)void play();
      }else{
        video.pause();video.currentTime=0;started=false;manualPause=false;
        screen.material=posterMaterial;section.dataset.state='approaching';hint.textContent='SCROLL TO EXPLORE';playButton.textContent='画面を再生';
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
  section.classList.add('phone-ready');section.dataset.state='approaching';
  hint.textContent=reduce?'画面を再生して、SOPHIAの世界へ':'SCROLL TO EXPLORE';
  // Reduced-motion viewers see the settled model, with explicit playback controls.
  if(reduce){onStage=true;update();}
}
