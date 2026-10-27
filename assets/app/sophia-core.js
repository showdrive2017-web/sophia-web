/* SOPHIA shared — core: palette, colour math, breathing, text helpers.
   値は DESIGN.md「体験の決まりごと」＝現行コードの値。変更しない。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

// 実際の恒星の分光型に沿った6色（青白・白・黄金・橙・赤橙・赤）
SOPHIA.PALETTE=["#8CA6E0","#DCE6F5","#D8B565","#E8975A","#D9634A","#B25C6B"];
SOPHIA.PNAME=["青白い星","白い星","黄金の星","橙の星","赤橙の星","赤い星"];
SOPHIA.GRAY="#9A9285";                      // 色なしの星はほぼ純白に焼ける（描画側で #E4EBFA を使う）
SOPHIA.NEB_COLS=[[126,110,205],[72,112,196],[62,152,176],[204,164,96],[168,92,164]];

SOPHIA.hex=function(h,a){var n=parseInt(h.slice(1),16);return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")";};
SOPHIA.mixA=function(c,wh,a){               // 白に寄せた色＋透明度
  var v=parseInt(c.slice(1),16),r=v>>16&255,g=v>>8&255,b=v&255;
  return 'rgba('+Math.round(r+(255-r)*wh)+','+Math.round(g+(255-g)*wh)+','+Math.round(b+(255-b)*wh)+','+Math.max(0,a).toFixed(3)+')';};
SOPHIA.shade=function(hexCol,toWhite){      // 白に寄せた色（不透明）
  var n=parseInt(hexCol.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255;
  return 'rgb('+Math.round(r+(255-r)*toWhite)+','+Math.round(g+(255-g)*toWhite)+','+Math.round(b+(255-b)*toWhite)+')';};

// 明滅：星ごとに周期が違う（2.5〜5.7秒、黄金角で位相を散らす）
SOPHIA.breathe=function(n,t){
  var f=0.0011+((n.id*0.6180339)%1)*0.0013;
  var v=0.5+0.5*Math.sin(t*f+n.id*2.399963);
  return v*v*(3-2*v);
};

SOPHIA.text={
  esc:function(t){return String(t==null?'':t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');},
  toHtml:function(v){                       // 旧形式の平文 → HTML
    v=v==null?'':String(v);
    if(/<(br|div|span|img|p)\b/i.test(v))return SOPHIA.text.clean(v);
    return SOPHIA.text.esc(v).replace(/\n/g,'<br>');
  },
  // 本文の HTML を、書いた文字と画像だけに絞る（2.0、2026-10-23。マツ子の指摘：作品ファイルに仕込まれた <img onerror> などが動かないように）。
  // DOMParser の文書は画像を読まずスクリプトも動かさないので、そこで掃除してから返す。
  // 残す：文字・改行・段落・太字など・画像（data:image か http(s) のみ）。属性は img の src と alt、色や太さの style だけ
  clean:function(v){
    var doc=new DOMParser().parseFromString('<body>'+(v==null?'':String(v))+'</body>','text/html'),body=doc.body;
    var KEEP=/^(BR|DIV|P|SPAN|B|I|U|S|STRONG|EM|FONT|UL|OL|LI|BLOCKQUOTE|H[1-6]|IMG)$/,DROP=/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|BASE|FORM|INPUT|BUTTON|TEXTAREA|SELECT|SVG|MATH|TEMPLATE|NOSCRIPT|FRAME|FRAMESET|AUDIO|VIDEO|SOURCE|TRACK|CANVAS)$/;
    var IMG=/^(data:image\/(png|jpe?g|gif|webp|avif);base64,|https?:\/\/)/i,BADCSS=/url\s*\(|expression|javascript:|@import|behavior/i;
    (function walk(el){
      Array.prototype.slice.call(el.childNodes).forEach(function(n){
        if(n.nodeType===3)return;
        if(n.nodeType!==1){n.remove();return;}
        if(DROP.test(n.tagName)){n.remove();return;}
        if(!KEEP.test(n.tagName)){walk(n);while(n.firstChild)n.parentNode.insertBefore(n.firstChild,n);n.remove();return;}   // unknown tags: keep their words
        Array.prototype.slice.call(n.attributes).forEach(function(a){
          var k=a.name.toLowerCase(),ok=(n.tagName==='IMG'&&(k==='alt'||(k==='src'&&IMG.test(a.value.trim()))))||(k==='style'&&!BADCSS.test(a.value))||(n.tagName==='FONT'&&(k==='color'||k==='size'));
          if(!ok)n.removeAttribute(a.name);});
        if(n.tagName==='IMG'&&!n.getAttribute('src')){n.remove();return;}
        walk(n);});
    })(body);
    return body.innerHTML;
  },
  toText:function(v){                       // HTML → 平文（画像は「（画像）」）
    var d=new DOMParser().parseFromString('<body>'+(v==null?'':String(v))+'</body>','text/html').body;   // an inert document: nothing in it loads or runs
    d.querySelectorAll('img').forEach(function(im){im.replaceWith(document.createTextNode('（画像）'));});
    d.querySelectorAll('br').forEach(function(b){b.replaceWith(document.createTextNode('\n'));});
    d.querySelectorAll('div,p').forEach(function(b){b.prepend(document.createTextNode('\n'));});
    return (d.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
  }
};
})();
