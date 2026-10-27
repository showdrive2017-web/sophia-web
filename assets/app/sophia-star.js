/* SOPHIA shared — 星の描画核：Optical Flares 風。白く焼けた芯＋広く柔らかい光、色は縁ほど濃い。
   眩しさは DIM=0.84 倍（選択中の星など、呼び出し側が 1.0 を渡す場合もある）。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};
var mixA=function(c,wh,a){return SOPHIA.mixA(c,wh,a);};

SOPHIA.star={
  // pX,pY: 画面座標 / r: 星の半径(画面px) / gc: 光の色 / lum: 明るさ / G: 光の半径 / DIM: 眩しさ / o: 全体の透明度
  // big（任意。PC 版の大きな星）: {core: 芯の倍率, body: 0〜1 芯のまわりの光の厚み}。無ければ今までどおり
  flare:function(ctx,pX,pY,r,gc,lum,G,DIM,o,big){
    if(o==null)o=1;
    var ck=big&&big.core||1,bd=big&&big.body||0;   // 大きな星ほど、芯が大きく、芯のすぐまわりに光の厚みが出る
    ctx.save();ctx.globalCompositeOperation='lighter';
    var g=ctx.createRadialGradient(pX,pY,0,pX,pY,G);
    g.addColorStop(0,   mixA(gc,.85,Math.min(1,1.0*lum)*o*DIM));   // 白く焼けた芯
    g.addColorStop(.03, mixA(gc,.62,Math.min(1,.85*lum)*o*DIM));
    g.addColorStop(.08, mixA(gc,.42,Math.min(1,.55*lum)*o*DIM));   // 光があふれ出す
    g.addColorStop(.17, mixA(gc,.26,.30*lum*o*DIM));
    g.addColorStop(.32, mixA(gc,.16,.14*lum*o*DIM));               // 縁に向かって色が濃くなる
    g.addColorStop(.58, mixA(gc,.10,.05*lum*o*DIM));
    g.addColorStop(1,   mixA(gc,.10,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(pX,pY,G,0,6.2832);ctx.fill();
    if(bd>0){var cr=r*0.4*ck,B=ctx.createRadialGradient(pX,pY,0,pX,pY,cr*2.6),ba=.16*bd*Math.min(1,lum)*o*DIM;   // 芯のすぐ外の、柔らかな光の層（輪郭を作らず、白く飛ばさない）
      B.addColorStop(0,mixA(gc,.5,ba));B.addColorStop(.4,mixA(gc,.4,ba*.6));B.addColorStop(.7,mixA(gc,.3,ba*.2));B.addColorStop(1,mixA(gc,.2,0));
      ctx.fillStyle=B;ctx.beginPath();ctx.arc(pX,pY,cr*2.6,0,6.2832);ctx.fill();}
    ctx.shadowColor=mixA(gc,.6,.95);ctx.shadowBlur=r*1.5*Math.sqrt(ck);
    ctx.fillStyle='rgba(255,255,255,'+(Math.min(1,.66+.26*lum)*o).toFixed(3)+')';
    ctx.beginPath();ctx.arc(pX,pY,r*(0.3+0.1*(ck>1?Math.min(1,lum):lum))*ck,0,6.2832);ctx.fill();   // a big heart keeps its size when it flares
    ctx.restore();
  }
};
})();
