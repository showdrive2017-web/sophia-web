// 30fps source: Desktop/mobile_sequence.png. The original ending remains in the video.
const cues=[
 [5.5,27.5,['星を生み出し、','なぞってつなぐ'],'right'],
 [27.5,31.7,['整理整とん機能搭載'],'left'],
 [32,35.5,['星の一覧を、','ひと目で見渡す。'],'right'],
 [35.7,43.7,['プロジェクトは','1度に5つまで、','ワンタップで切り替え可能'],'right',['プロジェクトは1度に5つまで、','ワンタップで切り替え可能'],'※製品版のみの機能です']
];
export function phoneCaption(time,compact=false){
 if(time>=43.7&&time<46.65)return {id:'question',side:'both',panels:[
  {side:'left',lines:['これって'],visible:true},
  {side:'right',lines:['マインドアップアプリ？'],visible:time>=44.4}
 ]};
 const index=cues.findIndex(([from,to])=>time>=from&&time<to);
 return index<0?null:{id:index,lines:compact&&cues[index][4]?cues[index][4]:cues[index][2],side:cues[index][3],note:cues[index][5]||''};
}
