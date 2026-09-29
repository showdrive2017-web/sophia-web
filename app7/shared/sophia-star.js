/* SOPHIA shared — 星の描画核：Optical Flares 風。白く焼けた芯＋広く柔らかい光、色は縁ほど濃い。
   眩しさは DIM=0.84 倍（選択中の星など、呼び出し側が 1.0 を渡す場合もある）。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};
var mixA=function(c,wh,a){return SOPHIA.mixA(c,wh,a);};

SOPHIA.star={
  // pX,pY: 画面座標 / r: 星の半径(画面px) / gc: 光の色 / lum: 明るさ / G: 光の半径 / DIM: 眩しさ / o: 全体の透明度
  flare:function(ctx,pX,pY,r,gc,lum,G,DIM,o){
    if(o==null)o=1;
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
    ctx.shadowColor=mixA(gc,.6,.95);ctx.shadowBlur=r*1.5;
    ctx.fillStyle='rgba(255,255,255,'+(Math.min(1,.66+.26*lum)*o).toFixed(3)+')';
    ctx.beginPath();ctx.arc(pX,pY,r*(0.3+0.1*lum),0,6.2832);ctx.fill();
    ctx.restore();
  }
};
})();
