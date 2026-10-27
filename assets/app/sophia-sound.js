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
  function grain(t,f,q,vol,dur){                // のりがはがれる、ごく短いパリッ
    var c=a();if(!c)return;
    var s=c.createBufferSource();s.buffer=noise();
    var bp=c.createBiquadFilter();bp.type="bandpass";bp.frequency.value=f;bp.Q.value=q;
    var g=c.createGain(),st=c.currentTime+t;
    g.gain.setValueAtTime(0.0001,st);
    g.gain.exponentialRampToValueAtTime(vol,st+0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    s.connect(bp);bp.connect(g);g.connect(master);s.start(st,Math.random()*0.04);s.stop(st+dur+0.02);
  }
  function sweep(t,f0,f1,dur,q,vol){            // 音程が上がっていく、つながったノイズ
    var c=a();if(!c)return;
    var s=c.createBufferSource();s.buffer=noise();
    var bp=c.createBiquadFilter();bp.type="bandpass";bp.Q.value=q;
    var st=c.currentTime+t;
    bp.frequency.setValueAtTime(f0,st);bp.frequency.exponentialRampToValueAtTime(f1,st+dur);
    var g=c.createGain();
    g.gain.setValueAtTime(0.0001,st);
    g.gain.exponentialRampToValueAtTime(vol,st+dur*0.7);
    g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    s.connect(bp);bp.connect(g);g.connect(master);s.start(st);s.stop(st+dur+0.02);
  }
  // 日付のダイヤル（2026-10-20、試作でヨシが選んだ音）：本物の金庫のダイヤルのように、金属が当たる硬い「カチ」。
  // ごく短い高域のノイズ＋鋼のかすかな響き＋筒そのものの小さな手応え。こもらないよう、ほかの音とは別に圧縮を通さず出す
  var dialOut=null,lastNotch=0;
  function dOut(){var c=a();if(!c)return null;if(!dialOut){dialOut=c.createGain();dialOut.gain.value=0.32;dialOut.connect(c.destination);}return dialOut;}
  function burst(st,type,f,q,vol,dur){
    var c=a(),o=dOut();if(!c||!o)return;
    var s=c.createBufferSource();s.buffer=noise();
    var fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
    var g=c.createGain();g.gain.setValueAtTime(vol,st);g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    s.connect(fl);fl.connect(g);g.connect(o);s.start(st);s.stop(st+dur+0.005);
  }
  function ring(st,f,vol,dur){
    var c=a(),o=dOut();if(!c||!o)return;
    var s=c.createOscillator(),g=c.createGain();s.type="sine";s.frequency.value=f;
    g.gain.setValueAtTime(vol,st);g.gain.exponentialRampToValueAtTime(0.0001,st+dur);
    s.connect(g);g.connect(o);s.start(st);s.stop(st+dur+0.005);
  }
  function notch(t,k,v){                        // k：大きさ、v：音の高さ（毎回わずかに揺らす）
    var c=a();if(!c)return;var st=c.currentTime+0.002+t;
    burst(st,"highpass",3200*v,.8,.9*k,.006);   // カチ：金属が当たる芯
    ring(st,3170*v,.10*k,.035);ring(st,4890*v,.07*k,.026);ring(st,7130*v,.045*k,.018);   // 鋼の響き
    burst(st+.001,"bandpass",1600*v,2.5,.35*k,.012);   // 筒の手応え
  }
  var P={
    dial:function(){                            // ダイヤルの1目盛り。速く回しても 26ms より詰めない
      var now=Date.now();if(now-lastNotch<26)return;lastNotch=now;notch(0,1,.94+Math.random()*.12);},
    latch:function(){notch(0,.8,1.04);notch(.024,1.15,.9);},   // 「決める」：留め金のような二重の「カチッ」
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
    peel:function(){                            // メモを貼る（PC）：テープをはがすような「ぺりーっ」を短く
      sweep(0,1400,5600,.08,2.2,.55);           // 1.4→5.6kHz へ駆け上がるはがれ
      grain(.02,2600,5,.2,.016);grain(.045,3800,5,.24,.016);   // 途中のパリッ
      grain(.082,6800,6,.45,.01);               // 「っ」：はがれ切った瞬間
    },
    shutter:function(){                         // 星を撮る（スマホ）：ミラーレスの静かな「シャキッ」。わざとらしい「カシャッ」にはしない
      grain(0,4200,2.4,.42,.016);grain(.003,2300,3.5,.16,.022);     // 先幕：シャ
      grain(.040,6600,3,.62,.013);grain(.043,3400,4,.2,.02);        // 後幕：キッ（0.04秒後）
      blip(170,.040,.028,"sine",.10,120);                           //   機構のごく小さな手応え
    },
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
  // 星がふくらむ間の音（2.0、2026-10-23）。ふくらみ始めで鳴らし、溜めの長さ（アプリは 0.7 秒。最初は 1.5 秒）で大きな星に切り替わると音も終わる。途中で離したら・指を動かしたら、すぐ消す。
  // 本番は合成の 'synth'：「しゅううううう…」と息を吸い込む音だけ。離したときの誕生の音（キュポン）につながる。
  //   ヨシが選んだ録音 A（Artlist の空気が抜ける音の逆回し）の空気の部分を測って合成したもの。A の低い「ボフッ」と最後の「キュッ」は、ヨシの判断で外した
  //   2〜8kHz の息が 1/20 から強くなり続け、帯域も少しずつ明るくなる。いちばん大きくなったところで静かに消える
  // 録音（tools/sfx/reference）は聞き比べ用。Artlist の契約ではアプリに入れて配れないため、本番では使わない
  var growBuf={},growNow=null,growNoise=null;
  function swellVoice(c,out,t,dur){             // builds the voice on any AudioContext (the offline one too, for checking); returns its sources
    var k=(dur||1.5)/1.5;                       // 2.0 second pass: the same breath, drawn in over the gathering's length (0.7 s in the app)
    if(!growNoise||growNoise.sampleRate!==c.sampleRate){var L=Math.floor(c.sampleRate*2);growNoise=c.createBuffer(1,L,c.sampleRate);
      var d=growNoise.getChannelData(0);for(var i=0;i<L;i++)d[i]=Math.random()*2-1;}
    var s=c.createBufferSource();s.buffer=growNoise;s.loop=true;s.loopStart=Math.random();
    var hp=c.createBiquadFilter(),pk=c.createBiquadFilter(),lp=c.createBiquadFilter(),g=c.createGain();
    hp.type='highpass';hp.frequency.value=900;hp.Q.value=.5;
    pk.type='peaking';pk.frequency.setValueAtTime(2600,t);pk.frequency.linearRampToValueAtTime(4200,t+1.45*k);pk.Q.value=1;pk.gain.value=6;   // the breath brightens as it is drawn in
    lp.type='lowpass';lp.frequency.setValueAtTime(5200,t);lp.frequency.linearRampToValueAtTime(8200,t+1.45*k);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(.004,t+.1*k);g.gain.exponentialRampToValueAtTime(.022,t+.42*k);
    g.gain.exponentialRampToValueAtTime(.08,t+.85*k);g.gain.exponentialRampToValueAtTime(.16,t+1.42*k);g.gain.exponentialRampToValueAtTime(0.0001,t+1.5*k);
    s.connect(hp);hp.connect(pk);pk.connect(lp);lp.connect(g);g.connect(out);
    s.start(t);s.stop(t+1.5*k+0.02);
    return [s];
  }
  SOPHIA.swellVoice=swellVoice;                 // for checking the voice offline (tools); the app goes through api.growStart
  api.growLoad=function(name,url){
    try{fetch(url).then(function(r){return r.arrayBuffer();}).then(function(ab){var c=a();if(!c)return;
      c.decodeAudioData(ab,function(b){growBuf[name]=b;},function(){});}).catch(function(){});}catch(e){}
  };
  api.growStart=function(name,dur){
    if(!on)return;var c=a(),o=dOut();if(!c||!o)return;api.growStop(0.02);
    var g=c.createGain();g.connect(o);         // past the compressor, like the dial: it keeps its own shape
    if(!name||name==='synth'){g.gain.value=1.4;growNow={src:swellVoice(c,g,c.currentTime+0.005,dur),g:g};return;}
    var b=growBuf[name];if(!b){g.disconnect();return;}
    var s=c.createBufferSource();s.buffer=b;g.gain.value=1.4;s.connect(g);s.start();growNow={src:[s],g:g};
  };
  api.growStop=function(fade){
    if(!growNow||!AC)return;var t=AC.currentTime,n=growNow;growNow=null;fade=fade||0.06;
    try{n.g.gain.cancelScheduledValues(t);n.g.gain.setValueAtTime(n.g.gain.value,t);n.g.gain.linearRampToValueAtTime(0,t+fade);
      n.src.forEach(function(s){try{s.stop(t+fade+0.02);}catch(e){}});}catch(e){}
  };
  api.enabled=function(){return on;};
  api.set=function(v){on=v;try{localStorage.setItem("sophia-sound",v?"1":"0");}catch(e){}
    if(v)try{P.toggle();}catch(e){}};
  api.flip=function(){                          // 音を鳴らさず切り替える（スマホの♪ボタン）
    on=!on;try{localStorage.setItem("sophia-sound",on?"1":"0");}catch(e){}return on;};
  return api;
};
})();
