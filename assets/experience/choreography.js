import * as THREE from 'three';
const mix=THREE.MathUtils.lerp;
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
function track(keys,p){
 let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],span=b[0]-a[0],t=Math.max(0,Math.min(1,(p-a[0])/span));
 // Continuous velocity through falling waypoints; repeated values form deliberate rests.
 const slope=(k,field,j)=>{if(k===0||k===keys.length-1)return 0;const prev=keys[k-1],at=keys[k],next=keys[k+1],hp=at[0]-prev[0],hn=next[0]-at[0],dp=(at[field][j]-prev[field][j])/hp,dn=(next[field][j]-at[field][j])/hn;if(dp*dn<=0)return 0;const w1=2*hn+hp,w2=hn+2*hp;return(w1+w2)/(w1/dp+w2/dn)};
 const interpolate=field=>a[field].map((v,j)=>(2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*span*slope(i,field,j)+(-2*t*t*t+3*t*t)*b[field][j]+(t*t*t-t*t)*span*slope(i+1,field,j));
 return {position:interpolate(1),angles:interpolate(2)};
}
export function advanceProgress(state,target,dt,frequency,damping){
 const steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
 for(let i=0;i<steps;i++){state.velocity+=(frequency*frequency*(target-state.value)-2*damping*frequency*state.velocity)*h;state.value+=state.velocity*h;if(state.value<0||state.value>1){state.value=Math.max(0,Math.min(1,state.value));state.velocity=0}}
 if(Math.abs(state.value-target)<.00006&&Math.abs(state.velocity)<.0001){state.value=target;state.velocity=0}
 return state.value;
}
export function phoneLaunchOffset(elapsed,reduce=false){
 const t=Math.max(0,Math.min(1,elapsed/.55));return .04*(reduce?1:1-Math.pow(1-t,3));
}
// Advance the PC journey once the phone leaves, without changing the shared fall.
export function stageProgress(p){
 if(p<=.405)return p;
 const keys=[[.405,.405],[.55,.665],[.735,.805],[.740,.810],[.785,.855],[1,1]];
 let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;
 const slope=k=>{if(k===0)return 1;if(k===keys.length-1)return (keys[k][1]-keys[k-1][1])/(keys[k][0]-keys[k-1][0]);const hp=keys[k][0]-keys[k-1][0],hn=keys[k+1][0]-keys[k][0],dp=(keys[k][1]-keys[k-1][1])/hp,dn=(keys[k+1][1]-keys[k][1])/hn;return(3*(hp+hn))/((2*hn+hp)/dp+(hn+2*hp)/dn)};
 const a=keys[i],b=keys[i+1],h=b[0]-a[0],t=Math.max(0,Math.min(1,(p-a[0])/h));
 return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*slope(i)+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*slope(i+1);
}
export function framing(p,aspect,layout={}){
 const tan=Math.tan(16*Math.PI/180),wide=Math.max(2.9,1.65/(2*tan*aspect));
 const height=layout.height||900,compact=aspect<=1.25||(layout.width||height*aspect)<=900;
 const fraction=Math.max(.40,Math.min(.78,(height-240)/height));
 const phoneD=Math.max(Math.max(.143974*2.2/(2*tan),.06932*2.2/(2*tan*aspect))*1.13,compact?.143974*2.2/(2*tan*fraction)+.04:0);
 const phoneY=.85+(compact?32*2*tan*(phoneD-.04)/height:0);
 const pcD=Math.max(.495439/(2*tan*aspect),.278685/(2*tan))*1.18;
 const story=stageProgress(p),focus=smooth((p-.23)/.105),back=smooth((story-.535)/.13),zoom=smooth((story-.695)/.11);
 const camera=new THREE.Vector3(0,1.20,wide).lerp(new THREE.Vector3(0,phoneY,.9+phoneD),focus).lerp(new THREE.Vector3(0,-.8,wide),back).lerp(new THREE.Vector3(-.09,-1.6003,-.16775+pcD),zoom);
 const look=new THREE.Vector3(0,.80,0).lerp(new THREE.Vector3(0,phoneY,.9),focus).lerp(new THREE.Vector3(0,-1.3,0),back).lerp(new THREE.Vector3(-.09,-1.6003,-.16775),zoom);
 return {camera,look,wide,phoneD,pcD,tan,zoom};
}
export function choreography(p,aspect,time=0,reduce=false,clocks={},layout={}){
 const f=framing(p,aspect,layout),upper=1.2+f.wide*f.tan*1.45,keyboardY=-1.745-.065*(1-smooth((aspect-.65)/.70));
 const phone=track([
  [0,[.4,upper+.5,-.2],[.3,-1.7,-.28]],
  [.018,[.42,1.45,.35],[.22,-.7,-.12]],
  [.070,[.34,.86,.24],[-.08,-.65,.20]],
  [.15,[.32,.96,.72],[.15,-1.85,.26]],
  [.23,[.12,1.05,.38],[-.08,-.85,-.22]],
  [.335,[0,.85,.9],[0,0,0]],
  [.405,[0,.85,.9],[0,0,0]],
  [.535,[-.04,.85+f.phoneD*f.tan*4.4+.50,.90],[-.15,.25,-.20]],
  [1,[-.04,upper+3,.90],[-.15,.25,-.20]]],clocks.phone??p);
 const monitor=track([
  [0,[-.55,upper+1.2,-.7],[.4,.6,2.55]],
  [.035,[-.55,upper+.9,-.7],[.4,.8,2.9]],
  [.075,[-.60,1.6,-.65],[.3,.7,3.1]],
  [.13,[-.30,.30,.55],[-.5,.5,3.65]],
  [.21,[-.60,-.48,-.40],[.3,-.9,4.2]],
  [.29,[.10,-1.13,-.45],[-.15,.7,5.05]],
  [.37,[-.35,-1.5,-.5],[.3,1.1,5.7]],
  [.48,[.25,-1.8,-.4],[.4,-1,6.4]],
  [.57,[-.62,-1.75,.35],[-.35,.8,6.95]],
  [.67,[.50,-1.25,-.45],[.55,-.8,7.35]],
  [.735,[.42,-.92,-.35],[.3,Math.PI*2,Math.PI*3]],
  [.775,[.06,-1.54,-.20],[.12,11.50,12.05]],
  [.805,[-.09,-1.670306,-.13299],[0,Math.PI*4,Math.PI*4]],
  [.855,[-.09,-1.670306,-.13299],[0,Math.PI*4,Math.PI*4]],
  [.985,[-.50,-1.670306+f.pcD*f.tan*4+.6,-.05],[.26,Math.PI*4-.65,Math.PI*4-.65]],
  [1,[-.50,-1.670306+f.pcD*f.tan*4+.6,-.05],[.26,Math.PI*4-.65,Math.PI*4-.65]]],stageProgress(clocks.monitor??p));
 const keyboard=track([
  [0,[.70,upper+2,-.65],[.75,-.7,1.25]],
  [.065,[.70,upper+1.2,-.65],[.75,-.7,1.25]],
  [.12,[.62,1.10,f.wide*.44],[.75,-.5,1.25]],
  [.18,[Math.min(.40,f.wide*.32*f.tan*aspect*.85),1.0,f.wide*.68],[1.05,0,1.45]],
  [.245,[.56,-1.08,f.wide*.38],[.75,-.6,1.1]],
  [.32,[.55,-1.90,.20],[.65,.55,.9]],
  [.40,[.45,-2.10,.05],[.55,.3,.7]],
  [.49,[-.68,-2.36,-.10],[.8,-.65,-.85]],
  [.58,[-.70,-2.10,.70],[.8,.75,-1.25]],
  [.68,[-.68,-2.15,1.0],[.8,-.6,-1.3]],
  [.735,[-.90,-1.83,.10],[.65,-.35,-.30]],
  [.765,[-.70,keyboardY,.08],[.55,0,0]],
  [.805,[-.09,keyboardY,.08],[.55,0,0]],
  [.855,[-.09,keyboardY,.08],[.55,0,0]],
  [.99,[-.65,keyboardY+f.pcD*f.tan*4.6+.6,.02],[.45,-.85,.32]],
  [1,[-.65,keyboardY+f.pcD*f.tan*4.6+.6,.02],[.45,-.85,.32]]],stageProgress(clocks.keyboard??p));
 const mouse=track([
  [0,[-.5,upper+2.5,-.7],[.3,.8,.6]],
  [.09,[-.5,upper+.9,-.7],[.3,.8,.6]],
  [.14,[-.5,.80,.45],[-.5,2,.9]],
  [.22,[-.15,-1.10,.25],[1.5,2.8,1.6]],
  [.30,[-.3,-2.40,-.30],[2.1,3.2,2.2]],
  [.45,[.6,-2.75,-.70],[3.3,4.1,2.8]],
  [.56,[.75,-1.82,-.10],[4.7,4.8,3.3]],
  [.67,[.65,-2.0,.35],[5.7,5.5,4.8]],
  [.735,[.90,-3.45,-.40],[6.8,5.4,5.4]],
  [.805,[.90,-3.45,-.40],[Math.PI*2,Math.PI*2,Math.PI*2]],
  [.855,[.90,-3.45,-.40],[Math.PI*2,Math.PI*2,Math.PI*2]],
  [.985,[.7,-1.71+f.pcD*f.tan*4.8+.55,-.1],[Math.PI*2+1.5,Math.PI*2+1.4,Math.PI*2-.8]],
  [1,[.7,-1.71+f.pcD*f.tan*4.8+.55,-.1],[Math.PI*2+1.5,Math.PI*2+1.4,Math.PI*2-.8]]],stageProgress(clocks.mouse??p));
 // The scroll chooses the story beat; a slow clock gives each object its own inertia.
 if(!reduce){
  const float=1-smooth((stageProgress(p)-.74)/.06),phoneFloat=(1-smooth((p-.25)/.075))*smooth(p/.02);
  for(const [i,o]of[monitor,keyboard,mouse].entries()){
   o.position[1]+=Math.sin(time*.45+i*2)*.025*float;
   o.position[0]+=Math.cos(time*.32+i*1.8)*.018*float;
   o.angles[2]+=Math.sin(time*.28+i)*.045*float;
  }
  phone.position[1]+=Math.sin(time*.38)*.018*phoneFloat;
  phone.angles[2]+=Math.sin(time*.27)*.025*phoneFloat;
 }
 return {phone,monitor,keyboard,mouse,...f};
}
export function keyboardQuaternion(angles,position,camera){
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles));
 const n=new THREE.Vector3(0,1,0).applyQuaternion(q),toward=camera.clone().sub(new THREE.Vector3(...position)).normalize();
 const dot=n.dot(toward),minimum=.20;
 if(dot<minimum){
  const axis=new THREE.Vector3().crossVectors(n,toward).normalize();
  const correction=new THREE.Quaternion().setFromAxisAngle(axis,Math.acos(Math.max(-1,Math.min(1,dot)))-Math.acos(minimum));
  q.premultiply(correction);
 }
 return q;
}
