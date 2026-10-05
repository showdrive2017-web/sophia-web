import * as THREE from 'three';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {DRACOLoader} from '../vendor/DRACOLoader.js';
import {choreography,keyboardQuaternion,advanceProgress,phoneLaunchOffset,stageProgress} from './choreography.js?v=7a';
import {phoneCaption} from './captions.js?v=9';
import {completionLift,completionHandoff} from './completion.js?v=9';
import {Stardust} from './stardust.js?v=6';
import {keyTravel} from './typing.js?v=6';
const section=document.querySelector('#device-experience');
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)},lerp=THREE.MathUtils.lerp;
let hold=null,holdY=0,snap=false;
// Keep wheel, touch, keyboard and scrollbar movement at the same playback position.
function preventScroll(e){if(hold&&!e.ctrlKey&&(!e.touches||e.touches.length===1))e.preventDefault()}
addEventListener('wheel',preventScroll,{passive:false,capture:true});
addEventListener('touchmove',preventScroll,{passive:false,capture:true});
addEventListener('keydown',e=>{if(hold&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest('input,textarea,select')&&!(e.key===' '&&e.target.closest('button')))e.preventDefault()},{capture:true});
addEventListener('scroll',()=>{if(hold&&!snap&&Math.abs(scrollY-holdY)>1){snap=true;window.sophiaScroll?.jump(holdY);window.scrollTo(0,holdY);snap=false}},{passive:true});
function scrollHold(y,phase){hold=phase;holdY=y;window.sophiaScroll?.hold(y);window.scrollTo(0,y);window.sophiaCinema={holding:true,phase,since:performance.now()};section.dataset.locked=phase;document.body.classList.add('device-holding')}
function scrollRelease(){hold=null;window.sophiaScroll?.release();window.sophiaCinema={holding:false};delete section.dataset.locked;document.body.classList.remove('device-holding')}
async function init(){
 const view=section.querySelector('.device-view'),hint=section.querySelector('.device-hint'),ui=section.querySelector('.device-controls'),msg=section.querySelector('.device-message'),play=section.querySelector('[data-device-play]'),restart=section.querySelector('[data-device-restart]'),skip=section.querySelector('[data-device-skip]'),bar=section.querySelector('.device-progress i');
 const caption=section.querySelector('.device-caption');let captionId=null;
 document.body.append(view,ui,hint,caption);
 function updateCaption(){
  const phase=phases.phone,visible=current===phase&&['playing','done'].includes(phase.status)&&motion.phone.value>=.335&&motion.phone.value<=.405;
  const compact=view.clientWidth/view.clientHeight<=1.25||view.clientWidth<=900;
  const cue=visible?phoneCaption(phase.v.currentTime,compact):null;
  if(!cue){caption.hidden=true;caption.classList.remove('on');captionId=null;section.dataset.caption='';return}
  caption.hidden=false;
  const cueKey=cue.id+':'+compact;
  if(captionId!==cueKey){
   captionId=cueKey;caption.classList.remove('on');caption.dataset.side=cue.side;
   const lines=texts=>texts.map((text,i)=>{const line=document.createElement('span'),inner=document.createElement('span');line.className='caption-line';inner.textContent=text;inner.style.setProperty('--line',i);line.append(inner);return line});
   const content=cue.panels?cue.panels.map(panel=>{const el=document.createElement('span');el.className='caption-panel';el.dataset.side=panel.side;el.append(...lines(panel.lines));return el}):lines(cue.lines);
   if(cue.note){const note=document.createElement('small');note.className='caption-note';note.textContent=cue.note;content.push(note)}
   caption.replaceChildren(...content);
   requestAnimationFrame(()=>requestAnimationFrame(()=>{if(captionId===cueKey&&!caption.hidden)caption.classList.add('on')}));
  }
  if(cue.panels)caption.querySelectorAll('.caption-panel').forEach((el,i)=>{el.classList.toggle('revealed',cue.panels[i].visible);el.setAttribute('aria-hidden',String(!cue.panels[i].visible))});
  section.dataset.caption=String(cue.id);
 }
 const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const r=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio,1.75));r.setClearColor(0,0);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;view.append(r.domElement);r.domElement.setAttribute('aria-label','スマホ、モニター、キーボード、マウスが一緒に落下し、スマホ、PCの順に正面に現れる');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.001,25);
 scene.add(new THREE.HemisphereLight(0xcde7ff,0x797075,2.3));
 for(const[pos,color,intensity]of[[[.5,2,2],0xffffff,3.5],[[-1,1,.5],0x9bbdff,1.8],[[1,.6,-1],0xffd79a,2.8]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...pos);scene.add(light)}
 const studio=new THREE.Scene();studio.background=new THREE.Color(0x6a7588);
 for(const[pos,scale,color]of[[[0,2,0],[4,.01,4],0xffffff],[[2,0,0],[.01,3,3],0xa8c9ff],[[-2,0,0],[.01,3,3],0xffdfbc],[[0,0,-2],[4,3,.01],0x1c2233]]){const box=new THREE.Mesh(new THREE.BoxGeometry(...scale),new THREE.MeshBasicMaterial({color}));box.position.set(...pos);studio.add(box)}
 const pm=new THREE.PMREMGenerator(r);scene.environment=pm.fromScene(studio,.02).texture;pm.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
 const loader=new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(new URL('../vendor/draco/',import.meta.url).href));   // the models are Draco-compressed (about a seventh of the size)
 const [pc,mobile]=await Promise.all([loader.loadAsync(new URL('../pc/sophia-pc.glb?v=10',import.meta.url).href),loader.loadAsync(new URL('../phone/sophia-mobile.glb?v=10',import.meta.url).href)]);scene.add(pc.scene,mobile.scene);mobile.scene.scale.setScalar(2.2);mobile.scene.updateMatrixWorld(true);
 const phoneBounds=new THREE.Box3().setFromObject(mobile.scene),phoneCorner=new THREE.Vector3();
 // Use independent world-space paths. The original Maya geometry stays intact.
 const parts={};pc.scene.updateMatrixWorld(true);
 for(const [key,name]of[['monitor','Sophia_Monitor'],['keyboard','Sophia_Keyboard'],['mouse','Sophia_Mouse']]){const node=pc.scene.getObjectByName(name);scene.attach(node);parts[key]={node,base:node.quaternion.clone()}}
 parts.keyboard.node.traverse(o=>{if(o.isMesh&&o.material.normalScale)o.material.normalScale.set(.35,.35)});
 for(const part of Object.values(parts))part.node.traverse(o=>{if(o.isMesh&&o.material.name.startsWith('Sophia_Clean'))o.material.envMapIntensity=.30});
 const keys=[];parts.keyboard.node.traverse(o=>{if(o.userData.sophiaKey)keys.push({node:o,y:o.position.y})});
 keys.sort((a,b)=>{a.node.geometry.computeBoundingBox();b.node.geometry.computeBoundingBox();return a.node.geometry.boundingBox.getCenter(new THREE.Vector3()).x-b.node.geometry.boundingBox.getCenter(new THREE.Vector3()).x});
 const typingCount=Math.min(24,keys.length);
 const dust=new Stardust(scene,[mobile.scene,parts.monitor.node,parts.keyboard.node,parts.mouse.node],r.getPixelRatio());
 function pose(part,pos,angles){part.node.position.set(...pos);part.node.quaternion.setFromEuler(new THREE.Euler(...angles)).multiply(part.base)}
 const phases={};
 for(const [name,screenName,point,next]of[['phone','Sophia_Mobile_Screen',.36,.425],['pc','Sophia_Screen',.74,.79]]){
  const v=document.createElement('video');v.src=new URL('../'+name+'/screen-sequence.mp4?v=10',import.meta.url).href;v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='metadata';v.hidden=true;section.append(v);
  const screen=(name==='pc'?parts.monitor.node:mobile.scene).getObjectByName(screenName);if(!screen)throw Error('Missing display');
  const tx=new THREE.VideoTexture(v);tx.colorSpace=THREE.SRGBColorSpace;tx.flipY=false;tx.anisotropy=Math.min(8,r.capabilities.getMaxAnisotropy());const mat=new THREE.MeshBasicMaterial({map:tx,toneMapped:false});
  const phase={name,v,screen,poster:screen.material,mat,point,next,status:'pending',paused:false,primed:false,push:0,launchTime:0,completedAt:0,lift:0};phases[name]=phase;
  v.addEventListener('loadeddata',()=>{if(current===phase)screen.material=mat});
  v.addEventListener('timeupdate',()=>{if(current===phase&&Number.isFinite(v.duration))bar.style.width=(100*v.currentTime/v.duration)+'%'});
  v.addEventListener('ended',()=>{phase.status='done';phase.completedAt=performance.now();phase.paused=false;if(hold===name)scrollRelease();msg.textContent='↓ スクロールして、次のシーンへ';play.textContent='もう一度再生';ui.classList.add('finished');hint.textContent=''});
  v.addEventListener('error',()=>{if(current===phase){msg.textContent='映像を読み込めませんでした。スキップで先へ進めます。';play.textContent='再生を試す'}});
 }
 let current=null,raf=0,typingEvents=0,previousPressed=0;
 function geometry(){const start=innerHeight*.04,end=section.getBoundingClientRect().top+scrollY+section.offsetHeight-view.clientHeight;return{top:start,range:end-start}}
 function show(phase){current=phase;ui.hidden=false;ui.classList.toggle('finished',phase.status==='done');hint.textContent=phase.name==='phone'||phase.status==='done'?'':'SOPHIA FOR PC';play.disabled=['framing','launching'].includes(phase.status);play.textContent=phase.status==='done'?'もう一度再生':phase.v.paused?'再生':'一時停止';bar.style.width=(Number.isFinite(phase.v.duration)?100*phase.v.currentTime/phase.v.duration:0)+'%'}
 async function run(phase){show(phase);phase.paused=false;if(phase.v.readyState>=2)phase.screen.material=phase.mat;msg.textContent='映像の終わりまでご覧ください';try{await phase.v.play();if(current!==phase||phase.status==='skipped'){phase.v.pause();return}play.textContent='一時停止'}catch{play.textContent='画面を再生';msg.textContent='「画面を再生」で映像が始まります。スキップで先へ進めます。'}}
 function enter(phase){phase.status='framing';phase.push=0;phase.launchTime=0;phase.completedAt=0;const g=geometry();scrollHold(g.top+g.range*phase.point,phase.name);show(phase);phase.v.preload='auto';msg.textContent='画面が正面に来たら再生します';play.textContent='再生'}
 function skipCurrent(){if(!current)return;const phase=current;phase.status='skipped';phase.v.pause();scrollRelease();const g=geometry();const target=phase.next===1?g.top+section.offsetHeight-view.clientHeight*.14:g.top+g.range*phase.next;window.sophiaScroll?.jump(target);window.scrollTo(0,target)}
 skip.addEventListener('click',skipCurrent);
 play.addEventListener('click',()=>{if(!current)return;const p=current;if(!p.v.paused){p.paused=true;p.v.pause();play.textContent='再生'}else{if(p.v.ended||p.status==='done'||p.status==='skipped'){p.v.currentTime=0;enter(p)}else void run(p)}});
 restart.addEventListener('click',()=>{if(!current)return;current.v.currentTime=0;enter(current)});
 function resize(){const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;r.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(hold){const g=geometry();holdY=g.top+g.range*phases[hold].point;window.sophiaScroll?.jump(holdY);window.scrollTo(0,holdY)}}new ResizeObserver(resize).observe(view);resize();
 const route=document.querySelector('#constellation'),trail=route.querySelector('.trail'),pen=document.querySelector('#pen');
 const lineMaterial=new THREE.MeshBasicMaterial({color:0xffe6b2,transparent:true,opacity:.87,depthWrite:false});
 const line=new THREE.Mesh(new THREE.BufferGeometry(),lineMaterial);scene.add(line);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
 const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(255,255,240,1)');gradient.addColorStop(.12,'rgba(255,237,194,.98)');gradient.addColorStop(.35,'rgba(239,196,117,.25)');gradient.addColorStop(1,'rgba(239,196,117,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 const glowTexture=new THREE.CanvasTexture(glowCanvas);
 const starMaterial=new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const star=new THREE.Sprite(starMaterial);scene.add(star);
 const nodeStars=[...document.querySelectorAll('[data-node]')].filter(el=>!el.closest('#film')).map(el=>{const sprite=new THREE.Sprite(starMaterial.clone());scene.add(sprite);return{el,sprite}});
 const satellites=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xeac98a,transparent:true,opacity:.45,depthWrite:false}));scene.add(satellites);
 const satStars=Array.from({length:64},()=>{const sprite=new THREE.Sprite(starMaterial.clone());sprite.material.opacity=.6;scene.add(sprite);return sprite});
 let cachedD='',routePoints=[],satGroups=[],routeLength=0,lastLineTime=0;
 function depthRoute(z,now){
  const d=trail.getAttribute('d');if(!d){line.visible=star.visible=false;return}
  if(cachedD!==d){cachedD=d;routeLength=trail.getTotalLength();routePoints=[];for(let l=0;l<=routeLength;l+=8){const point=trail.getPointAtLength(l);routePoints.push({x:point.x,y:point.y,l})}satGroups=[...route.querySelectorAll('.sat')].map(el=>({el,lines:[...el.querySelectorAll('line')],stars:[...el.querySelectorAll('circle')]}))}
  const rect=route.getBoundingClientRect(),drawn=routeLength-(parseFloat(trail.style.strokeDashoffset)||0),height=view.clientHeight,width=view.clientWidth;
  const project=(x,y)=>{const ray=new THREE.Vector3(x/width*2-1,1-y/height*2,.5).unproject(camera).sub(camera.position).normalize();return camera.position.clone().addScaledVector(ray,(z-camera.position.z)/ray.z)};
  // Reuse the authored curved route, with genuine depth testing against all four models.
  if(now-lastLineTime>32){lastLineTime=now;const points=routePoints.filter(o=>o.l<=drawn&&o.y+rect.top>-80&&o.y+rect.top<height+80).map(o=>project(o.x+rect.left,o.y+rect.top));line.visible=points.length>1;
   if(line.visible){const path=points.length===2?new THREE.LineCurve3(points[0],points[1]):new THREE.CatmullRomCurve3(points),pixel=camera.position.distanceTo(project(width/2,height/2))*2*Math.tan(16*Math.PI/180)/height;line.geometry.dispose();line.geometry=new THREE.TubeGeometry(path,Math.min(140,points.length*2),pixel*.7,4,false)}
  }
  const x=Number(pen.getAttribute('cx'))+rect.left,y=Number(pen.getAttribute('cy'))+rect.top;
  star.visible=y>-50&&y<height+50&&Number(pen.style.opacity)!==0;
  if(star.visible){star.position.copy(project(x,y));const pixel=camera.position.distanceTo(star.position)*2*Math.tan(16*Math.PI/180)/height;star.scale.setScalar(pixel*46)}
  const pixelScale=point=>camera.position.distanceTo(point)*2*Math.tan(16*Math.PI/180)/height;
  for(const {el,sprite}of nodeStars){const box=el.getBoundingClientRect(),y=box.top+box.height/2;sprite.visible=y>-70&&y<height+70&&!el.closest('#download');if(sprite.visible){sprite.position.copy(project(box.left+box.width/2,y));sprite.material.opacity=el.classList.contains('lit')?1:.20;sprite.scale.setScalar(pixelScale(sprite.position)*(el.classList.contains('lit')?62:24))}}
  const vertices=[];let count=0;
  for(const group of satGroups){if(!group.el.classList.contains('on'))continue;for(const el of group.lines){const y1=Number(el.getAttribute('y1'))+rect.top,y2=Number(el.getAttribute('y2'))+rect.top;if(Math.max(y1,y2)<-40||Math.min(y1,y2)>height+40)continue;vertices.push(...project(Number(el.getAttribute('x1'))+rect.left,y1).toArray(),...project(Number(el.getAttribute('x2'))+rect.left,y2).toArray())}for(const el of group.stars){const y=Number(el.getAttribute('cy'))+rect.top;if(y<-40||y>height+40||count>=satStars.length)continue;const sprite=satStars[count++];sprite.visible=true;sprite.position.copy(project(Number(el.getAttribute('cx'))+rect.left,y));sprite.scale.setScalar(pixelScale(sprite.position)*14)}}
  for(let i=count;i<satStars.length;i++)satStars[i].visible=false;
  satellites.geometry.dispose();satellites.geometry=new THREE.BufferGeometry();satellites.geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));satellites.visible=vertices.length>0;
 }
 let visualP=clamp((scrollY-geometry().top)/geometry().range),previousTime=performance.now();
 const motion=Object.fromEntries(['phone','monitor','keyboard','mouse'].map(key=>[key,{value:visualP,velocity:0}]));
 const response={phone:[6.5,.86],monitor:[4.8,.78],keyboard:[5.8,.74],mouse:[7.8,.68]};
 function update(now){
  const dt=Math.min(.1,(now-previousTime)/1000);previousTime=now;
  const g=geometry();let target=clamp((scrollY-g.top)/g.range);
  if(target<.015&&!hold){for(const phase of Object.values(phases)){if(phase.status!=='pending'){phase.status='pending';phase.push=0;phase.completedAt=0;phase.lift=0;phase.v.pause();phase.v.currentTime=0;phase.screen.material=phase.poster}}}
  if(!hold&&target>=phases.phone.point&&phases.phone.status==='pending'){enter(phases.phone);target=phases.phone.point}
  else if(!hold&&target>=phases.pc.point&&phases.pc.status==='pending'&&phases.phone.status!=='pending'){enter(phases.pc);target=phases.pc.point}
  visualP=reduce?target:lerp(visualP,target,1-Math.exp(-dt*5));
  if(Math.abs(visualP-target)<.00005)visualP=target;
  const clocks={};for(const key of Object.keys(motion)){if(reduce){motion[key].value=target;motion[key].velocity=0}clocks[key]=reduce?target:advanceProgress(motion[key],target,dt,...response[key])}
  const p=visualP,active=scrollY>g.top*.5&&p<.998;
  document.body.classList.toggle('devices-world-active',active);view.style.visibility=active?'visible':'hidden';hint.hidden=!active;
  if(!hold){if(target>=.32&&target<.41)show(phases.phone);else if(target>=.715&&target<.785)show(phases.pc);else{ui.hidden=true;current=null;hint.textContent=target<.3?'SCROLL TO EXPLORE':target<.7?'SCROLL TO ASSEMBLE':'SCROLL TO CONTINUE'}}
  if(hold&&phases[hold].status==='framing'&&phases[hold].lift<.4&&Math.abs(p-target)<.00025&&Object.values(motion).every(o=>Math.abs(o.value-target)<.0008&&Math.abs(o.velocity)<.005)){const phase=phases[hold];if(hold==='phone'&&!reduce){phase.status='launching';phase.launchTime=now;msg.textContent='映像が始まります'}else{phase.push=hold==='phone'?.04:0;phase.status='playing';void run(phase)}}
  if(hold==='phone'&&phases.phone.status==='launching'){const phase=phases.phone;phase.push=phoneLaunchOffset((now-phase.launchTime)/1000);if(now-phase.launchTime>=550){phase.status='playing';void run(phase)}}
  hint.hidden=!active||current?.name==='phone';
  const poses=choreography(p,camera.aspect,now/1000,reduce,clocks,{width:view.clientWidth,height:view.clientHeight});
  camera.position.copy(poses.camera);camera.lookAt(poses.look);camera.updateMatrixWorld();
  mobile.scene.visible=p<.55;mobile.scene.position.set(...poses.phone.position);mobile.scene.rotation.set(...poses.phone.angles);
  mobile.scene.position.z+=phases.phone.push*(1-smooth((clocks.phone-.405)/.13));
  for(const key of ['monitor','keyboard','mouse'])pose(parts[key],poses[key].position,poses[key].angles);
  parts.mouse.node.visible=stageProgress(clocks.mouse)<.745;
  parts.keyboard.node.quaternion.copy(keyboardQuaternion(poses.keyboard.angles,poses.keyboard.position,camera.position)).multiply(parts.keyboard.base);
  const forward=camera.getWorldDirection(new THREE.Vector3());
  for(const phase of Object.values(phases)){
   if(phase.status==='done')phase.lift=completionLift((now-phase.completedAt)/1000,view.clientHeight,reduce);
   else phase.lift=reduce?0:lerp(phase.lift,0,1-Math.exp(-dt*10));
   const progress=phase.name==='phone'?clocks.phone:clocks.monitor;
   const pixels=phase.lift*completionHandoff(progress,phase.name);
   const depth=new THREE.Vector3().subVectors(phase.name==='phone'?mobile.scene.position:parts.monitor.node.position,camera.position).dot(forward);
   const dy=pixels*2*poses.tan*depth/view.clientHeight;
   if(phase.name==='phone')mobile.scene.position.y+=dy;
   else for(const key of ['monitor','keyboard','mouse'])parts[key].node.position.y+=dy;
  }
  if(current===phases.phone){
   let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
   for(const x of [phoneBounds.min.x,phoneBounds.max.x])for(const y of [phoneBounds.min.y,phoneBounds.max.y])for(const z of [phoneBounds.min.z,phoneBounds.max.z]){phoneCorner.set(x,y,z).applyQuaternion(mobile.scene.quaternion).add(mobile.scene.position).project(camera);const px=(phoneCorner.x+1)*view.clientWidth/2,py=(1-phoneCorner.y)*view.clientHeight/2;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py)}
   caption.style.setProperty('--phone-left',left.toFixed(1)+'px');caption.style.setProperty('--phone-right',right.toFixed(1)+'px');
   const gutter=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'))||view.clientWidth*.045;
   const questionSize=Math.min(34,Math.max(22,view.clientWidth*.0235),Math.max(14,(view.clientWidth-right-gutter-32)/11));caption.style.setProperty('--question-size',questionSize.toFixed(1)+'px');
   section.dataset.phoneBounds=JSON.stringify({left:Math.round(left),right:Math.round(right),top:Math.round(top),bottom:Math.round(bottom)});
  }
  updateCaption();
  let pressed=0;for(const [i,key]of keys.entries()){const travel=!reduce&&hold==='pc'&&phases.pc.status==='playing'&&i<typingCount?keyTravel(phases.pc.v.currentTime,i,typingCount):0;key.node.position.y=key.y-travel;if(travel>.0001)pressed++}
  if(pressed&&!previousPressed)typingEvents++;previousPressed=pressed;
  const projectedBox=new THREE.Box3(),corner=new THREE.Vector3();
  const above=node=>{node.updateMatrixWorld(true);projectedBox.setFromObject(node);let bottom=Infinity;for(const x of [projectedBox.min.x,projectedBox.max.x])for(const y of [projectedBox.min.y,projectedBox.max.y])for(const z of [projectedBox.min.z,projectedBox.max.z])bottom=Math.min(bottom,corner.set(x,y,z).project(camera).y);return bottom>1.04};
  const pcExited=p>.90&&['done','skipped'].includes(phases.pc.status)&&above(parts.monitor.node)&&above(parts.keyboard.node);
  document.body.classList.toggle('devices-pc-exited',pcExited);section.dataset.pcExited=String(pcExited);
  if(pcExited)hint.hidden=true;
  const particles=dust.update(dt,now/1000,active&&!hold&&!reduce&&p<.99);
  if(active){depthRoute(lerp(.2,-.95,poses.zoom),now);view.style.opacity='1';r.render(scene,camera)}
  section.dataset.phonePush=phases.phone.push.toFixed(4);section.dataset.phoneLift=phases.phone.lift.toFixed(1);section.dataset.pcLift=phases.pc.lift.toFixed(1);section.dataset.playback=current?current.name+'-'+current.status:'';section.dataset.pressedKeys=String(pressed);section.dataset.typingEvents=String(typingEvents);section.dataset.keyCount=String(keys.length);section.dataset.stardust=String(particles);
  section.dataset.progress=p.toFixed(4);section.dataset.target=target.toFixed(4);section.dataset.state=hold?hold+'-'+phases[hold].status:p<.32?'falling':p<.405?'phone-front':p<.55?'phone-departing':p<.64?'scattered':p<.735?'assembling':p<.785?'pc-front':'departing';
  section.dataset.storyProgress=stageProgress(p).toFixed(4);
  section.dataset.partProgress=JSON.stringify(Object.fromEntries(Object.entries(clocks).map(([key,value])=>[key,Number(value.toFixed(4))])));
 }
 function tick(now=performance.now()){if(document.hidden){raf=0;return}update(now);raf=requestAnimationFrame(tick)}
 for(const phase of Object.values(phases)){phase.primed=true;phase.v.preload='auto';phase.v.load()}
 tick();
 document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const phase of Object.values(phases))phase.v.pause();cancelAnimationFrame(raf);raf=0}else{previousTime=performance.now();if(hold&&!phases[hold].paused&&phases[hold].status==='playing')void run(phases[hold]);if(!raf)tick()}});
 section.classList.add('devices-ready');hint.textContent='SCROLL TO EXPLORE';
}
if(section)init().catch(error=>{console.error('SOPHIA devices',error);scrollRelease();document.body.classList.remove('devices-world-active');document.body.classList.add('devices-pc-exited');section.dataset.state='error';const fallback=section.querySelector('.device-fallback');fallback.hidden=false;fallback.controls=true});
