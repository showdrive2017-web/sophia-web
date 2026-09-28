/* SOPHIA shared — 線の幾何：Maya のノードエディタと同じ S 字ケーブルと、根元が太く先が細いリボン */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

SOPHIA.geo={
  // 星から横に出て横に入るケーブル。左向きなら鏡写し。scale はビューの拡大率（PC: view.k / スマホ: sc）
  mayaCurve:function(p,q,scale){
    var dx=q.x-p.x,dy=q.y-p.y,adx=Math.abs(dx);
    var dir=dx>=0?1:-1;                       // 左向きは S が鏡写しになる
    var lean=Math.min(1,adx/(80*scale));      // ほぼ縦のときは曲げをゆるめて反転させない
    var off=adx*0.5+Math.min(Math.hypot(dx,dy)*0.3,120*scale)*lean;
    return{p:p,q:q,c1:{x:p.x+dir*off,y:p.y},c2:{x:q.x-dir*off,y:q.y}};
  },
  curveAt:function(cu,t){
    var u=1-t,A=u*u*u,B=3*u*u*t,C=3*u*t*t,D=t*t*t;
    return{x:A*cu.p.x+B*cu.c1.x+C*cu.c2.x+D*cu.q.x,y:A*cu.p.y+B*cu.c1.y+C*cu.c2.y+D*cu.q.y};
  },
  // 根元 w0 → 先端 w1 へ細るリボン。色は出発の星から到着の星へ移る。N: 分割数（PC 20 / スマホ 18）
  taper:function(ctx,cu,ta,tb,w0,w1,colA,colB,glow,glowCol,N){
    N=N||20;
    var L=[],R=[],i;
    var at=SOPHIA.geo.curveAt;
    for(i=0;i<=N;i++){
      var tt=ta+(tb-ta)*i/N,pt=at(cu,tt),pn=at(cu,Math.min(1,tt+0.004)),pp=at(cu,Math.max(0,tt-0.004));
      var dx=pn.x-pp.x,dy=pn.y-pp.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      var k=i/N,w=(w0+(w1-w0)*Math.pow(k,0.8))/2;
      L.push([pt.x-dy*w,pt.y+dx*w]);R.push([pt.x+dy*w,pt.y-dx*w]);
    }
    var s0=at(cu,ta),s1=at(cu,tb);
    var g=ctx.createLinearGradient(s0.x,s0.y,s1.x,s1.y);
    g.addColorStop(0,colA);g.addColorStop(1,colB);
    ctx.save();
    if(glow){ctx.shadowColor=glowCol;ctx.shadowBlur=glow;}
    ctx.fillStyle=g;ctx.beginPath();
    ctx.moveTo(L[0][0],L[0][1]);
    for(i=1;i<L.length;i++)ctx.lineTo(L[i][0],L[i][1]);
    for(i=R.length-1;i>=0;i--)ctx.lineTo(R[i][0],R[i][1]);
    ctx.closePath();ctx.fill();ctx.restore();
  }
};
})();
