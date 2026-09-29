/* SOPHIA shared — 作品ファイル（.json）とテキスト書き出し。
   .json が唯一の正。PC・スマホ・サーバーで同じ形式を使う（DESIGN.md「データ」）。 */
(function(){
"use strict";
var SOPHIA=window.SOPHIA=window.SOPHIA||{};

SOPHIA.data={
  // 取り込んだ JSON を安全な形に整える。欠けた番号は実データから導く
  normalize:function(d){
    var nodes=d.nodes||[],groups=d.groups||[],edges=d.edges||[],memos=d.memos||[];
    return{
      title:d.title||'無題',
      groups:groups,nodes:nodes,edges:edges,memos:memos,
      uid:d.uid||nodes.reduce(function(m,n){return Math.max(m,n.id||0);},0)+1,
      gid:d.gid||groups.reduce(function(m,g){return Math.max(m,g.id||0);},0)+1,
      cid:d.cid||1,
      mid:d.mid||memos.reduce(function(m,x){return Math.max(m,x.id||0);},0)+1
    };
  },

  safeName:function(title){return (title||'SOPHIA').replace(/[\\/:*?"<>|]/g,'_').trim()||'SOPHIA';},

  // テキスト書き出し（PC・スマホ同形式）：作った順に、名前〔色グループ〕・中身・「→ 次の星」。最後にメモ
  listText:function(st){
    var toText=SOPHIA.text.toText;
    var byId={};st.nodes.forEach(function(n){byId[n.id]=n;});
    var gById={};st.groups.forEach(function(g){gById[g.id]=g;});
    var d=new Date(),pad=function(v){return String(v).padStart(2,'0');};
    var t=st.title+'\n'+'─'.repeat(16)+'\n'+d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate())+' 書き出し　｜　'+st.nodes.length+' の星 / '+st.edges.length+' の線\n';
    st.nodes.slice().sort(function(a,b){return (a.cap||0)-(b.cap||0)||a.id-b.id;}).forEach(function(n,i){
      var g=gById[n.group];
      t+='\n'+(i+1)+'. '+(n.title||'無題')+(g?'　〔'+g.name+'〕':'')+'\n';
      var bt=toText(n.body);if(bt)t+=bt+'\n';
      var nx=st.edges.filter(function(e){return e.a===n.id;})
        .map(function(e){return byId[e.b];}).filter(Boolean)
        .map(function(x){return x.title||'無題';});
      if(nx.length)t+='→ '+nx.join(' / ')+'\n';
    });
    var ms=st.memos.map(function(m){return toText(m.t);}).filter(Boolean);
    if(ms.length){t+='\n'+'─'.repeat(16)+'\nメモ\n';ms.forEach(function(m){t+='\n・'+m.replace(/\n/g,'\n　')+'\n';});}
    return t;
  }
};
})();
