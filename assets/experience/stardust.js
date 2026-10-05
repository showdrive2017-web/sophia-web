import * as THREE from 'three';
// World-space particles remain where a device passed, then gently drift and fade.
export class Stardust {
 constructor(scene,emitters,pixelRatio){
  this.emitters=emitters.map((node,index)=>({node,extent:index===0?.085:.15,previous:node.position.clone(),quaternion:node.quaternion.clone(),credit:0}));
  this.pool=Array.from({length:200},()=>({life:0,position:new THREE.Vector3(),velocity:new THREE.Vector3(),size:0,seed:Math.random()}));
  this.cursor=0;this.positions=new Float32Array(600);this.opacity=new Float32Array(200);this.sizes=new Float32Array(200);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));geometry.setAttribute('alpha',new THREE.BufferAttribute(this.opacity,1));geometry.setAttribute('size',new THREE.BufferAttribute(this.sizes,1));geometry.setDrawRange(0,200);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,uniforms:{pixelRatio:{value:pixelRatio}},vertexShader:`attribute float alpha;attribute float size;varying float vAlpha;uniform float pixelRatio;void main(){vAlpha=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*pixelRatio;}`,fragmentShader:`varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);float core=exp(-r*r*110.);float halo=exp(-r*r*20.)*.22;float ray=(exp(-abs(p.x)*100.)+exp(-abs(p.y)*100.))*max(0.,1.-r*2.)*.16;gl_FragColor=vec4(1.,.86,.61,vAlpha*(core+halo+ray));}`});
  this.points=new THREE.Points(geometry,material);this.points.frustumCulled=false;scene.add(this.points);
 }
 update(dt,time,enabled){
  for(const e of this.emitters){
   const delta=e.node.position.clone().sub(e.previous),speed=delta.length()/Math.max(dt,.001),spin=e.quaternion.angleTo(e.node.quaternion)/Math.max(dt,.001);
   e.credit+=enabled&&e.node.visible&&(speed>.035||spin>.4)?dt*Math.min(24,9+speed*8+spin*1.5):0;
   while(e.credit>=1){
    e.credit--;const particle=this.pool[this.cursor++%this.pool.length];particle.life=particle.total=.55+Math.random()*.45;
    particle.position.copy(e.previous).lerp(e.node.position,Math.random());
    // Emission stays just outside the silhouette, rather than covering the display.
    const extent=e.extent;
    particle.position.add(new THREE.Vector3((Math.random()<.5?-1:1)*extent,(Math.random()-.5)*extent*2,-.035).applyQuaternion(e.node.quaternion));
    particle.velocity.copy(delta).multiplyScalar(-.08/Math.max(dt,.001));particle.velocity.clampLength(0,.12);particle.velocity.y+=.015;
    particle.size=5+Math.random()*8;
   }
   e.previous.copy(e.node.position);e.quaternion.copy(e.node.quaternion);
  }
  let count=0;
  for(let i=0;i<this.pool.length;i++){
   const p=this.pool[i];p.life=Math.max(0,p.life-dt);p.position.addScaledVector(p.velocity,dt);
   this.positions.set(p.position.toArray(),i*3);this.sizes[i]=p.size;
   const age=1-p.life/(p.total||1);this.opacity[i]=p.life>0?.55*Math.min(1,age/.10)*Math.pow(1-age,1.6)*(.75+.25*Math.sin(time*14+p.seed*30)):0;
   if(p.life>0)count++;
  }
  for(const name of ['position','alpha','size'])this.points.geometry.attributes[name].needsUpdate=true;
  this.points.visible=count>0;return count;
 }
}
