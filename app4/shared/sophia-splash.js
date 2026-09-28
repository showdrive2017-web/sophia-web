/* SOPHIA shared — 起動画面：天の川の星空（青緑の夜、帯が流れる）を一度だけ描く。
   帯の向きや散らばりは PC/スマホで少し違うので、呼び出し側が数値を渡す。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

SOPHIA.splash={
  // o: {x0,y0,x1,y1, cloudN,cloudSpread,cloudR:[base,spread], laneN,laneSpread,laneR:[base,spread], dustSpread}
  paint:function(c,o){
    if(!c||!c.getContext)return;
    var d=Math.min(2,window.devicePixelRatio||1),W=innerWidth,H=innerHeight;
    c.width=W*d;c.height=H*d;
    var g=c.getContext('2d');g.scale(d,d);
    var gauss=function(){var u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();
      return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v);};
    var bg=g.createLinearGradient(0,0,W*0.35,H);
    bg.addColorStop(0,'#081620');bg.addColorStop(.5,'#0f2534');bg.addColorStop(1,'#0a1c28');
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    var x0=o.x0,y0=o.y0,x1=o.x1,y1=o.y1;
    var L=Math.hypot(x1-x0,y1-y0),ux=(x1-x0)/L,uy=(y1-y0)/L,nx=-uy,ny=ux;
    var along=function(k){return{x:x0+(x1-x0)*k,y:y0+(y1-y0)*k};};
    var i,k,off,P,x,y,r,a,rg;
    g.globalCompositeOperation='lighter';
    for(i=0;i<o.cloudN;i++){                       // 銀河核の光る雲
      k=Math.random();off=gauss()*o.cloudSpread;P=along(k);
      x=P.x+nx*off;y=P.y+ny*off;r=o.cloudR[0]+Math.random()*o.cloudR[1];
      a=(0.03+Math.random()*0.045)*(0.6+0.8*Math.sin(Math.PI*k));
      rg=g.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,'rgba(172,205,220,'+a.toFixed(3)+')');rg.addColorStop(1,'rgba(172,205,220,0)');
      g.fillStyle=rg;g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();
    }
    g.globalCompositeOperation='source-over';
    for(i=0;i<o.laneN;i++){                        // 帯を縫う暗い塵の筋
      k=Math.random();off=gauss()*o.laneSpread;P=along(k);
      x=P.x+nx*off;y=P.y+ny*off;r=o.laneR[0]+Math.random()*o.laneR[1];
      rg=g.createRadialGradient(x,y,0,x,y,r);
      rg.addColorStop(0,'rgba(8,20,28,.28)');rg.addColorStop(1,'rgba(8,20,28,0)');
      g.fillStyle=rg;g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();
    }
    g.globalCompositeOperation='lighter';
    var N=Math.round(W*H/190);
    for(i=0;i<N;i++){                              // 星屑。帯に沿って濃くなる
      if(Math.random()<0.5){k=Math.random();off=gauss()*o.dustSpread;P=along(k);x=P.x+nx*off;y=P.y+ny*off;}
      else{x=Math.random()*W;y=Math.random()*H;}
      var m=Math.pow(Math.random(),3.2);
      r=0.22+m*0.95;a=0.22+0.72*Math.random();
      var tint=Math.random()<0.2?'205,225,255':(Math.random()<0.12?'255,236,210':'238,244,248');
      g.fillStyle='rgba('+tint+','+a.toFixed(3)+')';
      g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();
    }
    for(i=0;i<Math.round(W*H/26000);i++){          // わずかな明るい星、柔らかい光つき
      x=Math.random()*W;y=Math.random()*H;r=0.9+Math.random()*0.9;
      rg=g.createRadialGradient(x,y,0,x,y,r*3.4);
      rg.addColorStop(0,'rgba(225,238,248,.42)');rg.addColorStop(1,'rgba(225,238,248,0)');
      g.fillStyle=rg;g.beginPath();g.arc(x,y,r*3.4,0,6.2832);g.fill();
      g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(x,y,r,0,6.2832);g.fill();
    }
  }
};
})();
