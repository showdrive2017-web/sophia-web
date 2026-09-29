/* SOPHIA shared — 誕生と削除の演出。
   誕生：無から現れ、殻を破るように不均一に膨らみ、丸く収まる。0.33秒。
   削除：囲みの中心から四方八方へ飛び出し、加速しながら自分の色の尾を引いて燃え尽きる。0.5秒。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};
var hex=function(h,a){return SOPHIA.hex(h,a);};
var shade=function(c,w){return SOPHIA.shade(c,w);};

SOPHIA.fx={
  // 誕生の弾。now = performance.now()-T0（アプリ側の時計）
  birth:function(n,now){return{n:n,t0:now,dur:330,seed:Math.random()*6.283};},

  // 削除の飛翔体の群れ。gone: 消える星たち / colorOf, radius: アプリ側のヘルパ / now: アプリ時計
  vanish:function(gone,colorOf,radius,now){
    var cx=0,cy=0;gone.forEach(function(n){cx+=n.x;cy+=n.y;});cx/=gone.length;cy/=gone.length;
    var flyers=gone.map(function(n){
      var a=Math.atan2(n.y-cy,n.x-cx);
      if(Math.hypot(n.x-cx,n.y-cy)<4)a=Math.random()*6.2832;
      a+=(Math.random()*2-1)*0.55;             // 選択から離れる向きへ、四方八方に
      return{x:n.x,y:n.y,a:a,c:colorOf(n),w:radius(n),D:300+Math.random()*340,d:Math.random()*0.04};
    });
    return{t0:now,dur:500,flyers:flyers};
  },

  // 1フレーム描く。project(f)=飛翔体の始点の画面座標。終わっていたら false
  drawVanish:function(ctx,V,t,project,scale){
    var u=(t-V.t0)/V.dur;
    if(u>=1)return false;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var i=0;i<V.flyers.length;i++){
      var f=V.flyers[i];
      var uu=Math.max(0,Math.min(1,(u-f.d)/(1-f.d)));
      var p0=project(f),ux=Math.cos(f.a),uy=Math.sin(f.a),nx=-uy,ny=ux;
      var e=0.4*uu+0.6*Math.pow(uu,1.6);       // すぐに離れ、なお加速しつづける
      var dist=f.D*e,hx=p0.x+ux*dist,hy=p0.y+uy*dist;
      var L=Math.min(dist+3,24+200*uu);        // 速くなるほど尾が伸びる
      var tx=hx-ux*L,ty=hy-uy*L;
      var fade=uu<0.5?1:1-(uu-0.5)/0.5;
      var w=Math.max(1.1,f.w*scale*0.55)*(1-0.55*uu);
      if(L>1){
        var g=ctx.createLinearGradient(tx,ty,hx,hy);
        g.addColorStop(0,hex(f.c,0));g.addColorStop(0.65,hex(f.c,0.5*fade));
        g.addColorStop(1,'rgba(255,250,240,'+(0.9*fade).toFixed(3)+')');
        ctx.fillStyle=g;ctx.beginPath();
        ctx.moveTo(tx,ty);ctx.lineTo(hx+nx*w,hy+ny*w);ctx.lineTo(hx-nx*w,hy-ny*w);ctx.closePath();ctx.fill();
      }
      ctx.shadowColor=hex(f.c,.95);ctx.shadowBlur=12;
      ctx.fillStyle='rgba(255,252,244,'+fade.toFixed(3)+')';
      ctx.beginPath();ctx.arc(hx,hy,w*1.05,0,6.2832);ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.restore();
    return true;
  }
};

// 誕生の描画（本体）。Rf = radius(n)*scale を呼び出し側が渡す。終わっていたら false
SOPHIA.fx.drawBirth=function(ctx,B,t,pX,pY,scale,c,Rf){
  var u=(t-B.t0)/B.dur;
  if(u>=1)return false;
  var seed=B.seed,q=u;
  var ease3=function(x){return 1-Math.pow(1-x,3);};
  // 無から現れ → 殻を破るように不均一に膨らみ（2次・3次モードの揺らぎ）→ 丸く収まる
  var scale2,amp=0;
  if(q<0.16)      scale2=0.42*(1-Math.pow(1-q/0.16,2));
  else if(q<0.55) scale2=0.42+0.76*ease3((q-0.16)/0.39);
  else{var w=(q-0.55)/0.45;scale2=1.0+0.18*(1-w)*Math.cos(w*3.0);}
  var base=Rf*0.6;
  if(q>=0.08&&q<0.62)amp=base*0.55*Math.sin(Math.PI*(q-0.08)/0.54);
  var al=Math.min(1,q/0.12);
  ctx.save();ctx.globalCompositeOperation='lighter';
  var halo=Rf*scale2*4.2;
  var hg=ctx.createRadialGradient(pX,pY,0,pX,pY,Math.max(1,halo));
  hg.addColorStop(0,hex(c,0.7*al));hg.addColorStop(0.2,hex(c,0.32*al));hg.addColorStop(1,hex(c,0));
  ctx.fillStyle=hg;ctx.beginPath();ctx.arc(pX,pY,Math.max(1,halo),0,6.2832);ctx.fill();
  ctx.shadowColor=hex(c,.95);ctx.shadowBlur=24*Math.min(scale,1.4);
  ctx.fillStyle=shade(c,0.45);ctx.globalAlpha=al;
  ctx.beginPath();
  var N=28;
  for(var i=0;i<=N;i++){
    var a2=i/N*6.2832;
    var rr=Math.max(0,base*scale2+amp*(Math.sin(a2*2+seed)+0.6*Math.sin(a2*3-seed*1.7))/1.6);
    var x=pX+Math.cos(a2)*rr,y=pY+Math.sin(a2)*rr;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();
  ctx.shadowColor='rgba(255,255,255,.95)';ctx.shadowBlur=Rf;
  ctx.fillStyle='rgba(255,255,255,.95)';
  ctx.beginPath();ctx.arc(pX,pY,Math.max(0,Rf*0.3*scale2),0,6.2832);ctx.fill();
  ctx.restore();
  return true;
};
})();
