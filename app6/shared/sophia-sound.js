/* SOPHIA shared — 音。すべて合成、音源は使わない。数値は DESIGN.md「体験の決まりごと」の値。
   PC 版・スマホ版で共通。localStorage キー 'sophia-sound' も共通。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

SOPHIA.createSound=function(){
  var AC=null,master=null,nb=null,on=true;
  try{on=localStorage.getItem("sophia-sound")!=="0";}catch(e){}
  function a(){
    if(!AC){
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      AC=new C();master=AC.createGain();master.gain.value=0.2;
      var comp=AC.createDynamicsCompressor();
      master.connect(comp);comp.connect(AC.destination);
    }
    if(AC.state==="suspended")AC.resume();
    return AC;
  }
  function noise(){
    var c=a();if(!c)return null;
    if(!nb){var L=Math.floor(c.sampleRate*0.3);nb=c.createBuffer(1,L,c.sampleRate);
      var d=nb.getChannelData(0);
      for(var i=0;i<L;i++)d[i]=(Math.random()*2-1)*(1-i/L);}
    return nb;
  }
  function blip(f,t,dur,type,vol,glide,atk,gt){
    var c=a();if(!c)return;
    var o=c.createOscillator(),g=c.createGain(),st=c.currentTime+t;
    o.type=type||"triangle";
    o.frequency.setValueAtTime(f,st);
    if(glide)o.frequency.exponentialRampToValueAtTime(glide,st+(gt||dur*0.85));
    g.gain.setValueAtTime(0.0001,st);
    g.gain.exponentialRampToValueAtTime(vol,st+(atk||0.007));
    g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    o.connect(g);g.connect(master);o.start(st);o.stop(st+dur+0.06);
  }
  function hiss(t,f,q,atk,dur,vol){             // 形を整えたノイズの一吹き
    var c=a();if(!c)return;
    var s=c.createBufferSource();s.buffer=noise();
    var bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=f;bp.Q.value=q;
    var g=c.createGain(),st=c.currentTime+t;
    g.gain.setValueAtTime(0.0001,st);
    g.gain.exponentialRampToValueAtTime(vol,st+atk);
    g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    s.connect(bp);bp.connect(g);g.connect(master);s.start(st);s.stop(st+dur+0.02);
  }
  function snip(t,f,vol){
    var c=a();if(!c)return;
    var s=c.createBufferSource();s.buffer=noise();
    var bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=f;bp.Q.value=7;
    var g=c.createGain(),st=c.currentTime+t;
    g.gain.setValueAtTime(0.0001,st);
    g.gain.exponentialRampToValueAtTime(vol,st+0.003);
    g.gain.exponentialRampToValueAtTime(0.0001,st+0.055);
    s.connect(bp);bp.connect(g);g.connect(master);s.start(st);s.stop(st+0.1);
  }
  var P={
    add:function(){blip(880,0,.10,"triangle",.42);blip(1318.5,.052,.14,"triangle",.30);},
    link:function(){                            // つなぐ：「ポッ」のあと E6・B6 が続けて跳ねるチャイム
      blip(520,0,.045,"sine",.30,190);          // ポッ：わずかに音程が落ちる、何かが開く音
      snip(0,5200,.035);                        //   その輪郭
      blip(1318.5,.018,.26,"sine",.26);         // E6
      blip(3639,.018,.07,"sine",.035);          //   ガラス質の倍音
      blip(1975.5,.072,.36,"sine",.24);         // B6、5度上：「できた」の持ち上がり
      blip(5452,.072,.09,"sine",.03);           //   ガラス質の倍音
      blip(2637,.075,.22,"sine",.05);           // 1オクターブ上のかすかなきらめき
    },
    born:function(){                            // 誕生：シャッ — ぷいっ — キュポン
      hiss(0,10500,.7,.003,.014,1.3);           // シャッ：10kHz 付近の空気の音
      hiss(.004,5500,1.0,.002,.010,.585);
      blip(560,.010,.052,"sine",.30,760,.003);  // ぷいっ：560→760Hz へ滑る
      blip(560,.010,.046,"triangle",.06,760,.003);
      blip(900,.107,.009,"sine",.33,700,.0008); // ポ：打点の芯
      blip(1000,.107,.032,"sine",.95,1820,.0008,.0045);   // キュ：1000→1800Hz を 4.5ms で駆け上がる
      blip(1000,.107,.02,"triangle",.24,1820,.0008,.0045);
      blip(1660,.113,.03,"sine",.067,1640,.002); // ン：かすかな余韻
      hiss(.137,6500,1.2,.001,.004,.048);        //   閉じるときの小さなクリック
    },
    snap:function(){blip(1174.7,0,.05,"sine",.12);},
    vanish:function(){blip(1568,0,.36,"sine",.05,440);blip(2349,.02,.28,"sine",.025,660);snip(0,3200,.05);snip(.06,2400,.04);snip(.13,1600,.03);},
    cut:function(){snip(0,3400,.42);snip(.042,2600,.30);blip(320,0,.05,"square",.06);},
    cluster:function(){[523.3,659.3,784,1046.5].forEach(function(f,i){blip(f,i*.052,.20,"sine",.26-i*.03);});
      blip(130.8,0,.55,"sine",.10);},
    remove:function(){blip(392,0,.17,"sine",.32,196);},
    tick:function(){blip(1568,0,.04,"sine",.20);},
    note:function(){blip(1046.5,0,.055,"sine",.24);blip(1396.9,.04,.08,"sine",.16);},
    noteM:function(){blip(783.99,0,.12,"sine",.16);blip(1174.7,.07,.16,"sine",.12);},   // スマホの「できた」音（PC の note と周波数が違う）
    stick:function(){blip(196,0,.085,"sine",.30,150);snip(.005,900,.16);blip(1174.7,.02,.05,"sine",.10);},
    tock:function(){
      snip(0,2600,.34);blip(190,0,.028,"square",.13);
      snip(.012,1400,.14);
    },
    plop:function(){
      blip(560,0,.16,"sine",.42,205);       // 音程の落下＝玉が入る
      blip(300,.028,.22,"sine",.26,120);
      snip(.012,640,.12);                    // 小さなしぶき
      blip(880,.14,.10,"sine",.07,660);      // 波紋
    },
    grab:function(){blip(392,0,.06,"sine",.10,470);},   // 星を掴む：小さな上昇音（スマホ）
    toggle:function(){blip(740,0,.07,"triangle",.30);}
  };
  var api={};
  Object.keys(P).forEach(function(k){api[k]=function(){if(on)try{P[k]();}catch(e){}};});
  api.enabled=function(){return on;};
  api.set=function(v){on=v;try{localStorage.setItem("sophia-sound",v?"1":"0");}catch(e){}
    if(v)try{P.toggle();}catch(e){}};
  api.flip=function(){                          // 音を鳴らさず切り替える（スマホの♪ボタン）
    on=!on;try{localStorage.setItem("sophia-sound",on?"1":"0");}catch(e){}return on;};
  return api;
};
})();
