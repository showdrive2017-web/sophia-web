/* SOPHIA shared — 背景の星雲。背景の星は描かず、淡い星雲（22個、透明度4.5〜9.5%）だけが漂う。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

SOPHIA.galaxy={
  // 天の川の帯に沿って星雲を播く。数値は PC/スマホそれぞれの現行値を呼び出し側が渡す。
  // opts: {count, nearCount, center:{x,y}, along, offNear, offFar, rBase, rSpread}
  seedNebulas:function(opts){
    var out=[];
    var bandA=-0.55,ca=Math.cos(bandA),sa=Math.sin(bandA);
    var COLS=SOPHIA.NEB_COLS;
    for(var i=0;i<opts.count;i++){
      var along=(Math.random()*2-1)*opts.along;
      var off=(Math.random()*2-1)*(i<opts.nearCount?opts.offNear:opts.offFar);
      out.push({
        x:opts.center.x+along*ca-off*sa,
        y:opts.center.y+along*sa+off*ca,
        z:0.28+Math.random()*0.34,
        r:opts.rBase+Math.random()*opts.rSpread,
        c:COLS[(Math.random()*COLS.length)|0],
        a:0.045+Math.random()*0.05,
        ph:Math.random()*6.28,
        sp:.00015+Math.random()*.0003
      });
    }
    return out;
  }
};
})();
