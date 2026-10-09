// 30fps source: Desktop/mobile_sequence.png. The original ending remains in the video.
const EN=document.documentElement.lang==='en';
const cuesEN=[
 [5.5,27.5,['Make stars,','trace to connect'],'right'],
 [27.5,31.7,['Tidy in one tap'],'left'],
 [32,35.5,['See your whole star list','at a glance.'],'right'],
 [35.7,43.7,['Up to 5 projects,','switch with one tap'],'right',['Up to 5 projects,','switch with one tap'],'* Full version only']
];
const cuesJA=[
 [5.5,27.5,['星を生み出し、','なぞってつなぐ'],'right'],
 [27.5,31.7,['整理整とん機能搭載'],'left'],
 [32,35.5,['星の一覧を、','ひと目で見渡す。'],'right'],
 [35.7,43.7,['プロジェクトは','1度に5つまで、','ワンタップで切り替え可能'],'right',['プロジェクトは1度に5つまで、','ワンタップで切り替え可能'],'※製品版のみの機能です']
];
export function phoneCaption(time,compact=false){
 if(time>=43.7&&time<46.65)return {id:'question',side:'both',panels:[
  {side:'left',lines:[EN?'Is this…':'これって'],visible:true},
  {side:'right',lines:[EN?'a mind map app?':'マインドアップアプリ？'],visible:time>=44.4}
 ]};
 const cues=EN?cuesEN:cuesJA;
 const index=cues.findIndex(([from,to])=>time>=from&&time<to);
 return index<0?null:{id:index,lines:compact&&cues[index][4]?cues[index][4]:cues[index][2],side:cues[index][3],note:cues[index][5]||''};
}
