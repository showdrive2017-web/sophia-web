/* SOPHIA shared — 体験版と商品版（DESIGN.md「販売」）。
   体験版は星10個まで。購入はログインなしで有効になる。ログインは同期のためだけ。
   ストアの窓口（adapter）が付いていない所（PC 版・ブラウザ）は、購入の手段ができるまで制限しない。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};
var CACHE='sophia-full';

SOPHIA.license=(function(){
  var LIMIT=10;
  var adapter=null,full=true,listeners=[];
  function set(v){
    v=!!v;
    try{localStorage.setItem(CACHE,v?'1':'0');}catch(e){}
    if(full===v)return;
    full=v;
    listeners.forEach(function(f){try{f(full);}catch(e){}});
  }
  return{
    LIMIT:LIMIT,
    // adapter: { init(onOwned), buy() → 'ok'|'cancel'|'error'|'unavailable', restore() → 'ok'|'none'|'error', price() → 表示用の価格 or null }
    use:function(a){
      adapter=a;
      var cached=null;try{cached=localStorage.getItem(CACHE);}catch(e){}
      full=(cached==='1');                        // オフラインでも、一度確かめた購入はそのまま効く
      a.init(set);
    },
    hasStore:function(){return !!adapter;},
    isFull:function(){return full;},
    // 今 count 個あるところに add 個生めるか。既にある星を読む・編集する・消すのはいつでもできる
    allows:function(count,add){return full||count+(add||1)<=LIMIT;},
    buy:function(){return adapter?adapter.buy():Promise.resolve('unavailable');},
    restore:function(){return adapter?adapter.restore():Promise.resolve('unavailable');},
    price:function(){return (adapter&&adapter.price())||'1,200円';},
    onChange:function(f){listeners.push(f);}
  };
})();
})();
