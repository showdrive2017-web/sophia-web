const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
// Move the device, without advancing the page or skipping the next story beat.
export function completionLift(elapsed,height,reduce=false){
 const pixels=Math.min(44,Math.max(28,height*.05));
 return pixels*(reduce?1:smooth(elapsed/.9));
}
export function completionHandoff(progress,phase){
 const start=phase==='phone'?.405:.785,span=phase==='phone'?.09:.11;
 return 1-smooth((progress-start)/span);
}
