var cubeBuf=gl.getParameter(gl.ARRAY_BUFFER_BINDING);
var _uc=useCube;
useCube=function(){gl.bindBuffer(gl.ARRAY_BUFFER,cubeBuf);_uc();};
var lastT=performance.now();
function frame(){
 requestAnimationFrame(frame);
 var nowMs=performance.now(),dt=Math.min(.05,(nowMs-lastT)/1000);lastT=nowMs;
 var tAmb=nowMs/1000,i;
 var playing=(state==='play'&&ac);
 var gt=playing?ac.currentTime-songStart:0;
 if(playing){
  for(i=0;i<notes.length;i++){var nt=notes[i];
   if(nt.t-gt>appr+0.5)break;
   if(nt.done||nt.broken)continue;
   if(nt.held){
    if(!laneHasTouch(nt.lane)&&nt.end-gt>0.12){
     nt.broken=true;nMiss++;combo=0;shake=.5;vib(35);
     popJudge('BREAK','#f55');}
    else if(gt>=nt.end){
     nt.done=true;score+=200*mult();nPerf++;
     burst(LANEX[nt.lane],[1,1,1],22);popJudge('HOLD ✓','#4ff');vib(12);}}
   else if(!nt.judged&&gt>nt.t+0.2){
    nt.missed=true;nMiss++;combo=0;
    shake=Math.max(shake,.35);vib(25);popJudge('MISS','#f55');}}
  if(gt>dur+1.5){finish();playing=false;}
  else{
   while(beatIdx<beats.length-1&&beats[beatIdx+1]<=gt)beatIdx++;
   progF.style.width=Math.max(0,Math.min(100,gt/dur*100))+'%';
   scoreEl.textContent=score;
   multEl.textContent='×'+mult();
   if(combo>=3){comboEl.style.display='block';comboEl.textContent='COMBO ×'+combo;}
   else comboEl.style.display='none';
   if(gt<0){countEl.style.display='block';countEl.textContent=Math.ceil(-gt);}
   else if(gt<0.5){countEl.style.display='block';countEl.textContent='GO!';}
   else countEl.style.display='none';}}
 var pulse=0;
 if(playing&&beats.length&&gt>=beats[0]){
  var since=Math.max(0,gt-beats[beatIdx]);
  pulse=Math.max(0,1-since/0.4);pulse*=pulse;}
 else if(!playing)pulse=(Math.sin(tAmb*2.2)+1)*0.2;
 shake=Math.max(0,shake-dt*2);
 swayX+=(lastLaneX*.14-swayX)*dt*6;
 var eye=[swayX+(Math.random()-.5)*shake*.5,
  13+pulse*.3+(Math.random()-.5)*shake*.5,10];
 gl.clearColor(theme.bg[0],theme.bg[1],theme.bg[2],1);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 var fov=(62+pulse*6)*Math.PI/180;
 PV=mul(perspective(fov,canvas.width/canvas.height,.1,300),
  lookAt(eye,[swayX*.5,.5,-16],[0,1,0]));
 useCube();
 gl.uniformMatrix4fv(uPV,false,PV);
 gl.uniform3fv(uEye,eye);
 gl.uniform3fv(uFog,theme.bg);
 var bg2=[theme.bg[0]*1.6+.02,theme.bg[1]*1.6+.02,theme.bg[2]*1.6+.03];
 drawBox(0,-.25,-38,0,0,10.6,.5,95,bg2);
 var railC=[theme.acc[0]*.3+pulse*.25,theme.acc[1]*.3+pulse*.25,theme.acc[2]*.3+pulse*.25];
 var rails=[-4.4,-2.2,0,2.2,4.4];
 for(i=0;i<5;i++)drawBox(rails[i],.06,-38,0,0,.12,.12,95,railC);
 drawBox(0,.1,0,0,0,10,.16,.5,
  [theme.acc[0]*(.6+pulse),theme.acc[1]*(.6+pulse),theme.acc[2]*(.6+pulse)]);
 var acT=ac?ac.currentTime:tAmb;
 for(i=0;i<4;i++){
  var pr=Math.max(0,1-(acT-pressT[i])*6)+(playing&&laneHasTouch(i)?.7:0);
  var lc=theme.lanes[i];
  drawBox(LANEX[i],.13,0,0,0,2.05,.2,.55,
   [.1+lc[0]*(.25+pr*.6),.1+lc[1]*(.25+pr*.6),.15+lc[2]*(.25+pr*.6)]);
  addGlow(LANEX[i],.35,0,
   lc[0]*(.25+pulse*.4+pr*.5),lc[1]*(.25+pulse*.4+pr*.5),lc[2]*(.25+pulse*.4+pr*.5),1.3);}
 var mvt=playing?Math.max(0,gt)*fallS:tAmb*8;
 var off=mvt%7;
 for(i=0;i<16;i++){var zs=off-i*7;if(zs>2)continue;
  drawBox(0,.03,zs,0,0,9.8,.06,.2,[.1,.15,.35]);}
 var off2=mvt%18;
 for(i=0;i<9;i++){var zt=off2-i*18-4;if(zt>8)continue;
  var h1=4+((i*7)%5),h2=4+((i*5)%5);
  var tw=[theme.acc[0]*.4,theme.acc[1]*.4,theme.acc[2]*.4];
  drawBox(-7,h1/2,zt,0,0,1.3,h1,1.3,tw);
  drawBox(7,h2/2,zt-9,0,0,1.3,h2,1.3,tw);}
 drawBox(0,9,-125,0,0,80,26,1,
  [theme.sun[0]*(.5+pulse*.45),theme.sun[1]*(.5+pulse*.45),theme.sun[2]*(.5+pulse*.45)]);
 drawBox(0,.4,-115,0,0,140,3.5,1,
  [theme.acc[0]*.3,theme.acc[1]*.3,theme.acc[2]*.3]);
 if(playing)for(i=0;i<notes.length;i++){var n2=notes[i];
  if(n2.t-gt>appr+0.3)break;
  var zH=-(n2.t-gt)*fallS;
  if(zH<-78||zH>6)continue;
  var col=theme.lanes[n2.lane];
  if(n2.missed)col=[col[0]*.25,col[1]*.25,col[2]*.25];
  if(n2.done||n2.broken)continue;
  if(n2.hold){
   var zT=-(n2.end-gt)*fallS,len=zH-zT;
   if(len>0.1)drawBox(LANEX[n2.lane],.3,(zH+zT)/2,0,0,1.5,.32,len,
    [col[0]*.7,col[1]*.7,col[2]*.7]);}
  var glow=Math.max(0,1-Math.abs(zH)/4);
  drawBox(LANEX[n2.lane],.32,zH,0,0,2,.55,1.5,
   [col[0]*(1+glow),col[1]*(1+glow),col[2]*(1+glow)]);
  addGlow(LANEX[n2.lane],.5,zH,
   col[0]*(.3+glow*.5),col[1]*(.3+glow*.5),col[2]*(.3+glow*.5),1.5);}
 for(i=parts.length-1;i>=0;i--){var p=parts[i];
  p.life-=dt;if(p.life<=0){parts.splice(i,1);continue;}
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=14*dt;}
 for(i=0;i<STARS.length;i++)addGlow(STARS[i][0],STARS[i][1],STARS[i][2],.5,.55,.7,.5);
 flushPoints();}
frame();
renderList();
try{if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)
 navigator.serviceWorker.register('sw.js').catch(function(){});}catch(e){}
