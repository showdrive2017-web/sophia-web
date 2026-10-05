export function keyTravel(time,index,count){
 // Short irregular bursts, with quiet intervals between them. Video time also freezes keys on pause.
 const cycle=Math.floor(time/4.7),within=time-cycle*4.7;
 if(within<.55||within>1.75)return 0;
 let travel=0;
 for(let beat=0;beat<9;beat++){
  const key=(cycle*37+beat*17+beat*beat*3)%count,age=within-(.55+beat*.12);
  if(key!==index||age<0||age>.19)continue;
  const amount=age<.05?age/.05:Math.max(0,1-(age-.05)/.14);
  travel=Math.max(travel,.0022*Math.sin(Math.PI*amount/2));
 }
 return travel;
}
